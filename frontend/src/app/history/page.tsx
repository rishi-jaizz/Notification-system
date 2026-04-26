'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Notification, NotificationType, NotificationStatus } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import api from '@/lib/api';

const typeIcon: Record<string, string> = { EMAIL: '📧', SMS: '📱', IN_APP: '🔔' };
const typeClass: Record<string, string> = { EMAIL: 'email', SMS: 'sms', IN_APP: 'in-app' };

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (filterType) params.type = filterType;
      if (filterStatus === 'unread') params.unread = 'true';
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;

      const res = await api.get('/notifications', { params });
      setNotifications(res.data.notifications);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterStatus, filterFrom, filterTo]);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user, loadNotifications]);

  const resetPage = () => setPage(1);

  const handleMarkRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, status: 'READ' } : n));
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/notifications/${id}`);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotal((t) => t - 1);
  };

  if (authLoading || !user) return null;

  const statusBadge = (s: NotificationStatus) => {
    const cls: Record<string, string> = {
      UNREAD: 'badge-unread', READ: 'badge-read', SENT: 'badge-sent',
      FAILED: 'badge-failed', PENDING: 'badge-pending',
    };
    return <span className={`badge ${cls[s] || 'badge-read'}`}>{s}</span>;
  };

  return (
    <AppLayout title="Notification History" subtitle={`${total} total notifications`}>
      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filter-bar">
          <select className="form-select" value={filterType} onChange={(e) => { setFilterType(e.target.value); resetPage(); }}>
            <option value="">All Types</option>
            <option value="EMAIL">📧 Email</option>
            <option value="SMS">📱 SMS</option>
            <option value="IN_APP">🔔 In-App</option>
          </select>

          <select className="form-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}>
            <option value="">All Status</option>
            <option value="unread">Unread only</option>
          </select>

          <input
            className="form-input"
            type="date"
            value={filterFrom}
            onChange={(e) => { setFilterFrom(e.target.value); resetPage(); }}
            title="From date"
          />
          <input
            className="form-input"
            type="date"
            value={filterTo}
            onChange={(e) => { setFilterTo(e.target.value); resetPage(); }}
            title="To date"
          />

          {(filterType || filterStatus || filterFrom || filterTo) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setFilterType(''); setFilterStatus(''); setFilterFrom(''); setFilterTo(''); resetPage(); }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <span className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <div className="empty-state-icon">🗂️</div>
            <div className="empty-state-text">No notifications match your filters.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Message</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td>
                    <div className="flex items-center gap-8">
                      <span className={`notif-icon ${typeClass[n.type]}`} style={{ width: 28, height: 28, fontSize: 13, borderRadius: 6 }}>
                        {typeIcon[n.type]}
                      </span>
                      <span className={`badge badge-${typeClass[n.type]}`}>{n.type === 'IN_APP' ? 'In-App' : n.type}</span>
                    </div>
                  </td>
                  <td className="title-cell" style={{ maxWidth: 200 }}>{n.title}</td>
                  <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: 12 }}>
                    {n.message}
                  </td>
                  <td>{statusBadge(n.status)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    <span title={format(new Date(n.createdAt), 'PPpp')}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-8">
                      {n.status === 'UNREAD' && (
                        <button className="btn btn-xs btn-secondary" onClick={() => handleMarkRead(n.id)} title="Mark as read">✓</button>
                      )}
                      <button className="btn btn-xs btn-danger" onClick={() => handleDelete(n.id)} title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
          <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            );
          })}
          <button className="page-btn" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>›</button>
          <button className="page-btn" disabled={page === pages} onClick={() => setPage(pages)}>»</button>
        </div>
      )}
    </AppLayout>
  );
}
