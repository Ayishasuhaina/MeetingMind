import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, CheckCircle, Trash2, ChevronUp, ChevronDown, CheckSquare,
  Edit2, Loader2, AlertTriangle, Clock, X, RefreshCw
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';
import { getActions, createAction, updateAction, deleteAction, getMeetings } from '../services/api';
import { formatDate, getStatusColor, getPriorityColor, getInitials } from '../utils/helpers';

const STATUS_TABS = ['all', 'pending', 'in_progress', 'blocked', 'completed', 'overdue'];
const PRIORITY_OPTIONS = ['all', 'critical', 'high', 'medium', 'low'];
const PRIORITY_FORM = ['low', 'medium', 'high', 'critical'];
const STATUS_FORM = ['pending', 'in_progress', 'blocked', 'completed'];

const avatarColors = [
  'bg-indigo-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
  'bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-teal-500',
];

const emptyForm = { title: '', description: '', owner: '', due_date: '', priority: 'medium', status: 'pending', meeting_id: '' };

function isDueSoon(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T23:59:59');
  const now = new Date();
  const diff = (d - now) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 3;
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === 'completed') return false;
  return new Date(dateStr + 'T23:59:59') < new Date();
}

export default function ActionItems() {
  const [items, setItems] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');
  const [sortAsc, setSortAsc] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [actRes, mtgRes] = await Promise.all([getActions(), getMeetings()]);
      setItems(actRes.items || []);
      setMeetings(mtgRes.items || []);
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    blocked: items.filter(i => i.status === 'blocked').length,
    completed: items.filter(i => i.status === 'completed').length,
    overdue: items.filter(i => i.status === 'overdue' || isOverdue(i.due_date, i.status)).length,
  }), [items]);

  const filtered = useMemo(() => {
    return items
      .filter(item => {
        const q = search.toLowerCase();
        const matchSearch = !q || item.title.toLowerCase().includes(q) || (item.owner || '').toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || item.status === statusFilter ||
          (statusFilter === 'overdue' && isOverdue(item.due_date, item.status));
        const matchPriority = priorityFilter === 'all' || item.priority === priorityFilter;
        return matchSearch && matchStatus && matchPriority;
      })
      .sort((a, b) => {
        let diff;
        if (sortBy === 'priority') {
          const order = { critical: 0, high: 1, medium: 2, low: 3 };
          diff = (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
        } else {
          diff = new Date(a.due_date || '9999-12-31') - new Date(b.due_date || '9999-12-31');
        }
        return sortAsc ? diff : -diff;
      });
  }, [items, search, statusFilter, priorityFilter, sortBy, sortAsc]);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  function handleFormChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createAction({
        title: form.title, description: form.description || null,
        owner: form.owner || null, due_date: form.due_date || null,
        priority: form.priority, status: form.status,
        meeting_id: form.meeting_id ? Number(form.meeting_id) : null,
      });
      showSuccess('Action item created');
      setForm(emptyForm);
      setAddOpen(false);
      fetchData();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      title: item.title, description: item.description || '',
      owner: item.owner || '', due_date: item.due_date || '',
      priority: item.priority, status: item.status,
      meeting_id: item.meeting_id || '',
    });
    setEditOpen(true);
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      await updateAction(editItem.id, {
        title: form.title, description: form.description || null,
        owner: form.owner || null, due_date: form.due_date || null,
        priority: form.priority, status: form.status,
        meeting_id: form.meeting_id ? Number(form.meeting_id) : null,
      });
      showSuccess('Action item updated');
      setEditOpen(false);
      setEditItem(null);
      fetchData();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await updateAction(id, { status: newStatus });
      showSuccess(`Status changed to ${newStatus.replace('_', ' ')}`);
      fetchData();
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this action item?')) return;
    try {
      await deleteAction(id);
      showSuccess('Action item deleted');
      fetchData();
    } catch (e) { setError(e.message); }
  }

  function getMeetingTitle(meetingId) {
    if (!meetingId) return '—';
    const m = meetings.find(m => m.id === meetingId);
    return m ? m.title : `#${meetingId}`;
  }

  const getMemberColor = (name) => {
    if (!name) return avatarColors[0];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return avatarColors[Math.abs(h) % avatarColors.length];
  };

  const statusLabel = (s) => s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1);

  function toggleSort(col) {
    if (sortBy === col) setSortAsc(v => !v);
    else { setSortBy(col); setSortAsc(true); }
  }

  // ── Form modal shared between Add and Edit ────────────────────────────────
  function renderForm(onSubmit, submitLabel) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
          <input type="text" name="title" required value={form.title} onChange={handleFormChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Action item title" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleFormChange} rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Details..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner</label>
            <input type="text" name="owner" value={form.owner} onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Person name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
            <input type="date" name="due_date" value={form.due_date} onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
            <select name="priority" value={form.priority} onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {PRIORITY_FORM.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select name="status" value={form.status} onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {STATUS_FORM.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
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
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => { setAddOpen(false); setEditOpen(false); }}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        </div>
      </form>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading action items...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg shadow-lg text-green-700 dark:text-green-400 text-sm animate-slide-in">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Action Items</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{items.length} total action items from the database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchData}><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Button onClick={() => { setForm(emptyForm); setAddOpen(true); }}><Plus className="w-4 h-4" /> Add Action Item</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
          { label: 'Pending', value: stats.pending, cls: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
          { label: 'In Progress', value: stats.in_progress, cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
          { label: 'Blocked', value: stats.blocked, cls: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
          { label: 'Completed', value: stats.completed, cls: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
          { label: 'Overdue', value: stats.overdue, cls: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 ${s.cls}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by title or owner..." className="flex-1 min-w-0" />
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex-wrap">
            {STATUS_TABS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                  statusFilter === s ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}>
                {statusLabel(s)}
              </button>
            ))}
          </div>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {PRIORITY_OPTIONS.map(p => (
              <option key={p} value={p}>{p === 'all' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {filtered.length === 0 ? (
          <EmptyState icon={CheckSquare} title="No action items found" description="Try adjusting your search or filters, or add a new item."
            action={<Button onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); }} variant="secondary" size="sm">Clear filters</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Meeting</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('due_date')}>
                    <span className="flex items-center gap-1">Due Date {sortBy === 'due_date' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('priority')}>
                    <span className="flex items-center gap-1">Priority {sortBy === 'priority' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(item => {
                  const overdue = isOverdue(item.due_date, item.status);
                  const dueSoon = isDueSoon(item.due_date) && !overdue && item.status !== 'completed';
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${overdue ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}>
                      <td className="px-4 py-3">
                        <p className={`font-medium ${item.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>{item.title}</p>
                        {item.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px]">{item.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {item.owner ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full ${getMemberColor(item.owner)} flex items-center justify-center text-white text-xs font-bold`}>{getInitials(item.owner)}</div>
                            <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">{item.owner}</span>
                          </div>
                        ) : <span className="text-gray-400 text-xs">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-500 dark:text-gray-400 text-xs max-w-[150px] truncate">{getMeetingTitle(item.meeting_id)}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={overdue ? 'text-red-600 dark:text-red-400 font-semibold' : dueSoon ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-600 dark:text-gray-300'}>
                          {item.due_date ? formatDate(item.due_date) : '—'}
                        </span>
                        {overdue && <span className="ml-1.5 text-xs text-red-500">OVERDUE</span>}
                        {dueSoon && <span className="ml-1.5 text-xs text-orange-500 flex items-center gap-0.5 inline-flex"><Clock className="w-3 h-3" />Soon</span>}
                      </td>
                      <td className="px-4 py-3"><Badge color={getPriorityColor(item.priority)}>{item.priority}</Badge></td>
                      <td className="px-4 py-3">
                        <select value={item.status} onChange={e => handleStatusChange(item.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            item.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            item.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            item.status === 'blocked' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            item.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                          {STATUS_FORM.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {item.status !== 'completed' && (
                            <button onClick={() => handleStatusChange(item.id, 'completed')} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Complete">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Action Item" size="lg">
        {renderForm(handleAdd, 'Add Item')}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => { setEditOpen(false); setEditItem(null); }} title="Edit Action Item" size="lg">
        {renderForm(handleEdit, 'Save Changes')}
      </Modal>
    </div>
  );
}
