'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function SettingsPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const prefs = (user?.preferences as { email: boolean; sms: boolean; inApp: boolean }) || { email: true, sms: true, inApp: true };

  const [emailEnabled, setEmailEnabled] = useState(prefs.email);
  const [smsEnabled, setSmsEnabled] = useState(prefs.sms);
  const [inAppEnabled, setInAppEnabled] = useState(prefs.inApp);
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  // Sync when user loads
  useEffect(() => {
    if (user) {
      const p = user.preferences as { email: boolean; sms: boolean; inApp: boolean };
      setEmailEnabled(p.email);
      setSmsEnabled(p.sms);
      setInAppEnabled(p.inApp);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/users/me/preferences', { email: emailEnabled, sms: smsEnabled, inApp: inAppEnabled, phone });
      await refreshUser();
      setSuccess('✅ Preferences updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <AppLayout title="Settings" subtitle="Manage your notification preferences">
      <div style={{ maxWidth: 580 }}>
        {/* Profile */}
        <div className="card mb-24">
          <div className="card-title">👤 Profile</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{user.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user.email}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Phone Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(for SMS notifications)</span></label>
              <input
                className="form-input"
                placeholder="+1 555 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <div className="form-hint">International format recommended, e.g. +15550001234</div>
            </div>

            {/* Preferences */}
            <div className="card-title" style={{ marginTop: 20 }}>🔔 Notification Channels</div>

            <div className="toggle-wrap">
              <div className="toggle-info">
                <div className="toggle-label">📧 Email Notifications</div>
                <div className="toggle-desc">Receive notifications via email to {user.email}</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="toggle-wrap">
              <div className="toggle-info">
                <div className="toggle-label">📱 SMS Notifications</div>
                <div className="toggle-desc">Receive SMS messages{phone ? ` to ${phone}` : ' (add phone number above)'}</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="toggle-wrap">
              <div className="toggle-info">
                <div className="toggle-label">🔔 In-App Notifications</div>
                <div className="toggle-desc">Receive real-time notifications in the notification center</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={inAppEnabled} onChange={(e) => setInAppEnabled(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            {success && (
              <div style={{ background: 'var(--green-glow)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: 16, fontSize: 13, color: 'var(--green)' }}>
                {success}
              </div>
            )}
            {error && (
              <div style={{ background: 'var(--red-glow)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: 16, fontSize: 13, color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 20 }}>
              {loading ? <><span className="spinner" /> Saving...</> : '💾 Save Preferences'}
            </button>
          </form>
        </div>

        {/* SMTP / Twilio Info */}
        <div className="card">
          <div className="card-title">🔧 Integration Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Email (SMTP)', desc: 'Configure SMTP_HOST in backend .env', icon: '📧' },
              { label: 'SMS (Twilio)', desc: 'Configure TWILIO_ACCOUNT_SID in backend .env', icon: '📱' },
              { label: 'Real-time (Socket.IO)', desc: 'Connected via WebSocket', icon: '⚡', ok: true },
              { label: 'Queue (BullMQ + Redis)', desc: 'Job queue processing active', icon: '⚙️', ok: true },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <span className={`badge ${item.ok ? 'badge-sent' : 'badge-pending'}`}>
                  {item.ok ? 'Active' : 'Simulation'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
