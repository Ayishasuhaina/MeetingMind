export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function isOverdue(dateStr) {
  return new Date(dateStr) < new Date();
}

export function getPriorityColor(priority) {
  switch (priority) {
    case 'high': return 'red';
    case 'medium': return 'yellow';
    case 'low': return 'green';
    default: return 'gray';
  }
}

export function getStatusColor(status) {
  switch (status) {
    case 'completed': return 'green';
    case 'in_progress': return 'blue';
    case 'pending': return 'yellow';
    case 'overdue': return 'red';
    case 'upcoming': return 'indigo';
    case 'approved': return 'green';
    default: return 'gray';
  }
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function formatError(err) {
  // Return a human‑readable message for any kind of error object.
  // Prefer the built‑in Error message, then common API fields, then a safe JSON string.
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    if (err.message) return err.message;
    if (err.detail) return err.detail;
    try { return JSON.stringify(err); } catch (_) { return 'An error occurred'; }
  }
  return 'An unknown error occurred';
}

  export function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}
