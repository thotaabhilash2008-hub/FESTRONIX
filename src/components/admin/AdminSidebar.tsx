import React, { useState } from 'react';
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
  X
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
    { id: 'settings' as AdminNavTab, label: 'Settings', icon: Settings }
  ];

  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md"
        onClick={() => setOpen(true)}
        aria-label="Open admin sidebar"
      >
        <Menu size={24} />
      </button>

      {/* Overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`admin-sidebar admin-scrollbar bg-gray-900 text-gray-100 fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:static md:w-64`}
      >
        {/* Close button for mobile */}
        <button
          className="md:hidden absolute top-4 right-4 text-gray-300"
          onClick={() => setOpen(false)}
          aria-label="Close admin sidebar"
        >
          <X size={24} />
        </button>

        {/* Top Branding Crest */}
        <div className="admin-sidebar-brand p-4">
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
        <nav className="admin-sidebar-menu admin-scrollbar flex-1 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onSelectTab(item.id); setOpen(false); }}
                className={`admin-sidebar-item w-full text-left px-4 py-2 flex items-center justify-between ${isActive ? 'active' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="admin-sidebar-badge ml-2">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer p-4">
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