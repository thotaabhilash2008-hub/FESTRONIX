import React, { useState, useEffect } from 'react';
import { X, QrCode, Download, Printer, CheckCircle2, Clock, AlertTriangle, ShieldCheck, User, Users, Search, Sparkles, Ticket } from 'lucide-react';
import { Registration } from '../types/festronix';
import { INITIAL_REGISTRATIONS } from '../data/mockData';

interface DigitalPassModalProps {
  registrations: Registration[];
  onClose: () => void;
  onBrowseEvents?: () => void;
}

export const DigitalPassModal: React.FC<DigitalPassModalProps> = ({
  registrations: initialRegistrations,
  onClose,
  onBrowseEvents
}) => {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  // Combine props registrations + mock registrations if needed for lookup
  const [activeList, setActiveList] = useState<Registration[]>(
    initialRegistrations.length > 0 ? initialRegistrations : INITIAL_REGISTRATIONS
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  const handleSearchPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const q = searchQuery.trim().toLowerCase();
    const found = activeList.filter(
      r =>
        r.id.toLowerCase().includes(q) ||
        r.leaderRoll.toLowerCase().includes(q) ||
        r.leaderEmail.toLowerCase().includes(q) ||
        r.leaderName.toLowerCase().includes(q) ||
        (r.teammates && r.teammates.some(tm => tm.rollNumber.toLowerCase().includes(q) || tm.name.toLowerCase().includes(q)))
    );

    if (found.length > 0) {
      setActiveList(found);
      setSelectedIndex(0);
      setSearchFeedback(`Found ${found.length} pass(es) matching "${searchQuery}"!`);
    } else {
      setSearchFeedback(`No pass found for "${searchQuery}". Please check your Roll No or Registration ID.`);
    }
  };

  const handleResetSearch = () => {
    setActiveList(initialRegistrations.length > 0 ? initialRegistrations : INITIAL_REGISTRATIONS);
    setSelectedIndex(0);
    setSearchQuery('');
    setSearchFeedback(null);
  };

  const reg = activeList[selectedIndex] || activeList[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
      case 'not_applicable':
        return (
          <span className="badge-status badge-verified">
            <CheckCircle2 size={13} />
            <span>Pass Validated / Active</span>
          </span>
        );
      case 'verification_pending':
        return (
          <span className="badge-status badge-pending">
            <Clock size={13} />
            <span>Verification Pending</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="badge-status badge-full">
            <AlertTriangle size={13} />
            <span>Payment Proof Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ padding: '28px', maxWidth: '700px', width: '95%' }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ticket size={20} color="#FF1A8C" />
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: '1.25rem',
                color: '#FF1A8C',
                letterSpacing: '0.04em',
                fontWeight: 700
              }}
            >
              OFFICIAL FESTRONIX REGISTRATION PASS
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F8FAFC')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Search Pass Finder */}
        <form onSubmit={handleSearchPass} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={15}
                color="#FF1A8C"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="cyber-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Find your pass: enter Roll No, Registration ID (FEST-...), or Email"
                style={{
                  paddingLeft: '36px',
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  background: 'rgba(255, 255, 255, 0.04)'
                }}
              />
            </div>
            <button
              type="submit"
              className="btn-cyber-primary"
              style={{ padding: '0 16px', height: '38px', fontSize: '0.8rem' }}
            >
              Lookup
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="btn-cyber-secondary"
                style={{ padding: '0 12px', height: '38px', fontSize: '0.78rem' }}
              >
                Reset
              </button>
            )}
          </div>
          {searchFeedback && (
            <div
              style={{
                fontSize: '0.74rem',
                color: searchFeedback.includes('Found') ? '#10B981' : '#F43F5E',
                marginTop: '6px',
                fontWeight: 600
              }}
            >
              {searchFeedback}
            </div>
          )}
        </form>

        {/* Multi-pass selector tabs */}
        {activeList.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              overflowX: 'auto',
              paddingBottom: '6px'
            }}
          >
            {activeList.map((r, i) => (
              <button
                key={r.id}
                onClick={() => setSelectedIndex(i)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: i === selectedIndex ? '1px solid #FF1A8C' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: i === selectedIndex ? 'rgba(255, 26, 140, 0.15)' : 'rgba(18, 14, 30, 0.6)',
                  color: i === selectedIndex ? '#FF4D94' : '#94a3b8',
                  fontSize: '0.78rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontWeight: i === selectedIndex ? 700 : 500,
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                Pass #{i + 1}: {r.eventTitle.slice(0, 18)}...
              </button>
            ))}
          </div>
        )}

        {/* Digital Ticket Container */}
        {reg ? (
          <div
            className="ticket-wrapper"
            style={{
              padding: '24px',
              color: '#F5F0E8',
              position: 'relative',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(20, 16, 34, 0.95) 0%, rgba(12, 10, 20, 0.98) 100%)',
              border: '1px solid rgba(255, 26, 140, 0.3)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(255, 26, 140, 0.15)'
            }}
          >
            {/* Ticket Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#FF4D94', letterSpacing: '0.12em', fontWeight: 800, textTransform: 'uppercase' }}>
                  VARDHAMAN COLLEGE OF ENGINEERING • FESTRONIX 2026
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: '1.45rem',
                    fontWeight: 700,
                    marginTop: '2px',
                    color: '#F8FAFC',
                    letterSpacing: '0.02em'
                  }}
                >
                  {reg.eventTitle}
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                  Registration ID: <span style={{ color: '#FF1A8C', fontFamily: 'monospace', fontWeight: 700 }}>{reg.id}</span>
                </div>
              </div>

              <div>{getStatusBadge(reg.paymentStatus)}</div>
            </div>

            {/* Ticket Body Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.3fr 1fr',
                gap: '20px',
                padding: '16px 0',
                borderTop: '1px dashed rgba(255, 26, 140, 0.3)',
                borderBottom: '1px dashed rgba(255, 26, 140, 0.3)',
                alignItems: 'center'
              }}
            >
              {/* Participant info */}
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Participant / Team Lead
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>{reg.leaderName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>{reg.leaderCollege}</div>
                  <div style={{ fontSize: '0.75rem', color: '#FF4D94', fontFamily: 'monospace' }}>Roll No: {reg.leaderRoll}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Email: {reg.leaderEmail}</div>
                </div>

                {reg.teammates && reg.teammates.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Squad Teammates ({reg.teammates.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {reg.teammates.map((tm, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '4px',
                            color: '#CBD5E1',
                            fontFamily: "'Space Grotesk', sans-serif"
                          }}
                        >
                          {tm.name} ({tm.rollNumber})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification/Entry Status */}
                <div style={{ marginTop: '14px' }}>
                  {reg.checkedIn ? (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10b981',
                        borderRadius: '6px',
                        color: '#34d399',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      <ShieldCheck size={14} />
                      <span>CHECKED IN AT {reg.checkedInAt}</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        color: '#94A3B8',
                        fontSize: '0.75rem'
                      }}
                    >
                      <Clock size={14} />
                      <span>Authorized Entry Pass • Ready for QR Scan</span>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code token */}
              <div style={{ textAlign: 'center', background: '#ffffff', padding: '14px', borderRadius: '12px' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reg.qrToken || reg.id)}`}
                  alt="Entry QR Pass"
                  style={{ width: '120px', height: '120px', margin: '0 auto', display: 'block' }}
                />
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.68rem',
                    color: '#0c0a14',
                    fontWeight: 700,
                    marginTop: '8px',
                    letterSpacing: '0.05em'
                  }}
                >
                  TOKEN: {reg.qrToken || reg.id}
                </div>
              </div>
            </div>

            {/* Ticket Footer details */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '14px',
                fontSize: '0.72rem',
                color: '#94A3B8'
              }}
            >
              <div>
                Date Issued: <span>{reg.registrationDate}</span> • Status: <strong style={{ color: '#10B981' }}>CONFIRMED</strong>
              </div>
              {reg.transactionId && (
                <div>
                  UTR: <span style={{ color: '#FF1A8C', fontFamily: 'monospace' }}>{reg.transactionId}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
            <p>No pass selected.</p>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          {onBrowseEvents && (
            <button
              onClick={() => {
                onClose();
                onBrowseEvents();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#FF4D94',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif"
              }}
            >
              + Register for another event
            </button>
          )}

          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
            <button onClick={handlePrint} className="btn-cyber-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              <Printer size={15} />
              <span>Print / Save Pass</span>
            </button>

            <button onClick={onClose} className="btn-cyber-primary" style={{ padding: '8px 20px', fontSize: '0.8rem' }}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
