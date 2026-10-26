"""
Text extractor — reads uploaded files and returns clean plain text.

Supported formats:
  .txt   — read as UTF-8, fallback latin-1
  .vtt   — WebVTT captions, strips cue headers/timestamps
  .srt   — SubRip subtitles, strips index lines and timestamps
  .docx  — Microsoft Word (python-docx)
  .pdf   — PDF text layer only (PyPDF2); no OCR

Audio/video files are NOT supported for transcription. The endpoint will
return a clear error message if one is uploaded.
"""
from __future__ import annotations

import io
import re
from typing import Tuple


# ── helpers ──────────────────────────────────────────────────────────────────

def _strip_vtt(raw: str) -> str:
    """Remove WebVTT headers, cue identifiers, and timestamp lines."""
    lines = raw.splitlines()
    out = []
    for line in lines:
        stripped = line.strip()
        # Skip WEBVTT header, NOTE blocks, timestamp lines
        if stripped.startswith("WEBVTT") or stripped.startswith("NOTE"):
            continue
        # VTT/SRT timestamp pattern: 00:00:00.000 --> 00:00:00.000
        if re.match(r"^\d{1,2}:\d{2}[\.:]\d{2}", stripped):
            continue
        # Pure numeric cue identifier
        if re.match(r"^\d+$", stripped):
            continue
        if stripped:
            out.append(stripped)
    return "\n".join(out)


def _strip_srt(raw: str) -> str:
    """Remove SRT indices and timestamp lines."""
    lines = raw.splitlines()
    out = []
    for line in lines:
        stripped = line.strip()
        if re.match(r"^\d+$", stripped):
            continue
        if re.match(r"^\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+\d{2}:\d{2}:\d{2},\d{3}", stripped):
            continue
        if stripped:
            out.append(stripped)
    return "\n".join(out)


# ── main extractor ────────────────────────────────────────────────────────────

AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".wmv"}
TEXT_EXTENSIONS  = {".txt", ".vtt", ".srt", ".docx", ".pdf"}
MAX_FILE_SIZE_MB = 20


def extract_text(filename: str, file_bytes: bytes) -> Tuple[str, str]:
    """
    Extract plain text from the uploaded file.

    Returns:
        (text, detected_format)

    Raises:
        ValueError with a descriptive message on unsupported type or bad content.
    """
    if len(file_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise ValueError(f"File exceeds maximum size of {MAX_FILE_SIZE_MB} MB.")

    ext = _get_extension(filename)

    if ext in AUDIO_EXTENSIONS or ext in VIDEO_EXTENSIONS:
        raise ValueError(
            f"Audio/video transcription is not supported in this version. "
            f"Please upload a transcript file (.txt, .vtt, .srt, .docx, or .pdf) instead."
        )

    if ext not in TEXT_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type '{ext}'. "
            f"Accepted types: .txt, .vtt, .srt, .docx, .pdf"
        )

    if ext == ".txt":
        return _read_txt(file_bytes), "txt"
    if ext == ".vtt":
        return _read_vtt(file_bytes), "vtt"
    if ext == ".srt":
        return _read_srt(file_bytes), "srt"
    if ext == ".docx":
        return _read_docx(file_bytes), "docx"
    if ext == ".pdf":
        return _read_pdf(file_bytes), "pdf"

    raise ValueError(f"Unhandled extension: {ext}")  # unreachable


def _get_extension(filename: str) -> str:
    parts = filename.rsplit(".", 1)
    if len(parts) != 2:
        return ""
    return "." + parts[1].lower()


def _read_txt(data: bytes) -> str:
    for enc in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
        try:
            text = data.decode(enc)
            text = text.strip()
            if not text:
                raise ValueError("The uploaded text file appears to be empty.")
            return text
        except UnicodeDecodeError:
            continue
    raise ValueError("Could not decode the text file. Please ensure it is saved as UTF-8.")


def _read_vtt(data: bytes) -> str:
    raw = _read_txt(data)
    text = _strip_vtt(raw)
    if not text.strip():
        raise ValueError("The VTT file contained no readable caption text after parsing.")
    return text


def _read_srt(data: bytes) -> str:
    raw = _read_txt(data)
    text = _strip_srt(raw)
    if not text.strip():
        raise ValueError("The SRT file contained no readable subtitle text after parsing.")
    return text


def _read_docx(data: bytes) -> str:
    try:
        from docx import Document  # type: ignore
    except ImportError:
        raise ValueError("python-docx is not installed. Run: pip install python-docx")
    try:
        doc = Document(io.BytesIO(data))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        if not paragraphs:
            raise ValueError("The DOCX file contains no readable text.")
        return "\n".join(paragraphs)
    except Exception as exc:
        raise ValueError(f"Failed to read DOCX file: {exc}") from exc


def _read_pdf(data: bytes) -> str:
    try:
        from PyPDF2 import PdfReader  # type: ignore
    except ImportError:
        raise ValueError("PyPDF2 is not installed. Run: pip install pypdf2")
    try:
        reader = PdfReader(io.BytesIO(data))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text.strip())
        if not pages:
            raise ValueError(
                "No text could be extracted from the PDF. "
                "The file may be scanned (image-only). OCR is not supported."
            )
        return "\n".join(pages)
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Failed to read PDF file: {exc}") from exc
