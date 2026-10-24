import React, { useState, useEffect } from 'react';
import { 
  Award, Building2, CreditCard, QrCode, Globe, LogOut, 
  ShieldCheck, Clock, Activity, Sparkles 
} from 'lucide-react';
import { AdminUser, AdminRole } from '../../services/adminAuthService';

interface AdminHeaderProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onSwitchToFest: () => void;
  titleOverride?: string;
  badgeOverride?: string;
  badgeType?: 'super_admin' | 'dept' | 'finance' | 'volunteer' | 'event';
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  adminUser,
  onLogout,
  onSwitchToFest,
  titleOverride,
  badgeOverride,
  badgeType
}) => {
  // Live Clock in IST
  const [timeStr, setTimeStr] = useState(() => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoleConfig = () => {
    const role = adminUser.role;
    if (role === 'vencorpia') {
      return {
        title: titleOverride || 'VENCORPIA EXECUTIVE CONSOLE',
        badge: badgeOverride || '👑 SUPER ADMIN • FEST-WIDE LEADERSHIP',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeBorder: 'rgba(245, 158, 11, 0.45)',
        badgeColor: '#FBBF24',
        icon: Award,
        iconBg: 'linear-gradient(135deg, #B45309 0%, #D97706 50%, #F59E0B 100%)'
      };
    }
    if (role === 'connect_club') {
      return {
        title: titleOverride || 'CONNECT CLUB EXECUTIVE CONSOLE',
        badge: badgeOverride || '👑 SUPER ADMIN • FEST-WIDE LEADERSHIP',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeBorder: 'rgba(245, 158, 11, 0.45)',
        badgeColor: '#FBBF24',
        icon: Award,
        iconBg: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #0284C7 100%)'
      };
    }
    if (role === 'dean_sac' || role === 'super_admin') {
      return {
        title: titleOverride || 'DEAN SAC EXECUTIVE CONSOLE',
        badge: badgeOverride || '👑 SUPER ADMIN • CENTRAL GOVERNANCE',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeBorder: 'rgba(245, 158, 11, 0.45)',
        badgeColor: '#FBBF24',
        icon: Award,
        iconBg: 'linear-gradient(135deg, #283B78 0%, #3B539C 50%, #789593 100%)'
      };
    }
    if (role === 'finance_reviewer') {
      return {
        title: titleOverride || 'CENTRAL FINANCE & PAYMENT AUDIT CONSOLE',
        badge: badgeOverride || '💳 FINANCE REVIEW OFFICER',
        badgeBg: 'rgba(16, 185, 129, 0.15)',
        badgeBorder: 'rgba(16, 185, 129, 0.45)',
        badgeColor: '#34D399',
        icon: CreditCard,
        iconBg: 'linear-gradient(135deg, #065F46 0%, #059669 50%, #10B981 100%)'
      };
    }
    if (role === 'volunteer_checkin') {
      return {
        title: titleOverride || 'GATE ENTRY & PASS CHECK-IN CONSOLE',
        badge: badgeOverride || '🎟️ VOLUNTEER GATE CREW',
        badgeBg: 'rgba(168, 85, 247, 0.15)',
        badgeBorder: 'rgba(168, 85, 247, 0.45)',
        badgeColor: '#C084FC',
        icon: QrCode,
        iconBg: 'linear-gradient(135deg, #6B21A8 0%, #9333EA 50%, #A855F7 100%)'
      };
    }
    if (role === 'event_coordinator') {
      return {
        title: titleOverride || `${adminUser.departmentCode || 'EVENT'} OPERATIONS & COORDINATOR DESK`,
        badge: badgeOverride || `🎯 ${adminUser.departmentCode || ''} EVENT COORD`,
        badgeBg: 'rgba(56, 189, 248, 0.15)',
        badgeBorder: 'rgba(56, 189, 248, 0.45)',
        badgeColor: '#38BDF8',
        icon: Award,
        iconBg: 'linear-gradient(135deg, #0369A1 0%, #0284C7 50%, #38BDF8 100%)'
      };
    }
    // Department Chief / HOD
    return {
      title: titleOverride || `DEPARTMENT OF ${adminUser.departmentName?.toUpperCase() || adminUser.departmentCode || 'ENGINEERING'}`,
      badge: badgeOverride || `🏛️ ${adminUser.departmentCode || ''} CHIEF HOD`,
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      badgeBorder: 'rgba(56, 189, 248, 0.45)',
      badgeColor: '#38BDF8',
      icon: Building2,
      iconBg: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #38BDF8 100%)'
    };
  };

  const config = getRoleConfig();
  const IconComponent = config.icon;

  return (
    <header className="admin-exec-header">
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Left: Brand & User Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              position: 'relative',
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: config.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(56, 189, 248, 0.35)',
              flexShrink: 0
            }}
          >
            {/* Spinning ambient border */}
            <div
              style={{
                position: 'absolute',
                inset: '-2px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.8), transparent 60%, rgba(139, 92, 246, 0.8))',
                zIndex: -1,
                opacity: 0.7
              }}
            />
            <IconComponent size={22} color="#FFFFFF" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)",
                  fontSize: '1.18rem',
                  fontWeight: 800,
                  margin: 0,
                  color: '#FFFFFF',
                  letterSpacing: '0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {config.title}
              </h1>

              <span
                style={{
                  fontSize: '0.67rem',
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  background: config.badgeBg,
                  border: `1px solid ${config.badgeBorder}`,
                  color: config.badgeColor,
                  fontWeight: 800,
                  letterSpacing: '0.04em'
                }}
              >
                {config.badge}
              </span>
            </div>

            <p style={{ fontSize: '0.76rem', color: '#94A3B8', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{adminUser.fullName}</span>
              <span>•</span>
              <span>{adminUser.designation}</span>
              <span>•</span>
              <span style={{ color: '#64748B' }}>Vardhaman College of Engineering</span>
            </p>
          </div>
        </div>

        {/* Right: Live HUD Telemetry & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Live System Beacon */}
          <div className="admin-live-beacon">
            <span className="admin-live-beacon-dot" />
            <span>LIVE SYNC</span>
          </div>

          {/* Live Digital Clock */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(14, 21, 38, 0.8)',
              border: '1px solid rgba(220, 227, 232, 0.12)',
              borderRadius: '10px',
              color: '#38BDF8',
              fontFamily: "var(--font-title, 'Space Grotesk', monospace)",
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.05em'
            }}
          >
            <Clock size={13} color="#38BDF8" />
            <span>{timeStr} IST</span>
          </div>

          {/* Switch to Public Fest Site */}
          <button
            onClick={onSwitchToFest}
            className="admin-btn admin-btn-ghost"
            style={{ padding: '7px 14px', fontSize: '0.78rem' }}
            title="Return to Festronix 2026 Public Showcase"
          >
            <Globe size={13} color="#38BDF8" />
            <span>Fest Portal</span>
          </button>

          {/* Sign Out */}
          <button
            onClick={onLogout}
            className="admin-btn admin-btn-danger"
            style={{ padding: '7px 14px', fontSize: '0.78rem' }}
            title="End secure admin session"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="admin-header-glow-line" />
    </header>
  );
};
