// Database type definitions matching Supabase schema

export type UserRole = 'student' | 'faculty' | 'staff' | 'admin' | 'guest';

export type AnnouncementPriority = 'normal' | 'high' | 'urgent';

export type RequestStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type RequestPriority = 'low' | 'medium' | 'high';

export type FeedbackType = 'feedback' | 'complaint' | 'suggestion';

export type FeedbackStatus = 'open' | 'responded' | 'closed';

export type RSVPStatus = 'going' | 'interested' | 'not_going';

export type NotificationType =
  | 'announcement'
  | 'event'
  | 'service_request'
  | 'feedback'
  | 'alert'
  | 'account';

export type ClubRole = 'member' | 'officer';

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  department_id: string | null;
  university_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  department?: Department | null;
}

export interface Facility {
  id: string;
  name: string;
  category: string;
  description: string | null;
  building: string | null;
  floor: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_time: string | null;
  closing_time: string | null;
  is_open_weekends: boolean;
  phone: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  type: string;
  phone: string;
  description: string | null;
  available_24h: boolean;
  location: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  image_url: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementRead {
  id: string;
  announcement_id: string;
  user_id: string;
  read_at: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  start_time: string;
  end_time: string | null;
  max_attendees: number | null;
  image_url: string | null;
  organizer_id: string | null;
  created_at: string;
  updated_at: string;
  rsvp_status?: RSVPStatus | null;
  rsvp_count?: number;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: RSVPStatus;
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string;
  logo_url: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  location: string | null;
  president_id: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
  is_member?: boolean;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: ClubRole;
  joined_at: string;
}

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  status: RequestStatus;
  priority: RequestPriority;
  location: string | null;
  photo_url: string | null;
  user_id: string;
  assigned_to: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
  history?: RequestHistory[];
  assignee?: Profile | null;
}

export interface RequestHistory {
  id: string;
  request_id: string;
  status: RequestStatus;
  note: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  type: FeedbackType;
  subject: string;
  message: string;
  category: string | null;
  rating: number | null;
  photo_url: string | null;
  user_id: string;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
  responses?: FeedbackResponse[];
}

export interface FeedbackResponse {
  id: string;
  feedback_id: string;
  message: string;
  responder_id: string | null;
  created_at: string;
  responder?: Profile | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  announcements: boolean;
  events: boolean;
  service_requests: boolean;
  feedback: boolean;
  alerts: boolean;
  account: boolean;
  created_at: string;
  updated_at: string;
}
