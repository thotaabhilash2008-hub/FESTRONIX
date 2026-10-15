import React, { useMemo } from 'react';
import { Flame, Trophy, Calendar, MapPin, Users, ArrowRight, Sparkles, AlertCircle, Zap } from 'lucide-react';
import { FestEvent } from '../types/festronix';

interface HypedEventsSectionProps {
  events: FestEvent[];
  onSelectEvent: (event: FestEvent) => void;
  onRegisterEvent: (event: FestEvent) => void;
  onExploreAll: () => void;
}

export const HypedEventsSection: React.FC<HypedEventsSectionProps> = ({
  events,
  onSelectEvent,
  onRegisterEvent,
  onExploreAll
}) => {
  // Sort events strictly by registeredCount descending
  const hypedEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => b.registeredCount - a.registeredCount)
      .slice(0, 4);
  }, [events]);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return {
          label: '#1 MOST HYPED',
          bg: 'linear-gradient(135deg, #283B78 0%, #3E4264 50%, #789593 100%)',
          textColor: '#FFFFFF',
          border: '1px solid rgba(186, 206, 187, 0.65)',
          glow: '0 0 22px rgba(120, 149, 147, 0.45)'
        };
      case 1:
        return {
          label: '#2 TRENDING',
          bg: 'linear-gradient(135deg, #283B78 0%, #3E5296 100%)',
          textColor: '#FFFFFF',
          border: '1px solid rgba(220, 227, 229, 0.45)',
          glow: '0 0 18px rgba(40, 59, 120, 0.5)'
        };
      case 2:
        return {
          label: '#3 RAPID FILL',
          bg: 'linear-gradient(135deg, #3E4264 0%, #789593 100%)',
          textColor: '#FFFFFF',
          border: '1px solid rgba(120, 149, 147, 0.5)',
          glow: '0 0 16px rgba(120, 149, 147, 0.4)'
        };
      default:
        return {
          label: `#${index + 1} HIGH DEMAND`,
          bg: 'linear-gradient(135deg, #18254b 0%, #283B78 100%)',
          textColor: '#FFFFFF',
          border: '1px solid rgba(220, 227, 229, 0.35)',
          glow: '0 0 14px rgba(40, 59, 120, 0.4)'
        };
    }
  };

  return (
    <section
      id="hyped-events"
      style={{
        padding: '70px 20px 50px',
        maxWidth: '1240px',
        margin: '0 auto',
        position: 'relative'
      }}
    >
      {/* Background ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70%',
          height: '350px',
          background: 'radial-gradient(ellipse, rgba(40, 59, 120, 0.25) 0%, rgba(120, 149, 147, 0.12) 50%, transparent 80%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 14px',
              borderRadius: '9999px',
              background: 'rgba(120, 149, 147, 0.15)',
              border: '1px solid rgba(120, 149, 147, 0.4)',
              color: '#BACEBB',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.12em',
              marginBottom: '10px',
              boxShadow: '0 0 15px rgba(120, 149, 147, 0.2)'
            }}
          >
            <Flame size={14} color="#BACEBB" />
            <span>REAL-TIME AUDIENCE LEADERBOARD</span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700,
              margin: '0 0 10px 0',
              letterSpacing: '0.02em',
              display: 'inline-block',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #DCE3E5 40%, #BACEBB 75%, #789593 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            🔥 TOP HYPED EVENTS
          </h2>

          <p
            style={{
              color: '#A8B3C2',
              maxWidth: '640px',
              margin: '0 auto',
              fontSize: '0.95rem',
              lineHeight: 1.6
            }}
          >
            Ranked live strictly by total student registrations across all engineering departments.
            Limited slots remain — grab your pass before seats hit full capacity!
          </p>
        </div>

        {/* Hyped Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}
        >
          {hypedEvents.map((evt, idx) => {
            const badge = getRankBadge(idx);
            const fillPct = Math.min(100, Math.round((evt.registeredCount / evt.capacity) * 100));
            const spotsLeft = Math.max(0, evt.capacity - evt.registeredCount);
            const isFull = evt.registeredCount >= evt.capacity || evt.status === 'full';

            return (
              <div
                key={evt.id}
                className="card-cyber"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  borderRadius: '22px',
                  background: 'rgba(20, 31, 62, 0.90)',
                  backdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(220, 227, 229, 0.22)',
                  boxShadow: '0 0 25px rgba(40, 59, 120, 0.22), 0 12px 32px rgba(0, 0, 0, 0.8)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Top Rank Header */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px'
                    }}
                  >
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        fontFamily: "'Space Grotesk', sans-serif",
                        background: badge.bg,
                        color: badge.textColor,
                        border: badge.border,
                        boxShadow: badge.glow,
                        letterSpacing: '0.06em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Flame size={14} fill="#FFFFFF" color="#FFFFFF" />
                      {badge.label}
                    </span>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '5px 12px',
                        borderRadius: '10px',
                        background: 'rgba(120, 149, 147, 0.15)',
                        border: '1px solid rgba(120, 149, 147, 0.4)',
                        color: '#BACEBB',
                        fontFamily: "'Space Grotesk', sans-serif"
                      }}
                    >
                      {evt.departmentCode}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      color: '#FFFFFF',
                      margin: '0 0 12px 0',
                      lineHeight: 1.3
                    }}
                  >
                    {evt.title}
                  </h3>

                  {/* Quick info row */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '14px',
                      fontSize: '0.8rem',
                      color: '#A8B3C2',
                      marginBottom: '16px'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#DCE3E5" />
                      {evt.date}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#789593" />
                      {evt.venue.split(',')[0]}
                    </span>
                  </div>

                  {/* Prize Highlight */}
                  {evt.prizes?.first && (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'rgba(16, 26, 53, 0.75)',
                        border: '1px solid rgba(220, 227, 229, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '18px'
                      }}
                    >
                      <Trophy size={18} color="#FBBF24" />
                      <span style={{ fontSize: '0.82rem', color: '#DCE3E5' }}>
                        1st Prize:{' '}
                        <strong style={{ color: '#BACEBB', fontWeight: 700 }}>
                          {evt.prizes.first}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Registration Meter & Actions */}
                <div>
                  {/* Registration Progress Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.78rem',
                        marginBottom: '6px'
                      }}
                    >
                      <span style={{ color: '#BACEBB', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color="#BACEBB" />
                        {evt.registeredCount} Enrolled
                      </span>
                      <span
                        style={{
                          color: isFull ? '#FB7185' : '#A8B3C2',
                          fontWeight: 600
                        }}
                      >
                        {isFull ? 'HOUSEFULL' : `${spotsLeft} seats left (${fillPct}%)`}
                      </span>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        borderRadius: '9999px',
                        background: 'rgba(16, 26, 53, 0.8)',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${fillPct}%`,
                          height: '100%',
                          background: isFull
                            ? 'linear-gradient(90deg, #F43F5E, #E11D48)'
                            : 'linear-gradient(90deg, #283B78 0%, #789593 50%, #BACEBB 100%)',
                          boxShadow: '0 0 10px rgba(120, 149, 147, 0.5)',
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={() => onSelectEvent(evt)}
                      style={{
                        background: 'rgba(16, 26, 53, 0.85)',
                        border: '1px solid rgba(220, 227, 229, 0.25)',
                        color: '#DCE3E5',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: "'Space Grotesk', sans-serif"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#789593';
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(120, 149, 147, 0.3)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(220, 227, 229, 0.25)';
                        e.currentTarget.style.color = '#DCE3E5';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => onRegisterEvent(evt)}
                      disabled={isFull}
                      style={{
                        background: isFull
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'linear-gradient(135deg, #283B78 0%, #3B539C 50%, #4B63AA 100%)',
                        color: isFull ? '#A8B3C2' : '#FFFFFF',
                        border: isFull ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(220, 227, 229, 0.35)',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        boxShadow: isFull ? 'none' : '0 0 20px rgba(40, 59, 120, 0.65)',
                        cursor: isFull ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: "'Space Grotesk', sans-serif"
                      }}
                      onMouseEnter={e => {
                        if (!isFull) {
                          e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 0 30px rgba(120, 149, 147, 0.45)';
                          e.currentTarget.style.borderColor = '#BACEBB';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isFull) {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 0 20px rgba(40, 59, 120, 0.65)';
                          e.currentTarget.style.borderColor = 'rgba(220, 227, 229, 0.35)';
                        }
                      }}
                    >
                      {isFull ? 'Sold Out' : evt.fee === 0 ? 'Register Free' : `₹${evt.fee} Register`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Prompt */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onExploreAll}
            style={{
              background: 'rgba(40, 59, 120, 0.25)',
              border: '1px solid rgba(220, 227, 229, 0.3)',
              color: '#DCE3E5',
              padding: '11px 26px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: '0 0 15px rgba(40, 59, 120, 0.3)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(40, 59, 120, 0.45)';
              e.currentTarget.style.borderColor = '#789593';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(120, 149, 147, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(40, 59, 120, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(220, 227, 229, 0.3)';
              e.currentTarget.style.color = '#DCE3E5';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(40, 59, 120, 0.3)';
            }}
          >
            <span>Explore All 30+ Festronix Events</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};
