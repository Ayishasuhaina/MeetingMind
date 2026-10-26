"""Pydantic schemas for extraction results — Phase 3."""
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


# ── Per-item schemas ──────────────────────────────────────────────────────────

class ExtractedActionItem(BaseModel):
    title: str
    owner: Optional[str] = None           # null when not found in text
    due_date: Optional[str] = None        # ISO date or natural language string, null when absent
    priority: str = "medium"              # low | medium | high — defaults to medium
    evidence: Optional[str] = None        # verbatim sentence(s) from transcript
    confidence: float = Field(1.0, ge=0.0, le=1.0)
    ambiguous: bool = False               # True when owner/date could not be determined


class ExtractedDecision(BaseModel):
    title: str
    description: Optional[str] = None
    decided_by: Optional[str] = None
    impact: Optional[str] = None          # low | medium | high | null
    evidence: Optional[str] = None
    confidence: float = Field(1.0, ge=0.0, le=1.0)
    ambiguous: bool = False


class ExtractedKeyPoint(BaseModel):
    content: str
    category: str = "highlight"           # highlight | risk | question | summary | other
    evidence: Optional[str] = None
    confidence: float = Field(1.0, ge=0.0, le=1.0)


class ExtractedRisk(BaseModel):
    content: str
    evidence: Optional[str] = None


class ExtractedQuestion(BaseModel):
    content: str
    evidence: Optional[str] = None


# ── Top-level result ──────────────────────────────────────────────────────────

class ExtractionResult(BaseModel):
    summary: Optional[str] = None
    key_points: List[ExtractedKeyPoint] = []
    action_items: List[ExtractedActionItem] = []
    decisions: List[ExtractedDecision] = []
    risks: List[ExtractedRisk] = []
    open_questions: List[ExtractedQuestion] = []
    extractor_used: str = "rule_based"    # "rule_based" | "llm"
    warnings: List[str] = []              # user-facing notes about ambiguity / low confidence


# ── Request / Response schemas for API endpoints ──────────────────────────────

class ParseFileResponse(BaseModel):
    """Response from /extract/parse — raw text only."""
    filename: str
    char_count: int
    line_count: int
    detected_format: str                  # txt | vtt | srt | docx | pdf
    text: str


class ProcessRequest(BaseModel):
    """Submit transcript text for extraction."""
    transcript: str = Field(..., min_length=10)
    meeting_title: Optional[str] = None
    language: str = "en"
    extract_actions: bool = True
    extract_decisions: bool = True
    extract_key_points: bool = True
    extract_risks: bool = True
    extract_questions: bool = True


class ApproveRequest(BaseModel):
    """User-reviewed extraction result to persist."""
    meeting_id: int
    result: ExtractionResult
    overwrite_summary: bool = True
    save_actions: bool = True
    save_decisions: bool = True
    save_key_points: bool = True


class ApproveResponse(BaseModel):
    meeting_id: int
    saved_actions: int
    saved_decisions: int
    saved_key_points: int
    skipped_duplicate_actions: int
    skipped_duplicate_decisions: int
    message: str
