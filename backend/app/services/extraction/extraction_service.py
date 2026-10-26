"""
Extraction orchestrator — Phase 3.

Responsibilities:
  1. Choose extractor (LLM if key present, else rule-based).
  2. Run extraction with graceful LLM → rule fallback.
  3. Persist approved results to the DB, deduplicating against existing rows.
  4. Reprocess stored transcript for an existing meeting.
"""
from __future__ import annotations

import re
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.meeting import Meeting
from app.models.action_item import ActionItem
from app.models.decision import Decision
from app.models.key_point import KeyPoint
from app.schemas.extraction import (
    ApproveRequest,
    ApproveResponse,
    ExtractionResult,
    ProcessRequest,
)
from app.services.extraction.rule_extractor import run_rule_extraction


# ── Extractor selector ────────────────────────────────────────────────────────

def run_extraction(req: ProcessRequest) -> ExtractionResult:
    """
    Run extraction on the given transcript text.
    Tries LLM first (if OPENAI_API_KEY set), falls back to rule-based.
    """
    api_key: Optional[str] = getattr(settings, "openai_api_key", None)

    if api_key:
        try:
            from app.services.extraction.llm_extractor import run_llm_extraction
            result = run_llm_extraction(
                transcript=req.transcript,
                api_key=api_key,
                model=getattr(settings, "openai_model", "gpt-4o-mini"),
                base_url=getattr(settings, "openai_base_url", None),
                extract_actions=req.extract_actions,
                extract_decisions=req.extract_decisions,
                extract_key_points=req.extract_key_points,
                extract_risks=req.extract_risks,
                extract_questions=req.extract_questions,
            )
            return result
        except Exception as exc:
            # Graceful fallback — add warning to result
            fallback = _run_rule(req)
            fallback.warnings.insert(
                0,
                f"LLM extraction failed ({exc}). Using rule-based extractor instead."
            )
            return fallback

    return _run_rule(req)


def _run_rule(req: ProcessRequest) -> ExtractionResult:
    return run_rule_extraction(
        transcript=req.transcript,
        extract_actions=req.extract_actions,
        extract_decisions=req.extract_decisions,
        extract_key_points=req.extract_key_points,
        extract_risks=req.extract_risks,
        extract_questions=req.extract_questions,
    )


# ── Deduplication helpers ─────────────────────────────────────────────────────

def _normalise(text: str) -> str:
    """Lowercase, collapse whitespace, drop punctuation — for fuzzy title match."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text[:80]


def _title_exists(existing_titles: set[str], new_title: str, threshold: int = 70) -> bool:
    """Return True if new_title is similar enough to an existing title."""
    norm_new = _normalise(new_title)
    for existing in existing_titles:
        # Simple character-overlap ratio
        common = sum(c in existing for c in norm_new)
        if len(norm_new) > 0 and common / len(norm_new) >= threshold / 100:
            return True
    return False


# ── Persist approved results ──────────────────────────────────────────────────

def approve_and_save(
    db: Session,
    meeting: Meeting,
    req: ApproveRequest,
) -> ApproveResponse:
    """
    Persist user-approved extraction results to the database.
    Deduplicates action items and decisions against existing rows for the meeting.
    """
    result = req.result
    saved_actions = saved_decisions = saved_key_points = 0
    skipped_dup_actions = skipped_dup_decisions = 0

    # ── Update meeting summary ────────────────────────────────────────────
    if req.overwrite_summary and result.summary:
        meeting.summary = result.summary
        meeting.processing_status = "completed"

    # ── Existing titles for dedup ─────────────────────────────────────────
    existing_action_titles: set[str] = {
        _normalise(a.title)
        for a in db.query(ActionItem).filter(ActionItem.meeting_id == meeting.id).all()
    }
    existing_decision_titles: set[str] = {
        _normalise(d.title)
        for d in db.query(Decision).filter(Decision.meeting_id == meeting.id).all()
    }

    # ── Save action items ─────────────────────────────────────────────────
    if req.save_actions:
        for item in result.action_items:
            if _title_exists(existing_action_titles, item.title):
                skipped_dup_actions += 1
                continue
            db.add(ActionItem(
                title=item.title,
                description=item.evidence,
                meeting_id=meeting.id,
                owner=item.owner,
                due_date=item.due_date,
                priority=item.priority,
                status="pending",
                evidence=item.evidence,
            ))
            existing_action_titles.add(_normalise(item.title))
            saved_actions += 1

    # ── Save decisions ────────────────────────────────────────────────────
    if req.save_decisions:
        for d in result.decisions:
            if _title_exists(existing_decision_titles, d.title):
                skipped_dup_decisions += 1
                continue
            db.add(Decision(
                title=d.title,
                description=d.description,
                meeting_id=meeting.id,
                decided_by=d.decided_by,
                impact=d.impact,
                evidence=d.evidence,
                status="pending",
            ))
            existing_decision_titles.add(_normalise(d.title))
            saved_decisions += 1

    # ── Save key points ───────────────────────────────────────────────────
    if req.save_key_points:
        # Clear old key points for this meeting before replacing
        db.query(KeyPoint).filter(KeyPoint.meeting_id == meeting.id).delete()
        for kp in result.key_points:
            db.add(KeyPoint(
                content=kp.content,
                meeting_id=meeting.id,
                category=kp.category,
                evidence=kp.evidence,
            ))
            saved_key_points += 1

    db.commit()

    return ApproveResponse(
        meeting_id=meeting.id,
        saved_actions=saved_actions,
        saved_decisions=saved_decisions,
        saved_key_points=saved_key_points,
        skipped_duplicate_actions=skipped_dup_actions,
        skipped_duplicate_decisions=skipped_dup_decisions,
        message=(
            f"Saved {saved_actions} action(s), {saved_decisions} decision(s), "
            f"{saved_key_points} key point(s). "
            f"Skipped {skipped_dup_actions + skipped_dup_decisions} duplicate(s)."
        ),
    )
