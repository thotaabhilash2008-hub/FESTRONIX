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
          bg: 'linear-gradient(135deg, #00F0D0 0%, #7C3AED 50%, #C026D3 100%)',
          textColor: '#FFFFFF',
          border: '1px solid #00F0D0',
          glow: '0 0 20px rgba(0, 240, 208, 0.45)'
        };
      case 1:
        return {
          label: '#2 TRENDING',
          bg: 'linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 50%, #64748B 100%)',
          textColor: '#080611',
          border: '1px solid #FFFFFF',
          glow: '0 0 16px rgba(255, 255, 255, 0.4)'
        };
      case 2:
        return {
          label: '#3 RAPID FILL',
          bg: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)',
          textColor: '#080611',
          border: '1px solid #FFD700',
          glow: '0 0 16px rgba(255, 215, 0, 0.4)'
        };
      default:
        return {
          label: `#${index + 1} HIGH DEMAND`,
          bg: 'linear-gradient(135deg, rgba(192, 38, 211, 0.25), rgba(124, 58, 237, 0.25))',
          textColor: '#F0ABFC',
          border: '1px solid #C026D3',
          glow: '0 0 12px rgba(192, 38, 211, 0.3)'
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
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
              fontWeight: 400,
              margin: '0 0 10px 0',
              letterSpacing: '0.04em',
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
                  borderRadius: '18px',
                  background: 'rgba(18, 14, 30, 0.75)',
                  backdropFilter: 'blur(16px)',
                  border: idx === 0 ? '1px solid rgba(255, 215, 0, 0.4)' : '1px solid rgba(255, 215, 0, 0.15)',
                  boxShadow: idx === 0 ? '0 12px 35px -8px rgba(255, 215, 0, 0.15)' : '0 10px 30px -10px rgba(0, 0, 0, 0.6)',
                  position: 'relative',
                  overflow: 'hidden'
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
                        padding: '4px 10px',
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
                        gap: '4px'
                      }}
                    >
                      {idx === 0 ? <Zap size={12} fill="#0c0a14" /> : <Flame size={12} />}
                      {badge.label}
                    </span>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 215, 0, 0.08)',
                        border: '1px solid rgba(255, 215, 0, 0.2)',
                        color: '#FFD700',
                        fontFamily: "'Space Grotesk', sans-serif"
                      }}
                    >
                      {evt.departmentCode}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '1.45rem',
                      letterSpacing: '0.04em',
                      color: '#F5F0E8',
                      margin: '0 0 10px 0',
                      lineHeight: 1.2
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
                      color: '#9B8E7B',
                      marginBottom: '16px'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} color="#FFD700" />
                      {evt.date}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#A78BFA" />
                      {evt.venue.split(',')[0]}
                    </span>
                  </div>

                  {/* Prize Highlight */}
                  {evt.prizes?.first && (
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 215, 0, 0.05)',
                        border: '1px solid rgba(255, 215, 0, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '18px'
                      }}
                    >
                      <Trophy size={14} color="#FFD700" />
                      <span style={{ fontSize: '0.78rem', color: '#D4C5A9' }}>
                        1st Prize:{' '}
                        <strong style={{ color: '#FFD700', fontWeight: 700 }}>
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
                      <span style={{ color: '#FFD700', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={13} />
                        {evt.registeredCount} Enrolled
                      </span>
                      <span
                        style={{
                          color: isFull ? '#F43F5E' : spotsLeft <= 10 ? '#F59E0B' : '#9B8E7B',
                          fontWeight: 600
                        }}
                      >
                        {isFull ? 'HOUSEFULL' : `${spotsLeft} seats left (${fillPct}%)`}
                      </span>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: '6px',
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
                            : idx === 0
                            ? 'linear-gradient(90deg, #FFD700, #F59E0B)'
                            : 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => onSelectEvent(evt)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#F5F0E8',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: "'Space Grotesk', sans-serif"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#FFD700';
                        e.currentTarget.style.color = '#FFD700';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.color = '#F5F0E8';
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
                          : 'linear-gradient(135deg, #FFD700 0%, #F5A623 100%)',
                        color: isFull ? '#6B5E4E' : '#0c0a14',
                        border: 'none',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: isFull ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: "'Space Grotesk', sans-serif"
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
