"""
Extraction endpoints — Phase 3.

POST /api/extract/parse           — Upload file, return extracted text
POST /api/extract/process         — Submit transcript text, return ExtractionResult
POST /api/extract/approve         — Save approved result to DB
POST /api/extract/reprocess/{id}  — Re-run extraction on stored transcript
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.meeting import Meeting
from app.schemas.extraction import (
    ApproveRequest,
    ApproveResponse,
    ExtractionResult,
    ParseFileResponse,
    ProcessRequest,
)
from app.services.extraction.text_extractor import extract_text
from app.services.extraction.extraction_service import run_extraction, approve_and_save

router = APIRouter()


# ── POST /api/extract/parse ───────────────────────────────────────────────────

@router.post(
    "/parse",
    response_model=ParseFileResponse,
    summary="Upload a file and extract its text",
    description=(
        "Upload a .txt, .vtt, .srt, .docx, or .pdf file. "
        "Returns the extracted plain text for preview before processing. "
        "Audio/video files are not supported."
    ),
)
async def parse_file(file: UploadFile = File(...)):
    filename = file.filename or "upload"
    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
        text, detected_format = extract_text(filename, file_bytes)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    return ParseFileResponse(
        filename=filename,
        char_count=len(text),
        line_count=text.count("\n") + 1,
        detected_format=detected_format,
        text=text,
    )


# ── POST /api/extract/process ─────────────────────────────────────────────────

@router.post(
    "/process",
    response_model=ExtractionResult,
    summary="Process transcript text and extract structured knowledge",
    description=(
        "Submit raw transcript text. Returns structured extraction result "
        "with action items, decisions, key points, risks, and open questions. "
        "Uses an LLM if OPENAI_API_KEY is configured, otherwise the local "
        "rule-based extractor runs automatically."
    ),
)
def process_transcript(req: ProcessRequest):
    if not req.transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript text cannot be empty.",
        )
    return run_extraction(req)


# ── POST /api/extract/approve ─────────────────────────────────────────────────

@router.post(
    "/approve",
    response_model=ApproveResponse,
    status_code=status.HTTP_200_OK,
    summary="Save reviewed extraction results to the database",
    description=(
        "Persist the user-reviewed extraction result. "
        "Deduplicates action items and decisions against existing records for the meeting. "
        "Updates meeting summary and processing status."
    ),
)
def approve_extraction(req: ApproveRequest, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, req.meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with id={req.meeting_id} not found.",
        )
    return approve_and_save(db, meeting, req)


# ── POST /api/extract/reprocess/{meeting_id} ──────────────────────────────────

@router.post(
    "/reprocess/{meeting_id}",
    response_model=ExtractionResult,
    summary="Re-run extraction on a stored transcript",
    description=(
        "Re-run the extraction pipeline on the transcript already stored for a meeting. "
        "Returns a new ExtractionResult without saving — the user must call /approve to persist. "
        "Returns 409 if the meeting has no stored transcript."
    ),
)
def reprocess_meeting(
    meeting_id: int,
    extract_actions: bool = True,
    extract_decisions: bool = True,
    extract_key_points: bool = True,
    extract_risks: bool = True,
    extract_questions: bool = True,
    db: Session = Depends(get_db),
):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with id={meeting_id} not found.",
        )
    if not meeting.transcript or not meeting.transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Meeting '{meeting.title}' has no stored transcript to reprocess. "
                "Upload or paste a transcript first."
            ),
        )

    req = ProcessRequest(
        transcript=meeting.transcript,
        meeting_title=meeting.title,
        extract_actions=extract_actions,
        extract_decisions=extract_decisions,
        extract_key_points=extract_key_points,
        extract_risks=extract_risks,
        extract_questions=extract_questions,
    )
    return run_extraction(req)
