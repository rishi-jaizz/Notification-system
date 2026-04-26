'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import TemplateModal from '@/components/TemplateModal';
import { Template } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';

const typeClass: Record<string, string> = { EMAIL: 'email', SMS: 'sms', IN_APP: 'in-app' };
const typeIcon: Record<string, string> = { EMAIL: '📧', SMS: '📱', IN_APP: '🔔' };

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/templates', { params: filterType ? { type: filterType } : {} });
      setTemplates(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    if (user) loadTemplates();
  }, [user, loadTemplates]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await api.delete(`/templates/${id}`);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const openCreate = () => { setEditTemplate(null); setModalOpen(true); };
  const openEdit = (t: Template) => { setEditTemplate(t); setModalOpen(true); };

  if (authLoading || !user) return null;

  return (
    <AppLayout title="Templates" subtitle="Manage reusable notification templates">
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-16">
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'EMAIL', 'SMS', 'IN_APP'].map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${filterType === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType(t)}
            >
              {t === '' ? 'All' : t === 'IN_APP' ? '🔔 In-App' : t === 'EMAIL' ? '📧 Email' : '📱 SMS'}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          ＋ New Template
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="empty-state" style={{ padding: 60 }}>
          <span className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : templates.length === 0 ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-text">No templates yet. Create your first one!</div>
          <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 16 }}>
            ＋ Create Template
          </button>
        </div>
      ) : (
        <div className="template-card-grid">
          {templates.map((t) => (
            <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
            >
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={`notif-icon ${typeClass[t.type]}`} style={{ width: 36, height: 36, fontSize: 16, borderRadius: 8, flexShrink: 0 }}>
                    {typeIcon[t.type]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                    <span className={`badge badge-${typeClass[t.type]}`} style={{ marginTop: 2 }}>
                      {t.type === 'IN_APP' ? 'In-App' : t.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subject */}
              {t.subject && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '6px 10px', borderRadius: 6 }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Subject:</strong> {t.subject}
                </div>
              )}

              {/* Body preview */}
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                {t.body}
              </div>

              {/* Variables */}
              {(t.variables as string[]).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(t.variables as string[]).map((v) => (
                    <span key={v} className="badge badge-unread" style={{ fontSize: 10 }}>{`{{${v}}}`}</span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Updated {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-xs btn-secondary" onClick={() => openEdit(t)}>✏️ Edit</button>
                  <button className="btn btn-xs btn-danger" onClick={() => handleDelete(t.id)}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <TemplateModal
          template={editTemplate}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); loadTemplates(); }}
        />
      )}
    </AppLayout>
  );
}
