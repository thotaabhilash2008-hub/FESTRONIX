import React, { useState, useEffect } from 'react';
import { X, QrCode, Download, Printer, CheckCircle2, Clock, AlertTriangle, ShieldCheck, User, Users, Search, Sparkles, Ticket, ShoppingBag } from 'lucide-react';
import { Registration, User as UserType } from '../types/festronix';
import { INITIAL_REGISTRATIONS } from '../data/mockData';

interface DigitalPassModalProps {
  registrations: Registration[];
  currentUser?: UserType | null;
  onClose: () => void;
  onBrowseEvents?: () => void;
  onOpenMultiPass?: () => void;
}

export const DigitalPassModal: React.FC<DigitalPassModalProps> = ({
  registrations: initialRegistrations,
  currentUser,
  onClose,
  onBrowseEvents,
  onOpenMultiPass
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

  const allRegs = initialRegistrations.length > 0 ? initialRegistrations : INITIAL_REGISTRATIONS;

  // Filter for current user if logged in, otherwise show all
  const userFiltered = currentUser
    ? allRegs.filter(
        r =>
          r.userId === currentUser.id ||
          r.buyerRoll === currentUser.rollNumber ||
          r.leaderRoll.toLowerCase() === currentUser.rollNumber.toLowerCase() ||
          r.leaderEmail.toLowerCase() === currentUser.email.toLowerCase()
      )
    : allRegs;

  const [activeList, setActiveList] = useState<Registration[]>(
    userFiltered.length > 0 ? userFiltered : allRegs
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
            <Ticket size={20} color="#BACEBB" />
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: '1.25rem',
                color: '#FFFFFF',
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
              background: 'rgba(220, 227, 229, 0.08)',
              border: '1px solid rgba(220, 227, 229, 0.15)',
              color: '#A8B3C2',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#A8B3C2')}
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
                color="#BACEBB"
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
                  background: 'rgba(16, 26, 53, 0.85)',
                  border: '1px solid rgba(220, 227, 229, 0.22)',
                  color: '#FFFFFF'
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
                  border: i === selectedIndex ? '1px solid #789593' : '1px solid rgba(220, 227, 229, 0.15)',
                  background: i === selectedIndex ? 'rgba(40, 59, 120, 0.4)' : 'rgba(16, 26, 53, 0.6)',
                  color: i === selectedIndex ? '#BACEBB' : '#A8B3C2',
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
              color: '#FFFFFF',
              position: 'relative',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(20, 31, 62, 0.98) 0%, rgba(16, 26, 53, 0.98) 100%)',
              border: '1px solid rgba(120, 149, 147, 0.35)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(40, 59, 120, 0.3)'
            }}
          >
            {/* Ticket Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#BACEBB', letterSpacing: '0.12em', fontWeight: 800, textTransform: 'uppercase' }}>
                  VARDHAMAN COLLEGE OF ENGINEERING • FESTRONIX 2026
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: '1.45rem',
                    fontWeight: 700,
                    marginTop: '2px',
                    color: '#FFFFFF',
                    letterSpacing: '0.02em'
                  }}
                >
                  {reg.eventTitle}
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#A8B3C2', marginTop: '2px' }}>
                  Registration ID: <span style={{ color: '#DCE3E5', fontFamily: 'monospace', fontWeight: 700 }}>{reg.id}</span>
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
                borderTop: '1px dashed rgba(120, 149, 147, 0.35)',
                borderBottom: '1px dashed rgba(120, 149, 147, 0.35)',
                alignItems: 'center'
              }}
            >
              {/* Participant info */}
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#A8B3C2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Participant / Team Lead
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>{reg.leaderName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#A8B3C2' }}>{reg.leaderCollege}</div>
                  <div style={{ fontSize: '0.75rem', color: '#BACEBB', fontFamily: 'monospace' }}>Roll No: {reg.leaderRoll}</div>
                  <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>Email: {reg.leaderEmail}</div>
                </div>

                {reg.teammates && reg.teammates.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#A8B3C2', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Squad Teammates ({reg.teammates.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {reg.teammates.map((tm, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 10px',
                            background: 'rgba(120, 149, 147, 0.15)',
                            border: '1px solid rgba(120, 149, 147, 0.35)',
                            borderRadius: '4px',
                            color: '#BACEBB',
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
                        background: 'rgba(40, 59, 120, 0.35)',
                        border: '1px solid rgba(120, 149, 147, 0.4)',
                        borderRadius: '6px',
                        color: '#BACEBB',
                        fontSize: '0.75rem'
                      }}
                    >
                      <Clock size={14} color="#BACEBB" />
                      <span>Authorized Entry Pass • Ready for QR Scan</span>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code token */}
              <div style={{ textAlign: 'center', background: '#FFFFFF', padding: '14px', borderRadius: '12px' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reg.qrToken || reg.id)}`}
                  alt="Entry QR Pass"
                  style={{ width: '120px', height: '120px', margin: '0 auto', display: 'block' }}
                />
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.68rem',
                    color: '#101A35',
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
                color: '#A8B3C2'
              }}
            >
              <div>
                Date Issued: <span>{reg.registrationDate}</span> • Status: <strong style={{ color: '#10B981' }}>CONFIRMED</strong>
              </div>
              {reg.transactionId && (
                <div>
                  UTR: <span style={{ color: '#BACEBB', fontFamily: 'monospace' }}>{reg.transactionId}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: '#A8B3C2' }}>
            <p>No pass selected.</p>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onOpenMultiPass && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMultiPass();
                }}
                style={{
                  background: 'rgba(40, 59, 120, 0.35)',
                  border: '1px solid rgba(120, 149, 147, 0.45)',
                  borderRadius: '6px',
                  color: '#BACEBB',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '7px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: "'Space Grotesk', sans-serif",
                  transition: 'all 0.2s'
                }}
              >
                <ShoppingBag size={14} />
                <span>+ Buy Multiple Passes</span>
              </button>
            )}

            {onBrowseEvents && (
              <button
                onClick={() => {
                  onClose();
                  onBrowseEvents();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#A8B3C2',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                Browse Events →
              </button>
            )}
          </div>

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
