import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Loader2, Download } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import MeetingActivityChart from '../components/charts/MeetingActivityChart';
import TaskCompletionChart from '../components/charts/TaskCompletionChart';
import { getReportSummary, getMeetings, getActions, getDecisions, downloadCSV } from '../services/api';
import { formatDate, getStatusColor, getPriorityColor } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';

const TABS = ['Overview', 'Meetings', 'Action Items', 'Decisions'];

const TYPE_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Reports() {
  const [tab, setTab] = useState('Overview');
  const { isDark } = useTheme();

  const [report, setReport] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [actions, setActions] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date range filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const axisColor = isDark ? '#6b7280' : '#9ca3af';
  const gridColor = isDark ? '#374151' : '#f3f4f6';
  const tooltipStyle = {
    backgroundColor: isDark ? '#1f2937' : '#fff',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    borderRadius: '8px',
    color: isDark ? '#f9fafb' : '#111827',
  };

  // Fetch all data on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [reportData, meetingsData, actionsData, decisionsData] = await Promise.all([
          getReportSummary(),
          getMeetings(),
          getActions(),
          getDecisions(),
        ]);
        setReport(reportData);
        setMeetings(meetingsData.items || []);
        setActions(actionsData.items || []);
        setDecisions(decisionsData.items || []);
      } catch (err) {
        setError(err.message || 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Re-fetch report summary when date range changes
  useEffect(() => {
    if (!dateFrom && !dateTo) return;
    async function fetchReport() {
      try {
        const params = {};
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        const reportData = await getReportSummary(params);
        setReport(reportData);
      } catch (err) {
        console.error('Failed to re-fetch report summary:', err);
      }
    }
    fetchReport();
  }, [dateFrom, dateTo]);

  // Meetings by category for pie chart
  const meetingsByCategory = useMemo(() => {
    if (!report?.meetings_by_category) return [];
    return Object.entries(report.meetings_by_category).map(([name, value]) => ({ name, value }));
  }, [report]);

  // Task completion chart data
  const taskCompletionData = useMemo(() => {
    if (!report?.actions_by_status) return [];
    return [
      { name: 'Completed', value: report.actions_by_status.completed || 0, color: '#4f46e5' },
      { name: 'In Progress', value: report.actions_by_status.in_progress || 0, color: '#0ea5e9' },
      { name: 'Pending', value: report.actions_by_status.pending || 0, color: '#f59e0b' },
      { name: 'Overdue', value: report.actions_by_status.overdue || 0, color: '#ef4444' },
    ];
  }, [report]);

  // Meeting activity chart data
  const meetingActivityData = useMemo(() => {
    if (!report?.meetings_by_category) return [];
    return Object.entries(report.meetings_by_category).map(([name, count]) => ({ name, count }));
  }, [report]);

  // Action items per owner
  const actionsByOwner = useMemo(() => {
    const map = {};
    actions.forEach(a => {
      if (!map[a.owner]) map[a.owner] = { total: 0, completed: 0 };
      map[a.owner].total++;
      if (a.status === 'completed') map[a.owner].completed++;
    });
    return Object.entries(map).map(([name, v]) => ({
      name: name.split(' ')[0],
      total: v.total,
      completed: v.completed,
      rate: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
    }));
  }, [actions]);

  // Decisions by impact
  const decisionsByImpact = useMemo(() => {
    if (!report?.decisions_by_impact) return [];
    const impactColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
    return Object.entries(report.decisions_by_impact).map(([impact, count]) => ({
      impact: impact.charAt(0).toUpperCase() + impact.slice(1),
      count,
      fill: impactColors[impact] || '#6b7280',
    }));
  }, [report]);

  async function handleDownloadCSV(type) {
    try {
      await downloadCSV(type);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <p className="text-red-500 dark:text-red-400 font-medium">Error: {error}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please try again later.</p>
      </div>
    );
  }

  const completedCount = report?.actions_by_status?.completed || 0;
  const totalActions = actions.length || 1;
  const completionRate = Math.round((completedCount / totalActions) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reports &amp; Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Insights and metrics from your meetings.</p>
        </div>
        {/* Date range filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Total Meetings', value: meetings.length, color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Total Action Items', value: actions.length, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Completion Rate', value: `${completionRate}%`, color: 'text-green-600 dark:text-green-400' },
              { label: 'Recent Activity', value: report?.recent_activity_count || 0, color: 'text-purple-600 dark:text-purple-400' },
            ].map(s => (
              <Card key={s.label}>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Meeting Activity</h3>
              <MeetingActivityChart data={meetingActivityData} />
            </Card>
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Task Completion Breakdown</h3>
              <TaskCompletionChart data={taskCompletionData} />
            </Card>
          </div>
        </div>
      )}

      {/* Meetings Tab */}
      {tab === 'Meetings' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => handleDownloadCSV('meetings')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <Download className="w-4 h-4" /> Download CSV
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Meetings by Category</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={meetingsByCategory} cx="50%" cy="45%" outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                    {meetingsByCategory.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Meetings Summary</h3>
              <div className="space-y-3 mt-2">
                {meetings.slice(0, 8).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{m.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(m.date)}</p>
                    </div>
                    <Badge color="indigo">{m.category}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card padding={false}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">All Meetings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Participants</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {meetings.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{m.title}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(m.date)}</td>
                      <td className="px-4 py-3"><Badge color="indigo">{m.category}</Badge></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{Array.isArray(m.participants) ? m.participants.length : m.participants}</td>
                      <td className="px-4 py-3"><Badge color={getStatusColor(m.processing_status)}>{m.processing_status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Action Items Tab */}
      {tab === 'Action Items' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => handleDownloadCSV('actions')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <Download className="w-4 h-4" /> Download CSV
            </button>
          </div>
          <Card>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Completion Rate by Owner</h3>
            <div className="space-y-4">
              {actionsByOwner.map(a => (
                <div key={a.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{a.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{a.completed}/{a.total} · <span className="text-green-600 dark:text-green-400 font-medium">{a.rate}%</span></span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-green-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${a.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Overdue Action Items</h3>
            <div className="space-y-2">
              {actions.filter(a => a.status === 'overdue').map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{a.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{a.owner} · Due {formatDate(a.due_date)}</p>
                  </div>
                  <Badge color={getPriorityColor(a.priority)}>{a.priority}</Badge>
                </div>
              ))}
              {actions.filter(a => a.status === 'overdue').length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No overdue action items.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Decisions Tab */}
      {tab === 'Decisions' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => handleDownloadCSV('decisions')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <Download className="w-4 h-4" /> Download CSV
            </button>
          </div>
          <Card>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Decisions by Impact Level</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={decisionsByImpact} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="impact" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Decisions" radius={[4, 4, 0, 0]}>
                  {decisionsByImpact.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card padding={false}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">All Decisions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Decision</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Decided By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Impact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {decisions.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{d.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xs truncate">{d.description}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{d.decided_by}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(d.decision_date)}</td>
                      <td className="px-4 py-3">
                        <Badge color={d.impact === 'high' ? 'red' : d.impact === 'medium' ? 'yellow' : 'green'}>{d.impact}</Badge>
                      </td>
                      <td className="px-4 py-3"><Badge color={getStatusColor(d.status)}>{d.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
