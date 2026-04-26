'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, login, register, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) router.push('/dashboard');
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, phone || undefined);
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setTab('login');
    setEmail('alice@example.com');
    setPassword('demo1234');
  };

  if (authLoading) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
      {/* Animated background blobs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', top: '-200px', left: '-100px', animation: 'blob 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)', bottom: '-100px', right: '0px', animation: 'blob 10s ease-in-out infinite 2s' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', top: '40%', right: '30%', animation: 'blob 12s ease-in-out infinite 4s' }} />
      </div>

      {/* Left panel — branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', position: 'relative', minWidth: 0 }}>
        <div style={{ maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, var(--accent), var(--purple))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: '0 0 30px var(--accent-glow)', flexShrink: 0 }}>🔔</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Notify<span style={{ color: 'var(--accent-light)' }}>Hub</span></div>
          </div>

          <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 16 }}>
            The complete<br />
            <span style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              notification platform
            </span>
          </h1>

          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40, maxWidth: 380 }}>
            Send email, SMS, and in-app notifications with real-time delivery, intelligent queuing, and a powerful template engine.
          </p>

          {[
            { icon: '⚡', label: 'Real-time push via WebSocket' },
            { icon: '📧', label: 'Email & SMS integration with queues' },
            { icon: '📝', label: 'Dynamic template engine with variables' },
            { icon: '📊', label: 'Full history, filters & read tracking' },
          ].map((f) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{f.icon}</div>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — auth form */}
      <div style={{ width: 460, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', borderLeft: '1px solid var(--border)', background: 'rgba(12,20,37,0.8)', backdropFilter: 'blur(20px)', position: 'relative' }}>
        <div style={{ width: '100%', animation: 'fadeIn 0.4s ease' }}>
          {/* Tab */}
          <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: 4, marginBottom: 28, border: '1px solid var(--border)' }}>
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 'var(--radius-xs)',
                  border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  transition: 'all 0.2s',
                  background: tab === t ? 'var(--accent)' : 'transparent',
                  color: tab === t ? 'white' : 'var(--text-muted)',
                  boxShadow: tab === t ? '0 0 16px var(--accent-glow)' : 'none',
                }}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {tab === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(for SMS)</span></label>
                  <input className="form-input" placeholder="+1 555 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>

            {error && (
              <div style={{ background: 'var(--red-glow)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}>
              {loading ? <><span className="spinner" /> {tab === 'login' ? 'Signing in...' : 'Creating account...'}</> :
                tab === 'login' ? '→ Sign In' : '→ Create Account'}
            </button>
          </form>

          <div className="divider" style={{ margin: '20px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Try a demo account</p>
            <button className="btn btn-secondary" onClick={fillDemo} style={{ width: '100%', justifyContent: 'center' }}>
              🎭 Use Demo Credentials
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              alice@example.com / demo1234
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
