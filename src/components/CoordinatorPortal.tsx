import React, { useState } from 'react';
import { 
  Users, CheckCircle2, XCircle, Search, QrCode, FileSpreadsheet, 
  Sparkles, Shield, UserPlus, Eye, AlertTriangle, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { FestEvent, Registration, PaymentStatus } from '../types/festronix';
import { StorageService } from '../services/storageService';

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

  // Spot registration form state
  const [spotEventId, setSpotEventId] = useState<string>(events[0]?.id || '');
  const [spotName, setSpotName] = useState('');
  const [spotEmail, setSpotEmail] = useState('');
  const [spotPhone, setSpotPhone] = useState('');
  const [spotCollege, setSpotCollege] = useState('Vardhaman College of Engineering');
  const [spotRoll, setSpotRoll] = useState('');
  const [spotFeePaid, setSpotFeePaid] = useState(true);
  const [spotSuccessMsg, setSpotSuccessMsg] = useState('');

  // Check-in desk state
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInResult, setCheckInResult] = useState<{
    status: 'VALID' | 'ALREADY_CHECKED_IN' | 'NOT_FOUND' | 'PAYMENT_PENDING' | null;
    message: string;
    reg?: Registration;
  }>({ status: null, message: '' });

  // Filter registrations by selected event
  const filteredRegs = registrations.filter(r => 
    selectedEventId === 'all' || r.eventId === selectedEventId
  );

  const pendingReviews = filteredRegs.filter(r => r.paymentStatus === 'verification_pending');

  const handleVerify = (regId: string) => {
    StorageService.updatePaymentStatus(regId, 'verified', 'VCE Coordinator Desk');
    onRefreshData();
  };

  const handleRejectConfirm = () => {
    if (rejectionModalRegId) {
      StorageService.updatePaymentStatus(
        rejectionModalRegId,
        'rejected',
        'VCE Coordinator Desk',
        rejectionReasonText
      );
      setRejectionModalRegId(null);
      onRefreshData();
    }
  };

  const handleSpotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const event = events.find(e => e.id === spotEventId);
    if (!event) return;

    if (!spotName || !spotPhone || !spotRoll) {
      alert('Please fill out Name, Phone, and Roll number');
      return;
    }

    const newReg = StorageService.addRegistration({
      eventId: event.id,
      eventTitle: event.title,
      leaderName: spotName,
      leaderEmail: spotEmail || `${spotRoll.toLowerCase()}@festronix.spot`,
      leaderPhone: spotPhone,
      leaderCollege: spotCollege,
      leaderRoll: spotRoll,
      teammates: [],
      format: 'individual',
      fee: event.fee,
      source: 'spot',
      registrationDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      paymentStatus: spotFeePaid ? 'verified' : 'verification_pending',
      transactionId: spotFeePaid ? 'CASH-SPOT-COLLECTED' : undefined,
      verifiedBy: 'Desk Coordinator (Spot)',
      verifiedAt: new Date().toLocaleTimeString()
    });

    setSpotSuccessMsg(`Spot Registration Created! Token: ${newReg.qrToken} (ID: ${newReg.id})`);
    setSpotName('');
    setSpotPhone('');
    setSpotRoll('');
    onRefreshData();
  };

  const handleScanOrSubmitCheckIn = (token: string) => {
    if (!token.trim()) return;
    const res = StorageService.checkInRegistration(token.trim(), 'Gate 1 Fast Check-in Desk');
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

      {/* TAB 2: On-Venue Spot Registration */}
      {activeTab === 'spot' && (
        <div className="cyber-card" style={{ padding: '28px', maxWidth: '750px', margin: '0 auto' }}>
          <div style={{ marginBottom: '22px' }}>
            <span style={{ fontSize: '0.75rem', color: '#FFD700', fontWeight: 800 }}>CAMPUS ON-VENUE DESK</span>
            <h3 className="font-title" style={{ fontSize: '1.4rem', color: '#F5F0E8', marginTop: '2px' }}>
              FAST SPOT REGISTRATION
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#9B8E7B' }}>
              Create instant walk-in registrations on fest days. Source will be stamped as "SPOT".
            </p>
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

          <form onSubmit={handleSpotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#9B8E7B', display: 'block', marginBottom: '6px' }}>
                SELECT EVENT *
              </label>
              <select
                className="cyber-select"
                value={spotEventId}
                onChange={e => setSpotEventId(e.target.value)}
              >
                {events.map(evt => (
                  <option key={evt.id} value={evt.id}>
                    [{evt.departmentCode}] {evt.title} — Fee: {evt.fee === 0 ? 'FREE' : `₹${evt.fee}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#9B8E7B', display: 'block', marginBottom: '6px' }}>
                  STUDENT NAME *
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
                <label style={{ fontSize: '0.78rem', color: '#9B8E7B', display: 'block', marginBottom: '6px' }}>
                  ROLL NUMBER / ID *
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#9B8E7B', display: 'block', marginBottom: '6px' }}>
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
                <label style={{ fontSize: '0.78rem', color: '#9B8E7B', display: 'block', marginBottom: '6px' }}>
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
                Payment collected in cash or on-desk QR by coordinator (Mark as Verified immediately)
              </label>
            </div>

            <button type="submit" className="btn-cyber-primary" style={{ padding: '14px', marginTop: '10px' }}>
              <span>Generate Spot QR Pass</span>
              <ArrowRight size={16} />
            </button>
          </form>
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
