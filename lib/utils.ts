import type { RequestStatus, RequestPriority, AnnouncementPriority, FeedbackType, NotificationType } from '@/types/database';

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} • ${formatTime(dateStr)}`;
}

export function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

export function formatUpcoming(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffDay < 0) return formatDate(dateStr);
  if (diffDay === 0) return 'Today';
  if (diffDay === 1) return 'Tomorrow';
  if (diffDay < 7) return `In ${diffDay} days`;
  return formatDate(dateStr);
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

export const statusColors: Record<RequestStatus, string> = {
  open: 'warning',
  in_progress: 'primary',
  resolved: 'success',
  closed: 'neutral',
};

export const statusLabels: Record<RequestStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const priorityLabels: Record<RequestPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const announcementPriorityLabels: Record<AnnouncementPriority, string> = {
  normal: 'Normal',
  high: 'High Priority',
  urgent: 'Urgent',
};

export const feedbackTypeLabels: Record<FeedbackType, string> = {
  feedback: 'Feedback',
  complaint: 'Complaint',
  suggestion: 'Suggestion',
};

export const notificationTypeLabels: Record<NotificationType, string> = {
  announcement: 'Announcement',
  event: 'Event',
  service_request: 'Service Request',
  feedback: 'Feedback',
  alert: 'Alert',
  account: 'Account',
};

export function isFacilityOpen(facility: {
  opening_time: string | null;
  closing_time: string | null;
  is_open_weekends: boolean;
}): boolean {
  if (!facility.opening_time || !facility.closing_time) return true;
  const now = new Date();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  if (isWeekend && !facility.is_open_weekends) return false;

  const [oh, om] = facility.opening_time.split(':').map(Number);
  const [ch, cm] = facility.closing_time.split(':').map(Number);
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;

  // Handle overnight (e.g. 00:00 - 23:59)
  if (closeMin <= openMin) {
    return currentMin >= openMin || currentMin <= closeMin;
  }
  return currentMin >= openMin && currentMin <= closeMin;
}
