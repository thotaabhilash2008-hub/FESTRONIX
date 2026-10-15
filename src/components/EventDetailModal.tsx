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
                  backgroundColor: 'rgba(0, 140, 255, 0.12)',
                  border: '1px solid rgba(0, 210, 255, 0.45)',
                  color: '#00D2FF',
                  padding: '2px 8px',
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
                  color: '#38BDF8',
                  background: 'rgba(0, 130, 255, 0.08)',
                  border: '1px solid rgba(0, 150, 255, 0.35)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600
                }}
              >
                {event.category}
              </span>
            </div>

            <h2 className="font-title" style={{ fontSize: '1.8rem', color: '#F8FAFC', fontWeight: 800 }}>
              {event.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
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
            background: 'rgba(3, 14, 38, 0.88)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 140, 255, 0.35)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="#00D2FF" />
              <span>DATE & TIME</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#F8FAFC', marginTop: '4px' }}>
              {event.date}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>{event.time}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="#00D2FF" />
              <span>VENUE</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#F8FAFC', marginTop: '4px' }}>
              {event.venue}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} color="#38BDF8" />
              <span>TEAM STRUCTURE</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#F8FAFC', marginTop: '4px', textTransform: 'capitalize' }}>
              {event.format === 'individual' ? 'Solo Participant' : `${event.format} (${event.minTeamSize}-${event.maxTeamSize} Members)`}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#00D2FF" />
              <span>REGISTRATION FEE</span>
            </div>
            <div className="font-title" style={{ fontSize: '1.1rem', fontWeight: 800, color: event.fee === 0 ? '#34d399' : '#00D2FF', marginTop: '2px' }}>
              {event.fee === 0 ? 'FREE ENTRY' : `₹${event.fee} per Team`}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '24px' }}>
          <h4 className="font-title" style={{ fontSize: '1rem', color: '#00D2FF', marginBottom: '8px' }}>
            OVERVIEW
          </h4>
          <p style={{ color: '#CBD5E1', lineHeight: 1.6, fontSize: '0.95rem' }}>
            {event.description}
          </p>
        </div>

        {/* Prizes Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 className="font-title" style={{ fontSize: '1rem', color: '#00D2FF', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={18} color="#FBBF24" />
            <span>AWARDS & RECOGNITION</span>
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(2, 25, 60, 0.7)', border: '1px solid rgba(0, 140, 255, 0.35)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#00D2FF', fontWeight: 700 }}>FIRST PRIZE</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>{event.prizes.first}</div>
            </div>
            {event.prizes.second && (
              <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 700 }}>SECOND PRIZE</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>{event.prizes.second}</div>
              </div>
            )}
            {event.prizes.third && (
              <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 700 }}>THIRD PRIZE</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>{event.prizes.third}</div>
              </div>
            )}
          </div>
        </div>

        {/* Rules & Guidelines */}
        <div style={{ marginBottom: '24px' }}>
          <h4 className="font-title" style={{ fontSize: '1rem', color: '#38BDF8', marginBottom: '10px' }}>
            RULES & COMPLIANCE
          </h4>
          <ul style={{ paddingLeft: '20px', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
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
            background: 'rgba(3, 14, 38, 0.88)',
            borderRadius: '10px',
            border: '1px solid rgba(0, 140, 255, 0.3)',
            marginBottom: '28px',
            gap: '14px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>EVENT COORDINATOR</div>
            <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.95rem' }}>{event.coordinatorName}</div>
            <div style={{ display: 'flex', gap: '14px', marginTop: '4px', fontSize: '0.8rem', color: '#38BDF8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={13} color="#00D2FF" /> {event.coordinatorPhone}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={13} color="#00D2FF" /> {event.coordinatorEmail}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>REGISTRATION DEADLINE</div>
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
