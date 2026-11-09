import { formatDistanceToNow, format, isValid } from 'date-fns';

export function timeAgo(value) {
  if (!value) return 'Not checked yet';
  const date = new Date(value);
  return isValid(date) ? `${formatDistanceToNow(date, { addSuffix: true })}` : '—';
}

export function dateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return isValid(date) ? format(date, 'MMM d, yyyy · h:mm a') : '—';
}

export function shortDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return isValid(date) ? format(date, 'MMM d, h:mm a') : '—';
}

export function duration(ms) {
  if (ms === null || ms === undefined || Number.isNaN(Number(ms))) return '—';
  return `${Math.round(Number(ms))} ms`;
}

export function uptimeLabel(value) {
  return value === null || value === undefined ? '—' : `${Number(value).toFixed(2)}%`;
}

export function initials(user) {
  const first = user?.first_name?.[0] || user?.username?.[0] || 'D';
  const last = user?.last_name?.[0] || '';
  return `${first}${last}`.toUpperCase();
}

export function maskTarget(value, type) {
  if (type === 'DISCORD') return value ? 'https://discord.com/api/webhooks/••••••••' : '—';
  return value || '—';
}

export function statusTone(status) {
  const value = String(status || 'UNKNOWN').toUpperCase();
  if (['UP', 'OPERATIONAL', 'RESOLVED', 'SUCCESS'].includes(value)) return 'success';
  if (['DOWN', 'DEGRADED', 'OPEN', 'FAILED'].includes(value)) return 'danger';
  if (['ACKNOWLEDGED', 'WARNING'].includes(value)) return 'warning';
  return 'neutral';
}

export function titleCase(value) {
  return String(value || '').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()).replaceAll('_', ' ');
}
