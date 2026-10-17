import React, { useState } from 'react';
import { 
  QrCode, Users, CheckCircle2, XCircle, AlertCircle, Search, 
  ArrowRight, LogOut, RefreshCw, Sparkles, Shield, UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminUser } from '../../services/adminAuthService';
import { StorageService } from '../../services/storageService';
import { Registration } from '../../types/festronix';

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

  const [registrations, setRegistrations] = useState<Registration[]>(StorageService.getRegistrations());
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
      r.qrToken.toLowerCase() === cleanQ ||
      r.id.toLowerCase() === cleanQ ||
      r.leaderRoll.toLowerCase() === cleanQ ||
      (r.buyerRoll && r.buyerRoll.toLowerCase() === cleanQ)
    );

    if (!reg) {
      setCheckinStatus({
        type: 'not_found',
        message: `No registration found matching "${query}". Verify Roll Number or Token.`
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
        message: `Payment status is ${reg.paymentStatus.toUpperCase().replace('_', ' ')}. Redirect participant to Accounts / Spot desk before admission.`
      });
      setLastCheckedIn(reg);
      return;
    }

    // Perform Check-in
    const res = await StorageService.checkInRegistration(reg.id, adminUser.fullName || 'Volunteer Gate Crew');
    if (res.success) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      const updated = { ...reg, checkedIn: true, checkedInAt: new Date().toLocaleTimeString(), checkedInBy: adminUser.fullName };
      setLastCheckedIn(updated);
      setCheckinStatus({
        type: 'success',
        message: `ADMISSION GRANTED: ${reg.leaderName} (${reg.leaderRoll}) successfully checked into ${reg.eventTitle}!`
      });
      setTokenInput('');
      refreshList();
    } else {
      setCheckinStatus({
        type: 'pending_payment',
        message: res.message || 'Check-in failed.'
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', padding: '24px 20px', maxWidth: '1000px', margin: '0 auto', color: '#FFFFFF' }}>
      {/* Top Banner with Access Boundary Indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(20, 31, 62, 0.95)',
          border: '1px solid rgba(120, 149, 147, 0.35)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <QrCode size={24} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Gate Entry & Volunteer Check-in
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  background: 'rgba(244, 114, 182, 0.15)',
                  color: '#f472b6',
                  border: '1px solid rgba(244, 114, 182, 0.35)',
                  padding: '3px 8px',
                  borderRadius: '9999px'
                }}
              >
                ROLE: VOLUNTEER / CHECK-IN STAFF
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#A8B3C2', marginTop: '2px' }}>
              Access boundary: <strong>Limited check-in access</strong> • Responsibilities: Scan tickets and support entry operations
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onSwitchToFest}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(220, 227, 229, 0.2)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#DCE3E5',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Fest Portal
          </button>
          <button
            onClick={onLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#f87171',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(16, 26, 53, 0.8)', border: '1px solid rgba(220, 227, 229, 0.15)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.76rem', color: '#A8B3C2', fontWeight: 600 }}>Festival Admitted Footfall</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            {checkedInCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#789593' }}>Participants checked in at gates</div>
        </div>

        <div style={{ background: 'rgba(16, 26, 53, 0.8)', border: '1px solid rgba(220, 227, 229, 0.15)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.76rem', color: '#A8B3C2', fontWeight: 600 }}>Total Registered Passes</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
            {totalCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>Across all 9 academic branches</div>
        </div>

        <div style={{ background: 'rgba(16, 26, 53, 0.8)', border: '1px solid rgba(244, 114, 182, 0.3)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.76rem', color: '#f472b6', fontWeight: 700 }}>Attendance Rate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f472b6', marginTop: '4px' }}>
            {totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>Live venue entry percentage</div>
        </div>
      </div>

      {/* Check-in Scanner Box */}
      <div
        style={{
          background: 'rgba(16, 26, 53, 0.9)',
          border: '1px solid rgba(220, 227, 229, 0.22)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          marginBottom: '24px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(244, 114, 182, 0.15)',
              border: '1px solid rgba(244, 114, 182, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}
          >
            <UserCheck size={28} color="#f472b6" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px' }}>Fast Ticket & Pass Scanner</h2>
          <p style={{ fontSize: '0.82rem', color: '#A8B3C2', margin: 0 }}>
            Enter Participant Roll Number, Registration Token, or QR Code string to verify and grant gate admission.
          </p>
        </div>

        <form onSubmit={handleScanOrSubmit} style={{ maxWidth: '580px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              placeholder="e.g. 23VNR7721, FEST-2026-1082, or FEST26-TOKEN-..."
              autoFocus
              required
              style={{
                flex: 1,
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'rgba(10, 16, 32, 0.95)',
                border: '1px solid rgba(120, 149, 147, 0.45)',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                outline: 'none',
                fontFamily: 'monospace'
              }}
            />
            <button
              type="submit"
              className="btn-cyber-primary"
              style={{ padding: '14px 24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <QrCode size={18} />
              <span>Verify & Admit</span>
            </button>
          </div>
        </form>

        {/* Status Alerts */}
        {checkinStatus.type !== 'idle' && (
          <div
            style={{
              maxWidth: '580px',
              margin: '20px auto 0',
              padding: '16px',
              borderRadius: '12px',
              background:
                checkinStatus.type === 'success'
                  ? 'rgba(52, 211, 153, 0.15)'
                  : checkinStatus.type === 'already'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              border:
                checkinStatus.type === 'success'
                  ? '1px solid rgba(52, 211, 153, 0.4)'
                  : checkinStatus.type === 'already'
                  ? '1px solid rgba(245, 158, 11, 0.4)'
                  : '1px solid rgba(239, 68, 68, 0.4)',
              color:
                checkinStatus.type === 'success'
                  ? '#34d399'
                  : checkinStatus.type === 'already'
                  ? '#fbbf24'
                  : '#f87171',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            {checkinStatus.type === 'success' ? (
              <CheckCircle2 size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {checkinStatus.type === 'success'
                  ? 'VERIFIED & ADMITTED'
                  : checkinStatus.type === 'already'
                  ? 'ALREADY CHECKED IN'
                  : checkinStatus.type === 'pending_payment'
                  ? 'PAYMENT VERIFICATION REQUIRED'
                  : 'RECORD NOT FOUND'}
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px', lineHeight: 1.4, color: '#DCE3E5' }}>
                {checkinStatus.message}
              </div>
            </div>
          </div>
        )}

        {/* Participant Details Card when Found */}
        {lastCheckedIn && (
          <div
            style={{
              maxWidth: '580px',
              margin: '16px auto 0',
              background: 'rgba(10, 16, 32, 0.8)',
              border: '1px solid rgba(220, 227, 229, 0.15)',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '0.74rem', color: '#789593', fontWeight: 700, letterSpacing: '0.05em' }}>
              PARTICIPANT DETAILS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#A8B3C2' }}>Name: </span>
                <strong>{lastCheckedIn.leaderName}</strong>
              </div>
              <div>
                <span style={{ color: '#A8B3C2' }}>Roll Number: </span>
                <strong>{lastCheckedIn.leaderRoll}</strong>
              </div>
              {lastCheckedIn.deptSection && (
                <div>
                  <span style={{ color: '#A8B3C2' }}>Dept & Section: </span>
                  <strong style={{ color: '#34d399' }}>{lastCheckedIn.deptSection}</strong>
                </div>
              )}
              <div>
                <span style={{ color: '#A8B3C2' }}>College: </span>
                <span>{lastCheckedIn.leaderCollege}</span>
              </div>
              <div>
                <span style={{ color: '#A8B3C2' }}>Event: </span>
                <span>{lastCheckedIn.eventTitle}</span>
              </div>
              <div>
                <span style={{ color: '#A8B3C2' }}>Pass Format: </span>
                <span style={{ textTransform: 'capitalize' }}>{lastCheckedIn.format}</span>
              </div>
              <div>
                <span style={{ color: '#A8B3C2' }}>Payment Status: </span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>{lastCheckedIn.paymentStatus.toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Check-ins Table */}
      <div style={{ background: 'rgba(16, 26, 53, 0.85)', border: '1px solid rgba(220, 227, 229, 0.15)', borderRadius: '16px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Gate Check-in Activity Log</h3>
          <button
            onClick={refreshList}
            style={{
              background: 'none',
              border: '1px solid rgba(220, 227, 229, 0.2)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#DCE3E5',
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={12} />
            <span>Refresh Log</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'rgba(40, 59, 120, 0.35)', borderBottom: '1px solid rgba(120, 149, 147, 0.3)', color: '#DCE3E5' }}>
                <th style={{ padding: '8px 12px' }}>Reg ID</th>
                <th style={{ padding: '8px 12px' }}>Participant</th>
                <th style={{ padding: '8px 12px' }}>Roll No</th>
                <th style={{ padding: '8px 12px' }}>Event</th>
                <th style={{ padding: '8px 12px' }}>Gate Status</th>
                <th style={{ padding: '8px 12px' }}>Check-in Time</th>
              </tr>
            </thead>
            <tbody>
              {registrations.filter(r => r.checkedIn).map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(220, 227, 229, 0.08)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.id}</td>
                  <td style={{ padding: '8px 12px', color: '#FFFFFF' }}>{r.leaderName}</td>
                  <td style={{ padding: '8px 12px', color: '#A8B3C2' }}>{r.leaderRoll}</td>
                  <td style={{ padding: '8px 12px', color: '#DCE3E5' }}>{r.eventTitle}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                      ADMITTED
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#A8B3C2' }}>{r.checkedInAt || '11:35 AM'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
