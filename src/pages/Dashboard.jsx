import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, CheckSquare, Clock, AlertTriangle, Lightbulb, ArrowRight, Calendar, User, Loader2 } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import MeetingActivityChart from '../components/charts/MeetingActivityChart';
import TaskCompletionChart from '../components/charts/TaskCompletionChart';
import { getDashboardStats, getMeetings, getActions } from '../services/api';
import { formatDate, getStatusColor, getPriorityColor } from '../utils/helpers';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, meetingsRes, actionsRes] = await Promise.all([
          getDashboardStats(),
          getMeetings(),
          getActions(),
        ]);
        setStats(statsRes);
        setMeetings(meetingsRes.items || []);
        setActions(actionsRes.items || []);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const recentMeetings = meetings.slice(0, 3);
  const upcomingDeadlines = [...actions]
    .filter(a => a.status !== 'completed')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 4);
  const recentActions = actions.slice(0, 5);

  // Build chart data from meetings grouped by category
  const categoryCountMap = {};
  meetings.forEach(m => {
    const cat = m.category || 'Other';
    categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
  });
  const meetingActivityData = Object.entries(categoryCountMap).map(([name, count]) => ({ name, count }));

  // Build task completion chart data from stats
  const taskCompletionData = [
    { name: 'Completed', value: stats.completed_actions || 0, color: '#4f46e5' },
    { name: 'In Progress', value: stats.in_progress_actions || 0, color: '#0ea5e9' },
    { name: 'Pending', value: stats.pending_actions || 0, color: '#f59e0b' },
    { name: 'Overdue', value: stats.overdue_actions || 0, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard title="Total Meetings" value={stats.total_meetings || 0} icon={Video} color="indigo" trend={{ value: '12%', positive: true }} />
        <StatCard title="Pending Tasks" value={stats.pending_actions || 0} icon={Clock} color="yellow" subtitle="Awaiting action" />
        <StatCard title="Completed Tasks" value={stats.completed_actions || 0} icon={CheckSquare} color="green" trend={{ value: '8%', positive: true }} />
        <StatCard title="Overdue Tasks" value={stats.overdue_actions || 0} icon={AlertTriangle} color="red" subtitle="Need attention" />
        <StatCard title="Decisions Made" value={stats.total_decisions || 0} icon={Lightbulb} color="blue" trend={{ value: '2', positive: true }} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Meeting Activity</h2>
            <Link to="/reports" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View reports →</Link>
          </div>
          <MeetingActivityChart data={meetingActivityData} />
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Task Completion Status</h2>
            <Link to="/action-items" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all →</Link>
          </div>
          <TaskCompletionChart data={taskCompletionData} />
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Upcoming Deadlines</h2>
            <Link to="/action-items" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingDeadlines.map(item => (
              <div key={item.id} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'overdue' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(item.due_date)}
                    </span>
                    <Badge color={getPriorityColor(item.priority)}>{item.priority}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Meetings */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Meetings</h2>
            <Link to="/meetings" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentMeetings.map(m => (
              <div key={m.id} className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{m.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(m.date)}</span>
                  <Badge color="green">{m.category}</Badge>
                </div>
                {m.summary && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{m.summary}</p>}
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Action Items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Action Items</h2>
            <Link to="/action-items" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentActions.map(item => (
              <div key={item.id} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3" /> {item.owner ? item.owner.split(' ')[0] : 'Unassigned'}
                    </span>
                    <Badge color={getStatusColor(item.status)}>{item.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
