import React, { useEffect, useState } from 'react';
import {
  Home,
  Building2,
  ClipboardList,
  CreditCard,
  Calendar,
  Users,
  QrCode,
  Bell,
  BarChart3,
  UserCog,
  Settings,
  Layers,
  ShieldCheck,
  Briefcase,
  Menu,
  X,
  TrendingUp
} from 'lucide-react';

export type AdminNavTab =
  | 'dashboard'
  | 'departments'
  | 'sponsors'
  | 'registrations'
  | 'payments'
  | 'revenue'
  | 'events'
  | 'coordinators'
  | 'roster'
  | 'reports'
  | 'structure'
  | 'users'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminNavTab;
  onSelectTab: (tab: AdminNavTab) => void;
  pendingPaymentsCount: number;
  totalEventsCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingPaymentsCount,
  totalEventsCount
}) => {
  const menuItems: { id: AdminNavTab; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard' as AdminNavTab, label: 'Dashboard', icon: Home },
    { id: 'departments' as AdminNavTab, label: 'Departments', icon: Building2 },
    { id: 'sponsors' as AdminNavTab, label: 'Sponsors & Partners', icon: Briefcase },
    { id: 'registrations' as AdminNavTab, label: 'Registrations', icon: ClipboardList },
    {
      id: 'payments' as AdminNavTab,
      label: 'Payment Approvals',
      icon: CreditCard,
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined
    },
    { id: 'revenue' as AdminNavTab, label: 'Revenue Analysis', icon: TrendingUp },
    {
      id: 'events' as AdminNavTab,
      label: 'Events',
      icon: Calendar,
      badge: totalEventsCount > 0 ? totalEventsCount : undefined
    },
    { id: 'coordinators' as AdminNavTab, label: 'Event Coordinators', icon: Users },
    { id: 'roster' as AdminNavTab, label: 'Participants', icon: Layers },
    { id: 'reports' as AdminNavTab, label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'structure' as AdminNavTab, label: 'User Management', icon: UserCog },
    { id: 'settings' as AdminNavTab, label: 'Settings', icon: Settings }
  ];

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Hamburger button for mobile */}
      <button
        className="admin-sidebar-mobile-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open admin sidebar"
        aria-expanded={open}
      >
        <Menu size={24} />
      </button>

      {/* Overlay backdrop */}
      {open && (
        <div
          className="admin-sidebar-overlay is-open"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`admin-sidebar admin-sidebar-responsive admin-scrollbar ${open ? 'is-open' : ''}`}
        aria-label="Admin navigation"
      >
        {/* Close button for mobile */}
        <button
          className="admin-sidebar-mobile-close"
          onClick={() => setOpen(false)}
          aria-label="Close admin sidebar"
        >
          <X size={24} />
        </button>

        {/* Top Branding Crest */}
        <div className="admin-sidebar-brand">
          <div>
            <div
              style={{
                fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)",
                fontSize: '1rem',
                fontWeight: 900,
                letterSpacing: '0.06em',
                background: 'linear-gradient(90deg, #FFFFFF 0%, #38BDF8 60%, #C084FC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.1
              }}
            >
              FESTRONIX
            </div>
            <div
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: '#38BDF8',
                letterSpacing: '0.12em',
                lineHeight: 1.2
              }}
            >
              2026
            </div>
            <div
              style={{
                fontSize: '0.58rem',
                color: '#94A3B8',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginTop: '1px'
              }}
            >
              Vardhaman College of Engineering
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="admin-sidebar-menu admin-scrollbar">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onSelectTab(item.id); setOpen(false); }}
                className={`admin-sidebar-item ${isActive ? 'active' : ''}`}
              >
                <div className="admin-sidebar-item-content">
                  <Icon size={17} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="admin-sidebar-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-campus-thumb relative h-32 overflow-hidden rounded-md">
            <img
              src="/vce_campus_bg.jpg"
              alt="Vardhaman College of Engineering Campus"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 45%' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 20%, rgba(9, 14, 26, 0.9) 100%)'
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)",
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#CBD5E1',
              textAlign: 'center',
              marginTop: '8px',
              textTransform: 'uppercase'
            }}
          >
            Vardhaman College of Engineering
          </div>
          <div
            style={{
              fontSize: '0.55rem',
              color: '#64748B',
              textAlign: 'center',
              marginTop: '2px',
              letterSpacing: '0.05em'
            }}
          >
            Bigger Ideas • Brighter Minds
          </div>
        </div>
      </aside>
    </>
  );
};
