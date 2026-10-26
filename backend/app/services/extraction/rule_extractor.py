"""
Rule-based transcript extractor — works with NO external API key.

Strategy:
  - Split transcript into sentences.
  - Score sentences against keyword pattern lists.
  - Only emit items where evidence clearly supports the label.
  - Mark items as ambiguous=True when confidence < 0.7.
  - Never invent owners, due dates, or priorities — use null if unsure.
"""
from __future__ import annotations

import re
from typing import List, Optional, Tuple

from app.schemas.extraction import (
    ExtractionResult,
    ExtractedActionItem,
    ExtractedDecision,
    ExtractedKeyPoint,
    ExtractedRisk,
    ExtractedQuestion,
)


# ── Compiled patterns ─────────────────────────────────────────────────────────

_ACTION_PHRASES = re.compile(
    r"\b(will|should|needs? to|has to|must|going to|action item|todo|to-do|"
    r"please|assigned to|responsible for|take care of|follow up|follow-up|"
    r"make sure|ensure|schedule|send|prepare|review|update|create|implement|"
    r"fix|resolve|submit|complete|deliver|write|draft|build|set up|set-up|"
    r"investigate|check|confirm|share|coordinate)\b",
    re.IGNORECASE,
)

_DECISION_PHRASES = re.compile(
    r"\b(decided|decision|agreed|agreement|approved|approved by|resolved|"
    r"concluded|confirmed|we will|we have agreed|go with|moving forward with|"
    r"chosen|selected|finalized|settled on|consensus|aligned on)\b",
    re.IGNORECASE,
)

_RISK_PHRASES = re.compile(
    r"\b(risk|blocker|concern|issue|problem|challenge|obstacle|bottleneck|"
    r"delay|dependency|stuck|blocking|worried|flag|escalate|critical|urgent)\b",
    re.IGNORECASE,
)

_QUESTION_PHRASES = re.compile(
    r"(\?$|open question|unclear|not sure|need to clarify|pending clarification|"
    r"need input|TBD|to be determined|outstanding question)",
    re.IGNORECASE,
)

_PRIORITY_HIGH = re.compile(r"\b(urgent|critical|asap|immediately|high priority|p0|p1)\b", re.IGNORECASE)
_PRIORITY_LOW  = re.compile(r"\b(low priority|whenever|eventually|nice to have|if time permits|p3|p4)\b", re.IGNORECASE)

# Name patterns: "Alice will..." / "assigned to Bob" / "John to review"
# Exclude common non-person words that start with a capital
_NOT_A_NAME = {
    "This", "That", "These", "Those", "The", "We", "They", "It",
    "Our", "Your", "Their", "There", "Jenkins", "GitHub", "Slack",
    "Google", "Microsoft", "Zoom", "Teams", "Monday", "Tuesday",
    "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "January","February","March","April","May","June","July",
    "August","September","October","November","December",
    "Q1","Q2","Q3","Q4",
}

_NAME_OWNER = re.compile(
    r"\b([A-Z][a-z]+(?: [A-Z][a-z]+)?)\s+(?:will|to|should|needs? to|must|is responsible)",
    re.MULTILINE,
)
_ASSIGNED_TO = re.compile(
    r"(?:assigned to|owner:|responsible:|action item for)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)?)",
    re.IGNORECASE,
)

# Due date patterns
_DUE_DATE = re.compile(
    r"\b(?:by|before|due|deadline|until)\s+"
    r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?|"
    r"\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|"
    r"(?:next\s+)?(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)|"
    r"(?:next\s+)?(?:week|month)|end of (?:week|month|quarter|Q\d))",
    re.IGNORECASE,
)

_IMPACT_HIGH = re.compile(r"\b(major|significant|critical|high.?impact|strategic|company.?wide|platform)\b", re.IGNORECASE)
_IMPACT_LOW  = re.compile(r"\b(minor|small|cosmetic|low.?impact|trivial|nice.?to.?have)\b", re.IGNORECASE)


# ── Sentence splitter ─────────────────────────────────────────────────────────

def _split_sentences(text: str) -> List[str]:
    """Split transcript into individual sentences, stripping speaker labels."""
    # Remove VTT/SRT residue timestamps
    text = re.sub(r"\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}", "", text)
    # Remove speaker labels: "Alice: " / "[Alice]:" / "ALICE:"
    text = re.sub(r"^\s*[\[\(]?[A-Z][a-zA-Z\s]{1,30}[\]\)]?\s*:", "", text, flags=re.MULTILINE)
    # Split on sentence-ending punctuation
    sentences = re.split(r"(?<=[.!?])\s+", text)
    # Also split on newlines for transcript-style lines
    result = []
    for s in sentences:
        for line in s.splitlines():
            line = line.strip()
            if len(line) > 15:   # skip very short fragments
                result.append(line)
    return result


# ── Extraction helpers ────────────────────────────────────────────────────────

def _extract_owner(sentence: str) -> Optional[str]:
    # Try explicit assignment first
    m = _ASSIGNED_TO.search(sentence)
    if m:
        name = m.group(1)
        if name not in _NOT_A_NAME:
            return name
    # Then infer from "Name will/to/should..."
    m = _NAME_OWNER.search(sentence)
    if m:
        name = m.group(1)
        if name not in _NOT_A_NAME:
            return name
    return None


def _extract_due_date(sentence: str) -> Optional[str]:
    m = _DUE_DATE.search(sentence)
    return m.group(1).strip() if m else None


def _extract_priority(sentence: str) -> str:
    if _PRIORITY_HIGH.search(sentence):
        return "high"
    if _PRIORITY_LOW.search(sentence):
        return "low"
    return "medium"


