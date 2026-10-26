import React, { useState } from 'react';
import { User, Bell, Plug, Palette, Users, Save, Check, Mail, Link, Unlink } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { teamMembers } from '../data/sampleData';
import { useTheme } from '../context/ThemeContext';

const SECTIONS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'integrations', label: 'Integrations', icon: Plug },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'team', label: 'Team', icon: Users },
];

const ACCENT_COLORS = [
  { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-600' },
  { name: 'Violet', value: 'violet', bg: 'bg-violet-600' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-600' },
  { name: 'Emerald', value: 'emerald', bg: 'bg-emerald-600' },
];

const INTEGRATIONS = [
  { name: 'Google Calendar', desc: 'Sync meetings from your Google Calendar', icon: '📅', connected: true },
  { name: 'Zoom', desc: 'Automatically import Zoom recordings', icon: '📹', connected: true },
  { name: 'Slack', desc: 'Send meeting summaries to Slack channels', icon: '💬', connected: false },
  { name: 'Microsoft Teams', desc: 'Import Teams meeting transcripts', icon: '🟦', connected: false },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const { isDark, toggleTheme } = useTheme();

  const [profile, setProfile] = useState({
    name: 'Alice Johnson',
    email: 'alice@meetingmind.io',
    role: 'Product Manager',
    bio: 'Product manager passionate about building great products.',
  });
  const [profileSaved, setProfileSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    meetingReminders: true,
    actionItemAlerts: true,
    decisionNotifications: false,
  });

  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [accentColor, setAccentColor] = useState('indigo');
  const [fontSize, setFontSize] = useState('medium');

  function handleProfileSave(e) {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  function toggleNotification(key) {
    setNotifications(n => ({ ...n, [key]: !n[key] }));
  }

  function toggleIntegration(name) {
    setIntegrations(prev => prev.map(i => i.name === name ? { ...i, connected: !i.connected } : i));
  }

  return (
    <div className="flex gap-6 min-h-0">
      {/* Settings Sidebar */}
      <aside className="w-48 flex-shrink-0 hidden md:block">
        <Card className="p-2">
          <nav className="space-y-1">
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeSection === key
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </Card>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden w-full">
        <div className="flex gap-2 flex-wrap mb-4">
          {SECTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Profile */}
        {activeSection === 'profile' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Profile Settings</h3>
            <form onSubmit={handleProfileSave} className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <Button type="button" variant="secondary" size="sm">Change Photo</Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG up to 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <input
                    type="text"
                    value={profile.role}
                    onChange={e => setProfile(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit">
                  {profileSaved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Notifications */}
        {activeSection === 'notifications' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Notification Preferences</h3>
            <div className="space-y-5">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email for all activity' },
                { key: 'meetingReminders', label: 'Meeting Reminders', desc: 'Get reminders 15 minutes before scheduled meetings' },
                { key: 'actionItemAlerts', label: 'Action Item Alerts', desc: 'Be notified when action items are assigned to you or become overdue' },
                { key: 'decisionNotifications', label: 'Decision Notifications', desc: 'Get notified when new decisions are recorded or approved' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-start justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotification(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      notifications[key] ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifications[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Integrations */}
        {activeSection === 'integrations' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Integrations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {integrations.map(integration => (
                <div
                  key={integration.name}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    integration.connected
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{integration.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-[160px]">{integration.desc}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge color={integration.connected ? 'green' : 'gray'}>
                      {integration.connected ? 'Connected' : 'Not connected'}
                    </Badge>
                    <Button
                      variant={integration.connected ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => toggleIntegration(integration.name)}
                    >
                      {integration.connected ? (
                        <><Unlink className="w-3.5 h-3.5" /> Disconnect</>
                      ) : (
                        <><Link className="w-3.5 h-3.5" /> Connect</>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Appearance */}
        {activeSection === 'appearance' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Appearance</h3>
            <div className="space-y-6">
              {/* Theme */}
              <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Switch between light and dark themes</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Accent Color */}
              <div className="pb-6 border-b border-gray-100 dark:border-gray-800">
                <p className="font-medium text-gray-900 dark:text-white mb-3">Accent Color</p>
                <div className="flex gap-3">
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setAccentColor(c.value)}
                      className={`w-10 h-10 rounded-full ${c.bg} flex items-center justify-center transition-transform hover:scale-110 ${
                        accentColor === c.value ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-gray-800 dark:ring-white' : ''
                      }`}
                      title={c.name}
                    >
                      {accentColor === c.value && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Selected: {ACCENT_COLORS.find(c => c.value === accentColor)?.name}</p>
              </div>

              {/* Font Size */}
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-3">Font Size</p>
                <div className="flex gap-2">
                  {['small', 'medium', 'large'].map(size => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors border ${
                        fontSize === size
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Team */}
        {activeSection === 'team' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h3>
              <Button size="sm">
                <Mail className="w-4 h-4" /> Invite Member
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Member</th>
                    <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {teamMembers.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {member.avatar}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{member.role}</td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400 text-xs">{member.email}</td>
                      <td className="py-3">
                        <Badge color="green">Active</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
