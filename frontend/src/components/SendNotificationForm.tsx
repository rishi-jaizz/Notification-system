'use client';

import { useState, useEffect } from 'react';
import { Template, NotificationType } from '@/types';
import api from '@/lib/api';

interface Props {
  onSent?: () => void;
}

export default function SendNotificationForm({ onSent }: Props) {
  const [type, setType] = useState<NotificationType>('IN_APP');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/templates').then((r) => setTemplates(r.data.data)).catch(() => {});
    api.get('/users').then((r) => setUsers(r.data.data)).catch(() => {});
  }, []);

  // Auto-fill from template
  useEffect(() => {
    if (!templateId) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setType(tpl.type);
      if (tpl.subject) setTitle(tpl.subject);
      setMessage(tpl.body);
    }
  }, [templateId, templates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/notifications', {
        type,
        title: type === 'SMS' ? 'SMS Notification' : title,
        message: type === 'SMS' ? title : message,
        targetUserId: targetUserId || undefined,
        templateId: templateId || undefined,
      });
      setSuccess('✅ Notification sent successfully!');
      setTitle('');
      setMessage('');
      setTemplateId('');
      setTargetUserId('');
      onSent?.();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((t) => t.type === type || !templateId);

  return (
    <form onSubmit={handleSubmit}>
      {/* Type Selector */}
      <div className="form-group">
        <label className="form-label">Notification Type</label>
        <div className="type-selector">
          {(['EMAIL', 'SMS', 'IN_APP'] as NotificationType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`type-btn ${type === t ? `active ${t.toLowerCase().replace('_', '-')}` : ''}`}
              onClick={() => { setType(t); setTemplateId(''); }}
            >
              <span className="type-btn-icon">
                {t === 'EMAIL' ? '📧' : t === 'SMS' ? '📱' : '🔔'}
              </span>
              {t === 'IN_APP' ? 'In-App' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Target user (optional) */}
      {users.length > 0 && (
        <div className="form-group">
          <label className="form-label">Send To</label>
          <select className="form-select" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
            <option value="">Myself</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>
      )}

      {/* Template */}
      <div className="form-group">
        <label className="form-label">Template <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
        <select
          className="form-select"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
        >
          <option value="">No template — write manually</option>
          {filteredTemplates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div className="form-group">
        <label className="form-label">{type === 'SMS' ? 'Message' : 'Title / Subject'}</label>
        <input
          className="form-input"
          placeholder={type === 'EMAIL' ? 'Email subject line...' : 'Notification title...'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required={type !== 'SMS'}
        />
      </div>

      {/* Message */}
      {type !== 'SMS' && (
        <div className="form-group">
          <label className="form-label">Message / Body</label>
          <textarea
            className="form-textarea"
            placeholder="Write your notification message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            style={{ minHeight: 90 }}
          />
        </div>
      )}

      {/* Feedback */}
      {success && (
        <div style={{ background: 'var(--green-glow)', border: '1px solid var(--green)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--green)' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ background: 'var(--red-glow)', border: '1px solid var(--red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--red)' }}>
          {error}
        </div>
      )}

      <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
        {loading ? <><span className="spinner" /> Sending...</> : '🚀 Send Notification'}
      </button>
    </form>
  );
}
