/**
 * Extraction API service — connects the frontend to Phase 3 backend endpoints.
 * Base URL defaults to http://localhost:8000. Override with VITE_API_URL env var.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse(res) {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || JSON.stringify(err);
    } catch { /* ignore */ }
    throw new Error(detail);
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

/**
 * Upload a file and get back extracted plain text.
 * @param {File} file
 * @returns {Promise<{filename, char_count, line_count, detected_format, text}>}
 */
export async function parseFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/api/extract/parse`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

/**
 * Process transcript text through the extraction engine.
 * @param {object} params
 * @returns {Promise<ExtractionResult>}
 */
export async function processTranscript({
  transcript,
  meetingTitle = null,
  language = 'en',
  extractActions = true,
  extractDecisions = true,
  extractKeyPoints = true,
  extractRisks = true,
  extractQuestions = true,
}) {
  const res = await fetch(`${BASE_URL}/api/extract/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript,
      meeting_title: meetingTitle,
      language,
      extract_actions: extractActions,
      extract_decisions: extractDecisions,
      extract_key_points: extractKeyPoints,
      extract_risks: extractRisks,
      extract_questions: extractQuestions,
    }),
  });
  return handleResponse(res);
}

/**
 * Save approved extraction results to the database.
 * @param {object} params
 * @returns {Promise<ApproveResponse>}
 */
export async function approveExtraction({
  meetingId,
  result,
  overwriteSummary = true,
  saveActions = true,
  saveDecisions = true,
  saveKeyPoints = true,
}) {
  const res = await fetch(`${BASE_URL}/api/extract/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meeting_id: meetingId,
      result,
      overwrite_summary: overwriteSummary,
      save_actions: saveActions,
      save_decisions: saveDecisions,
      save_key_points: saveKeyPoints,
    }),
  });
  return handleResponse(res);
}

/**
 * Re-run extraction on a meeting's stored transcript.
 * @param {number} meetingId
 * @returns {Promise<ExtractionResult>}
 */
export async function reprocessMeeting(meetingId) {
  const res = await fetch(`${BASE_URL}/api/extract/reprocess/${meetingId}`, {
    method: 'POST',
  });
  return handleResponse(res);
}

/**
 * Fetch the list of meetings (for the meeting selector dropdown).
 */
export async function fetchMeetings() {
  const res = await fetch(`${BASE_URL}/api/meetings?page_size=100&sort_by=date&sort_order=desc`);
  return handleResponse(res);
}

/**
 * Create a new meeting.
 */
export async function createMeeting(data) {
  const res = await fetch(`${BASE_URL}/api/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}
