import React, { useState } from 'react';
import { Search, Bell, ChevronDown, Globe, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { AdminUser } from '../../services/adminAuthService';

interface AdminTopNavProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onSwitchToFest: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const AdminTopNav: React.FC<AdminTopNavProps> = ({
  adminUser,
  onLogout,
  onSwitchToFest,
  searchQuery = '',
  onSearchChange
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // User initial
  const initial = (adminUser.fullName || 'Admin').trim().charAt(0).toUpperCase();

  const getRoleHeader = () => {
    if (adminUser.role === 'vencorpia') {
      return {
        title: 'VENCORPIA EXECUTIVE CONSOLE',
        badge: '👑 SUPER ADMIN • CENTRAL GOVERNANCE'
      };
    }
    if (adminUser.role === 'connect_club') {
      return {
        title: 'CONNECT CLUB EXECUTIVE CONSOLE',
        badge: '👑 SUPER ADMIN • CENTRAL GOVERNANCE'
      };
    }
    return {
      title: 'DEAN SAC EXECUTIVE CONSOLE',
      badge: '👑 SUPER ADMIN • CENTRAL GOVERNANCE'
    };
  };

  const headerInfo = getRoleHeader();

  return (
    <header className="admin-topbar">
      {/* Left: Console Title & Badges */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)",
              fontSize: '1.18rem',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: 0,
              letterSpacing: '0.03em'
            }}
          >
            {headerInfo.title}
          </h1>

          <span
            style={{
              fontSize: '0.67rem',
              padding: '3px 9px',
              borderRadius: '9999px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              color: '#FBBF24',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}
          >
            {headerInfo.badge}
          </span>
        </div>

        <p style={{ fontSize: '0.76rem', color: '#94A3B8', margin: '3px 0 0' }}>
          Student Activity Council (SAC) • Vardhaman College of Engineering
        </p>
      </div>

      {/* Right: Search, Notification Bell, User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Search Bar */}
        <div className="admin-search-bar">
          <Search size={15} color="#64748B" />
          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={e => onSearchChange && onSearchChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              width: '100%',
              fontFamily: 'inherit'
            }}
          />
          <span className="admin-kbd-badge">Ctrl K</span>
        </div>

        {/* Notification Bell with Ping */}
        <div style={{ position: 'relative' }}>
          <button
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(16, 24, 44, 0.75)',
              border: '1px solid rgba(220, 227, 232, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#E2E8F0',
              transition: 'all 0.2s'
            }}
            title="Notifications"
          >
            <Bell size={17} />
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '0.62rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
              }}
            >
              1
            </span>
          </button>
        </div>

        {/* User Profile Chip */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(14, 21, 38, 0.85)',
              border: '1px solid rgba(220, 227, 232, 0.14)',
              borderRadius: '9999px',
              padding: '4px 12px 4px 5px',
              cursor: 'pointer',
              color: '#FFFFFF',
              transition: 'all 0.2s'
            }}
          >
            {/* Avatar Circle */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(37, 99, 235, 0.4)'
              }}
            >
              {initial}
            </div>

            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF' }}>
                {adminUser.fullName}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                {adminUser.designation.split(',')[0]}
              </div>
            </div>

            <ChevronDown size={14} color="#94A3B8" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '210px',
                background: 'rgba(10, 16, 32, 0.98)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '14px',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.12)',
                backdropFilter: 'blur(20px)',
                padding: '6px',
                zIndex: 60,
                animation: 'adminModalEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(220, 227, 232, 0.08)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF' }}>{adminUser.fullName}</div>
                <div style={{ fontSize: '0.68rem', color: '#38BDF8' }}>{adminUser.email}</div>
              </div>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onSwitchToFest();
                }}
                className="admin-sidebar-item"
                style={{ padding: '8px 10px', marginTop: '4px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={15} color="#38BDF8" />
                  <span>Public Fest Portal</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onLogout();
                }}
                className="admin-sidebar-item"
                style={{ padding: '8px 10px', color: '#F87171' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LogOut size={15} color="#F87171" />
                  <span>Sign Out</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
