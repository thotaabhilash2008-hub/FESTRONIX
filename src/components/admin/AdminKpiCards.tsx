import React from 'react';
import { Users, IndianRupee, ShieldCheck, Ticket, ArrowUpRight } from 'lucide-react';
import { FestStats } from '../../types/festronix';

interface AdminKpiCardsProps {
  stats: FestStats;
}

export const AdminKpiCards: React.FC<AdminKpiCardsProps> = ({ stats }) => {
  const turnoutPercent = stats.totalRegistrations > 0
    ? Math.round((stats.checkedInCount / stats.totalRegistrations) * 100)
    : 44;

  // SVG Circular Gauge calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (turnoutPercent / 100) * circumference;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '22px' }}>
      {/* 1. TOTAL REGISTRATIONS */}
      <div className="admin-kpi-card admin-kpi-neon-blue">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="admin-kpi-icon-pod" style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
            <Users size={20} color="#38BDF8" />
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Registrations
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '2px' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
                {stats.totalRegistrations}
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#34D399',
                  background: 'rgba(16, 185, 129, 0.14)',
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}
              >
                <span>↑ +12%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Glowing Blue SVG Sparkline */}
        <div className="admin-kpi-sparkline" style={{ '--spark-color': '#38BDF8' } as React.CSSProperties}>
          <svg viewBox="0 0 200 40" width="100%" height="36" preserveAspectRatio="none">
            <defs>
              <linearGradient id="blueSparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,10 H200 M0,20 H200 M0,30 H200" stroke="rgba(148,163,184,0.12)" strokeWidth="0.6" strokeDasharray="2 4" />
            <path d="M0,31 L38,30 L76,26 L114,25 L152,19 L176,16 L200,12 L200,40 L0,40 Z" fill="url(#blueSparkGrad)" />
            <path d="M0,31 L38,30 L76,26 L114,25 L152,19 L176,16 L200,12" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="200" cy="12" r="2.8" fill="#38BDF8" stroke="#07111f" strokeWidth="1.5" />
          </svg>
        </div>

        <div style={{ fontSize: '0.73rem', color: '#94A3B8' }}>
          {stats.onlineCount} Online + {stats.spotCount} Spot Registrations
        </div>
      </div>

      {/* 2. TOTAL FEST REVENUE */}
      <div className="admin-kpi-card admin-kpi-neon-green">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="admin-kpi-icon-pod" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
            <IndianRupee size={20} color="#34D399" />
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Fest Revenue
            </span>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34D399', lineHeight: 1.1, marginTop: '2px' }}>
              ₹{stats.totalCollected.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Glowing Green SVG Sparkline */}
        <div className="admin-kpi-sparkline" style={{ '--spark-color': '#10B981' } as React.CSSProperties}>
          <svg viewBox="0 0 200 40" width="100%" height="36" preserveAspectRatio="none">
            <defs>
              <linearGradient id="greenSparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,10 H200 M0,20 H200 M0,30 H200" stroke="rgba(148,163,184,0.12)" strokeWidth="0.6" strokeDasharray="2 4" />
            <path d="M0,33 L40,31 L80,27 L120,22 L154,24 L178,15 L200,9 L200,40 L0,40 Z" fill="url(#greenSparkGrad)" />
            <path d="M0,33 L40,31 L80,27 L120,22 L154,24 L178,15 L200,9" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="200" cy="9" r="2.8" fill="#10B981" stroke="#071f18" strokeWidth="1.5" />
          </svg>
        </div>

        <div style={{ fontSize: '0.73rem', color: '#94A3B8' }}>
          Reconciled across all 9 departments & spot counters
        </div>
      </div>

      {/* 3. VERIFICATION QUEUE */}
      <div className="admin-kpi-card admin-kpi-neon-amber">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="admin-kpi-icon-pod" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
            <ShieldCheck size={20} color="#FBBF24" />
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: '#FBBF24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Verification Queue
            </span>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FBBF24', lineHeight: 1.1, marginTop: '2px' }}>
              {stats.pendingCount}
            </div>
          </div>
        </div>

        {/* Glowing Amber SVG Sparkline */}
        <div className="admin-kpi-sparkline" style={{ '--spark-color': '#F59E0B' } as React.CSSProperties}>
          <svg viewBox="0 0 200 40" width="100%" height="36" preserveAspectRatio="none">
            <defs>
              <linearGradient id="amberSparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,10 H200 M0,20 H200 M0,30 H200" stroke="rgba(148,163,184,0.12)" strokeWidth="0.6" strokeDasharray="2 4" />
            <path d="M0,34 L42,34 L82,29 L120,27 L145,30 L170,20 L200,13 L200,40 L0,40 Z" fill="url(#amberSparkGrad)" />
            <path d="M0,34 L42,34 L82,29 L120,27 L145,30 L170,20 L200,13" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="200" cy="13" r="2.8" fill="#F59E0B" stroke="#241805" strokeWidth="1.5" />
          </svg>
        </div>

        <div style={{ fontSize: '0.73rem', color: '#CBD5E1' }}>
          {stats.verifiedCount} verified • {stats.rejectedCount} rejected
        </div>
      </div>

      {/* 4. GATE CHECK-IN TURNOUT with Circular Radial Gauge */}
      <div className="admin-kpi-card admin-kpi-neon-purple">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="admin-kpi-icon-pod" style={{ background: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.4)' }}>
              <Ticket size={20} color="#C084FC" />
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: '#C084FC', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Gate Check-In Turnout
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginTop: '2px' }}>
                {stats.checkedInCount} / {stats.totalRegistrations}
              </div>
            </div>
          </div>

          {/* Circular Radial Progress Gauge */}
          <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
            <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background track circle */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="5"
                fill="transparent"
              />
              {/* Progress active circle */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                stroke="#C084FC"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#FFFFFF'
              }}
            >
              {turnoutPercent}%
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.73rem', color: '#94A3B8', marginTop: '16px' }}>
          {turnoutPercent}% Attendees Checked In
        </div>
      </div>
    </div>
  );
};
