// Meetings page – fully integrated with FastAPI backend
import React, { useState, useEffect, useMemo } from 'react';
import { Edit } from 'lucide-react';
import { Plus, Calendar, Users, Clock, Eye, Trash2, ChevronUp, ChevronDown, Video } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting } from '../services/api';
import { formatError } from '../utils/helpers';
import { formatDate, getStatusColor, getInitials } from '../utils/helpers';

const MEETING_TYPES = ['Planning', 'Retrospective', 'Client', 'Technical', 'Finance', 'Workshop', 'Investor', 'Other'];
const DURATIONS = ['30 min', '45 min', '60 min', '90 min', '120 min'];

const avatarColors = [
  'bg-indigo-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
  'bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-teal-500',
];

function ParticipantAvatars({ participants }) {
  const visible = participants.slice(0, 3);
  const extra = participants.length - 3;
  return (
    <div className="flex -space-x-2">
      {visible.map((p, i) => (
        <div
          key={i}
          title={p}
          className={`w-7 h-7 rounded-full ${avatarColors[i % avatarColors.length]} border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-bold`}
        >
          {getInitials(p)}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold">
          +{extra}
        </div>
      )}
    </div>
  );
}

const emptyForm = {
  title: '',
  date: '',
  time: '',
  duration: '60 min',
  type: 'Planning',
  participants: '',
  description: '',
};

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortAsc, setSortAsc] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [viewMeeting, setViewMeeting] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Load meetings from backend
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use page_size within backend limit (max 100)
      const res = await getMeetings({ page_size: 100 });
      console.log('Fetched meetings response:', res);
      // Expected response shape: { items: [...] }
      const data = res?.items ?? res?.meetings ?? [];
      setMeetings(data);
    } catch (e) {
      const msg = e?.response?.data?.detail?.[0]?.msg || e.message || 'Failed to load meetings';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const filtered = useMemo(() => {
    return meetings
      .filter(m => {
        const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || m.processing_status === statusFilter;
        const matchType = typeFilter === 'all' || m.category === typeFilter;
        return matchSearch && matchStatus && matchType;
      })
      .sort((a, b) => {
        const diff = new Date(a.date) - new Date(b.date);
        return sortAsc ? diff : -diff;
      });
  }, [meetings, search, statusFilter, typeFilter, sortAsc]);

  const handleFormChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSchedule = async e => {
    e.preventDefault();
    const payload = {
      title: form.title,
      date: form.date,
      time: form.time,
      duration: form.duration,
      category: form.type,
      participants: form.participants.split(',').map(p => p.trim()).filter(Boolean),
      description: form.description,
      processing_status: 'upcoming',
    };
    try {
      await createMeeting(payload);
      await fetchMeetings();
      setForm(emptyForm);
      setScheduleOpen(false);
    } catch (e) {
      alert(e.message);
    }
  };

  const openEdit = meeting => {
    setEditId(meeting.id);
    setForm({
      title: meeting.title,
      date: meeting.date || '',
      time: meeting.time || '',
      duration: meeting.duration || '60 min',
      type: meeting.category || 'Planning',
      participants: (meeting.participants || []).join(', '),
      description: meeting.description || '',
    });
    setEditOpen(true);
  };

  const handleEdit = async e => {
    e.preventDefault();
    const payload = {
      title: form.title,
      date: form.date,
      time: form.time,
      duration: form.duration,
      category: form.type,
      participants: form.participants.split(',').map(p => p.trim()).filter(Boolean),
      description: form.description,
    };
    try {
      await updateMeeting(editId, payload);
      await fetchMeetings();
      setEditOpen(false);
      setForm(emptyForm);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this meeting?')) return;
    try {
      await deleteMeeting(id);
      await fetchMeetings();
    } catch (e) {
      alert(e.message);
    }
  };

  const allTypes = ['all', ...Array.from(new Set(meetings.map(m => m.category)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-600 dark:text-gray-300">Loading meetings…</span>
      </div>
    );
  }

  if (error) {
  console.error('Meetings page error:', error);

    return (
      <div className="flex items-center justify-center h-64">
        <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap break-all" style={{ maxHeight: '300px', overflow: 'auto' }}>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meetings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{meetings.length} total meetings</p>
        </div>
        <Button onClick={() => setScheduleOpen(true)}><Plus className="w-4 h-4" /> Schedule Meeting</Button>
      </div>

      {/* Filters */}
      <Card padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search meetings..." className="flex-1 min-w-0" />
          {/* Status Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['all', 'upcoming', 'completed', 'pending'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${statusFilter === s ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {s}
              </button>
            ))}
          </div>
          {/* Type filter */}
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {allTypes.map(t => (
              <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No meetings found"
            description="Try adjusting your search or filters."
            action={<Button onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }} variant="secondary" size="sm">Clear filters</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => setSortAsc(v => !v)}>
                    <span className="flex items-center gap-1">
                      Date
                      {sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Participants</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{m.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{m.time}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {formatDate(m.date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{m.category || 'Other'}</td>
                    <td className="px-4 py-3">
                      <ParticipantAvatars participants={m.participants || []} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{m.duration}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <Badge color={getStatusColor(m.processing_status)}>{m.processing_status}</Badge>
                    </td>
                    <td className="px-4 py-3 flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setViewMeeting(m)}><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(m)}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(m.id)}><Trash2 className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Schedule Meeting Modal */}
      <Modal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule Meeting">
        <form onSubmit={handleSchedule} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="title" value={form.title} onChange={handleFormChange} placeholder="Title" required className="input" />
            <input name="date" type="date" value={form.date} onChange={handleFormChange} required className="input" />
            <input name="time" type="time" value={form.time} onChange={handleFormChange} required className="input" />
            <select name="duration" value={form.duration} onChange={handleFormChange} className="input">
              {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select name="type" value={form.type} onChange={handleFormChange} className="input">
              {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input name="participants" placeholder="Comma‑separated participants" value={form.participants} onChange={handleFormChange} className="input col-span-2" />
            <textarea name="description" placeholder="Description" value={form.description} onChange={handleFormChange} className="input col-span-2" rows={3} />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Meeting Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Meeting">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="title" value={form.title} onChange={handleFormChange} placeholder="Title" required className="input" />
            <input name="date" type="date" value={form.date} onChange={handleFormChange} required className="input" />
            <input name="time" type="time" value={form.time} onChange={handleFormChange} required className="input" />
            <select name="duration" value={form.duration} onChange={handleFormChange} className="input">
              {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select name="type" value={form.type} onChange={handleFormChange} className="input">
              {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input name="participants" placeholder="Comma‑separated participants" value={form.participants} onChange={handleFormChange} className="input col-span-2" />
            <textarea name="description" placeholder="Description" value={form.description} onChange={handleFormChange} className="input col-span-2" rows={3} />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* View Meeting Modal */}
      <Modal isOpen={!!viewMeeting} onClose={() => setViewMeeting(null)} title={viewMeeting?.title || ''}>
        {viewMeeting && (
          <div className="space-y-2">
            <p><strong>Date:</strong> {formatDate(viewMeeting.date)} {viewMeeting.time}</p>
            <p><strong>Duration:</strong> {viewMeeting.duration}</p>
            <p><strong>Category:</strong> {viewMeeting.category}</p>
            <p><strong>Participants:</strong> {(viewMeeting.participants || []).join(', ')}</p>
            <p><strong>Description:</strong> {viewMeeting.description}</p>
            <p><strong>Summary:</strong> {viewMeeting.summary}</p>
            <p><strong>Status:</strong> {viewMeeting.processing_status}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
