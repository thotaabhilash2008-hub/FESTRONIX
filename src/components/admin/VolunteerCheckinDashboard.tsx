import React, { useState } from 'react';
import { 
  QrCode, Users, CheckCircle2, XCircle, AlertCircle, Search, 
  ArrowRight, LogOut, RefreshCw, Sparkles, Shield, UserCheck, Check,
  Zap, Clock, Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminUser } from '../../services/adminAuthService';
import { StorageService } from '../../services/storageService';
import { Registration } from '../../types/festronix';
import { AdminHeader } from './AdminHeader';

interface VolunteerCheckinDashboardProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onSwitchToFest: () => void;
}

export const VolunteerCheckinDashboard: React.FC<VolunteerCheckinDashboardProps> = ({
  adminUser,
  onLogout,
  onSwitchToFest
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [lastCheckedIn, setLastCheckedIn] = useState<Registration | null>(null);
  const [checkinStatus, setCheckinStatus] = useState<{
    type: 'idle' | 'success' | 'already' | 'pending_payment' | 'not_found';
    message: string;
  }>({ type: 'idle', message: '' });

  const [registrations, setRegistrations] = useState<Registration[]>(() => StorageService.getRegistrations());
  const checkedInCount = registrations.filter(r => r.checkedIn).length;
  const totalCount = registrations.length;

  const refreshList = () => {
    setRegistrations(StorageService.getRegistrations());
  };

  const handleScanOrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = tokenInput.trim();
    if (!query) return;

    const allRegs = StorageService.getRegistrations();
    const cleanQ = query.toLowerCase();

    // Match by QR Token, Reg ID, Roll Number, or Buyer Roll
    const reg = allRegs.find(r => 
      r.qrToken?.toLowerCase() === cleanQ ||
      r.id.toLowerCase() === cleanQ ||
      r.leaderRoll.toLowerCase() === cleanQ ||
      (r.buyerRoll && r.buyerRoll.toLowerCase() === cleanQ)
    );

    if (!reg) {
      setCheckinStatus({
        type: 'not_found',
        message: `No registration record found matching "${query}". Verify Roll Number or Token.`
      });
      setLastCheckedIn(null);
      return;
    }

    if (reg.checkedIn) {
      setCheckinStatus({
        type: 'already',
        message: `Participant "${reg.leaderName}" (${reg.leaderRoll}) was already admitted at ${reg.checkedInAt || 'earlier'} by ${reg.checkedInBy || 'Gate Desk'}.`
      });
      setLastCheckedIn(reg);
      return;
    }

    if (reg.paymentStatus !== 'verified') {
      setCheckinStatus({
        type: 'pending_payment',
        message: `Payment status is ${reg.paymentStatus.toUpperCase().replace('_', ' ')}. Redirect participant to Accounts / Spot desk before gate entry.`
      });
      setLastCheckedIn(reg);
      return;
    }

    // Perform Check-in
    const res = await StorageService.checkInRegistration(reg.id, adminUser.fullName || 'Volunteer Gate Crew');
    if (res.success) {
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.55 } });
      const updated = res.registration || { ...reg, checkedIn: true, checkedInAt: new Date().toLocaleTimeString(), checkedInBy: adminUser.fullName };
      setLastCheckedIn(updated);
      setCheckinStatus({
        type: 'success',
        message: `ADMISSION GRANTED: ${reg.leaderName} (${reg.leaderRoll}) verified and admitted into ${reg.eventTitle}!`
      });
      setTokenInput('');
      refreshList();
    } else {
      setCheckinStatus({
        type: 'already',
        message: res.message || 'Check-in failed.'
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: '#FFFFFF', paddingBottom: '60px' }}>
      {/* Shared Executive Header */}
      <AdminHeader
        adminUser={adminUser}
        onLogout={onLogout}
        onSwitchToFest={onSwitchToFest}
        titleOverride="GATE ENTRY & PARTICIPANT CHECK-IN CONSOLE"
        badgeOverride="🎟️ GATE CHECK-IN DESK"
      />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 20px' }}>
        {/* KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {/* Card 1: Admitted Footfall */}
          <div className="admin-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Festival Admitted Footfall
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34D399', lineHeight: 1.1, marginTop: '4px' }}>
                  {checkedInCount}
                </div>
              </div>
              <div className="admin-kpi-icon-pod" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
                <UserCheck size={20} color="#34D399" />
              </div>
            </div>
            <div className="admin-progress-track">
              <div
                className="admin-progress-fill"
                style={{
                  width: `${totalCount > 0 ? (checkedInCount / totalCount) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #10B981, #34D399)'
                }}
              />
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '6px' }}>
              Admitted across all festival check-in gates
            </div>
          </div>

          {/* Card 2: Total Registered Passes */}
          <div className="admin-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Registered Passes
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginTop: '4px' }}>
                  {totalCount}
                </div>
              </div>
              <div className="admin-kpi-icon-pod">
                <Users size={20} color="#38BDF8" />
              </div>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '16px' }}>
              Across all 9 engineering branches & central clubs
            </div>
          </div>

          {/* Card 3: Live Gate Turnout Rate */}
          <div className="admin-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#C084FC', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Gate Turnout
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#C084FC', lineHeight: 1.1, marginTop: '4px' }}>
                  {totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0}%
                </div>
              </div>
              <div className="admin-kpi-icon-pod" style={{ background: 'rgba(168, 85, 247, 0.12)', borderColor: 'rgba(168, 85, 247, 0.35)' }}>
                <Radio size={20} color="#C084FC" />
              </div>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '16px' }}>
              Real-time gate admission completion percentage
            </div>
          </div>
        </div>

        {/* High-Tech Scanner Reticle & Entry Input */}
        <div className="admin-card" style={{ padding: '32px 28px', marginBottom: '28px' }}>
          <div className="admin-card-top-accent" />

          {/* Futuristic Laser Reticle Animation */}
          <div className="admin-scanner-reticle">
            <div className="admin-scanner-laser" />
            <div className="admin-scanner-corner admin-scanner-corner-tl" />
            <div className="admin-scanner-corner admin-scanner-corner-tr" />
            <div className="admin-scanner-corner admin-scanner-corner-bl" />
            <div className="admin-scanner-corner admin-scanner-corner-br" />

            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '20px'
              }}
            >
              <QrCode size={48} color="#38BDF8" style={{ opacity: 0.85, marginBottom: '10px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.04em' }}>
                DIGITAL PASS SCANNER ACTIVE
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                Awaiting Optical QR or Keyboard Input
              </div>
            </div>
          </div>

          <form onSubmit={handleScanOrSubmit} style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} color="#38BDF8" style={{ position: 'absolute', left: '16px', top: '15px' }} />
                <input
                  type="text"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  placeholder="Enter Roll Number, Token (e.g. 23VNR7721, FEST-2026-1082)..."
                  autoFocus
                  required
                  className="admin-form-input"
                  style={{
                    paddingLeft: '44px',
                    fontFamily: "var(--font-title, 'Space Grotesk', monospace)",
                    fontSize: '0.96rem'
                  }}
                />
              </div>

              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                style={{ padding: '0 24px', flexShrink: 0 }}
              >
                <Zap size={16} />
                <span>Verify & Admit</span>
              </button>
            </div>
          </form>

          {/* Status Feedback Banner */}
          {checkinStatus.type !== 'idle' && (
            <div
              style={{
                maxWidth: '640px',
                margin: '22px auto 0',
                padding: '16px 20px',
                borderRadius: '14px',
                background:
                  checkinStatus.type === 'success'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : checkinStatus.type === 'already'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                border:
                  checkinStatus.type === 'success'
                    ? '1px solid rgba(16, 185, 129, 0.45)'
                    : checkinStatus.type === 'already'
                    ? '1px solid rgba(245, 158, 11, 0.45)'
                    : '1px solid rgba(239, 68, 68, 0.45)',
                color:
                  checkinStatus.type === 'success'
                    ? '#34D399'
                    : checkinStatus.type === 'already'
                    ? '#FBBF24'
                    : '#F87171',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)'
              }}
            >
              {checkinStatus.type === 'success' ? (
                <CheckCircle2 size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <AlertCircle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.94rem', letterSpacing: '0.02em' }}>
                  {checkinStatus.type === 'success'
                    ? 'ADMISSION GRANTED • PASS VALIDATED'
                    : checkinStatus.type === 'already'
                    ? 'ALREADY CHECKED IN'
                    : checkinStatus.type === 'pending_payment'
                    ? 'PAYMENT VERIFICATION REQUIRED'
                    : 'RECORD NOT FOUND'}
                </div>
                <div style={{ fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.4, color: '#E2E8F0' }}>
                  {checkinStatus.message}
                </div>
              </div>
            </div>
          )}

          {/* Participant Details Card */}
          {lastCheckedIn && (
            <div
              style={{
                maxWidth: '640px',
                margin: '20px auto 0',
                background: 'rgba(12, 18, 34, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.74rem', color: '#38BDF8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Participant Verified Profile
                </span>
                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '3px 9px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800 }}>
                  CHECKED IN
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.84rem' }}>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Participant Name</span>
                  <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>{lastCheckedIn.leaderName}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Roll Number</span>
                  <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{lastCheckedIn.leaderRoll}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Enrolled Event</span>
                  <span style={{ color: '#E2E8F0' }}>{lastCheckedIn.eventTitle}</span>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Format / Team</span>
                  <span style={{ textTransform: 'capitalize', color: '#E2E8F0' }}>{lastCheckedIn.format}</span>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>College Institution</span>
                  <span style={{ color: '#E2E8F0' }}>{lastCheckedIn.leaderCollege}</span>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Admitted At</span>
                  <span style={{ color: '#34D399', fontWeight: 600 }}>{lastCheckedIn.checkedInAt || 'Just Now'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="admin-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Gate Check-in Activity Stream
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#94A3B8', margin: '2px 0 0' }}>
                Real-time chronological admission records
              </p>
            </div>

            <button
              onClick={refreshList}
              className="admin-btn admin-btn-ghost"
              style={{ padding: '6px 12px', fontSize: '0.76rem' }}
            >
              <RefreshCw size={13} />
              <span>Refresh Log</span>
            </button>
          </div>

          <div className="admin-table-wrapper admin-scrollbar" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reg ID</th>
                  <th>Participant</th>
                  <th>Roll Number</th>
                  <th>Event</th>
                  <th>Gate Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {registrations.filter(r => r.checkedIn).length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                      No participants checked in yet today. Ready to scan at gates.
                    </td>
                  </tr>
                ) : (
                  registrations.filter(r => r.checkedIn).map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace' }}>{r.id}</td>
                      <td style={{ color: '#FFFFFF', fontWeight: 600 }}>{r.leaderName}</td>
                      <td style={{ color: '#94A3B8', fontFamily: 'monospace' }}>{r.leaderRoll}</td>
                      <td style={{ color: '#E2E8F0' }}>{r.eventTitle}</td>
                      <td>
                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
                          ADMITTED
                        </span>
                      </td>
                      <td style={{ color: '#94A3B8' }}>{r.checkedInAt || '11:35 AM'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
