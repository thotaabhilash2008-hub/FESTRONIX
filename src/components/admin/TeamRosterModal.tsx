import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { RegistrationDisplayGroup } from '../../lib/registrationDisplay';

interface TeamRosterModalProps {
  group: RegistrationDisplayGroup | null;
  onClose: () => void;
}

export const TeamRosterModal: React.FC<TeamRosterModalProps> = ({ group, onClose }) => {
  useEffect(() => {
    if (!group) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [group, onClose]);

  if (!group) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="coordinator-team-roster-title"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 240, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', background: 'rgba(2, 6, 23, 0.82)', backdropFilter: 'blur(8px)',
      }}
    >
      <section
        onClick={event => event.stopPropagation()}
        style={{
          width: 'min(820px, 100%)', maxHeight: 'min(760px, 92vh)', overflowY: 'auto',
          background: '#101A35', border: '1px solid rgba(56, 189, 248, 0.38)', borderRadius: '18px',
          padding: 'clamp(16px, 3vw, 24px)', boxShadow: '0 24px 80px rgba(0, 0, 0, 0.55)',
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '18px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#38BDF8', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Full team roster · {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
            </div>
            <h2 id="coordinator-team-roster-title" style={{ color: '#FFFFFF', fontSize: '1.25rem', margin: '5px 0 4px', overflowWrap: 'anywhere' }}>
              {group.teamName || 'Team'}
            </h2>
            <div style={{ color: '#A8B3C2', fontSize: '0.78rem', overflowWrap: 'anywhere' }}>
              {group.teamCode || group.displayId} · {group.representative.eventTitle}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close team roster"
            style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(220, 227, 229, 0.2)', background: 'rgba(255, 255, 255, 0.06)', color: '#DCE3E5', borderRadius: '9px', padding: '8px 11px', cursor: 'pointer', fontWeight: 700 }}
          >
            <X size={15} /> Close
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: '10px' }}>
          {group.members.map(member => {
            const normalizedRoll = member.rollNumber.trim().toUpperCase();
            const leaderRegistration = group.registrations.find(registration =>
              (registration.leaderRoll || registration.buyerRoll || '').trim().toUpperCase() === normalizedRoll
            );
            const teammate = group.registrations.flatMap(registration => registration.teammates || []).find(candidate =>
              candidate.rollNumber.trim().toUpperCase() === normalizedRoll
            );
            const checkedIn = leaderRegistration?.checkedIn ?? group.registrations.some(registration =>
              Boolean(registration.teammates?.some(candidate => candidate.rollNumber.trim().toUpperCase() === normalizedRoll)) && registration.checkedIn
            );
            const status = leaderRegistration?.paymentStatus || group.paymentStatus;

            return (
              <article key={member.rollNumber || member.name} style={{ minWidth: 0, padding: '14px', borderRadius: '12px', background: 'rgba(20, 31, 62, 0.86)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.86rem', overflowWrap: 'anywhere' }}>{member.name || 'Name unavailable'}</div>
                <div style={{ color: '#38BDF8', fontFamily: 'monospace', fontSize: '0.74rem', marginTop: '3px', overflowWrap: 'anywhere' }}>{member.rollNumber || 'Roll unavailable'}</div>
                <div style={{ color: '#A8B3C2', fontSize: '0.72rem', lineHeight: 1.55, marginTop: '9px', overflowWrap: 'anywhere' }}>
                  <div>{leaderRegistration?.leaderEmail || teammate?.email || 'Email unavailable'}</div>
                  <div>{leaderRegistration?.leaderPhone || teammate?.phone || 'Phone unavailable'}</div>
                  <div>{leaderRegistration?.leaderCollege || teammate?.college || group.representative.leaderCollege || 'College unavailable'}</div>
                </div>
                <div style={{ color: checkedIn ? '#34D399' : '#94A3B8', fontWeight: 700, fontSize: '0.72rem', marginTop: '9px', textTransform: 'capitalize' }}>
                  {checkedIn ? 'Checked in' : 'Not checked in'} · {String(status || 'unknown').replaceAll('_', ' ')}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
