import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, Mail, Download, Printer, CheckCircle2, Clock, AlertTriangle, ShieldCheck, User, Users, Search, Ticket, ShoppingBag, MessageCircle } from 'lucide-react';
import { FestEvent, Registration, Team, User as UserType } from '../types/festronix';
import { StorageService } from '../services/storageService';
import { EmailService } from '../services/emailService';

interface DigitalPassModalProps {
  registrations: Registration[];
  events: FestEvent[];
  currentUser?: UserType | null;
  activePassId?: string;
  pageMode?: boolean;
  onClose: () => void;
  onBrowseEvents?: () => void;
  onOpenMultiPass?: () => void;
}

const GUEST_PASS_CACHE_KEY = 'festronix_guest_pass_cache_v1';

const readGuestPassCache = (): Registration[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_PASS_CACHE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const mergePasses = (primary: Registration[], secondary: Registration[]): Registration[] => {
  const byId = new Map<string, Registration>();
  [...secondary, ...primary].forEach(registration => {
    if (registration?.id) byId.set(registration.id, registration);
  });
  return Array.from(byId.values());
};

export const DigitalPassModal: React.FC<DigitalPassModalProps> = ({
  registrations: initialRegistrations,
  events,
  currentUser,
  activePassId,
  pageMode = false,
  onClose,
  onBrowseEvents,
  onOpenMultiPass
}) => {
  const normalizeTeamCode = (code?: string) => (code || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const visibleRegistrations = (source: Registration[]) => {
    // 1. If currentUser is present
    if (currentUser) {
      const userMatches = source.filter(
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
      if (userMatches.length > 0) return userMatches;
    }

    // 2. Local device registered passes
    try {
      const myPassIds: string[] = JSON.parse(localStorage.getItem('festronix_my_registered_pass_ids') || '[]');
      const lastEmail = localStorage.getItem('festronix_last_registered_email')?.toLowerCase() || '';
      const lastRoll = localStorage.getItem('festronix_last_registered_roll')?.toLowerCase() || '';
      const lastPassId = localStorage.getItem('festronix_last_pass_id') || '';

      if (activePassId && !myPassIds.includes(activePassId)) {
        myPassIds.push(activePassId);
      }
      if (lastPassId && !myPassIds.includes(lastPassId)) {
        myPassIds.push(lastPassId);
      }

      if (myPassIds.length > 0 || lastEmail || lastRoll) {
        const localMatches = source.filter(
          r =>
            myPassIds.includes(r.id) ||
            (lastEmail && r.leaderEmail.toLowerCase() === lastEmail) ||
            (lastRoll && r.leaderRoll.toLowerCase() === lastRoll)
        );
        if (localMatches.length > 0) return localMatches;
      }
    } catch {}

    return source;
  };

  useEffect(() => {
    if (pageMode) return;
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [pageMode]);

  const [liveRegistrations, setLiveRegistrations] = useState<Registration[]>(() =>
    activePassId
      ? mergePasses(initialRegistrations, readGuestPassCache()).filter(r => r.id === activePassId)
      : []
  );
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const allRegs = liveRegistrations;

  const [activeList, setActiveList] = useState<Registration[]>(() => {
    if (activePassId) {
      const merged = mergePasses(initialRegistrations, readGuestPassCache());
      const match = merged.filter(r => r.id === activePassId);
      return match;
    }
    return [];
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedRegistrationId = useRef<string | null>(null);
  const [teamDashboards, setTeamDashboards] = useState<Record<string, Team>>({});
  const [isRefreshingTeams, setIsRefreshingTeams] = useState(false);
  const [lastTeamSync, setLastTeamSync] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<Record<string, string>>({});

  const lookupPassSecurely = async (query: string, silent = false) => {
    const rawQuery = query.trim();
    if (!rawQuery) return;

    if (!silent) {
      setIsLookupLoading(true);
      setLookupError(null);
      setSearchFeedback(null);
    }

    try {
      const isFourDigits = /^\d{4}$/.test(rawQuery);
      const searchTarget = isFourDigits ? `FEST-2026-${rawQuery}` : rawQuery;
      const normalizedRaw = rawQuery.toLowerCase();
      const normalizedTarget = searchTarget.toLowerCase();

      // Check local cache first
      const allCached = mergePasses(initialRegistrations, readGuestPassCache());
      const localMatches = allCached.filter(r => {
        const idLower = (r.id || '').toLowerCase();
        if (isFourDigits) {
          return idLower === normalizedTarget || idLower.endsWith(normalizedRaw);
        }
        return idLower === normalizedRaw || (r.qrToken && r.qrToken.toLowerCase() === normalizedRaw);
      });

      // Query Supabase backend
      let remoteMatches: Registration[] = [];
      try {
        const found = await StorageService.lookupPublicPasses(searchTarget);
        remoteMatches = found.filter(r => {
          const idLower = (r.id || '').toLowerCase();
          if (isFourDigits) {
            return idLower === normalizedTarget || idLower.endsWith(normalizedRaw);
          }
          return idLower === normalizedRaw || (r.qrToken && r.qrToken.toLowerCase() === normalizedRaw);
        });
      } catch (err: any) {
        // If 4-digit lookup fails, we only rely on local if available
        console.warn('Backend lookup error:', err);
      }

      const verified = mergePasses(remoteMatches, localMatches);

      if (verified.length > 0) {
        setLiveRegistrations(verified);
        setActiveList(verified);
        setSelectedIndex(0);
        setLookupError(null);
        setSearchFeedback(`Pass verified successfully! Found ${verified.length} matching pass${verified.length === 1 ? '' : 'es'}.`);
      } else {
        if (!silent) {
          setActiveList([]);
          setLiveRegistrations([]);
          setLookupError(
            isFourDigits
              ? `No pass found ending in digits "${rawQuery}". Please check your pass number.`
              : `No pass found matching "${rawQuery}". Please verify your Pass Number (e.g., FEST-2026-XXXX).`
          );
        }
      }
    } catch (error: any) {
      if (!silent) {
        setActiveList([]);
        setLookupError(error?.message || 'Pass lookup temporarily unavailable. Please try again.');
      }
    } finally {
      if (!silent) setIsLookupLoading(false);
    }
  };

  useEffect(() => {
    if (activePassId) {
      void lookupPassSecurely(activePassId, false);
    }
  }, [activePassId]);

  useEffect(() => {
    if (activePassId && activeList.length > 0) {
      const foundIdx = activeList.findIndex(r => r.id === activePassId);
      if (foundIdx >= 0) {
        setSelectedIndex(foundIdx);
        selectedRegistrationId.current = activePassId;
      }
    }
  }, [activePassId, activeList]);

  const handleResendEmail = async (reg: Registration) => {
    if (!reg.leaderEmail) return;
    setResendStatus(prev => ({ ...prev, [reg.id]: 'Sending...' }));
    try {
      await EmailService.sendPassEmail(reg);
      setResendStatus(prev => ({ ...prev, [reg.id]: '✓ Email Sent' }));
      setTimeout(() => {
        setResendStatus(prev => {
          const updated = { ...prev };
          delete updated[reg.id];
          return updated;
        });
      }, 4000);
    } catch {
      setResendStatus(prev => ({ ...prev, [reg.id]: 'Failed to send' }));
    }
  };

  useEffect(() => {
    selectedRegistrationId.current = activeList[selectedIndex]?.id || null;
  }, [activeList, selectedIndex]);

  const teamCodesKey = Array.from(
    new Set(allRegs.map(registration => normalizeTeamCode(registration.teamCode)).filter(Boolean))
  ).sort().join('|');
  const canRefreshTeamDashboards = !pageMode || Boolean(currentUser);

  useEffect(() => {
    if (!teamCodesKey || !canRefreshTeamDashboards) {
      setIsRefreshingTeams(false);
      return;
    }
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
  }, [teamCodesKey, canRefreshTeamDashboards]);

  const handleSearchPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    void lookupPassSecurely(searchQuery);
  };

  const handleResetSearch = () => {
    setLiveRegistrations([]);
    setActiveList([]);
    setSelectedIndex(0);
    setSearchQuery('');
    setSearchFeedback(null);
    setLookupError(null);
  };

  const reg = activeList.length > 0 ? (activeList[selectedIndex] || activeList[0]) : null;
  const associatedEvent = reg
    ? events.find(event => event.id === reg.eventId || event.slug === reg.eventId)
    : undefined;
  const whatsappGroupUrl = associatedEvent?.whatsappGroupLink?.trim();
  const hasSecureWhatsAppGroupUrl = (() => {
    if (!whatsappGroupUrl) return false;
    try {
      return new URL(whatsappGroupUrl).protocol === 'https:';
    } catch {
      return false;
    }
  })();
  const teamSummary = reg?.teamCode ? teamDashboards[normalizeTeamCode(reg.teamCode)] : undefined;
  const roster = teamSummary?.members?.length ? teamSummary.members : (reg?.teammates || []);
  const teamMemberCount = teamSummary?.totalMemberCount || (teamSummary ? 1 + (teamSummary.memberCount || roster.length) : undefined);
  const teamPaymentStatus = teamSummary?.paymentStatus || reg?.paymentStatus;
  const effectivePaymentStatus = teamPaymentStatus || reg?.paymentStatus;
  const hasCompletedPaymentOrFreePass = effectivePaymentStatus === 'verified' || (
    effectivePaymentStatus === 'not_applicable' && (reg?.fee === 0 || associatedEvent?.fee === 0)
  );
  const showWhatsAppGroupLink = hasCompletedPaymentOrFreePass && Boolean(reg?.qrToken) && hasSecureWhatsAppGroupUrl;
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
    // Find the pass card element
    const passEl = (document.getElementById('festronix-pass-card') || document.querySelector('.ticket-wrapper')) as HTMLElement;
    if (!passEl) { window.print(); return; }

    // Clone the pass HTML
    const html = passEl.outerHTML;

    // Collect all stylesheet links from the page
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    // Open a hidden print window
    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) { window.print(); return; }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <base href="${window.location.origin}/" />
          <title>Festronix Pass – ${reg?.id ?? ''}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            html, body {
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #080C16 !important;
              overflow: visible !important;
            }
            body {
              display: block !important;
              font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .ticket-wrapper {
              width: 100% !important;
              max-width: 720px !important;
              margin: 0 auto !important;
              padding: 20px 24px !important;
              border-radius: 14px !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
              page-break-before: avoid !important;
              break-before: avoid !important;
              box-sizing: border-box !important;
            }
            @media print {
              html, body {
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
              }
              .ticket-wrapper {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
                margin: 0 auto !important;
                transform: scale(0.96);
                transform-origin: top center;
              }
            }
          </style>
        </head>
        <body>
          ${html}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); window.close(); }, 400);
            };
          <\/script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div
      className={pageMode ? 'pass-page-shell' : 'modal-backdrop'}
      data-lenis-prevent={pageMode ? undefined : true}
      onClick={pageMode ? undefined : onClose}
    >
      <div
        className={pageMode ? 'pass-page-content' : 'modal-content pass-modal-content'}
        data-lenis-prevent-wheel
        data-lenis-prevent-touch
        onClick={pageMode ? undefined : e => e.stopPropagation()}
        style={{
          padding: pageMode ? 'clamp(20px, 3.5vw, 56px) 0 72px' : 'clamp(18px, 3.5vw, 28px)',
          maxWidth: pageMode ? '1120px' : '700px',
          width: pageMode ? 'min(100% - 24px, 1120px)' : '95%',
          maxHeight: pageMode ? 'none' : 'calc(100dvh - 24px)',
          overflowY: pageMode ? 'visible' : 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={20} color="#38BDF8" />
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: '1.25rem',
                color: '#FFFFFF',
                letterSpacing: '0.04em',
                fontWeight: 700
              }}
            >
              DOWNLOAD YOUR PASS
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(220, 227, 229, 0.08)',
              border: '1px solid rgba(220, 227, 229, 0.15)',
              color: '#A8B3C2',
              borderRadius: '8px',
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
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 26, 53, 0.8) 0%, rgba(9, 18, 36, 0.95) 100%)',
          border: '1px solid rgba(136, 178, 174, 0.25)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <p style={{
            margin: '0 0 10px 0',
            fontSize: '0.84rem',
            color: '#BACEBB',
            lineHeight: 1.4
          }}>
            Enter your <strong>Pass Number</strong> (e.g. <span style={{ color: '#38BDF8', fontFamily: "'Space Grotesk', monospace" }}>FEST-2026-1234</span>) or simply the <strong>last 4 digits</strong> (e.g. <span style={{ color: '#38BDF8', fontFamily: "'Space Grotesk', monospace" }}>1234</span>) to view and download your pass.
          </p>

          <form onSubmit={handleSearchPass}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={15}
                  color="#38BDF8"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="cyber-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Enter Pass No or Last 4 Digits (e.g. 4821)"
                  autoFocus
                  style={{
                    paddingLeft: '36px',
                    height: '42px',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    background: 'rgba(9, 18, 36, 0.95)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#FFFFFF'
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isLookupLoading}
                className="btn-cyber-primary"
                style={{
                  padding: '0 18px',
                  height: '42px',
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #1C2B59 0%, #283B78 50%, #38BDF8 100%)',
                  whiteSpace: 'nowrap'
                }}
              >
                <Search size={14} />
                {isLookupLoading ? 'Searching…' : 'Find Pass'}
              </button>
              {(searchQuery || activeList.length > 0) && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="btn-cyber-secondary"
                  style={{ padding: '0 12px', height: '42px', fontSize: '0.78rem' }}
                >
                  Clear
                </button>
              )}
            </div>
            {searchFeedback && (
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#34D399',
                  marginTop: '8px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={14} color="#34D399" />
                {searchFeedback}
              </div>
            )}
            {lookupError && (
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#F87171',
                  marginTop: '8px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                role="status"
              >
                <AlertTriangle size={14} color="#F87171" />
                {lookupError}
              </div>
            )}
          </form>
        </div>

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
          <>
          <div
            id="festronix-pass-card"
            className="ticket-wrapper"
            style={{
              padding: '24px 28px',
              color: '#FFFFFF',
              position: 'relative',
              borderRadius: '18px',
              background: 'linear-gradient(145deg, #091224 0%, #122146 50%, #1A2F5E 100%)',
              border: '1.5px solid rgba(136, 178, 174, 0.45)',
              boxShadow: '0 18px 50px rgba(0, 0, 0, 0.75), 0 0 35px rgba(40, 59, 120, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
              overflow: 'hidden'
            }}
          >
            {/* VCE Institutional Watermark */}
            <div
              style={{
                position: 'absolute',
                right: '-25px',
                bottom: '-25px',
                width: '240px',
                height: '240px',
                opacity: 0.04,
                pointerEvents: 'none',
                backgroundImage: 'url(/vce_crest_hires.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                zIndex: 0
              }}
            />

            {/* Ticket Header: VCE Brand, Festronix Logo & Pass Status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(136, 178, 174, 0.25)',
                position: 'relative',
                zIndex: 1
              }}
            >
              {/* Left: VCE Crest & Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src="/vce_logo.png"
                  alt="Vardhaman College of Engineering"
                  style={{
                    height: '38px',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))'
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: '#BACEBB',
                      letterSpacing: '0.12em',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      fontFamily: "'Space Grotesk', sans-serif"
                    }}
                  >
                    VARDHAMAN COLLEGE OF ENGINEERING
                  </div>
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: '#88B2AE',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      fontWeight: 600
                    }}
                  >
                    Autonomous Institute • NAAC A++
                  </div>
                </div>
              </div>

              {/* Center: Official Festronix 2026 Crest */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(28, 43, 89, 0.75) 0%, rgba(9, 18, 36, 0.85) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4), 0 0 12px rgba(56, 189, 248, 0.25)'
                }}
              >
                <img
                  src="/festronix_3d_title_clean.png"
                  alt="Festronix 2026"
                  style={{
                    height: '24px',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.6)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))'
                  }}
                />
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    color: '#38BDF8',
                    letterSpacing: '0.12em',
                    fontFamily: "'Space Grotesk', sans-serif",
                    borderLeft: '1px solid rgba(136, 178, 174, 0.35)',
                    paddingLeft: '8px',
                    textTransform: 'uppercase'
                  }}
                >
                  2026
                </span>
              </div>

              {/* Right: Pass Status Badge */}
              <div>{getStatusBadge(effectivePaymentStatus || reg.paymentStatus)}</div>
            </div>

            {/* Official Sponsors Strip: Sanvi Homes & Vencorpia */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
                margin: '10px 0 12px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(90deg, rgba(28, 43, 89, 0.75) 0%, rgba(14, 23, 46, 0.85) 100%)',
                border: '1px solid rgba(136, 178, 174, 0.3)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                position: 'relative',
                zIndex: 1
              }}
            >
              {/* Sanvi Homes Logo - 3D Hexagonal Emblem with Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: '#38BDF8',
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}
                >
                  TITLE SPONSOR:
                </span>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px'
                  }}
                >
                  <img
                    src="/sanvi_homes_3d_emblem.png"
                    alt="Sanvi Homes Emblem"
                    style={{
                      height: '24px',
                      width: 'auto',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 0 8px rgba(0, 194, 255, 0.55)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      letterSpacing: '0.04em',
                      fontFamily: "'Space Grotesk', sans-serif"
                    }}
                  >
                    SANVI HOMES
                  </span>
                </div>
              </div>

              {/* Vencorpia Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: '#38BDF8',
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}
                >
                  EVENT PARTNER:
                </span>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <img
                    src="/vencorpia_transparent.png"
                    alt="Vencorpia"
                    style={{
                      height: '20px',
                      width: 'auto',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 0 6px rgba(0, 194, 255, 0.45))'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#F8FAFC',
                      fontFamily: "'Space Grotesk', sans-serif",
                      letterSpacing: '0.02em'
                    }}
                  >
                    Vencorpia
                  </span>
                </div>
              </div>
            </div>

            {/* Event Title & Pass Header */}
            <div style={{ marginBottom: '14px', position: 'relative', zIndex: 1 }}>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 'clamp(1.25rem, 2.5vw, 1.55rem)',
                  fontWeight: 800,
                  margin: '0 0 4px 0',
                  color: '#FFFFFF',
                  letterSpacing: '0.02em',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                }}
              >
                {reg.eventTitle}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>
                  Pass ID: <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>{reg.id}</strong>
                </span>
                {associatedEvent?.category && (
                  <span
                    style={{
                      fontSize: '0.64rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.18)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38BDF8',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  >
                    {associatedEvent.category}
                  </span>
                )}
              </div>
            </div>

            {/* Ticket Body Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.3fr 1fr',
                gap: '20px',
                padding: '16px 0',
                borderTop: '1px dashed rgba(136, 178, 174, 0.35)',
                borderBottom: '1px dashed rgba(136, 178, 174, 0.35)',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1
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
                      background: 'linear-gradient(135deg, rgba(28, 43, 89, 0.75) 0%, rgba(16, 26, 53, 0.85) 100%)',
                      border: '1px solid rgba(136, 178, 174, 0.45)',
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
                        <div style={{ fontSize: '0.64rem', color: '#CBD5E1', fontWeight: 600 }}>TEAM CODE</div>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#38BDF8',
                            background: 'rgba(10, 18, 38, 0.85)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(136, 178, 174, 0.35)',
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
                      background: 'rgba(14, 23, 46, 0.75)',
                      border: '1px solid rgba(136, 178, 174, 0.35)'
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
                  <div style={{ fontSize: '0.7rem', color: '#88B2AE', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                    {teamSummary && !isTeamLeader ? 'Participant' : 'Participant / Team Lead'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>{reg.leaderName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>{reg.leaderCollege}</div>
                  <div style={{ fontSize: '0.75rem', color: '#BACEBB', fontFamily: 'monospace' }}>Roll No: {reg.leaderRoll}</div>
                  {reg.deptSection && (
                    <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px' }}>
                      Dept & Section: <strong style={{ color: '#FFFFFF', letterSpacing: '0.04em' }}>{reg.deptSection}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Email: {reg.leaderEmail}</div>
                </div>

                {roster.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#88B2AE', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>
                      Squad Teammates ({roster.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {roster.map((tm, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 10px',
                            background: 'rgba(28, 43, 89, 0.45)',
                            border: '1px solid rgba(136, 178, 174, 0.35)',
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
                  {!(reg.qrToken || reg.id) ? (
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
                      <QrCode size={14} />
                      <span>QR NOT AVAILABLE YET • REGISTRATION RECORD IS LIVE</span>
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
                        padding: '5px 12px',
                        background: 'rgba(28, 43, 89, 0.65)',
                        border: '1px solid rgba(136, 178, 174, 0.45)',
                        borderRadius: '6px',
                        color: '#BACEBB',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      <Clock size={14} color="#38BDF8" />
                      <span>Authorized Entry Pass • Ready for QR Scan</span>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code token or entry ticket */}
              {!(reg.qrToken || reg.id) ? (
                <div
                  style={{
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(14, 23, 46, 0.95) 100%)',
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
                      color: '#67E8F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}
                  >
                    <QrCode size={22} />
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FBBF24', letterSpacing: '0.04em' }}>
                    QR PASS NOT AVAILABLE YET
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#FEF3C7', marginTop: '4px', maxWidth: '170px', lineHeight: 1.3 }}>
                    The registration is live, but its entry ticket has not been generated yet.
                  </div>
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.18)',
                      color: '#67E8F9',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      fontFamily: 'monospace'
                    }}
                  >
                    REGISTRATION RECORDED
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    background: '#FFFFFF',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '2px solid rgba(136, 178, 174, 0.5)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reg.qrToken || reg.id)}`}
                    alt="Entry QR Pass"
                    style={{ width: '120px', height: '120px', margin: '0 auto', display: 'block' }}
                  />
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.68rem',
                      color: '#0E172E',
                      fontWeight: 800,
                      marginTop: '8px',
                      letterSpacing: '0.05em'
                    }}
                  >
                    TOKEN: {reg.qrToken || reg.id}
                  </div>
                  <div
                    style={{
                      fontSize: '0.62rem',
                      color: '#64748B',
                      fontWeight: 700,
                      marginTop: '2px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase'
                    }}
                  >
                    SCAN FOR EVENT CHECK-IN
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
                color: '#94A3B8',
                position: 'relative',
                zIndex: 1
              }}
            >
              <div>
                Date Issued: <span style={{ color: '#CBD5E1' }}>{reg.registrationDate}</span> • Status:{' '}
                {effectivePaymentStatus === 'payment_required' ? (
                  <strong style={{ color: '#FBBF24' }}>PENDING LEADER PAYMENT</strong>
                ) : (
                  <strong style={{ color: '#34D399' }}>CONFIRMED</strong>
                )}
              </div>
              {reg.transactionId ? (
                <div>
                  UTR: <span style={{ color: '#BACEBB', fontFamily: 'monospace' }}>{reg.transactionId}</span>
                </div>
              ) : (
                <div style={{ fontSize: '0.68rem', color: '#88B2AE' }}>
                  VCE SAC • Shamshabad, Hyderabad
                </div>
              )}
            </div>
          </div>
          {showWhatsAppGroupLink && whatsappGroupUrl && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
                marginTop: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(37, 211, 102, 0.08)',
                border: '1px solid rgba(37, 211, 102, 0.35)'
              }}
            >
              <div>
                <div style={{ color: '#FFFFFF', fontWeight: 700 }}>Join the event WhatsApp group</div>
                <div style={{ color: '#A8B3C2', fontSize: '0.78rem', marginTop: '3px' }}>
                  Payment verified and pass generated.
                </div>
              </div>
              <a
                href={whatsappGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Join the ${associatedEvent?.title || reg.eventTitle} WhatsApp group`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#25D366',
                  color: '#06210F',
                  fontWeight: 800,
                  textDecoration: 'none'
                }}
              >
                <MessageCircle size={18} />
                Join WhatsApp Group
              </a>
            </div>
          )}
          </>
        ) : (
          <div className="pass-empty-state" style={{
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '36px 20px',
            background: 'rgba(9, 18, 36, 0.7)',
            border: '1px dashed rgba(136, 178, 174, 0.3)',
            borderRadius: '14px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(40, 59, 120, 0.4)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8'
            }}>
              <Download size={26} />
            </div>
            <h2 style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              Search Your Pass to View & Download
            </h2>
            <p style={{ color: '#BACEBB', fontSize: '0.84rem', maxWidth: '440px', margin: 0, lineHeight: 1.5 }}>
              For your privacy, passes are only displayed once verified. Enter your full <strong>Pass Number</strong> (e.g. <code>FEST-2026-XXXX</code>) or the <strong>last 4 digits</strong> above to access your official ticket.
            </p>
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
            {reg && (
              <button onClick={handlePrint} className="btn-cyber-primary" style={{
                padding: '8px 18px',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #1C2B59 0%, #283B78 50%, #38BDF8 100%)'
              }}>
                <Download size={15} />
                <span>Download / Print Pass (PDF)</span>
              </button>
            )}

            <button onClick={onClose} className="btn-cyber-secondary" style={{ padding: '8px 20px', fontSize: '0.8rem' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
