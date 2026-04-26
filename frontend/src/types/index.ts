export type NotificationType = 'EMAIL' | 'SMS' | 'IN_APP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ' | 'UNREAD';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  preferences: { email: boolean; sms: boolean; inApp: boolean };
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  metadata?: Record<string, unknown>;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  type: NotificationType;
  subject?: string | null;
  body: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QueueCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface PaginatedResponse<T> {
  notifications: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
