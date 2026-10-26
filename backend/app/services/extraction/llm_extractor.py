"""
Optional LLM-based extractor — only active when OPENAI_API_KEY is set.

Compatible with any OpenAI-API-compatible provider:
  - OpenAI (gpt-4o, gpt-4o-mini, gpt-3.5-turbo)
  - Local models via OPENAI_BASE_URL (e.g. Ollama, LM Studio, Together AI)

When no key is configured this module raises ImportError-style ValueError
so the orchestrator falls back to rule_extractor silently.
"""
from __future__ import annotations

import json
import textwrap
from typing import Optional

from app.schemas.extraction import ExtractionResult


_SYSTEM_PROMPT = textwrap.dedent("""
You are an expert meeting analyst. Extract structured knowledge from the transcript.
Return ONLY valid JSON matching this schema — no markdown fences, no extra keys:

{
  "summary": "<2-3 sentence summary or null>",
  "key_points": [
    {"content": "...", "category": "highlight|risk|question|summary|other", "evidence": "<verbatim sentence>", "confidence": 0.9}
  ],
  "action_items": [
    {"title": "...", "owner": "<name or null>", "due_date": "<date string or null>", "priority": "low|medium|high", "evidence": "<verbatim sentence>", "confidence": 0.9, "ambiguous": false}
  ],
  "decisions": [
    {"title": "...", "description": "<or null>", "decided_by": "<name or null>", "impact": "low|medium|high|null", "evidence": "<verbatim sentence>", "confidence": 0.9, "ambiguous": false}
  ],
  "risks": [{"content": "...", "evidence": "..."}],
  "open_questions": [{"content": "...", "evidence": "..."}],
  "warnings": ["<any ambiguity notes>"]
}

Rules:
- Never invent owners, dates, or decisions not found in the text.
- Set owner/due_date to null when not mentioned.
- Set ambiguous=true when information is inferred, not explicitly stated.
- Only include items clearly supported by the transcript.
""").strip()


def run_llm_extraction(
    transcript: str,
    api_key: str,
    model: str = "gpt-4o-mini",
    base_url: Optional[str] = None,
    extract_actions: bool = True,
    extract_decisions: bool = True,
    extract_key_points: bool = True,
    extract_risks: bool = True,
    extract_questions: bool = True,
) -> ExtractionResult:
    """
    Call an OpenAI-compatible API to extract structured meeting knowledge.

    Raises:
        ValueError: on API failure, bad JSON, or validation error — caller
                    should fall back to rule_extractor.
    """
    try:
        import urllib.request as _req
        import urllib.error as _err
    except ImportError as e:
        raise ValueError(f"urllib not available: {e}") from e

    sections = []
    if not extract_actions:
        sections.append("Skip action item extraction.")
    if not extract_decisions:
        sections.append("Skip decision extraction.")
    if not extract_key_points:
        sections.append("Skip key point extraction.")
    if not extract_risks:
        sections.append("Skip risk extraction.")
    if not extract_questions:
        sections.append("Skip open question extraction.")

    user_prompt = f"Transcript:\n\n{transcript[:12000]}"  # guard token limit
    if sections:
        user_prompt += "\n\nInstructions: " + " ".join(sections)

    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt},
        ],
        "temperature": 0.1,
        "max_tokens": 3000,
    }).encode()

    endpoint = (base_url or "https://api.openai.com").rstrip("/") + "/v1/chat/completions"
    request = _req.Request(
        endpoint,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with _req.urlopen(request, timeout=60) as resp:
            body = json.loads(resp.read())
    except _err.HTTPError as exc:
        raise ValueError(f"LLM API error {exc.code}: {exc.read().decode(errors='replace')}") from exc
    except Exception as exc:
        raise ValueError(f"LLM API request failed: {exc}") from exc

    try:
        raw_content = body["choices"][0]["message"]["content"].strip()
        # Strip markdown fences if model adds them
        raw_content = raw_content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(raw_content)
    except (KeyError, json.JSONDecodeError) as exc:
        raise ValueError(f"LLM returned unparseable JSON: {exc}") from exc

    try:
        result = ExtractionResult.model_validate({**data, "extractor_used": "llm"})
        return result
    except Exception as exc:
        raise ValueError(f"LLM output failed schema validation: {exc}") from exc
