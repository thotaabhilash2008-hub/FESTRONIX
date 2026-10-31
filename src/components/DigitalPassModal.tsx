import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, Download, Printer, CheckCircle2, Clock, AlertTriangle, ShieldCheck, User, Users, Search, Sparkles, Ticket, ShoppingBag, Lock } from 'lucide-react';
import { Registration, Team, User as UserType } from '../types/festronix';
import { INITIAL_REGISTRATIONS } from '../data/mockData';
import { StorageService } from '../services/storageService';

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
  const normalizeTeamCode = (code?: string) => (code || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const visibleRegistrations = (source: Registration[]) => {
    if (!currentUser) return source;
    return source.filter(
      r =>
        r.userId === currentUser.id ||
        r.buyerRoll === currentUser.rollNumber ||
        r.leaderRoll.toLowerCase() === currentUser.rollNumber.toLowerCase() ||
        r.leaderEmail.toLowerCase() === currentUser.email.toLowerCase() ||
        r.teammates?.some(tm =>
          (tm.rollNumber && tm.rollNumber.toLowerCase() === currentUser.rollNumber.toLowerCase()) ||
          (tm.email && tm.email.toLowerCase() === currentUser.email.toLowerCase())
        )
    );
  };

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
  const userFiltered = visibleRegistrations(allRegs);

  const [activeList, setActiveList] = useState<Registration[]>(
    userFiltered.length > 0 ? userFiltered : allRegs
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedRegistrationId = useRef<string | null>(null);
  const [teamDashboards, setTeamDashboards] = useState<Record<string, Team>>({});
  const [isRefreshingTeams, setIsRefreshingTeams] = useState(false);
  const [lastTeamSync, setLastTeamSync] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  useEffect(() => {
    const selectedId = selectedRegistrationId.current;
    const next = visibleRegistrations(initialRegistrations.length > 0 ? initialRegistrations : INITIAL_REGISTRATIONS);
    setActiveList(next);
    setSelectedIndex(previousIndex => {
      if (selectedId) {
        const nextIndex = next.findIndex(registration => registration.id === selectedId);
        if (nextIndex >= 0) return nextIndex;
      }
      return Math.min(previousIndex, Math.max(next.length - 1, 0));
    });
  }, [initialRegistrations, currentUser]);

  useEffect(() => {
    selectedRegistrationId.current = activeList[selectedIndex]?.id || null;
  }, [activeList, selectedIndex]);

  const teamCodesKey = Array.from(
    new Set(allRegs.map(registration => normalizeTeamCode(registration.teamCode)).filter(Boolean))
  ).sort().join('|');

  useEffect(() => {
    if (!teamCodesKey) return;
    const teamCodes = teamCodesKey.split('|').filter(Boolean);
    let cancelled = false;

    const refreshTeamDashboards = async () => {
      setIsRefreshingTeams(true);
      try {
        const results = await Promise.all(
          teamCodes.map(async code => {
            try {
              const registration = allRegs.find(item => normalizeTeamCode(item.teamCode) === code);
              const team = await StorageService.fetchTeamDashboard(registration?.teamCode || code, registration?.eventId);
              return team ? [code, team] as const : null;
            } catch (error) {
              console.warn('Team dashboard refresh warning:', error);
              return null;
            }
          })
        );
        if (cancelled) return;
        const nextDashboards: Record<string, Team> = {};
        results.forEach(result => {
          if (result) nextDashboards[result[0]] = result[1];
        });
        setTeamDashboards(previous => ({ ...previous, ...nextDashboards }));
        setLastTeamSync(new Date());
      } finally {
        if (!cancelled) setIsRefreshingTeams(false);
      }
    };

    refreshTeamDashboards();
    const intervalId = window.setInterval(refreshTeamDashboards, 5000);
    const handleLiveUpdate = () => refreshTeamDashboards();
    window.addEventListener('festronix:teams-updated', handleLiveUpdate);
    window.addEventListener('festronix:regs-updated', handleLiveUpdate);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('festronix:teams-updated', handleLiveUpdate);
      window.removeEventListener('festronix:regs-updated', handleLiveUpdate);
    };
  }, [teamCodesKey]);

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
        (r.teamName && r.teamName.toLowerCase().includes(q)) ||
        (r.teamCode && r.teamCode.toLowerCase().includes(q)) ||
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
    const next = visibleRegistrations(initialRegistrations.length > 0 ? initialRegistrations : INITIAL_REGISTRATIONS);
    setActiveList(next.length > 0 ? next : allRegs);
    setSelectedIndex(0);
    setSearchQuery('');
    setSearchFeedback(null);
  };

  const reg = activeList[selectedIndex] || activeList[0];
  const teamSummary = reg?.teamCode ? teamDashboards[normalizeTeamCode(reg.teamCode)] : undefined;
  const roster = teamSummary?.members?.length ? teamSummary.members : (reg?.teammates || []);
  const teamMemberCount = teamSummary?.totalMemberCount || (teamSummary ? 1 + (teamSummary.memberCount || roster.length) : undefined);
  const teamPaymentStatus = teamSummary?.paymentStatus || reg?.paymentStatus;
  const effectivePaymentStatus = teamPaymentStatus || reg?.paymentStatus;
  const isTeamLeader = Boolean(
    teamSummary?.isCurrentUserLeader ||
    (currentUser && teamSummary?.leaderRoll && teamSummary.leaderRoll.toLowerCase() === currentUser.rollNumber.toLowerCase())
  );
  const selectedPassBelongsToCurrentLeader = Boolean(
    currentUser && reg?.leaderRoll && reg.leaderRoll.toLowerCase() === currentUser.rollNumber.toLowerCase()
  );
  const selectedPassIsLeaderRegistration = Boolean(
    reg?.leaderRoll && teamSummary?.leaderRoll && reg.leaderRoll.toLowerCase() === teamSummary.leaderRoll.toLowerCase()
  );
  const leaderQrGenerated = Boolean(
    teamSummary?.leaderQrGenerated || ((selectedPassBelongsToCurrentLeader || selectedPassIsLeaderRegistration) && reg?.qrToken)
  );
  const teamRegistrationStatus = teamSummary?.leaderRegistrationStatus === 'membership_pending' && leaderQrGenerated
    ? (reg?.paymentStatus || teamSummary?.paymentStatus || 'membership_pending')
    : (teamSummary?.leaderRegistrationStatus || teamPaymentStatus || 'membership_pending');

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
      case 'payment_required':
        return (
          <span
            className="badge-status"
            style={{
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid #F59E0B',
              color: '#FBBF24',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            <Clock size={13} />
            <span>Awaiting Leader Payment</span>
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
    <div className="modal-backdrop" data-lenis-prevent onClick={onClose}>
      <div
        className="modal-content"
        data-lenis-prevent-wheel
        data-lenis-prevent-touch
        onClick={e => e.stopPropagation()}
        style={{
          padding: '28px',
          maxWidth: '700px',
          width: '95%',
          maxHeight: 'calc(100dvh - 40px)',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
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

              <div>{getStatusBadge(effectivePaymentStatus || reg.paymentStatus)}</div>
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
                {/* Squad Banner (For Team Events) */}
                {(reg.teamName || reg.teamCode || teamSummary) && (
                  <div
                    style={{
                      marginBottom: '14px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(40, 59, 120, 0.45) 0%, rgba(62, 66, 100, 0.45) 100%)',
                      border: '1px solid rgba(120, 149, 147, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.66rem', color: '#BACEBB', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                        OFFICIAL SQUAD
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
                        {teamSummary?.teamName || reg.teamName || 'Squad Team'}
                      </div>
                    </div>
                    {reg.teamCode && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.64rem', color: '#A8B3C2', fontWeight: 600 }}>TEAM CODE</div>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#BACEBB',
                            background: 'rgba(16, 26, 53, 0.85)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(120, 149, 147, 0.35)',
                            fontSize: '0.82rem'
                          }}
                        >
                          {teamSummary?.teamCode || reg.teamCode}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {teamSummary && (
                  <div
                    style={{
                      marginBottom: '14px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(16, 26, 53, 0.72)',
                      border: '1px solid rgba(120, 149, 147, 0.35)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.68rem', color: '#BACEBB', letterSpacing: '0.08em', fontWeight: 800 }}>
                        LIVE TEAM STATUS
                      </span>
                      <span style={{ fontSize: '0.68rem', color: isRefreshingTeams ? '#FBBF24' : '#34D399', fontWeight: 700 }}>
                        {isRefreshingTeams ? 'SYNCING...' : lastTeamSync ? `UPDATED ${lastTeamSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'LIVE'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.64rem', color: '#A8B3C2' }}>TEAM SIZE</div>
                        <div style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 800 }}>
                          {teamMemberCount || 1} / {teamSummary.maxTeamSize}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.64rem', color: '#A8B3C2' }}>PAYMENT</div>
                        <div style={{ fontSize: '0.78rem', color: teamPaymentStatus === 'payment_required' ? '#FBBF24' : '#34D399', fontWeight: 800 }}>
                          {teamPaymentStatus === 'payment_required' ? 'PENDING' : teamPaymentStatus === 'verification_pending' ? 'UNDER REVIEW' : teamPaymentStatus === 'not_applicable' ? 'FREE' : 'ACTIVE'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.64rem', color: '#A8B3C2' }}>TEAM LEADER</div>
                        <div style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {teamSummary.leaderName}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.64rem', color: '#A8B3C2' }}>LEADER QR</div>
                        <div style={{ fontSize: '0.78rem', color: leaderQrGenerated ? '#34D399' : '#FBBF24', fontWeight: 800 }}>
                          {leaderQrGenerated ? 'GENERATED' : 'PENDING'}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.68rem', color: teamRegistrationStatus === 'membership_pending' ? '#FBBF24' : '#A8B3C2' }}>
                      Registration state: <strong>{teamRegistrationStatus === 'membership_pending' ? 'MEMBERSHIP RESERVED' : teamRegistrationStatus.toUpperCase().replace('_', ' ')}</strong>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#A8B3C2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {teamSummary && !isTeamLeader ? 'Participant' : 'Participant / Team Lead'}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>{reg.leaderName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#A8B3C2' }}>{reg.leaderCollege}</div>
                  <div style={{ fontSize: '0.75rem', color: '#BACEBB', fontFamily: 'monospace' }}>Roll No: {reg.leaderRoll}</div>
                  {reg.deptSection && (
                    <div style={{ fontSize: '0.75rem', color: '#DCE3E5', marginTop: '2px' }}>
                      Dept & Section: <strong style={{ color: '#BACEBB', letterSpacing: '0.04em' }}>{reg.deptSection}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>Email: {reg.leaderEmail}</div>
                </div>

                {roster.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#A8B3C2', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Squad Teammates ({roster.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {roster.map((tm, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 10px',
                            background: 'rgba(120, 149, 147, 0.15)',
                            border: '1px solid rgba(120, 149, 147, 0.35)',
                            borderRadius: '4px',
                            color: '#BACEBB',
                            fontFamily: "'Space Grotesk', sans-serif",
                            display: 'inline-flex',
                            flexDirection: 'column'
                          }}
                        >
                          <span>{tm.name} ({tm.rollNumber})</span>
                          <span style={{ fontSize: '0.62rem', color: tm.qrGenerated ? '#34D399' : '#FBBF24', marginTop: '2px' }}>
                            {(tm.registrationStatus || 'membership_pending').toUpperCase().replace('_', ' ')} • {tm.qrGenerated ? 'QR GENERATED' : 'QR NOT GENERATED'}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification/Entry Status */}
                <div style={{ marginTop: '14px' }}>
                  {effectivePaymentStatus === 'payment_required' || !reg.qrToken ? (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid #F59E0B',
                        borderRadius: '6px',
                        color: '#FBBF24',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      <Lock size={14} />
                      <span>ENTRY QR LOCKED • AWAITING LEADER PAYMENT</span>
                    </div>
                  ) : reg.checkedIn ? (
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

              {/* QR Code token or Locked Placeholder */}
              {effectivePaymentStatus === 'payment_required' || !reg.qrToken ? (
                <div
                  style={{
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(16, 26, 53, 0.95) 100%)',
                    border: '1px dashed #F59E0B',
                    padding: '16px 12px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '160px'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#FBBF24',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}
                  >
                    <Lock size={22} />
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FBBF24', letterSpacing: '0.04em' }}>
                    QR PASS LOCKED
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#FEF3C7', marginTop: '4px', maxWidth: '170px', lineHeight: 1.3 }}>
                    Awaiting Team Leader's payment submission.
                  </div>
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'rgba(245, 158, 11, 0.25)',
                      color: '#FBBF24',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      fontFamily: 'monospace'
                    }}
                  >
                    SLOT SECURED
                  </div>
                </div>
              ) : (
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
              )}
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
                Date Issued: <span>{reg.registrationDate}</span> • Status:{' '}
                {effectivePaymentStatus === 'payment_required' ? (
                  <strong style={{ color: '#FBBF24' }}>PENDING LEADER PAYMENT</strong>
                ) : (
                  <strong style={{ color: '#10B981' }}>CONFIRMED</strong>
                )}
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
