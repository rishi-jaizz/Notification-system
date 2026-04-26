'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import NotificationBell from './NotificationBell';

interface NavItem { href: string; label: string; icon: string; }

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/history',   label: 'History',   icon: '📋' },
  { href: '/templates', label: 'Templates', icon: '📄' },
  { href: '/settings',  label: 'Settings',  icon: '⚙' },
];

export default function AppLayout({ children, title, subtitle }: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isConnected } = useNotifications();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🔔</div>
          <div className="logo-text">Notify<span>Hub</span></div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Navigation</div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '4px 10px' }}>
            <span className={`connection-dot ${isConnected ? 'connected' : ''}`} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <div className="user-card" onClick={handleLogout} title="Click to logout">
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 14 }}>↪</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div>
              <div className="page-title">{title}</div>
              {subtitle && <div className="page-subtitle">{subtitle}</div>}
            </div>
          </div>
          <div className="header-right">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content animate-in">{children}</main>
      </div>
    </div>
  );
}
