import React, { useEffect, useState } from 'react';
import {
  Building2, Layers, ShieldCheck, Users, QrCode, Phone, Globe, LogOut, ChevronRight, Sparkles, KeyRound,
  TrendingUp, Menu, X
} from 'lucide-react';
import { AdminUser } from '../../services/adminAuthService';

export type DeptDashboardTab =
  | 'events'
  | 'revenue'
  | 'checkin'
  | 'security';

interface DeptSidebarProps {
  adminUser: AdminUser;
  deptCode: string;
  deptName?: string;
  activeTab: DeptDashboardTab;
  onSelectTab: (tab: DeptDashboardTab) => void;
  isDeptChief: boolean;
  isEventCoord: boolean;
  eventsCount: number;
  readinessScore: number;
  rosterCount: number;
  pendingPaymentsCount: number;
  announcementsCount: number;
  coordinatorsCount: number;
  onSwitchToFest: () => void;
  onLogout: () => void;
}

export const DeptSidebar: React.FC<DeptSidebarProps> = ({
  adminUser,
  deptCode,
  deptName,
  activeTab,
  onSelectTab,
  isDeptChief,
  isEventCoord,
  eventsCount,
  readinessScore,
  rosterCount,
  pendingPaymentsCount,
  announcementsCount,
  coordinatorsCount,
  onSwitchToFest,
  onLogout,
}) => {
  // Mobile drawer state
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

  // Helper for footer button styling
  function footerButtonStyle(color: string, hoverBg: string) {
    return {
      flex: 1,
      background: 'rgba(255, 255, 255, 0.04)',
      border: `1px solid rgba(148, 163, 184, 0.2)`,
      borderRadius: '8px',
      padding: '7px 8px',
      color: '#94A3B8',
      fontSize: '0.72rem',
      fontWeight: 700 as const,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      transition: 'all 0.15s ease',
      onMouseEnter: (e: any) => {
        e.currentTarget.style.background = hoverBg;
        e.currentTarget.style.color = color;
        e.currentTarget.style.borderColor = `${color}55`;
      },
      onMouseLeave: (e: any) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
        e.currentTarget.style.color = '#94A3B8';
        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
      },
    } as any;
  }

  interface DeptMenuItem {
    id: DeptDashboardTab;
    label: string;
    icon: any;
    badge?: string;
    badgeType?: 'danger' | 'success' | 'warning';
  }

  const menuItems: DeptMenuItem[] = [
    {
      id: 'events',
      label: isEventCoord ? 'Assigned Events' : `${deptCode} Events`,
      icon: Layers,
      badge: eventsCount > 0 ? String(eventsCount) : undefined,
    },
    {
      id: 'revenue',
      label: 'Revenue Analysis',
      icon: TrendingUp,
      badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} pending` : undefined,
      badgeType: pendingPaymentsCount > 0 ? 'warning' : undefined,
    },
    {
      id: 'checkin',
      label: 'Attendance Check-In',
      icon: QrCode,
      badge: 'QR',
    },
    {
      id: 'security',
      label: 'Change Password',
      icon: KeyRound,
    },
  ];

  // Sidebar content used by both desktop and mobile drawer
  const sidebarContent = () => (
    <>
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
              lineHeight: 1.1,
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
              lineHeight: 1.2,
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
              marginTop: '1px',
            }}
          >
            Vardhaman College of Engineering
          </div>
        </div>
      </div>

      {/* Department Context Badge */}
      <div style={{ padding: '12px 14px 6px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.28)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.35)',
              flexShrink: 0,
            }}
          >
            <Building2 size={16} color="#FFFFFF" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#38BDF8',
                letterSpacing: '0.05em',
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={deptName ? `Department of ${deptName}` : `Dept of ${deptCode}`}
            >
              DEPT OF {deptCode}
            </div>
            <div
              style={{
                fontSize: '0.62rem',
                color: '#CBD5E1',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginTop: '2px',
                letterSpacing: '0.03em',
              }}
            >
              {isDeptChief ? '🏛️ Department Coordinator Desk' : '🎯 Event Coordinator Desk'}
            </div>
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
              onClick={() => {
                onSelectTab(item.id);
                setOpen(false);
              }}
              className={`admin-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-sidebar-item-content" style={{ gap: '11px' }}>
                <Icon size={17} color={isActive ? '#FFFFFF' : '#94A3B8'} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className="admin-sidebar-badge"
                  style={{
                    ...((item.badgeType as string) === 'danger'
                      ? { background: '#EF4444', color: '#FFFFFF', boxShadow: '0 0 10px rgba(239, 68, 68, 0.55)' }
                      : item.badgeType === 'success'
                      ? { background: 'rgba(16, 185, 129, 0.25)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.5)', boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)' }
                      : item.badgeType === 'warning'
                      ? { background: 'rgba(245, 158, 11, 0.25)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.5)', boxShadow: '0 0 8px rgba(245, 158, 11, 0.3)' }
                      : { background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)', color: isActive ? '#FFFFFF' : '#94A3B8', boxShadow: 'none' })
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar-footer">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={onSwitchToFest}
            style={footerButtonStyle('#38BDF8', 'rgba(56, 189, 248, 0.12)')}
            title="Switch to Public Fest Portal"
          >
            <Globe size={13} />
            <span>Fest Portal</span>
          </button>
          <button
            onClick={onLogout}
            style={footerButtonStyle('#F87171', 'rgba(239, 68, 68, 0.15)')}
            title="Sign Out of Admin Console"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
        <div className="admin-sidebar-campus-thumb" style={{ position: 'relative', height: '120px', overflow: 'hidden', borderRadius: '8px' }}>
          <img
            src="/vce_campus_bg.jpg"
            alt="Vardhaman College of Engineering Campus"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 45%' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, transparent 20%, rgba(9, 14, 26, 0.9) 100%)',
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
            textTransform: 'uppercase',
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
            letterSpacing: '0.05em',
          }}
        >
          Bigger Ideas • Brighter Minds
        </div>
      </div>
    </>
  );

  // Render a proper mobile drawer instead of relying on utility classes that may
  // not be present in the production bundle.
  const renderDrawer = (
    <div className="admin-sidebar-mobile-shell" aria-label="Department sidebar">
      {/* Overlay */}
      <div
        className="admin-sidebar-overlay is-open"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside className="admin-sidebar admin-sidebar-mobile is-open admin-scrollbar">
        {/* Close button */}
        <button
          className="admin-sidebar-mobile-close"
          onClick={() => setOpen(false)}
          aria-label="Close department sidebar"
        >
          <X size={20} />
        </button>
        {sidebarContent()}
      </aside>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="admin-sidebar admin-sidebar-desktop admin-scrollbar" aria-label="Department navigation">
        {sidebarContent()}
      </aside>

      {/* Mobile hamburger button */}
      <button
        className="admin-sidebar-mobile-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <Menu size={24} />
      </button>

      {/* Mobile drawer */}
      {open && renderDrawer}
    </>
  );
};
