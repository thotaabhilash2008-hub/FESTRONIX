import React, { useEffect } from 'react';
import { X, Calendar, MapPin, Users, Trophy, Shield, Phone, Mail, ArrowRight, Clock } from 'lucide-react';
import { FestEvent } from '../types/festronix';

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
                  backgroundColor: 'rgba(255, 215, 0, 0.15)',
                  border: '1px solid #FFD700',
                  color: '#FFD700',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: 'Orbitron, sans-serif'
                }}
              >
                {event.departmentCode} DEPT
              </span>
              <span
                style={{
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  color: '#A78BFA',
                  background: 'rgba(124, 58, 237, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600
                }}
              >
                {event.category}
              </span>
            </div>

            <h2 className="font-title" style={{ fontSize: '1.8rem', color: '#F5F0E8', fontWeight: 800 }}>
              {event.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#9B8E7B',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
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
            background: 'rgba(5, 8, 24, 0.6)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 215, 0, 0.2)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: '#9B8E7B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="#FFD700" />
              <span>DATE & TIME</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#F5F0E8', marginTop: '4px' }}>
              {event.date}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#D4C5A9' }}>{event.time}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#9B8E7B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="#7C3AED" />
              <span>VENUE</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#F5F0E8', marginTop: '4px' }}>
              {event.venue}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#9B8E7B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} color="#34d399" />
              <span>TEAM STRUCTURE</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#F5F0E8', marginTop: '4px', textTransform: 'capitalize' }}>
              {event.format === 'individual' ? 'Solo Participant' : `${event.format} (${event.minTeamSize}-${event.maxTeamSize} Members)`}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#9B8E7B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#fbbf24" />
              <span>REGISTRATION FEE</span>
            </div>
            <div className="font-title" style={{ fontSize: '1.1rem', fontWeight: 800, color: event.fee === 0 ? '#34d399' : '#FFD700', marginTop: '2px' }}>
              {event.fee === 0 ? 'FREE ENTRY' : `₹${event.fee} per Team`}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '24px' }}>
          <h4 className="font-title" style={{ fontSize: '1rem', color: '#FFD700', marginBottom: '8px' }}>
            OVERVIEW
          </h4>
          <p style={{ color: '#D4C5A9', lineHeight: 1.6, fontSize: '0.95rem' }}>
            {event.description}
          </p>
        </div>

        {/* Prizes Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 className="font-title" style={{ fontSize: '1rem', color: '#fbbf24', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={18} color="#fbbf24" />
            <span>AWARDS & RECOGNITION</span>
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>FIRST PRIZE</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F5F0E8' }}>{event.prizes.first}</div>
            </div>
            {event.prizes.second && (
              <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#D4C5A9', fontWeight: 700 }}>SECOND PRIZE</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F5F0E8' }}>{event.prizes.second}</div>
              </div>
            )}
            {event.prizes.third && (
              <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#D4C5A9', fontWeight: 700 }}>THIRD PRIZE</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F5F0E8' }}>{event.prizes.third}</div>
              </div>
            )}
          </div>
        </div>

        {/* Rules & Guidelines */}
        <div style={{ marginBottom: '24px' }}>
          <h4 className="font-title" style={{ fontSize: '1rem', color: '#A78BFA', marginBottom: '10px' }}>
            RULES & COMPLIANCE
          </h4>
          <ul style={{ paddingLeft: '20px', color: '#D4C5A9', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
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
            background: 'rgba(18, 14, 30, 0.8)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '28px',
            gap: '14px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#9B8E7B' }}>EVENT COORDINATOR</div>
            <div style={{ fontWeight: 700, color: '#F5F0E8', fontSize: '0.95rem' }}>{event.coordinatorName}</div>
            <div style={{ display: 'flex', gap: '14px', marginTop: '4px', fontSize: '0.8rem', color: '#FFD700' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={13} /> {event.coordinatorPhone}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={13} /> {event.coordinatorEmail}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#9B8E7B' }}>REGISTRATION DEADLINE</div>
            <div style={{ fontWeight: 600, color: '#f87171', fontSize: '0.85rem' }}>{event.deadline}</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn-cyber-secondary">
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onRegister(event);
            }}
            disabled={isFull}
            className="btn-cyber-primary"
            style={{ opacity: isFull ? 0.5 : 1, cursor: isFull ? 'not-allowed' : 'pointer' }}
          >
            <span>{isFull ? 'Capacity Full' : 'Proceed to Registration'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
