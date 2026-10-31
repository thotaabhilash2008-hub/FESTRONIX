import React, { useEffect } from 'react';
import { X, Calendar, MapPin, Users, Trophy, Shield, Phone, Mail, ArrowRight, Clock } from 'lucide-react';
import { FestEvent } from '../types/festronix';
import { getEventRegistrationBlockReason } from '../lib/eventRegistration';

interface EventDetailModalProps {
  event: FestEvent | null;
  onClose: () => void;
  onRegister: (event: FestEvent) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onRegister
}) => {
  useEffect(() => {
    if (!event) return;
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [event]);

  if (!event) return null;

  const registrationBlockReason = getEventRegistrationBlockReason(event);
  const isFull = event.status === 'full' || event.registeredCount >= event.capacity;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ padding: '32px', maxWidth: '850px' }}
      >
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span
                style={{
                  backgroundColor: 'rgba(40, 59, 120, 0.4)',
                  border: '1px solid rgba(120, 149, 147, 0.45)',
                  color: '#BACEBB',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                {event.departmentCode} DEPT
              </span>
              <span
                style={{
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  color: '#DCE3E5',
                  background: 'rgba(120, 149, 147, 0.15)',
                  border: '1px solid rgba(120, 149, 147, 0.35)',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontWeight: 600
                }}
              >
                {event.category}
              </span>
            </div>

            <h2 className="font-title" style={{ fontSize: '1.8rem', color: '#FFFFFF', fontWeight: 800 }}>
              {event.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(220, 227, 229, 0.08)',
              border: '1px solid rgba(220, 227, 229, 0.15)',
              color: '#A8B3C2',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Specs Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginBottom: '24px',
            padding: '16px',
            background: 'rgba(16, 26, 53, 0.85)',
            borderRadius: '12px',
            border: '1px solid rgba(220, 227, 229, 0.18)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: '#A8B3C2', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="#BACEBB" />
              <span>DATE & TIME</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FFFFFF', marginTop: '4px' }}>
              {event.date}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#A8B3C2' }}>{event.time}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#A8B3C2', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="#BACEBB" />
              <span>VENUE</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FFFFFF', marginTop: '4px' }}>
              {event.venue}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#A8B3C2', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} color="#789593" />
              <span>TEAM STRUCTURE</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FFFFFF', marginTop: '4px', textTransform: 'capitalize' }}>
              {event.format === 'individual' ? 'Solo Participant' : `${event.format} (${event.minTeamSize}-${event.maxTeamSize} Members)`}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#A8B3C2', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#DCE3E5" />
              <span>REGISTRATION FEE</span>
            </div>
            <div className="font-title" style={{ fontSize: '1.1rem', fontWeight: 800, color: event.fee === 0 ? '#BACEBB' : '#DCE3E5', marginTop: '2px' }}>
              {event.fee === 0 ? 'FREE ENTRY' : `₹${event.fee} per Team`}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '24px' }}>
          <h4 className="font-title" style={{ fontSize: '1rem', color: '#DCE3E5', marginBottom: '8px', letterSpacing: '0.05em' }}>
            OVERVIEW
          </h4>
          <p style={{ color: '#A8B3C2', lineHeight: 1.65, fontSize: '0.95rem' }}>
            {event.description}
          </p>
        </div>

        {/* Prizes Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 className="font-title" style={{ fontSize: '1rem', color: '#DCE3E5', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={18} color="#FBBF24" />
            <span>AWARDS & RECOGNITION</span>
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(40, 59, 120, 0.35)', border: '1px solid rgba(120, 149, 147, 0.4)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#BACEBB', fontWeight: 700 }}>FIRST PRIZE</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>{event.prizes.first}</div>
            </div>
            {event.prizes.second && (
              <div style={{ padding: '12px', background: 'rgba(220, 227, 229, 0.05)', border: '1px solid rgba(220, 227, 229, 0.15)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#A8B3C2', fontWeight: 700 }}>SECOND PRIZE</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>{event.prizes.second}</div>
              </div>
            )}
            {event.prizes.third && (
              <div style={{ padding: '12px', background: 'rgba(220, 227, 229, 0.05)', border: '1px solid rgba(220, 227, 229, 0.15)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#A8B3C2', fontWeight: 700 }}>THIRD PRIZE</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>{event.prizes.third}</div>
              </div>
            )}
          </div>
        </div>

        {/* Rules & Guidelines */}
        <div style={{ marginBottom: '24px' }}>
          <h4 className="font-title" style={{ fontSize: '1rem', color: '#DCE3E5', marginBottom: '10px', letterSpacing: '0.05em' }}>
            RULES & COMPLIANCE
          </h4>
          <ul style={{ paddingLeft: '20px', color: '#A8B3C2', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
            {event.rules.map((rule, idx) => (
              <li key={idx} style={{ lineHeight: 1.5 }}>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Eligibility & Coordinator Contact */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: 'rgba(16, 26, 53, 0.85)',
            borderRadius: '10px',
            border: '1px solid rgba(220, 227, 229, 0.18)',
            marginBottom: '28px',
            gap: '14px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#A8B3C2' }}>EVENT COORDINATOR</div>
            <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.95rem' }}>{event.coordinatorName}</div>
            <div style={{ display: 'flex', gap: '14px', marginTop: '4px', fontSize: '0.8rem', color: '#BACEBB' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={13} color="#789593" /> {event.coordinatorPhone}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={13} color="#789593" /> {event.coordinatorEmail}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#A8B3C2' }}>REGISTRATION DEADLINE</div>
            <div style={{ fontWeight: 600, color: '#f87171', fontSize: '0.85rem' }}>{event.deadline}</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn-cyber-secondary">
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onRegister(event);
            }}
            disabled={Boolean(registrationBlockReason)}
            title={registrationBlockReason || undefined}
            className="btn-cyber-primary"
            style={{ opacity: registrationBlockReason ? 0.5 : 1, cursor: registrationBlockReason ? 'not-allowed' : 'pointer' }}
          >
            <span>{isFull ? 'Capacity Full' : registrationBlockReason ? 'Registration Closed' : 'Proceed to Registration'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
