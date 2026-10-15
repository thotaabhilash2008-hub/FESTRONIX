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
          bg: 'linear-gradient(135deg, #FF1A8C 0%, #FF007F 50%, #D8005A 100%)',
          textColor: '#FFFFFF',
          border: '1px solid #FF4D94',
          glow: '0 0 22px rgba(255, 26, 140, 0.8)'
        };
      case 1:
        return {
          label: '#2 TRENDING',
          bg: 'linear-gradient(135deg, #FF1A8C 0%, #C026D3 100%)',
          textColor: '#FFFFFF',
          border: '1px solid #FF66B2',
          glow: '0 0 18px rgba(255, 26, 140, 0.65)'
        };
      case 2:
        return {
          label: '#3 RAPID FILL',
          bg: 'linear-gradient(135deg, #FF2E93 0%, #E11D48 100%)',
          textColor: '#FFFFFF',
          border: '1px solid #FF4D94',
          glow: '0 0 18px rgba(255, 46, 147, 0.65)'
        };
      default:
        return {
          label: `#${index + 1} HIGH DEMAND`,
          bg: 'linear-gradient(135deg, #FF1A8C 0%, #D8005A 100%)',
          textColor: '#FFFFFF',
          border: '1px solid rgba(255, 120, 190, 0.6)',
          glow: '0 0 20px rgba(255, 26, 140, 0.7)'
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
          background: 'radial-gradient(ellipse, rgba(0, 240, 208, 0.08) 0%, rgba(192, 38, 211, 0.06) 50%, transparent 80%)',
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
              background: 'linear-gradient(135deg, rgba(0, 240, 208, 0.1), rgba(192, 38, 211, 0.12))',
              border: '1px solid rgba(0, 240, 208, 0.3)',
              color: '#00F0D0',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.12em',
              marginBottom: '10px',
              boxShadow: '0 0 15px rgba(0, 240, 208, 0.15)'
            }}
          >
            <Flame size={14} color="#00F0D0" />
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
              background: 'linear-gradient(135deg, #00F0D0 0%, #FFFFFF 40%, #C026D3 75%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            🔥 TOP HYPED EVENTS
          </h2>

          <p
            style={{
              color: '#CBD5E1',
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
                  borderRadius: '20px',
                  background: 'rgba(16, 7, 26, 0.82)',
                  backdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(255, 26, 140, 0.45)',
                  boxShadow: '0 0 25px -4px rgba(255, 26, 140, 0.35), 0 12px 32px rgba(0, 0, 0, 0.8)',
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
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        fontFamily: "'Space Grotesk', sans-serif",
                        background: badge.bg,
                        color: badge.textColor,
                        border: badge.border,
                        boxShadow: badge.glow,
                        letterSpacing: '0.06em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Flame size={13} fill="#FFFFFF" color="#FFFFFF" />
                      {badge.label}
                    </span>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(255, 26, 140, 0.08)',
                        border: '1px solid rgba(255, 26, 140, 0.35)',
                        color: '#FF66B2',
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
                      margin: '0 0 10px 0',
                      lineHeight: 1.25
                    }}
                  >
                    {evt.title}
                  </h3>

                  {/* Quick info row */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      fontSize: '0.78rem',
                      color: '#CBD5E1',
                      marginBottom: '16px'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={13} color="#FF4D94" />
                      {evt.date}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={13} color="#FF4D94" />
                      {evt.venue.split(',')[0]}
                    </span>
                  </div>

                  {/* Prize Highlight */}
                  {evt.prizes?.first && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 26, 140, 0.08)',
                        border: '1px solid rgba(255, 26, 140, 0.28)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '18px'
                      }}
                    >
                      <Trophy size={16} color="#FF1A8C" />
                      <span style={{ fontSize: '0.8rem', color: '#F8FAFC' }}>
                        1st Prize:{' '}
                        <strong style={{ color: '#FF4D94', fontWeight: 700 }}>
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
                        fontSize: '0.75rem',
                        marginBottom: '6px'
                      }}
                    >
                      <span style={{ color: '#FF1A8C', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Users size={13} color="#FF1A8C" />
                        {evt.registeredCount} Enrolled
                      </span>
                      <span
                        style={{
                          color: isFull ? '#F43F5E' : '#94A3B8',
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
                        background: 'rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${fillPct}%`,
                          height: '100%',
                          background: isFull
                            ? 'linear-gradient(90deg, #F43F5E, #E11D48)'
                            : 'linear-gradient(90deg, #FF1A8C 0%, #FF66B2 100%)',
                          boxShadow: '0 0 10px rgba(255, 26, 140, 0.7)',
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
                        background: 'rgba(18, 10, 26, 0.8)',
                        border: '1px solid rgba(255, 26, 140, 0.28)',
                        color: '#F8FAFC',
                        padding: '11px 14px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: "'Space Grotesk', sans-serif"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#FF1A8C';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 26, 140, 0.3)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255, 26, 140, 0.28)';
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
                          : 'linear-gradient(135deg, #FF1A8C 0%, #FF006E 50%, #D8005A 100%)',
                        color: isFull ? '#6B5E4E' : '#12000E',
                        border: 'none',
                        padding: '11px 14px',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        boxShadow: isFull ? 'none' : '0 0 24px rgba(255, 26, 140, 0.55)',
                        cursor: isFull ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: "'Space Grotesk', sans-serif"
                      }}
                      onMouseEnter={e => {
                        if (!isFull) {
                          e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 0 32px rgba(255, 26, 140, 0.75)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isFull) {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 0 24px rgba(255, 26, 140, 0.55)';
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
              background: 'transparent',
              border: '1px solid rgba(255, 215, 0, 0.25)',
              color: '#FFD700',
              padding: '10px 24px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
              e.currentTarget.style.borderColor = '#FFD700';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.25)';
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
