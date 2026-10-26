import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, ThumbsUp, Trash2, Lightbulb, Calendar, User, Edit2,
  Loader2, AlertTriangle, X, RefreshCw, CheckCircle, FileText
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';
import { getDecisions, createDecision, updateDecision, deleteDecision, getMeetings } from '../services/api';
import { formatDate, getStatusColor } from '../utils/helpers';

const impactColors = { high: 'red', medium: 'yellow', low: 'green' };
const emptyForm = { title: '', description: '', decided_by: '', meeting_id: '', impact: 'medium', decision_date: '', evidence: '', tags: '', status: 'pending' };

export default function Decisions() {
  const [decisions, setDecisions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [impactFilter, setImpactFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [decRes, mtgRes] = await Promise.all([getDecisions(), getMeetings()]);
      setDecisions(decRes.items || []);
      setMeetings(mtgRes.items || []);
    } catch (e) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => ({
    total: decisions.length,
    approved: decisions.filter(d => d.status === 'approved').length,
    pending: decisions.filter(d => d.status === 'pending').length,
    rejected: decisions.filter(d => d.status === 'rejected').length,
  }), [decisions]);

  const filtered = useMemo(() => {
    return decisions.filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.title.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q) || (d.tags || []).some(t => t.toLowerCase().includes(q));
      const matchImpact = impactFilter === 'all' || d.impact === impactFilter;
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchSearch && matchImpact && matchStatus;
    });
  }, [decisions, search, impactFilter, statusFilter]);

  function showSuccess(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); }
  function handleFormChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }
  function getMeetingTitle(id) { if (!id) return '—'; const m = meetings.find(m => m.id === id); return m ? m.title : `#${id}`; }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createDecision({
        title: form.title, description: form.description || null,
        decided_by: form.decided_by || null, impact: form.impact || null,
        meeting_id: form.meeting_id ? Number(form.meeting_id) : null,
        decision_date: form.decision_date || new Date().toISOString().split('T')[0],
        evidence: form.evidence || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        status: form.status,
      });
      showSuccess('Decision created');
      setForm(emptyForm);
      setAddOpen(false);
      fetchData();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  function openEdit(d) {
    setEditItem(d);
    setForm({
      title: d.title, description: d.description || '', decided_by: d.decided_by || '',
      meeting_id: d.meeting_id || '', impact: d.impact || 'medium',
      decision_date: d.decision_date || '', evidence: d.evidence || '',
      tags: (d.tags || []).join(', '), status: d.status,
    });
    setEditOpen(true);
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      await updateDecision(editItem.id, {
        title: form.title, description: form.description || null,
        decided_by: form.decided_by || null, impact: form.impact || null,
        meeting_id: form.meeting_id ? Number(form.meeting_id) : null,
        decision_date: form.decision_date || null, evidence: form.evidence || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        status: form.status,
      });
      showSuccess('Decision updated');
      setEditOpen(false); setEditItem(null);
      fetchData();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function handleApprove(id) {
    try { await updateDecision(id, { status: 'approved' }); showSuccess('Decision approved'); fetchData(); }
    catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this decision?')) return;
    try { await deleteDecision(id); showSuccess('Decision deleted'); fetchData(); }
    catch (e) { setError(e.message); }
  }

  function renderForm(onSubmit, submitLabel) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
          <input type="text" name="title" required value={form.title} onChange={handleFormChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Decision title" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleFormChange} rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Describe the decision..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Evidence / Transcript Excerpt</label>
          <textarea name="evidence" value={form.evidence} onChange={handleFormChange} rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-xs" placeholder="Paste relevant transcript excerpt..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Decided By</label>
            <input type="text" name="decided_by" value={form.decided_by} onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Person name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Decision Date</label>
            <input type="date" name="decision_date" value={form.decision_date} onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Impact</label>
            <select name="impact" value={form.impact} onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {['high', 'medium', 'low'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select name="status" value={form.status} onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {['pending', 'approved', 'rejected'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meeting</label>
            <select name="meeting_id" value={form.meeting_id} onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">None</option>
              {meetings.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
          <input type="text" name="tags" value={form.tags} onChange={handleFormChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="architecture, backend, Q4" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => { setAddOpen(false); setEditOpen(false); }}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {submitLabel}</Button>
        </div>
      </form>
    );
  }

  if (loading) {
    return (<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /><span className="ml-3 text-gray-500 dark:text-gray-400">Loading decisions...</span></div>);
  }

  return (
    <div className="space-y-6">
      {successMsg && (<div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg shadow-lg text-green-700 dark:text-green-400 text-sm"><CheckCircle className="w-4 h-4" /> {successMsg}</div>)}
      {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}<button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button></div>)}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Decisions</h2><p className="text-sm text-gray-500 dark:text-gray-400">{decisions.length} total decisions from the database</p></div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchData}><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Button onClick={() => { setForm(emptyForm); setAddOpen(true); }}><Plus className="w-4 h-4" /> Add Decision</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, cls: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700' },
          { label: 'Approved', value: stats.approved, cls: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' },
          { label: 'Pending', value: stats.pending, cls: 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' },
          { label: 'Rejected', value: stats.rejected, cls: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl shadow-sm p-4 text-center ${s.cls}`}>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search decisions, tags..." className="flex-1 min-w-0" />
          <select value={impactFilter} onChange={e => setImpactFilter(e.target.value)} className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Impacts</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Statuses</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option>
          </select>
        </div>
      </Card>

      {/* Decision Cards */}
      {filtered.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No decisions found" description="Adjust your filters or add a new decision."
          action={<Button onClick={() => { setSearch(''); setImpactFilter('all'); setStatusFilter('all'); }} variant="secondary" size="sm">Clear filters</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(d => (
            <Card key={d.id} className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white leading-snug">{d.title}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge color={impactColors[d.impact] || 'gray'}>{d.impact || '—'} impact</Badge>
                  <Badge color={getStatusColor(d.status)}>{d.status}</Badge>
                </div>
              </div>
              {d.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{d.description}</p>}

              {/* Evidence */}
              {d.evidence && (
                <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1"><FileText className="w-3 h-3" /> Evidence</div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-2">{d.evidence}</p>
                </div>
              )}

              {/* Tags */}
              {d.tags && d.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {d.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs rounded-full">{tag}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  {d.decided_by && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {d.decided_by}</span>}
                  {d.decision_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(d.decision_date)}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                  {d.status === 'pending' && (
                    <button onClick={() => handleApprove(d.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Approve"><ThumbsUp className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Source: <span className="font-medium text-gray-600 dark:text-gray-300">{getMeetingTitle(d.meeting_id)}</span></p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Decision" size="lg">{renderForm(handleAdd, 'Add Decision')}</Modal>
      <Modal isOpen={editOpen} onClose={() => { setEditOpen(false); setEditItem(null); }} title="Edit Decision" size="lg">{renderForm(handleEdit, 'Save Changes')}</Modal>
    </div>
  );
}
