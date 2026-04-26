'use client';

import { useState, useEffect } from 'react';
import { Template, NotificationType } from '@/types';
import api from '@/lib/api';

interface Props {
  template?: Template | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TemplateModal({ template, onClose, onSaved }: Props) {
  const isEdit = Boolean(template);
  const [name, setName] = useState(template?.name || '');
  const [type, setType] = useState<NotificationType>(template?.type || 'IN_APP');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Detect variables in real time
  const varMatches = (body + ' ' + subject).match(/\{\{\s*(\w+)\s*\}\}/g) || [];
  const detectedVars = Array.from(new Set(varMatches.map((m) => m.replace(/\{\{\s*|\s*\}\}/g, ''))));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = { name, type, subject: type === 'EMAIL' ? subject : undefined, body };
      if (isEdit && template) {
        await api.put(`/templates/${template.id}`, data);
      } else {
        await api.post('/templates', data);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? '✏️ Edit Template' : '➕ New Template'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Template Name */}
          <div className="form-group">
            <label className="form-label">Template Name</label>
            <input
              className="form-input"
              placeholder="e.g. Welcome Email, Order Confirmation..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Type */}
          <div className="form-group">
            <label className="form-label">Channel</label>
            <div className="type-selector">
              {(['EMAIL', 'SMS', 'IN_APP'] as NotificationType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`type-btn ${type === t ? `active ${t.toLowerCase().replace('_', '-')}` : ''}`}
                  onClick={() => setType(t)}
                >
                  <span className="type-btn-icon">{t === 'EMAIL' ? '📧' : t === 'SMS' ? '📱' : '🔔'}</span>
                  {t === 'IN_APP' ? 'In-App' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Subject (email only) */}
          {type === 'EMAIL' && (
            <div className="form-group">
              <label className="form-label">Subject Line</label>
              <input
                className="form-input"
                placeholder="e.g. Welcome, {{name}}!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          {/* Body */}
          <div className="form-group">
            <label className="form-label">Body</label>
            <textarea
              className="form-textarea"
              placeholder="Write your template body. Use {{variable}} for dynamic content..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              style={{ minHeight: 120 }}
            />
            <div className="form-hint">
              Use <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{'{{variable}}'}</code> syntax for dynamic content.
            </div>
          </div>

          {/* Detected Variables */}
          {detectedVars.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="form-label" style={{ marginBottom: 6 }}>Detected Variables</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {detectedVars.map((v) => (
                  <span key={v} className="badge badge-unread">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: 'var(--red-glow)', border: '1px solid var(--red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Saving...</> : isEdit ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
