import React, { useEffect, useState } from 'react';
import { 
  Users, CheckCircle2, XCircle, Search, QrCode, FileSpreadsheet, 
  Sparkles, Shield, UserPlus, Eye, AlertTriangle, ArrowRight, ShieldCheck,
  Printer, Copy, Plus, Trash2
} from 'lucide-react';
import { FestEvent, Registration, PaymentStatus, Teammate } from '../types/festronix';
import { StorageService } from '../services/storageService';
import { getEventRegistrationBlockReason } from '../lib/eventRegistration';

interface CoordinatorPortalProps {
  events: FestEvent[];
  registrations: Registration[];
  onRefreshData: () => void;
  onClose: () => void;
}

export const CoordinatorPortal: React.FC<CoordinatorPortalProps> = ({
  events,
  registrations,
  onRefreshData,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'reviews' | 'spot' | 'checkin' | 'list'>('reviews');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  // Review proof preview modal
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [rejectionModalRegId, setRejectionModalRegId] = useState<string | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('Payment screenshot unclear or transaction ID mismatch');

  // Spot registration form state (FR-SPOT-01 to FR-SPOT-07)
  const [spotEventId, setSpotEventId] = useState<string>(events[0]?.id || '');
  const [spotName, setSpotName] = useState('');
  const [spotEmail, setSpotEmail] = useState('');
  const [spotPhone, setSpotPhone] = useState('');
  const [spotCollege, setSpotCollege] = useState('Vardhaman College of Engineering');
  const [spotRoll, setSpotRoll] = useState('');
  const [spotStaffName, setSpotStaffName] = useState('Chief Event Coordinator');
  const [spotFeePaid, setSpotFeePaid] = useState(true);
  const [spotSuccessMsg, setSpotSuccessMsg] = useState('');
  const [spotErrorMsg, setSpotErrorMsg] = useState('');
  const [spotTeamName, setSpotTeamName] = useState('');
  const [spotTeammates, setSpotTeammates] = useState<Teammate[]>([]);
  const [spotCreatedReg, setSpotCreatedReg] = useState<Registration | null>(null);

  // Check-in desk state (FR-QR-02 to FR-QR-05)
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInResult, setCheckInResult] = useState<{
    status: 'VALID' | 'ALREADY_CHECKED_IN' | 'NOT_FOUND' | 'PAYMENT_PENDING' | null;
    message: string;
    reg?: Registration;
  }>({ status: null, message: '' });

  // Keep this legacy coordinator surface live when it is embedded by another
  // portal. The database remains the source of truth; the parent re-fetches
  // scoped events and registrations after each Realtime notification.
  useEffect(() => {
    const refresh = () => onRefreshData();
    window.addEventListener('festronix:regs-updated', refresh);
    window.addEventListener('festronix:events-updated', refresh);
    return () => {
      window.removeEventListener('festronix:regs-updated', refresh);
      window.removeEventListener('festronix:events-updated', refresh);
    };
  }, [onRefreshData]);

  // Filter registrations by selected event
  const filteredRegs = registrations.filter(r => 
    selectedEventId === 'all' || r.eventId === selectedEventId
  );

  const pendingReviews = filteredRegs.filter(r => r.paymentStatus === 'verification_pending');

  const handleVerify = async (regId: string) => {
    await StorageService.updatePaymentStatus(regId, 'verified', spotStaffName || 'VCE Coordinator Desk');
    onRefreshData();
  };

  const handleRejectConfirm = async () => {
    if (rejectionModalRegId) {
      await StorageService.updatePaymentStatus(
        rejectionModalRegId,
        'rejected',
        spotStaffName || 'VCE Coordinator Desk',
        rejectionReasonText
      );
      setRejectionModalRegId(null);
      onRefreshData();
    }
  };

  // Selected event for spot registration
  const currentSpotEvent = events.find(e => e.id === spotEventId) || events[0];

  const handleSpotEventSelect = (newEvtId: string) => {
    setSpotEventId(newEvtId);
    setSpotErrorMsg('');
    setSpotSuccessMsg('');
    setSpotCreatedReg(null);

    const targetEvt = events.find(e => e.id === newEvtId);
    if (!targetEvt) return;

    if (targetEvt.format === 'duo') {
      setSpotTeammates([
        { name: '', email: '', phone: '', college: spotCollege, rollNumber: '' }
      ]);
    } else if (targetEvt.format === 'team') {
      // Prepopulate teammates up to minTeamSize - 1
      const initialCount = Math.max(1, (targetEvt.minTeamSize || 2) - 1);
      const initialTms: Teammate[] = [];
      for (let i = 0; i < initialCount; i++) {
        initialTms.push({ name: '', email: '', phone: '', college: spotCollege, rollNumber: '' });
      }
      setSpotTeammates(initialTms);
    } else {
      setSpotTeammates([]);
    }
  };

  const handleAddSpotTeammate = () => {
    if (!currentSpotEvent) return;
    const maxTms = (currentSpotEvent.maxTeamSize || 4) - 1;
    if (spotTeammates.length >= maxTms) {
      alert(`Maximum team size for this event is ${currentSpotEvent.maxTeamSize} (including leader).`);
      return;
    }
    setSpotTeammates([
      ...spotTeammates,
      { name: '', email: '', phone: '', college: spotCollege, rollNumber: '' }
    ]);
  };

  const handleRemoveSpotTeammate = (idx: number) => {
    setSpotTeammates(spotTeammates.filter((_, i) => i !== idx));
  };

  const handleSpotTeammateChange = (idx: number, field: keyof Teammate, val: string) => {
    const updated = [...spotTeammates];
    updated[idx] = { ...updated[idx], [field]: val };
    setSpotTeammates(updated);
  };

  // Spot registration submission (FR-SPOT-01 to FR-SPOT-07)
  const handleSpotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpotErrorMsg('');
    setSpotSuccessMsg('');

    const event = events.find(e => e.id === spotEventId);
    if (!event) {
      setSpotErrorMsg('Selected event not found.');
      return;
    }

    const registrationBlockReason = getEventRegistrationBlockReason(event);
    if (registrationBlockReason) {
      setSpotErrorMsg(registrationBlockReason);
      return;
    }

    // Leader info validation (FR-SPOT-03)
    if (!spotName.trim() || !spotPhone.trim() || !spotRoll.trim()) {
      setSpotErrorMsg('Please fill out Participant Name, Phone, and Roll number.');
      return;
    }

    // Duplicate check for leader (FR-SPOT-04, FR-REG-05)
    const leaderDup = StorageService.checkDuplicateRegistration(event.id, spotRoll);
    if (leaderDup.isDuplicate && leaderDup.existingReg) {
      setSpotErrorMsg(`Leader (${spotRoll}) is already registered for this event (Pass ID: ${leaderDup.existingReg.id}). Duplicate registrations are not allowed.`);
      return;
    }

    // Team / Duo validation (FR-SPOT-02, FR-SPOT-03)
    const effectiveFormat = event.format;
    if (effectiveFormat !== 'individual') {
      if (!spotTeamName.trim()) {
        setSpotErrorMsg('Please specify a Team Name for this squad.');
        return;
      }

      const totalMembers = 1 + spotTeammates.length;
      if (totalMembers < event.minTeamSize || totalMembers > event.maxTeamSize) {
        setSpotErrorMsg(`Squad size must be between ${event.minTeamSize} and ${event.maxTeamSize} members. Current: ${totalMembers}.`);
        return;
      }

      // Check all teammates have required info
      for (let i = 0; i < spotTeammates.length; i++) {
        const tm = spotTeammates[i];
        if (!tm.name.trim() || !tm.rollNumber.trim() || !tm.phone.trim()) {
          setSpotErrorMsg(`Teammate #${i + 1} is missing Name, Roll Number, or Phone.`);
          return;
        }

        // Duplicate check for each teammate
        const tmDup = StorageService.checkDuplicateRegistration(event.id, tm.rollNumber);
        if (tmDup.isDuplicate && tmDup.existingReg) {
          setSpotErrorMsg(`Teammate "${tm.name}" (${tm.rollNumber}) is already registered for this event (Pass: ${tmDup.existingReg.id}).`);
          return;
        }
      }

      // Check intra-squad uniqueness
      const allSquadRolls = [spotRoll.trim().toLowerCase(), ...spotTeammates.map(t => t.rollNumber.trim().toLowerCase())];
      if (new Set(allSquadRolls).size !== allSquadRolls.length) {
        setSpotErrorMsg('Duplicate roll numbers detected within this team roster.');
        return;
      }
    }

    try {
      const staffAttribution = spotStaffName.trim() || 'Gate Operations Desk';
      const isFree = event.fee === 0;

      const newReg = await StorageService.addRegistration({
        eventId: event.id,
        eventTitle: event.title,
        teamName: effectiveFormat !== 'individual' ? spotTeamName.trim() : undefined,
        leaderName: spotName.trim(),
        leaderEmail: spotEmail.trim() || `${spotRoll.trim().toLowerCase()}@festronix.spot`,
        leaderPhone: spotPhone.trim(),
        leaderCollege: spotCollege.trim(),
        leaderRoll: spotRoll.trim().toUpperCase(),
        teammates: effectiveFormat !== 'individual' ? spotTeammates : [],
        format: effectiveFormat,
        fee: event.fee,
        source: 'spot',
        registrationDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        paymentStatus: isFree ? 'verified' : (spotFeePaid ? 'verified' : 'verification_pending'),
        transactionId: isFree ? 'FREE-PASS' : (spotFeePaid ? 'CASH-SPOT-COLLECTED' : undefined),
        verifiedBy: staffAttribution,
        verifiedAt: new Date().toLocaleTimeString(),
        spotRegisteredBy: staffAttribution
      });

      setSpotCreatedReg(newReg);
      setSpotSuccessMsg(`Spot Pass Issued Successfully! Token: ${newReg.qrToken} (ID: ${newReg.id})`);
      onRefreshData();
    } catch (err: any) {
      setSpotErrorMsg(err?.message || 'Failed to create spot registration.');
    }
  };

  const handleScanOrSubmitCheckIn = async (token: string) => {
    if (!token.trim()) return;
    const res = await StorageService.checkInRegistration(token.trim(), 'Gate 1 Fast Check-in Desk');
    setCheckInResult({
      status: res.status,
      message: res.message,
      reg: res.registration
    });
    if (res.success) {
      onRefreshData();
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Event', 'Leader Name', 'Roll No', 'College', 'Phone', 'Email', 'Source', 'Payment Status', 'Fee', 'Checked In'];
    const rows = filteredRegs.map(r => [
      r.id,
      `"${r.eventTitle.replace(/"/g, '""')}"`,
      `"${r.leaderName.replace(/"/g, '""')}"`,
      r.leaderRoll,
      `"${r.leaderCollege.replace(/"/g, '""')}"`,
      r.leaderPhone,
      r.leaderEmail,
      r.source,
      r.paymentStatus,
      r.fee,
      r.checkedIn ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Festronix_Registrations_${selectedEventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '40px auto 80px', padding: '0 20px' }}>
      {/* Coordinator Portal Header */}
      <div
        className="cyber-card"
        style={{
          padding: '24px 30px',
          marginBottom: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px',
          borderLeft: '4px solid #FFD700'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFD700', fontSize: '0.8rem', fontWeight: 700 }}>
            <Shield size={16} />
            <span>AUTHORISED EVENT OPERATIONS DESK</span>
          </div>
          <h2 className="font-title" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F5F0E8', marginTop: '4px' }}>
            COORDINATOR CONSOLE
          </h2>
          <div style={{ fontSize: '0.85rem', color: '#9B8E7B' }}>
            Logged in as: <strong>Chief Event Coordinator</strong> (Full Management Scope)
          </div>
        </div>

        {/* Event scope selector */}
        <div style={{ minWidth: '280px' }}>
          <label style={{ fontSize: '0.72rem', color: '#9B8E7B', display: 'block', marginBottom: '4px' }}>
            FILTER BY ASSIGNED EVENT:
          </label>
          <select
            className="cyber-select"
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
          >
            <option value="all">All Events ({events.length})</option>
            {events.map(evt => (
              <option key={evt.id} value={evt.id}>
                [{evt.departmentCode}] {evt.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('reviews')}
          className={activeTab === 'reviews' ? 'btn-cyber-primary' : 'btn-cyber-secondary'}
          style={{ position: 'relative' }}
        >
          <span>Payment Review Queue</span>
          {pendingReviews.length > 0 && (
            <span
              style={{
                backgroundColor: '#ef4444',
                color: '#F5F0E8',
                fontSize: '0.7rem',
                padding: '2px 7px',
                borderRadius: '9999px',
                marginLeft: '6px',
                fontWeight: 800
              }}
            >
              {pendingReviews.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('spot')}
          className={activeTab === 'spot' ? 'btn-cyber-primary' : 'btn-cyber-secondary'}
        >
          <UserPlus size={16} />
          <span>Spot Registration Desk</span>
        </button>

        <button
          onClick={() => setActiveTab('checkin')}
          className={activeTab === 'checkin' ? 'btn-cyber-primary' : 'btn-cyber-secondary'}
        >
          <QrCode size={16} />
          <span>QR Scanner & Gate Check-in</span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={activeTab === 'list' ? 'btn-cyber-primary' : 'btn-cyber-secondary'}
        >
          <Users size={16} />
          <span>Attendee Directory ({filteredRegs.length})</span>
        </button>
      </div>

      {/* TAB 1: Payment Review Queue */}
      {activeTab === 'reviews' && (
        <div className="cyber-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 className="font-title" style={{ fontSize: '1.25rem', color: '#FFD700' }}>
                PAYMENT EVIDENCE VERIFICATION QUEUE
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#9B8E7B' }}>
                Verify UPI screenshots and match UTR transaction numbers submitted by participants.
              </p>
            </div>
            <span className="badge-status badge-pending">
              {pendingReviews.length} Pending Actions
            </span>
          </div>

          {pendingReviews.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9B8E7B' }}>
              <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
              <div style={{ color: '#F5F0E8', fontWeight: 600 }}>All Payment Proofs Cleared!</div>
              <p style={{ fontSize: '0.85rem' }}>No pending proofs for the selected event filter.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 215, 0, 0.3)', color: '#FFD700' }}>
                    <th style={{ padding: '12px' }}>Reg ID</th>
                    <th style={{ padding: '12px' }}>Participant / College</th>
                    <th style={{ padding: '12px' }}>Event</th>
                    <th style={{ padding: '12px' }}>Fee</th>
                    <th style={{ padding: '12px' }}>Transaction ID (UTR)</th>
                    <th style={{ padding: '12px' }}>Screenshot Proof</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReviews.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '14px 12px', fontFamily: 'monospace', color: '#A78BFA' }}>{r.id}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#F5F0E8' }}>{r.leaderName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9B8E7B' }}>{r.leaderCollege} • {r.leaderRoll}</div>
                      </td>
                      <td style={{ padding: '14px 12px', color: '#D4C5A9' }}>{r.eventTitle}</td>
                      <td style={{ padding: '14px 12px', fontWeight: 700, color: '#fbbf24' }}>₹{r.fee}</td>
                      <td style={{ padding: '14px 12px', fontFamily: 'monospace', color: '#A78BFA' }}>
                        {r.transactionId || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        {r.paymentScreenshotUrl ? (
                          <button
                            onClick={() => setPreviewScreenshotUrl(r.paymentScreenshotUrl!)}
                            className="btn-cyber-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            <Eye size={13} />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span style={{ color: '#6B5E4E', fontSize: '0.75rem' }}>No image</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleVerify(r.id)}
                            style={{
                              padding: '6px 14px',
                              background: '#10b981',
                              color: '#F5F0E8',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.78rem'
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => setRejectionModalRegId(r.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid #ef4444',
                              color: '#f87171',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.78rem'
                            }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: On-Venue Spot Registration (FR-SPOT-01 to FR-SPOT-07) */}
      {activeTab === 'spot' && (
        <div className="cyber-card" style={{ padding: '28px', maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#FFD700', fontWeight: 800 }}>CAMPUS ON-VENUE DESK • FR-SPOT-01</span>
              <h3 className="font-title" style={{ fontSize: '1.4rem', color: '#F5F0E8', marginTop: '2px' }}>
                SPOT REGISTRATION & PASS ISSUANCE
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#9B8E7B' }}>
                Issue instant walk-in passes for Individual, Duo, and Team formats with official staff attribution.
              </p>
            </div>
            {spotCreatedReg && (
              <button
                onClick={() => {
                  setSpotCreatedReg(null);
                  setSpotName('');
                  setSpotPhone('');
                  setSpotRoll('');
                  setSpotTeamName('');
                  setSpotTeammates([]);
                  setSpotSuccessMsg('');
                  setSpotErrorMsg('');
                }}
                className="btn-cyber-primary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <Plus size={14} />
                <span>New Spot Entry</span>
              </button>
            )}
          </div>

          {spotSuccessMsg && (
            <div
              style={{
                padding: '14px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                borderRadius: '8px',
                color: '#34d399',
                fontSize: '0.88rem',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={18} />
              <span>{spotSuccessMsg}</span>
            </div>
          )}

          {spotErrorMsg && (
            <div
              style={{
                padding: '14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.88rem',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertTriangle size={18} />
              <span>{spotErrorMsg}</span>
            </div>
          )}

          {/* GENERATED PASS PREVIEW (FR-SPOT-07) */}
          {spotCreatedReg ? (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(20, 31, 62, 0.95) 0%, rgba(13, 20, 42, 0.98) 100%)',
                border: '2px solid #FFD700',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.25)',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 215, 0, 0.2)', border: '1px solid #FFD700', padding: '4px 12px', borderRadius: '20px', color: '#FFD700', fontSize: '0.75rem', fontWeight: 800, marginBottom: '14px' }}>
                <ShieldCheck size={14} />
                <span>OFFICIAL SPOT PASS ISSUED</span>
              </div>

              <h3 className="font-title" style={{ fontSize: '1.5rem', color: '#FFFFFF', margin: '0 0 6px' }}>
                {spotCreatedReg.eventTitle}
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#BACEBB', marginBottom: '16px' }}>
                Format: <strong style={{ textTransform: 'uppercase', color: '#FFD700' }}>{spotCreatedReg.format}</strong>
                {spotCreatedReg.teamName && <> • Squad: <strong style={{ color: '#FFFFFF' }}>{spotCreatedReg.teamName}</strong></>}
              </div>

              {/* QR Code & Token Box */}
              <div
                style={{
                  display: 'inline-block',
                  background: '#FFFFFF',
                  padding: '14px',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  marginBottom: '14px'
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(spotCreatedReg.qrToken)}`}
                  alt="Spot Pass QR Code"
                  style={{ width: '170px', height: '170px', display: 'block' }}
                />
              </div>

              <div style={{ fontFamily: 'monospace', fontSize: '0.92rem', color: '#FFD700', fontWeight: 800, letterSpacing: '1px', marginBottom: '8px' }}>
                {spotCreatedReg.qrToken}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9B8E7B', marginBottom: '16px' }}>
                Pass ID: {spotCreatedReg.id} • Issued by: <strong>{spotCreatedReg.spotRegisteredBy || spotCreatedReg.verifiedBy}</strong>
              </div>

              {/* Attendees Roster */}
              <div
                style={{
                  background: 'rgba(16, 26, 53, 0.8)',
                  border: '1px solid rgba(220, 227, 229, 0.15)',
                  borderRadius: '10px',
                  padding: '14px',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  marginBottom: '20px'
                }}
              >
                <div style={{ color: '#DCE3E5', marginBottom: '6px' }}>
                  <strong>Lead Attendee:</strong> {spotCreatedReg.leaderName} ({spotCreatedReg.leaderRoll}) — {spotCreatedReg.leaderPhone}
                </div>
                {spotCreatedReg.teammates && spotCreatedReg.teammates.length > 0 && (
                  <div>
                    <strong style={{ color: '#BACEBB' }}>Teammates ({spotCreatedReg.teammates.length}):</strong>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#A8B3C2' }}>
                      {spotCreatedReg.teammates.map((tm, idx) => (
                        <li key={idx}>
                          {tm.name} ({tm.rollNumber}) — {tm.phone}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={{ marginTop: '8px', borderTop: '1px solid rgba(220, 227, 229, 0.1)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', color: '#9B8E7B', fontSize: '0.75rem' }}>
                  <span>Source: <strong style={{ color: '#ec4899' }}>SPOT</strong></span>
                  <span>Payment: <strong style={{ color: spotCreatedReg.paymentStatus === 'verified' ? '#34d399' : '#fbbf24' }}>{spotCreatedReg.paymentStatus.toUpperCase()}</strong></span>
                  <span>Fee: <strong>{spotCreatedReg.fee === 0 ? 'FREE' : `₹${spotCreatedReg.fee}`}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleScanOrSubmitCheckIn(spotCreatedReg.qrToken)}
                  className="btn-cyber-primary"
                  style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                >
                  <ShieldCheck size={16} />
                  <span>Check In Attendee Now</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="btn-cyber-secondary"
                  style={{ padding: '10px 16px', fontSize: '0.85rem' }}
                >
                  <Printer size={16} />
                  <span>Print Pass</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(spotCreatedReg.qrToken);
                    alert('Token copied to clipboard: ' + spotCreatedReg.qrToken);
                  }}
                  className="btn-cyber-secondary"
                  style={{ padding: '10px 16px', fontSize: '0.85rem' }}
                >
                  <Copy size={16} />
                  <span>Copy Token</span>
                </button>
              </div>
            </div>
          ) : (
            /* SPOT REGISTRATION FORM (FR-SPOT-01 to FR-SPOT-06) */
            <form onSubmit={handleSpotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#9B8E7B', display: 'block', marginBottom: '6px' }}>
                  SELECT EVENT *
                </label>
                <select
                  className="cyber-select"
                  value={spotEventId}
                  onChange={e => handleSpotEventSelect(e.target.value)}
                >
                  {events.map(evt => (
                    <option key={evt.id} value={evt.id}>
                      [{evt.departmentCode}] {evt.title} — {evt.format.toUpperCase()} — Fee: {evt.fee === 0 ? 'FREE' : `₹${evt.fee}`} ({evt.registeredCount}/{evt.capacity} registered)
                    </option>
                  ))}
                </select>

                {currentSpotEvent && (
                  <div style={{ marginTop: '6px', display: 'flex', gap: '8px', fontSize: '0.75rem', alignItems: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 215, 0, 0.15)', color: '#FFD700', fontWeight: 700 }}>
                      Format: {currentSpotEvent.format.toUpperCase()}
                      {currentSpotEvent.format !== 'individual' && ` (${currentSpotEvent.minTeamSize}-${currentSpotEvent.maxTeamSize} members)`}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: currentSpotEvent.registeredCount >= currentSpotEvent.capacity ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)', color: currentSpotEvent.registeredCount >= currentSpotEvent.capacity ? '#f87171' : '#34d399', fontWeight: 600 }}>
                      Capacity: {currentSpotEvent.registeredCount}/{currentSpotEvent.capacity} Slots
                    </span>
                    <span style={{ color: '#9B8E7B' }}>
                      Status: <strong>{currentSpotEvent.status.toUpperCase()}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Staff attribution field (FR-SPOT-05) */}
              <div style={{ background: 'rgba(18, 14, 30, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                <label style={{ fontSize: '0.75rem', color: '#FFD700', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  STAFF / DESK IN-CHARGE ATTRIBUTION (FR-SPOT-05) *
                </label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="Officer or Desk Coordinator Name"
                  value={spotStaffName}
                  onChange={e => setSpotStaffName(e.target.value)}
                  required
                />
              </div>

              {/* Team Name for Duo / Team */}
              {currentSpotEvent && currentSpotEvent.format !== 'individual' && (
                <div style={{ background: 'rgba(40, 59, 120, 0.25)', border: '1px solid rgba(120, 149, 147, 0.35)', borderRadius: '10px', padding: '14px' }}>
                  <label style={{ fontSize: '0.78rem', color: '#BACEBB', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                    SQUAD / TEAM NAME *
                  </label>
                  <input
                    type="text"
                    className="cyber-input"
                    placeholder="e.g. CyberKnights / ByteForce"
                    value={spotTeamName}
                    onChange={e => setSpotTeamName(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Leader / Primary participant info */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: '#FFD700', fontWeight: 700 }}>
                  {currentSpotEvent?.format !== 'individual' ? 'TEAM LEADER INFORMATION *' : 'PARTICIPANT INFORMATION *'}
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#9B8E7B', display: 'block', marginBottom: '4px' }}>
                      FULL NAME *
                    </label>
                    <input
                      type="text"
                      className="cyber-input"
                      placeholder="Participant Name"
                      value={spotName}
                      onChange={e => setSpotName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#9B8E7B', display: 'block', marginBottom: '4px' }}>
                      COLLEGE ROLL NUMBER / ID *
                    </label>
                    <input
                      type="text"
                      className="cyber-input"
                      placeholder="e.g. 23VCECS045"
                      value={spotRoll}
                      onChange={e => setSpotRoll(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#9B8E7B', display: 'block', marginBottom: '4px' }}>
                      CONTACT PHONE *
                    </label>
                    <input
                      type="tel"
                      className="cyber-input"
                      placeholder="+91 Phone"
                      value={spotPhone}
                      onChange={e => setSpotPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#9B8E7B', display: 'block', marginBottom: '4px' }}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      className="cyber-input"
                      placeholder="student@college.edu (optional)"
                      value={spotEmail}
                      onChange={e => setSpotEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#9B8E7B', display: 'block', marginBottom: '4px' }}>
                    COLLEGE / CAMPUS
                  </label>
                  <input
                    type="text"
                    className="cyber-input"
                    placeholder="College Name"
                    value={spotCollege}
                    onChange={e => setSpotCollege(e.target.value)}
                  />
                </div>
              </div>

              {/* Teammates Section (FR-SPOT-02, FR-SPOT-03) */}
              {currentSpotEvent && currentSpotEvent.format !== 'individual' && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#FFD700', fontWeight: 700 }}>
                        TEAMMATES ROSTER ({spotTeammates.length} of max {(currentSpotEvent.maxTeamSize || 4) - 1})
                      </span>
                      <p style={{ fontSize: '0.72rem', color: '#9B8E7B', margin: '2px 0 0' }}>
                        FR-SPOT-03: Captures complete participant information identical to online registration.
                      </p>
                    </div>

                    {currentSpotEvent.format === 'team' && spotTeammates.length < (currentSpotEvent.maxTeamSize - 1) && (
                      <button
                        type="button"
                        onClick={handleAddSpotTeammate}
                        className="btn-cyber-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        <Plus size={13} />
                        <span>Add Teammate</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {spotTeammates.map((tm, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(20, 31, 62, 0.6)',
                          border: '1px solid rgba(220, 227, 229, 0.15)',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#BACEBB' }}>
                            Teammate #{idx + 1}
                          </span>
                          {currentSpotEvent.format === 'team' && spotTeammates.length > (currentSpotEvent.minTeamSize - 1) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSpotTeammate(idx)}
                              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <input
                            type="text"
                            className="cyber-input"
                            placeholder="Teammate Full Name *"
                            value={tm.name}
                            onChange={e => handleSpotTeammateChange(idx, 'name', e.target.value)}
                            required
                          />
                          <input
                            type="text"
                            className="cyber-input"
                            placeholder="Teammate Roll Number *"
                            value={tm.rollNumber}
                            onChange={e => handleSpotTeammateChange(idx, 'rollNumber', e.target.value)}
                            required
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                          <input
                            type="tel"
                            className="cyber-input"
                            placeholder="Contact Phone *"
                            value={tm.phone}
                            onChange={e => handleSpotTeammateChange(idx, 'phone', e.target.value)}
                            required
                          />
                          <input
                            type="email"
                            className="cyber-input"
                            placeholder="Email (optional)"
                            value={tm.email}
                            onChange={e => handleSpotTeammateChange(idx, 'email', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Status Config (FR-SPOT-06) */}
              {currentSpotEvent && currentSpotEvent.fee > 0 ? (
                <div
                  style={{
                    padding: '14px',
                    background: 'rgba(18, 14, 30, 0.6)',
                    border: '1px solid rgba(255, 215, 0, 0.25)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <input
                    type="checkbox"
                    id="spot-fee-check"
                    checked={spotFeePaid}
                    onChange={e => setSpotFeePaid(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="spot-fee-check" style={{ fontSize: '0.85rem', color: '#F5F0E8', cursor: 'pointer' }}>
                    Registration Fee of <strong>₹{currentSpotEvent.fee}</strong> collected on-desk (Cash / Desk UPI QR). Mark payment as <strong>Verified</strong> immediately.
                  </label>
                </div>
              ) : (
                <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: '8px', color: '#34d399', fontSize: '0.82rem' }}>
                  ✓ Free Event: No payment required (FR-PAY-01). Pass will be issued and verified instantly.
                </div>
              )}

              <button
                type="submit"
                className="btn-cyber-primary"
                style={{ padding: '14px', marginTop: '10px' }}
                disabled={currentSpotEvent && currentSpotEvent.registeredCount >= currentSpotEvent.capacity}
              >
                <span>Generate Official Spot QR Pass (FR-SPOT-07)</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: QR Scanner & Check-in Desk */}
      {activeTab === 'checkin' && (
        <div className="cyber-card" style={{ padding: '28px', maxWidth: '750px', margin: '0 auto' }}>
          <div style={{ marginBottom: '22px' }}>
            <span style={{ fontSize: '0.75rem', color: '#FFD700', fontWeight: 800 }}>VENUE ACCESS CONTROL</span>
            <h3 className="font-title" style={{ fontSize: '1.4rem', color: '#F5F0E8', marginTop: '2px' }}>
              QR PASS SCANNER & GATE CHECK-IN
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#9B8E7B' }}>
              Scan attendee QR codes or enter Pass / Token ID to grant entry and prevent duplicate entries.
            </p>
          </div>

          {/* Quick scanner / input bar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <input
              type="text"
              className="cyber-input"
              placeholder="Scan or type Token (e.g. FEST26-TOKEN-ARJ1082) or ID..."
              value={checkInInput}
              onChange={e => setCheckInInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScanOrSubmitCheckIn(checkInInput)}
            />
            <button
              onClick={() => handleScanOrSubmitCheckIn(checkInInput)}
              className="btn-cyber-primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              <QrCode size={16} />
              <span>Verify Pass</span>
            </button>
          </div>

          {/* Sample quick tokens to test */}
          <div style={{ marginBottom: '20px', fontSize: '0.75rem', color: '#9B8E7B' }}>
            Quick Demo Tokens to test:
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              {registrations.slice(0, 3).map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    setCheckInInput(r.qrToken);
                    handleScanOrSubmitCheckIn(r.qrToken);
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    color: '#FFD700',
                    cursor: 'pointer',
                    fontSize: '0.72rem'
                  }}
                >
                  {r.leaderName}: {r.qrToken}
                </button>
              ))}
            </div>
          </div>

          {/* Check-in result status alert */}
          {checkInResult.status && (
            <div
              style={{
                padding: '24px',
                borderRadius: '12px',
                border: `2px solid ${
                  checkInResult.status === 'VALID'
                    ? '#10b981'
                    : checkInResult.status === 'ALREADY_CHECKED_IN'
                    ? '#f59e0b'
                    : '#ef4444'
                }`,
                background:
                  checkInResult.status === 'VALID'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : checkInResult.status === 'ALREADY_CHECKED_IN'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                textAlign: 'center'
              }}
            >
              {checkInResult.status === 'VALID' ? (
                <>
                  <ShieldCheck size={48} color="#10b981" style={{ margin: '0 auto 10px' }} />
                  <h4 className="font-title" style={{ color: '#34d399', fontSize: '1.4rem' }}>
                    ENTRY GRANTED - VALID PASS
                  </h4>
                  <p style={{ color: '#F5F0E8', fontSize: '1rem', marginTop: '6px' }}>
                    {checkInResult.message}
                  </p>
                </>
              ) : checkInResult.status === 'ALREADY_CHECKED_IN' ? (
                <>
                  <AlertTriangle size={48} color="#f59e0b" style={{ margin: '0 auto 10px' }} />
                  <h4 className="font-title" style={{ color: '#fbbf24', fontSize: '1.4rem' }}>
                    DUPLICATE PASS DETECTED!
                  </h4>
                  <p style={{ color: '#F5F0E8', fontSize: '0.95rem', marginTop: '6px' }}>
                    {checkInResult.message}
                  </p>
                </>
              ) : (
                <>
                  <XCircle size={48} color="#ef4444" style={{ margin: '0 auto 10px' }} />
                  <h4 className="font-title" style={{ color: '#f87171', fontSize: '1.4rem' }}>
                    ACCESS DENIED
                  </h4>
                  <p style={{ color: '#F5F0E8', fontSize: '0.95rem', marginTop: '6px' }}>
                    {checkInResult.message}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Full Attendee Directory & CSV Export */}
      {activeTab === 'list' && (
        <div className="cyber-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 className="font-title" style={{ fontSize: '1.25rem', color: '#FFD700' }}>
                ATTENDEE REGISTRY ({filteredRegs.length})
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#9B8E7B' }}>
                Complete source of truth for online and spot registrations per PRD specs.
              </p>
            </div>

            <button onClick={exportCSV} className="btn-cyber-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <FileSpreadsheet size={16} />
              <span>Export CSV</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 215, 0, 0.3)', color: '#FFD700' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th style={{ padding: '10px' }}>Leader / Roll</th>
                  <th style={{ padding: '10px' }}>Event</th>
                  <th style={{ padding: '10px' }}>Format</th>
                  <th style={{ padding: '10px' }}>Source</th>
                  <th style={{ padding: '10px' }}>Payment</th>
                  <th style={{ padding: '10px' }}>Check-in</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegs.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#A78BFA' }}>{r.id}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: 600, color: '#F5F0E8' }}>{r.leaderName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#9B8E7B' }}>{r.leaderRoll} • {r.leaderPhone}</div>
                    </td>
                    <td style={{ padding: '12px 10px', color: '#D4C5A9' }}>{r.eventTitle}</td>
                    <td style={{ padding: '12px 10px', textTransform: 'capitalize', color: '#9B8E7B' }}>{r.format}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: r.source === 'spot' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 215, 0, 0.15)',
                          color: r.source === 'spot' ? '#f472b6' : '#A78BFA',
                          fontWeight: 700
                        }}
                      >
                        {r.source.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: r.paymentStatus === 'verified' ? '#34d399' : r.paymentStatus === 'rejected' ? '#f87171' : '#fbbf24',
                          fontWeight: 700
                        }}
                      >
                        {r.paymentStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      {r.checkedIn ? (
                        <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
                          ✓ In ({r.checkedInAt})
                        </span>
                      ) : (
                        <span style={{ color: '#6B5E4E', fontSize: '0.75rem' }}>No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewScreenshotUrl && (
        <div className="modal-backdrop" onClick={() => setPreviewScreenshotUrl(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '24px' }}>
            <h4 className="font-title" style={{ color: '#FFD700', marginBottom: '14px' }}>
              PAYMENT RECEIPT EVIDENCE
            </h4>
            <img
              src={previewScreenshotUrl}
              alt="Proof"
              style={{ width: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '8px' }}
            />
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button onClick={() => setPreviewScreenshotUrl(null)} className="btn-cyber-primary">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModalRegId && (
        <div className="modal-backdrop" onClick={() => setRejectionModalRegId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', padding: '24px' }}>
            <h4 className="font-title" style={{ color: '#f87171', marginBottom: '8px' }}>
              REJECT PAYMENT PROOF
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#D4C5A9', marginBottom: '16px' }}>
              Provide a clear audit reason for rejection per PRD Section 6.5.
            </p>
            <textarea
              className="cyber-input"
              rows={3}
              value={rejectionReasonText}
              onChange={e => setRejectionReasonText(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setRejectionModalRegId(null)} className="btn-cyber-secondary">
                Cancel
              </button>
              <button onClick={handleRejectConfirm} className="btn-cyber-danger">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
