export const meetings = [
  { id: 1, title: 'Q4 Product Roadmap Review', date: '2026-10-20', time: '10:00 AM', duration: '90 min', participants: ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Lee'], status: 'completed', type: 'Planning', transcript: true, summary: 'Reviewed Q4 roadmap, aligned on priorities, identified 3 key features for launch.' },
  { id: 2, title: 'Engineering Sprint Retrospective', date: '2026-10-19', time: '2:00 PM', duration: '60 min', participants: ['Bob Smith', 'Eve Davis', 'Frank Miller'], status: 'completed', type: 'Retrospective', transcript: true, summary: 'Sprint went well. Identified bottlenecks in code review process.' },
  { id: 3, title: 'Client Onboarding - Acme Corp', date: '2026-10-18', time: '11:00 AM', duration: '45 min', participants: ['Carol White', 'Alice Johnson', 'John Acme'], status: 'completed', type: 'Client', transcript: true, summary: 'Walked through product features. Client very engaged.' },
  { id: 4, title: 'Marketing Campaign Kickoff', date: '2026-10-22', time: '3:00 PM', duration: '60 min', participants: ['Grace Hall', 'Henry Park', 'Alice Johnson'], status: 'upcoming', type: 'Planning', transcript: false, summary: '' },
  { id: 5, title: 'Budget Review FY2027', date: '2026-10-23', time: '10:00 AM', duration: '120 min', participants: ['David Lee', 'Carol White', 'Alice Johnson'], status: 'upcoming', type: 'Finance', transcript: false, summary: '' },
  { id: 6, title: 'Design System Workshop', date: '2026-10-17', time: '1:00 PM', duration: '180 min', participants: ['Eve Davis', 'Frank Miller', 'Grace Hall'], status: 'completed', type: 'Workshop', transcript: true, summary: 'Established design token system. Agreed on component library approach.' },
  { id: 7, title: 'Investor Update Call', date: '2026-10-15', time: '4:00 PM', duration: '60 min', participants: ['Alice Johnson', 'David Lee'], status: 'completed', type: 'Investor', transcript: true, summary: 'Shared monthly metrics. Investors pleased with growth trajectory.' },
  { id: 8, title: 'Security Audit Review', date: '2026-10-24', time: '9:00 AM', duration: '90 min', participants: ['Bob Smith', 'Frank Miller', 'Security Team'], status: 'upcoming', type: 'Technical', transcript: false, summary: '' },
];

export const actionItems = [
  { id: 1, title: 'Update product roadmap document', assignee: 'Alice Johnson', dueDate: '2026-10-25', priority: 'high', status: 'in_progress', meetingId: 1, meetingTitle: 'Q4 Product Roadmap Review' },
  { id: 2, title: 'Fix code review bottleneck in CI pipeline', assignee: 'Bob Smith', dueDate: '2026-10-24', priority: 'high', status: 'pending', meetingId: 2, meetingTitle: 'Engineering Sprint Retrospective' },
  { id: 3, title: 'Prepare onboarding materials for Acme Corp', assignee: 'Carol White', dueDate: '2026-10-23', priority: 'medium', status: 'completed', meetingId: 3, meetingTitle: 'Client Onboarding - Acme Corp' },
  { id: 4, title: 'Schedule follow-up with design team on tokens', assignee: 'Eve Davis', dueDate: '2026-10-21', priority: 'low', status: 'overdue', meetingId: 6, meetingTitle: 'Design System Workshop' },
  { id: 5, title: 'Create investor deck for November update', assignee: 'David Lee', dueDate: '2026-11-01', priority: 'high', status: 'pending', meetingId: 7, meetingTitle: 'Investor Update Call' },
  { id: 6, title: 'Review and merge authentication PR', assignee: 'Frank Miller', dueDate: '2026-10-22', priority: 'high', status: 'overdue', meetingId: 2, meetingTitle: 'Engineering Sprint Retrospective' },
  { id: 7, title: 'Send product demo recording to Acme', assignee: 'Carol White', dueDate: '2026-10-26', priority: 'medium', status: 'pending', meetingId: 3, meetingTitle: 'Client Onboarding - Acme Corp' },
  { id: 8, title: 'Define Q4 success metrics', assignee: 'Alice Johnson', dueDate: '2026-10-28', priority: 'medium', status: 'in_progress', meetingId: 1, meetingTitle: 'Q4 Product Roadmap Review' },
  { id: 9, title: 'Compile sprint velocity data', assignee: 'Bob Smith', dueDate: '2026-10-20', priority: 'low', status: 'completed', meetingId: 2, meetingTitle: 'Engineering Sprint Retrospective' },
  { id: 10, title: 'Implement design token variables in codebase', assignee: 'Grace Hall', dueDate: '2026-11-05', priority: 'medium', status: 'pending', meetingId: 6, meetingTitle: 'Design System Workshop' },
];

export const decisions = [
  { id: 1, title: 'Adopt microservices architecture for v2.0', description: 'Team agreed to migrate monolith to microservices for better scalability. Migration to start Q1 2027.', meetingId: 1, meetingTitle: 'Q4 Product Roadmap Review', date: '2026-10-20', decidedBy: 'Alice Johnson', impact: 'high', status: 'approved' },
  { id: 2, title: 'Use GitHub Actions for CI/CD pipeline', description: 'Replace current Jenkins setup with GitHub Actions to reduce maintenance overhead.', meetingId: 2, meetingTitle: 'Engineering Sprint Retrospective', date: '2026-10-19', decidedBy: 'Bob Smith', impact: 'medium', status: 'approved' },
  { id: 3, title: 'Standardize on Tailwind CSS for all new UI', description: 'All new frontend work will use Tailwind CSS. Legacy CSS to be migrated over 2 quarters.', meetingId: 6, meetingTitle: 'Design System Workshop', date: '2026-10-17', decidedBy: 'Eve Davis', impact: 'medium', status: 'approved' },
  { id: 4, title: 'Extend Acme Corp contract by 6 months', description: 'Client requested extended engagement. Legal to prepare amended contract.', meetingId: 3, meetingTitle: 'Client Onboarding - Acme Corp', date: '2026-10-18', decidedBy: 'Carol White', impact: 'high', status: 'pending' },
  { id: 5, title: 'Allocate 20% of Q4 budget to security improvements', description: 'Post-audit, team agreed to prioritize security investment.', meetingId: 7, meetingTitle: 'Investor Update Call', date: '2026-10-15', decidedBy: 'David Lee', impact: 'high', status: 'approved' },
  { id: 6, title: 'Implement bi-weekly sprint cycle', description: 'Switch from 3-week to 2-week sprint cycles starting November.', meetingId: 2, meetingTitle: 'Engineering Sprint Retrospective', date: '2026-10-19', decidedBy: 'Bob Smith', impact: 'low', status: 'approved' },
];

export const meetingActivityData = [
  { month: 'May', meetings: 12, actions: 28 },
  { month: 'Jun', meetings: 18, actions: 42 },
  { month: 'Jul', meetings: 15, actions: 35 },
  { month: 'Aug', meetings: 22, actions: 58 },
  { month: 'Sep', meetings: 19, actions: 47 },
  { month: 'Oct', meetings: 8, actions: 22 },
];

export const taskCompletionData = [
  { name: 'Completed', value: 24, color: '#4f46e5' },
  { name: 'In Progress', value: 12, color: '#0ea5e9' },
  { name: 'Pending', value: 18, color: '#f59e0b' },
  { name: 'Overdue', value: 6, color: '#ef4444' },
];

export const knowledgeItems = [
  { id: 1, type: 'decision', title: 'Microservices Architecture Decision', content: 'Team agreed to migrate monolith to microservices for better scalability. Migration to start Q1 2027.', tags: ['architecture', 'backend', 'Q4'], date: '2026-10-20', source: 'Q4 Product Roadmap Review' },
  { id: 2, type: 'action', title: 'Update Product Roadmap', content: 'Alice to update the product roadmap document with Q4 priorities by Oct 25.', tags: ['roadmap', 'product'], date: '2026-10-20', source: 'Q4 Product Roadmap Review' },
  { id: 3, type: 'insight', title: 'Code Review Bottleneck Identified', content: 'Sprint velocity dropped due to slow code review cycles. CI pipeline changes planned.', tags: ['engineering', 'process', 'sprint'], date: '2026-10-19', source: 'Engineering Sprint Retrospective' },
  { id: 4, type: 'decision', title: 'GitHub Actions Migration', content: 'Replace Jenkins with GitHub Actions to reduce maintenance overhead and improve DX.', tags: ['devops', 'cicd'], date: '2026-10-19', source: 'Engineering Sprint Retrospective' },
  { id: 5, type: 'insight', title: 'Acme Corp High Engagement', content: 'Client showed strong interest in analytics features. Potential for upsell opportunity.', tags: ['client', 'sales', 'acme'], date: '2026-10-18', source: 'Client Onboarding - Acme Corp' },
  { id: 6, type: 'decision', title: 'Tailwind CSS Standardization', content: 'All new frontend work to use Tailwind CSS. Migration plan over 2 quarters.', tags: ['frontend', 'design', 'css'], date: '2026-10-17', source: 'Design System Workshop' },
];

export const teamMembers = [
  { id: 1, name: 'Alice Johnson', role: 'Product Manager', avatar: 'AJ', email: 'alice@meetingmind.io' },
  { id: 2, name: 'Bob Smith', role: 'Engineering Lead', avatar: 'BS', email: 'bob@meetingmind.io' },
  { id: 3, name: 'Carol White', role: 'Account Manager', avatar: 'CW', email: 'carol@meetingmind.io' },
  { id: 4, name: 'David Lee', role: 'CFO', avatar: 'DL', email: 'david@meetingmind.io' },
  { id: 5, name: 'Eve Davis', role: 'UX Designer', avatar: 'ED', email: 'eve@meetingmind.io' },
  { id: 6, name: 'Frank Miller', role: 'Senior Engineer', avatar: 'FM', email: 'frank@meetingmind.io' },
];
