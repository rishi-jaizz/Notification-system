'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import AppLayout from '@/components/AppLayout';
import SendNotificationForm from '@/components/SendNotificationForm';
import { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';

const typeIcon: Record<string, string> = { EMAIL: '📧', SMS: '📱', IN_APP: '🔔' };
const typeClass: Record<string, string> = { EMAIL: 'email', SMS: 'sms', IN_APP: 'in-app' };

interface Stats { total: number; unread: number; sentToday: number; failed: number; }

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { notifications, unreadCount, fetchNotifications, markRead } = useNotifications();
  const [stats, setStats] = useState<Stats>({ total: 0, unread: 0, sentToday: 0, failed: 0 });
  const [queueStats, setQueueStats] = useState<{ email: Record<string, number>; sms: Record<string, number> } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    // Fetch stats
    const loadStats = async () => {
      const [all, failed] = await Promise.all([
        api.get('/notifications', { params: { limit: 1000 } }),
        api.get('/notifications', { params: { limit: 1000 } }),
      ]);
      const notifs: Notification[] = all.data.notifications;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      setStats({
        total: all.data.total,
        unread: unreadCount,
        sentToday: notifs.filter((n) => n.status === 'SENT' && new Date(n.createdAt) >= today).length,
        failed: notifs.filter((n) => n.status === 'FAILED').length,
      });
    };
    loadStats().catch(() => {});

    api.get('/queue/status').then((r) => setQueueStats(r.data.data)).catch(() => {});
  }, [user, unreadCount]);

  const handleSent = () => {
    fetchNotifications();
  };

  if (authLoading || !user) return null;

  const statCards = [
    { label: 'Total Notifications', value: stats.total, icon: '🔔', color: 'indigo' },
    { label: 'Unread', value: unreadCount, icon: '📬', color: 'purple' },
    { label: 'Sent Today', value: stats.sentToday, icon: '✅', color: 'green' },
    { label: 'Failed', value: stats.failed, icon: '❌', color: 'red' },
  ];

  return (
    <AppLayout title="Dashboard" subtitle={`Welcome back, ${user.name}!`}>
      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className={`stat-icon-wrap ${s.color}`}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Send Form */}
        <div className="card">
          <div className="card-title">🚀 Send Notification</div>
          <SendNotificationForm onSent={handleSent} />
        </div>

        {/* Recent Notifications */}
        <div className="card">
          <div className="card-title" style={{ justifyContent: 'space-between' }}>
            <span>📋 Recent Notifications</span>
            {unreadCount > 0 && <span className="badge badge-unread">{unreadCount} unread</span>}
          </div>

          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">🔔</div>
              <div className="empty-state-text">No notifications yet. Send your first one!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifications.slice(0, 6).map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${n.status === 'UNREAD' ? 'unread' : ''}`}
                  style={{ cursor: n.status === 'UNREAD' ? 'pointer' : 'default' }}
                  onClick={() => n.status === 'UNREAD' && markRead(n.id)}
                >
                  <div className={`notif-icon ${typeClass[n.type]}`}>{typeIcon[n.type]}</div>
                  <div className="notif-body">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-meta">
                      <span className={`badge badge-${n.status.toLowerCase()}`}>{n.status}</span>
                      <span className="notif-time">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Queue Status */}
      {queueStats && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-title">⚙️ Queue Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {(['email', 'sms'] as const).map((q) => {
              const counts = queueStats[q];
              return (
                <div key={q} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {q === 'email' ? '📧' : '📱'} {q.toUpperCase()} Queue
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { label: 'Waiting', value: counts.waiting ?? 0, color: 'var(--amber)' },
                      { label: 'Active',  value: counts.active  ?? 0, color: 'var(--cyan)' },
                      { label: 'Done',    value: counts.completed ?? 0, color: 'var(--green)' },
                      { label: 'Failed',  value: counts.failed  ?? 0, color: 'var(--red)' },
                    ].map((stat) => (
                      <div key={stat.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
