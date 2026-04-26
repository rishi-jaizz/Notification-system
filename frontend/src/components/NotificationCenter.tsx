'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/context/NotificationContext';
import { Notification } from '@/types';

const typeIcon: Record<string, string> = { EMAIL: '📧', SMS: '📱', IN_APP: '🔔' };
const typeClass: Record<string, string> = { EMAIL: 'email', SMS: 'sms', IN_APP: 'in-app' };

function NotifItem({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  const isUnread = n.status === 'UNREAD';
  return (
    <div
      className={`notif-item ${isUnread ? 'unread' : ''}`}
      style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border)' }}
      onClick={() => isUnread && onRead(n.id)}
    >
      <div className={`notif-icon ${typeClass[n.type]}`}>{typeIcon[n.type]}</div>
      <div className="notif-body">
        <div className="notif-title">{n.title}</div>
        <div className="notif-message">{n.message}</div>
        <div className="notif-meta">
          {isUnread && <span className="badge badge-unread">New</span>}
          <span className="notif-time">
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function NotificationCenter({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications();

  return (
    <div className="notif-dropdown">
      <div className="notif-dropdown-header">
        <div className="notif-dropdown-title">
          Notifications {unreadCount > 0 && <span className="badge badge-unread">{unreadCount}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {unreadCount > 0 && (
            <button className="btn btn-xs btn-ghost" onClick={() => markAllRead()}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="notif-dropdown-list">
        {loading ? (
          <div className="empty-state">
            <span className="spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <div className="empty-state-text">No notifications yet</div>
          </div>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <NotifItem key={n.id} n={n} onRead={markRead} />
          ))
        )}
      </div>

      <div className="notif-dropdown-footer">
        <Link
          href="/history"
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onClose}
        >
          View all notifications →
        </Link>
      </div>
    </div>
  );
}
