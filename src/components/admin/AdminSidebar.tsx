import React from 'react';
import { 
  Home, Building2, ClipboardList, CreditCard, Calendar, Users, 
  QrCode, Bell, BarChart3, UserCog, Settings, Layers, ShieldCheck, Briefcase
} from 'lucide-react';

export type AdminNavTab = 
  | 'dashboard' 
  | 'departments' 
  | 'sponsors'
  | 'registrations' 
  | 'payments' 
  | 'events' 
  | 'coordinators' 
  | 'checkin' 
  | 'roster' 
  | 'bulletins' 
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
  const menuItems = [
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
    { 
      id: 'events' as AdminNavTab, 
      label: 'Events', 
      icon: Calendar,
      badge: totalEventsCount > 0 ? totalEventsCount : undefined
    },
    { id: 'coordinators' as AdminNavTab, label: 'Event Coordinators', icon: Users },
    { id: 'checkin' as AdminNavTab, label: 'Gate Check-in', icon: QrCode },
    { id: 'roster' as AdminNavTab, label: 'Participants', icon: Layers },
    { id: 'bulletins' as AdminNavTab, label: 'Campus Bulletins', icon: Bell },
    { id: 'reports' as AdminNavTab, label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'structure' as AdminNavTab, label: 'User Management', icon: UserCog },
    { id: 'settings' as AdminNavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="admin-sidebar admin-scrollbar">
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
              onClick={() => onSelectTab(item.id)}
              className={`admin-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                <Icon size={17} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="admin-sidebar-badge">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer: Real Vardhaman College of Engineering Campus Thumbnail */}
      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-campus-thumb">
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
  );
};