def _extract_impact(sentence: str) -> Optional[str]:
    if _IMPACT_HIGH.search(sentence):
        return "high"
    if _IMPACT_LOW.search(sentence):
        return "low"
    return None


def _clean_title(sentence: str, max_len: int = 120) -> str:
    """Trim a sentence to a reasonable action/decision title."""
    # Remove leading speaker artefacts
    sentence = re.sub(r"^(so|ok|okay|alright|yeah|yep|right|and|but|also|well),?\s+", "", sentence, flags=re.IGNORECASE)
    if len(sentence) > max_len:
        sentence = sentence[:max_len].rsplit(" ", 1)[0] + "…"
    return sentence.strip()


def _deduplicate(items: list, key_fn) -> list:
    """Simple dedup by normalised key."""
    seen = set()
    out = []
    for item in items:
        k = re.sub(r"\s+", " ", key_fn(item).lower().strip())[:60]
        if k not in seen:
            seen.add(k)
            out.append(item)
    return out


# ── Summary builder ───────────────────────────────────────────────────────────

def _build_summary(sentences: List[str], action_count: int, decision_count: int) -> str:
    """Build a concise summary from the first few informative sentences."""
    intro_sentences = [s for s in sentences if len(s) > 40][:3]
    parts = []
    if intro_sentences:
        parts.append(" ".join(intro_sentences[:2]))
    parts.append(
        f"This meeting produced {action_count} action item(s) and "
        f"{decision_count} decision(s) as identified by automated extraction."
    )
    return " ".join(parts)


# ── Main extractor ────────────────────────────────────────────────────────────

def run_rule_extraction(
    transcript: str,
    extract_actions: bool = True,
    extract_decisions: bool = True,
    extract_key_points: bool = True,
    extract_risks: bool = True,
    extract_questions: bool = True,
) -> ExtractionResult:
    """
    Run the local rule-based extractor on a transcript string.
    Returns an ExtractionResult with no invented data.
    """
    sentences = _split_sentences(transcript)
    warnings: List[str] = []

    if len(sentences) < 3:
        warnings.append(
            "The transcript is very short. Extraction results may be limited."
        )

    actions: List[ExtractedActionItem] = []
    decisions: List[ExtractedDecision] = []
    key_points: List[ExtractedKeyPoint] = []
    risks: List[ExtractedRisk] = []
    questions: List[ExtractedQuestion] = []

    for sentence in sentences:
        # ── Risks ─────────────────────────────────────────────────────────
        if extract_risks and _RISK_PHRASES.search(sentence):
            risks.append(ExtractedRisk(content=_clean_title(sentence), evidence=sentence))

        # ── Open questions ────────────────────────────────────────────────
        if extract_questions and _QUESTION_PHRASES.search(sentence):
            questions.append(ExtractedQuestion(content=_clean_title(sentence), evidence=sentence))

        # ── Decisions ─────────────────────────────────────────────────────
        if extract_decisions and _DECISION_PHRASES.search(sentence):
            owner = _extract_owner(sentence)
            impact = _extract_impact(sentence)
            ambiguous = owner is None
            decisions.append(
                ExtractedDecision(
                    title=_clean_title(sentence),
                    description=sentence if len(sentence) > 80 else None,
                    decided_by=owner,
                    impact=impact,
                    evidence=sentence,
                    confidence=0.65 if ambiguous else 0.85,
                    ambiguous=ambiguous,
                )
            )

        # ── Action items ──────────────────────────────────────────────────
        elif extract_actions and _ACTION_PHRASES.search(sentence):
            # Skip very short or purely generic lines
            if len(sentence) < 20:
                continue
            owner = _extract_owner(sentence)
            due_date = _extract_due_date(sentence)
            priority = _extract_priority(sentence)
            ambiguous = owner is None and due_date is None
            actions.append(
                ExtractedActionItem(
                    title=_clean_title(sentence),
                    owner=owner,
                    due_date=due_date,
                    priority=priority,
                    evidence=sentence,
                    confidence=0.6 if ambiguous else 0.8,
                    ambiguous=ambiguous,
                )
            )

    # ── Key points — pick highest-value sentences not already classified ──
    if extract_key_points:
        classified_evidence = {a.evidence for a in actions} | {d.evidence for d in decisions}
        for sentence in sentences:
            if sentence in classified_evidence:
                continue
            if len(sentence) > 30:
                key_points.append(
                    ExtractedKeyPoint(
                        content=_clean_title(sentence),
                        category="highlight",
                        evidence=sentence,
                        confidence=0.6,
                    )
                )
        # Cap at 8 key points
        key_points = key_points[:8]

    # Dedup within each category
    actions   = _deduplicate(actions,   lambda x: x.title)
    decisions = _deduplicate(decisions, lambda x: x.title)
    risks     = _deduplicate(risks,     lambda x: x.content)
    questions = _deduplicate(questions, lambda x: x.content)

    # Warn about ambiguous items
    ambig_actions = sum(1 for a in actions if a.ambiguous)
    ambig_decisions = sum(1 for d in decisions if d.ambiguous)
    if ambig_actions:
        warnings.append(
            f"{ambig_actions} action item(s) are marked ambiguous — owner or due date could not be determined from the text."
        )
    if ambig_decisions:
        warnings.append(
            f"{ambig_decisions} decision(s) are marked ambiguous — please verify before saving."
        )

    summary = _build_summary(sentences, len(actions), len(decisions))

    return ExtractionResult(
        summary=summary,
        key_points=key_points,
        action_items=actions,
        decisions=decisions,
        risks=risks,
        open_questions=questions,
        extractor_used="rule_based",
        warnings=warnings,
    )
