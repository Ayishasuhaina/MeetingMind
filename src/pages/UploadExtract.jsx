/**
 * UploadExtract — Phase 3 complete rewrite.
 *
 * Step 1: Upload file OR paste transcript text + choose / create meeting
 * Step 2: Preview extracted text + validate
 * Step 3: Review extraction results (editable)
 * Step 4: Approve → save to DB + success screen
 *
 * Supported file types: .txt, .vtt, .srt, .docx, .pdf
 * Audio/video transcription is NOT supported — clearly indicated.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, FileText, X, ChevronRight, ChevronLeft, CheckCircle,
  AlertTriangle, Info, Loader2, RefreshCw, Settings2, Eye,
  Trash2, Plus, Save, RotateCcw, Lightbulb, CheckSquare,
  MessageSquare, ShieldAlert, HelpCircle, Brain,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import {
  parseFile,
  processTranscript,
  approveExtraction,
  fetchMeetings,
  createMeeting,
} from '../services/extractionApi';

// ── Constants ─────────────────────────────────────────────────────────────────
const SUPPORTED_EXTENSIONS = ['.txt', '.vtt', '.srt', '.docx', '.pdf'];
const MAX_FILE_MB = 20;
const STEPS = ['Input', 'Preview', 'Review', 'Done'];

// ── Small helpers ─────────────────────────────────────────────────────────────
function fileExtension(name = '') {
  const parts = name.split('.');
  return parts.length > 1 ? '.' + parts[parts.length - 1].toLowerCase() : '';
}

function fileSizeMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

function StatusDot({ status }) {
  const cls = {
    ok: 'bg-green-500',
    warn: 'bg-yellow-500',
    error: 'bg-red-500',
  }[status] || 'bg-gray-400';
  return <span className={`inline-block w-2 h-2 rounded-full ${cls} mr-1.5 flex-shrink-0`} />;
}

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${done ? 'bg-green-500 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 sm:w-16 ${i < current ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Editable list item ────────────────────────────────────────────────────────
function EditableItem({ item, fields, onUpdate, onRemove, ambiguousNote }) {
  return (
    <div className={`p-3 rounded-lg border ${item.ambiguous ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'} space-y-2`}>
      {item.ambiguous && (
        <div className="flex items-start gap-1.5 text-yellow-700 dark:text-yellow-400 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{ambiguousNote || 'Some details could not be determined from the text. Please review.'}</span>
        </div>
      )}
      {fields.map(({ key, label, type, options }) => (
        <div key={key} className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">{label}</label>
          {type === 'select' ? (
            <select
              value={item[key] || ''}
              onChange={e => onUpdate({ ...item, [key]: e.target.value })}
              className="flex-1 text-xs px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {options.map(o => <option key={o} value={o}>{o}</option>)}
              <option value="">—</option>
            </select>
          ) : (
            <input
              type={type || 'text'}
              value={item[key] || ''}
              onChange={e => onUpdate({ ...item, [key]: e.target.value })}
              placeholder={`Enter ${label.toLowerCase()}…`}
              className="flex-1 text-xs px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-400"
            />
          )}
        </div>
      ))}
      {item.evidence && (
        <details className="text-xs text-gray-500 dark:text-gray-400">
          <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">Evidence excerpt</summary>
          <blockquote className="mt-1 pl-2 border-l-2 border-gray-300 dark:border-gray-600 italic">{item.evidence}</blockquote>
        </details>
      )}
      <div className="flex justify-end">
        <button onClick={onRemove} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
          <Trash2 className="w-3 h-3" /> Remove
        </button>
      </div>
    </div>
  );
}

// ── Section collapse panel ────────────────────────────────────────────────────
function Section({ icon: Icon, title, count, color, children, badge }) {
  const [open, setOpen] = useState(true);
  return (
    <Card padding={false} className="overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
          <span className="px-2 py-0.5 text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">{count}</span>
          {badge}
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 space-y-2">{children}</div>}
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function UploadExtract() {
  const [step, setStep] = useState(0);

  // Step 1 state
  const [inputMode, setInputMode] = useState('file'); // 'file' | 'paste'
  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [createNewMeeting, setCreateNewMeeting] = useState(false);
  const [settings, setSettings] = useState({
    language: 'en',
    extractActions: true,
    extractDecisions: true,
    extractKeyPoints: true,
    extractRisks: true,
    extractQuestions: true,
  });

  // Step 2 state
  const [parsedText, setParsedText] = useState('');
  const [parseInfo, setParseInfo] = useState(null); // {filename, char_count, detected_format}
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  // Step 3 state
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extraction, setExtraction] = useState(null); // ExtractionResult

  // Step 4 state
  const [approving, setApproving] = useState(false);
  const [approveResult, setApproveResult] = useState(null);
  const [approveError, setApproveError] = useState('');
  const [targetMeetingId, setTargetMeetingId] = useState(null);

  const fileRef = useRef();

  // Load meetings list
  useEffect(() => {
    fetchMeetings()
      .then(data => setMeetings(data?.items || []))
      .catch(() => setMeetings([]));
  }, []);

  // ── File handling ───────────────────────────────────────────────────────────
  function validateFile(file) {
    if (!file) return 'No file selected.';
    const ext = fileExtension(file.name);
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type "${ext}". Accepted: ${SUPPORTED_EXTENSIONS.join(', ')}. Note: audio/video transcription is not supported.`;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return `File is too large (${fileSizeMB(file.size)} MB). Maximum allowed size is ${MAX_FILE_MB} MB.`;
    }
    if (file.size === 0) {
      return 'The file appears to be empty.';
    }
    return '';
  }

  function handleFilePick(file) {
    const err = validateFile(file);
    setFileError(err);
    setSelectedFile(err ? null : file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFilePick(file);
  }

  // ── Step 1 → Step 2: parse ──────────────────────────────────────────────────
  async function handleParse() {
    setParseError('');
    setParsing(true);
    try {
      if (inputMode === 'file') {
        const result = await parseFile(selectedFile);
        setParsedText(result.text);
        setParseInfo(result);
      } else {
        if (pastedText.trim().length < 10) {
          setParseError('Please enter at least a few lines of transcript text.');
          return;
        }
        setParsedText(pastedText.trim());
        setParseInfo({ filename: 'pasted-text', char_count: pastedText.length, line_count: pastedText.split('\n').length, detected_format: 'txt' });
      }
      setStep(1);
    } catch (err) {
      setParseError(err.message || 'Failed to parse file.');
    } finally {
      setParsing(false);
    }
  }

  // ── Step 2 → Step 3: extract ────────────────────────────────────────────────
  async function handleExtract() {
    setExtractError('');
    setExtracting(true);
    try {
      const result = await processTranscript({
        transcript: parsedText,
        meetingTitle: createNewMeeting ? newMeetingTitle : (meetings.find(m => m.id === +selectedMeetingId)?.title || null),
        language: settings.language,
        extractActions: settings.extractActions,
        extractDecisions: settings.extractDecisions,
        extractKeyPoints: settings.extractKeyPoints,
        extractRisks: settings.extractRisks,
        extractQuestions: settings.extractQuestions,
      });
      setExtraction(result);
      setStep(2);
    } catch (err) {
      setExtractError(err.message || 'Extraction failed.');
    } finally {
      setExtracting(false);
    }
  }

  // ── Step 3 → Step 4: approve ────────────────────────────────────────────────
  async function handleApprove() {
    setApproveError('');
    setApproving(true);
    try {
      let meetingId = +selectedMeetingId;

      // Create meeting if needed
      if (createNewMeeting) {
        if (!newMeetingTitle.trim()) {
          setApproveError('Please enter a title for the new meeting.');
          return;
        }
        const created = await createMeeting({
          title: newMeetingTitle.trim(),
          transcript: parsedText,
          processing_status: 'processing',
        });
        meetingId = created.id;
      } else {
        // Store transcript on existing meeting via update
        if (!meetingId) {
          setApproveError('Please select a meeting to save results to.');
          return;
        }
        // Update transcript via meetings PUT
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/meetings/${meetingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: parsedText }),
        });
      }

      setTargetMeetingId(meetingId);

      const result = await approveExtraction({
        meetingId,
        result: extraction,
        overwriteSummary: true,
        saveActions: true,
        saveDecisions: true,
        saveKeyPoints: true,
      });
      setApproveResult(result);
      setStep(3);
    } catch (err) {
      setApproveError(err.message || 'Failed to save results.');
    } finally {
      setApproving(false);
    }
  }

  // ── Extraction result editors ────────────────────────────────────────────────
  function updateAction(i, updated) {
    setExtraction(e => ({ ...e, action_items: e.action_items.map((a, idx) => idx === i ? updated : a) }));
  }
  function removeAction(i) {
    setExtraction(e => ({ ...e, action_items: e.action_items.filter((_, idx) => idx !== i) }));
  }
  function addAction() {
    setExtraction(e => ({ ...e, action_items: [...e.action_items, { title: '', owner: null, due_date: null, priority: 'medium', evidence: null, confidence: 1, ambiguous: false }] }));
  }

  function updateDecision(i, updated) {
    setExtraction(e => ({ ...e, decisions: e.decisions.map((d, idx) => idx === i ? updated : d) }));
  }
  function removeDecision(i) {
    setExtraction(e => ({ ...e, decisions: e.decisions.filter((_, idx) => idx !== i) }));
  }
  function addDecision() {
    setExtraction(e => ({ ...e, decisions: [...e.decisions, { title: '', description: null, decided_by: null, impact: null, evidence: null, confidence: 1, ambiguous: false }] }));
  }

  function removeRisk(i) {
    setExtraction(e => ({ ...e, risks: e.risks.filter((_, idx) => idx !== i) }));
  }
  function removeQuestion(i) {
    setExtraction(e => ({ ...e, open_questions: e.open_questions.filter((_, idx) => idx !== i) }));
  }
  function removeKeyPoint(i) {
    setExtraction(e => ({ ...e, key_points: e.key_points.filter((_, idx) => idx !== i) }));
  }

  function resetAll() {
    setStep(0); setSelectedFile(null); setPastedText(''); setParsedText('');
    setParseInfo(null); setParseError(''); setExtractError(''); setApproveError('');
    setExtraction(null); setApproveResult(null); setTargetMeetingId(null);
    setCreateNewMeeting(false); setSelectedMeetingId(''); setNewMeetingTitle('');
  }

  // ── Render helpers ───────────────────────────────────────────────────────────
  const canProceedStep0 = !fileError && (
    (inputMode === 'file' && selectedFile) ||
    (inputMode === 'paste' && pastedText.trim().length >= 10)
  ) && (createNewMeeting ? newMeetingTitle.trim() : selectedMeetingId);

  const ambiguousCount = extraction
    ? (extraction.action_items.filter(a => a.ambiguous).length + extraction.decisions.filter(d => d.ambiguous).length)
    : 0;

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Upload &amp; Extract
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload a transcript file or paste text to extract meeting knowledge — summaries, action items, decisions, and more.
        </p>
      </div>

      <StepIndicator current={step} />

      {/* ── STEP 0: Input ─────────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Input mode toggle */}
            <Card>
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 w-fit">
                {[['file', 'Upload File'], ['paste', 'Paste Text']].map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setInputMode(mode)}
                    className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${inputMode === mode
                        ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {inputMode === 'file' ? (
                <>
                  {/* Drag & drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      dragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : selectedFile ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                        : fileError ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      accept=".txt,.vtt,.srt,.docx,.pdf"
                      onChange={e => { if (e.target.files[0]) handleFilePick(e.target.files[0]); }}
                    />
                    {selectedFile ? (
                      <>
                        <FileText className="w-12 h-12 text-green-500 mb-3" />
                        <p className="font-semibold text-gray-900 dark:text-white">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fileSizeMB(selectedFile.size)} MB</p>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedFile(null); setFileError(''); }}
                          className="mt-3 p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="font-semibold text-gray-900 dark:text-white">Drag &amp; drop or click to browse</p>
                        <div className="flex flex-wrap gap-2 mt-3 justify-center">
                          {SUPPORTED_EXTENSIONS.map(ext => (
                            <span key={ext} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full font-mono">{ext}</span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Max {MAX_FILE_MB} MB · Text files only · No audio/video</p>
                      </>
                    )}
                  </div>
                  {fileError && (
                    <div className="mt-2 flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{fileError}</span>
                    </div>
                  )}
                </>
              ) : (
                /* Paste mode */
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Paste transcript text
                  </label>
                  <textarea
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    rows={12}
                    placeholder={"Paste your meeting transcript here...\n\nExample:\nAlice: Let's discuss the Q4 roadmap.\nBob: I think we should prioritize the mobile app feature.\n..."}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono resize-y"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {pastedText.length} characters · Speaker labels (e.g. "Alice:") are supported and will be stripped
                  </p>
                </div>
              )}
            </Card>

            {/* Meeting selection */}
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Link to Meeting</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCreateNewMeeting(false)}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${!createNewMeeting ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    Use Existing Meeting
                  </button>
                  <button
                    onClick={() => setCreateNewMeeting(true)}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${createNewMeeting ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    + Create New Meeting
                  </button>
                </div>

                {createNewMeeting ? (
                  <input
                    type="text"
                    value={newMeetingTitle}
                    onChange={e => setNewMeetingTitle(e.target.value)}
                    placeholder="Enter meeting title…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <select
                    value={selectedMeetingId}
                    onChange={e => setSelectedMeetingId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a meeting…</option>
                    {meetings.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.title} {m.date ? `(${m.date})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </Card>
          </div>

          {/* Settings panel */}
          <div className="space-y-4">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Extraction Settings</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
                  <select
                    value={settings.language}
                    onChange={e => setSettings(s => ({ ...s, language: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
                {[
                  { key: 'extractActions', label: 'Action Items', desc: 'Find tasks and owners' },
                  { key: 'extractDecisions', label: 'Decisions', desc: 'Identify agreements made' },
                  { key: 'extractKeyPoints', label: 'Key Points', desc: 'Notable discussion highlights' },
                  { key: 'extractRisks', label: 'Risks & Blockers', desc: 'Concerns and blockers' },
                  { key: 'extractQuestions', label: 'Open Questions', desc: 'Unresolved questions' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                    </div>
                    <button
                      onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${settings[key] ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${settings[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold">About extraction</p>
                  <p>Uses local rule-based extraction by default. Set <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">OPENAI_API_KEY</code> in the backend <code>.env</code> file for LLM-powered extraction.</p>
                  <p className="text-blue-600 dark:text-blue-500">Audio/video transcription is not supported. Text files only.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── STEP 1: Preview ───────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          {parseInfo && (
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full">
                <FileText className="w-3.5 h-3.5" />
                {parseInfo.filename}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">
                Format: <strong>{parseInfo.detected_format?.toUpperCase()}</strong>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">
                {parseInfo.char_count?.toLocaleString()} chars · {parseInfo.line_count} lines
              </span>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${parseInfo.char_count > 500 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'}`}>
                <StatusDot status={parseInfo.char_count > 500 ? 'ok' : 'warn'} />
                {parseInfo.char_count > 500 ? 'Good length' : 'Short transcript'}
              </span>
            </div>
          )}

          <Card padding={false}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Extracted Text Preview</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Edit below if needed before processing</span>
            </div>
            <textarea
              value={parsedText}
              onChange={e => setParsedText(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 text-sm font-mono bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none resize-y"
            />
          </Card>

          {extractError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{extractError}</span>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Review extraction ─────────────────────────────────────────── */}
      {step === 2 && extraction && (
        <div className="space-y-4">
          {/* Extractor badge + warnings */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge color={extraction.extractor_used === 'llm' ? 'indigo' : 'gray'}>
              {extraction.extractor_used === 'llm' ? 'LLM Extraction' : 'Rule-Based Extraction'}
            </Badge>
            {ambiguousCount > 0 && (
              <div className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{ambiguousCount} item(s) need review</span>
              </div>
            )}
          </div>

          {extraction.warnings?.map((w, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}

          {/* Summary */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Meeting Summary
            </h3>
            <textarea
              value={extraction.summary || ''}
              onChange={e => setExtraction(ex => ({ ...ex, summary: e.target.value }))}
              rows={3}
              placeholder="Auto-generated summary (editable)…"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
          </Card>

          {/* Action Items */}
          <Section icon={CheckSquare} title="Action Items" count={extraction.action_items.length} color="text-indigo-600 dark:text-indigo-400">
            {extraction.action_items.map((item, i) => (
              <EditableItem
                key={i}
                item={item}
                onUpdate={u => updateAction(i, u)}
                onRemove={() => removeAction(i)}
                ambiguousNote="Owner or due date could not be determined. Please fill in if known."
                fields={[
                  { key: 'title', label: 'Title', type: 'text' },
                  { key: 'owner', label: 'Owner', type: 'text' },
                  { key: 'due_date', label: 'Due Date', type: 'text' },
                  { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'] },
                ]}
              />
            ))}
            <button onClick={addAction} className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-1">
              <Plus className="w-3.5 h-3.5" /> Add action item
            </button>
          </Section>

          {/* Decisions */}
          <Section icon={Lightbulb} title="Decisions" count={extraction.decisions.length} color="text-yellow-600 dark:text-yellow-400">
            {extraction.decisions.map((d, i) => (
              <EditableItem
                key={i}
                item={d}
                onUpdate={u => updateDecision(i, u)}
                onRemove={() => removeDecision(i)}
                ambiguousNote="Decision owner could not be determined. Please verify."
                fields={[
                  { key: 'title', label: 'Title', type: 'text' },
                  { key: 'decided_by', label: 'Decided By', type: 'text' },
                  { key: 'impact', label: 'Impact', type: 'select', options: ['low', 'medium', 'high'] },
                ]}
              />
            ))}
            <button onClick={addDecision} className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-1">
              <Plus className="w-3.5 h-3.5" /> Add decision
            </button>
          </Section>

          {/* Key Points */}
          {extraction.key_points.length > 0 && (
            <Section icon={MessageSquare} title="Key Points" count={extraction.key_points.length} color="text-blue-600 dark:text-blue-400">
              {extraction.key_points.map((kp, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <p className="flex-1 text-sm text-gray-800 dark:text-gray-200">{kp.content}</p>
                  <button onClick={() => removeKeyPoint(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </Section>
          )}

          {/* Risks */}
          {extraction.risks.length > 0 && (
            <Section icon={ShieldAlert} title="Risks & Blockers" count={extraction.risks.length} color="text-red-600 dark:text-red-400">
              {extraction.risks.map((r, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/10 rounded border border-red-200 dark:border-red-800">
                  <p className="flex-1 text-sm text-gray-800 dark:text-gray-200">{r.content}</p>
                  <button onClick={() => removeRisk(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </Section>
          )}

          {/* Open Questions */}
          {extraction.open_questions.length > 0 && (
            <Section icon={HelpCircle} title="Open Questions" count={extraction.open_questions.length} color="text-purple-600 dark:text-purple-400">
              {extraction.open_questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-purple-50 dark:bg-purple-900/10 rounded border border-purple-200 dark:border-purple-800">
                  <p className="flex-1 text-sm text-gray-800 dark:text-gray-200">{q.content}</p>
                  <button onClick={() => removeQuestion(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </Section>
          )}

          {approveError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{approveError}</span>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Done ─────────────────────────────────────────────────────── */}
      {step === 3 && approveResult && (
        <Card className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Extraction Saved!</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">{approveResult.message}</p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { label: 'Action Items Saved', val: approveResult.saved_actions, color: 'indigo' },
              { label: 'Decisions Saved', val: approveResult.saved_decisions, color: 'yellow' },
              { label: 'Key Points Saved', val: approveResult.saved_key_points, color: 'blue' },
              { label: 'Duplicates Skipped', val: approveResult.skipped_duplicate_actions + approveResult.skipped_duplicate_decisions, color: 'gray' },
            ].map(({ label, val, color }) => (
              <div key={label} className={`px-4 py-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-800`}>
                <p className={`text-2xl font-bold text-${color}-700 dark:text-${color}-300`}>{val}</p>
                <p className={`text-xs text-${color}-600 dark:text-${color}-400 mt-0.5`}>{label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="secondary" onClick={resetAll}>
              <RotateCcw className="w-4 h-4" /> Process Another
            </Button>
            {targetMeetingId && (
              <Button onClick={() => window.location.href = '/action-items'}>
                <CheckSquare className="w-4 h-4" /> View Action Items
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ── Navigation bar ────────────────────────────────────────────────────── */}
      {step < 3 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            onClick={() => { if (step === 0) resetAll(); else setStep(s => s - 1); }}
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Reset' : 'Back'}
          </Button>

          <div className="flex gap-3">
            {step === 0 && (
              <Button onClick={handleParse} disabled={!canProceedStep0 || parsing}>
                {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                {parsing ? 'Parsing…' : 'Preview Text'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            {step === 1 && (
              <Button onClick={handleExtract} disabled={!parsedText.trim() || extracting}>
                {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {extracting ? 'Extracting…' : 'Run Extraction'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            {step === 2 && (
              <Button onClick={handleApprove} disabled={approving}>
                {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {approving ? 'Saving…' : 'Approve & Save'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
