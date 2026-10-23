import React, { useMemo } from 'react';
import { Flame, Trophy, Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { FestEvent } from '../types/festronix';
import { Tilt3DCard } from './3d';
import { ScrollReveal } from './animations';

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
          bg: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #0284C7 100%)',
          textColor: '#FFFFFF',
          border: '1px solid rgba(56, 189, 248, 0.5)',
          glow: '0 0 20px rgba(56, 189, 248, 0.4)'
        };
      case 1:
        return {
          label: '#2 TRENDING',
          bg: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          textColor: '#FFFFFF',
          border: '1px solid rgba(220, 227, 232, 0.35)',
          glow: '0 0 16px rgba(0, 0, 0, 0.6)'
        };
      case 2:
        return {
          label: '#3 RAPID FILL',
          bg: 'linear-gradient(135deg, #162136 0%, #0B132B 100%)',
          textColor: '#38BDF8',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          glow: '0 0 14px rgba(56, 189, 248, 0.25)'
        };
      default:
        return {
          label: `#${index + 1} HIGH DEMAND`,
          bg: 'linear-gradient(135deg, #151820 0%, #0E1017 100%)',
          textColor: '#CBD5E1',
          border: '1px solid rgba(199, 203, 212, 0.2)',
          glow: 'none'
        };
    }
  };

  return (
    <section
      id="hyped-events"
      style={{
        padding: '90px 20px 60px',
        maxWidth: '1280px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Editorial Header */}
        <ScrollReveal threshold="top 90%" duration={0.8}>
          <div style={{ textAlign: 'center', marginBottom: '46px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 18px',
                borderRadius: '9999px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38BDF8',
                fontSize: '0.75rem',
                fontWeight: 800,
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '0.14em',
                marginBottom: '12px',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.2)'
              }}
            >
              <Flame size={14} color="#38BDF8" />
              <span>02 // REAL-TIME AUDIENCE LEADERBOARD</span>
            </div>

            <h2
              className="text-editorial-headline"
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                fontWeight: 800,
                margin: '0 0 14px 0',
                display: 'inline-block'
              }}
            >
              TOP HYPED <span style={{ color: '#38BDF8', textShadow: '0 0 24px rgba(56, 189, 248, 0.5)' }}>COMPETITIVE ARENAS</span>
            </h2>

            <p
              style={{
                color: '#CBD5E1',
                maxWidth: '660px',
                margin: '0 auto',
                fontSize: 'clamp(0.96rem, 1.4vw, 1.08rem)',
                lineHeight: 1.7,
                textShadow: '0 1px 4px rgba(0,0,0,0.8)'
              }}
            >
              Ranked live by validated student registrations across all 9 engineering faculties.
              Capacity limits strictly enforced by the jury.
            </p>
          </div>
        </ScrollReveal>

        {/* Hyped Grid with 3D Tilt */}
        <ScrollReveal threshold="top 85%" stagger={0.12} duration={0.8}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '36px'
            }}
          >
            {hypedEvents.map((evt, idx) => {
              const badge = getRankBadge(idx);
              const fillPct = Math.min(100, Math.round((evt.registeredCount / evt.capacity) * 100));
              const spotsLeft = Math.max(0, evt.capacity - evt.registeredCount);
              const isFull = evt.registeredCount >= evt.capacity || evt.status === 'full';

              return (
                <Tilt3DCard key={evt.id} maxTilt={5} scale={1.02}>
                  <div
                    className="cyber-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '28px',
                      borderRadius: '20px',
                      background: 'rgba(15, 22, 38, 0.94)',
                      border: '1px solid rgba(148, 163, 184, 0.22)',
                      boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.9)',
                      backdropFilter: 'blur(20px)',
                      height: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Top Rank Header */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '16px'
                        }}
                      >
                        <span
                          style={{
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            fontSize: '0.74rem',
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
                          <Flame size={13} fill="#FFFFFF" color="#FFFFFF" />
                          {badge.label}
                        </span>

                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            padding: '5px 12px',
                            borderRadius: '6px',
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38BDF8',
                            fontFamily: "'Space Grotesk', sans-serif"
                          }}
                        >
                          {evt.departmentCode}
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          letterSpacing: '-0.02em',
                          color: '#FFFFFF',
                          margin: '0 0 12px 0',
                          lineHeight: 1.3
                        }}
                      >
                        {evt.title}
                      </h3>

                      {/* Metadata */}
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '14px',
                          fontSize: '0.8rem',
                          color: '#CBD5E1',
                          marginBottom: '18px'
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="#94A3B8" />
                          {evt.date}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={13} color="#38BDF8" />
                          {evt.venue.split(',')[0]}
                        </span>
                      </div>

                      {/* Prize Highlight */}
                      {evt.prizes?.first && (
                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            background: 'rgba(8, 12, 22, 0.85)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '20px'
                          }}
                        >
                          <Trophy size={16} color="#FBBF24" />
                          <span style={{ fontSize: '0.82rem', color: '#E2E8F0' }}>
                            1st Prize:{' '}
                            <strong style={{ color: '#FBBF24', fontWeight: 800 }}>
                              {evt.prizes.first}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress & Actions */}
                    <div>
                      <div style={{ marginBottom: '18px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.78rem',
                            marginBottom: '6px'
                          }}
                        >
                          <span style={{ color: '#E2E8F0', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Users size={13} color="#38BDF8" />
                            {evt.registeredCount} Enrolled
                          </span>
                          <span style={{ color: isFull ? '#FB7185' : '#CBD5E1', fontWeight: 600 }}>
                            {isFull ? 'CAPACITY REACHED' : `${spotsLeft} slots left (${fillPct}%)`}
                          </span>
                        </div>

                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            borderRadius: '9999px',
                            background: 'rgba(8, 12, 22, 0.9)',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: `${fillPct}%`,
                              height: '100%',
                              background: isFull
                                ? '#FB7185'
                                : 'linear-gradient(90deg, #1E3A8A 0%, #2563EB 50%, #38BDF8 100%)',
                              boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
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
                          className="btn-cyber-secondary"
                          style={{
                            padding: '11px 12px',
                            fontSize: '0.82rem',
                            justifyContent: 'center',
                            width: '100%'
                          }}
                        >
                          View Details
                        </button>

                        <button
                          onClick={() => onRegisterEvent(evt)}
                          disabled={isFull}
                          className={isFull ? 'btn-cyber-secondary' : 'btn-cyber-gold'}
                          style={{
                            padding: '11px 12px',
                            fontSize: '0.84rem',
                            justifyContent: 'center',
                            width: '100%',
                            cursor: isFull ? 'not-allowed' : 'pointer',
                            opacity: isFull ? 0.4 : 1
                          }}
                        >
                          {isFull ? 'Sold Out' : evt.fee === 0 ? 'Register Free' : `₹${evt.fee} Register`}
                        </button>
                      </div>
                    </div>
                  </div>
                </Tilt3DCard>
              );
            })}
          </div>
        </ScrollReveal>

        {/* View All Prompt */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onExploreAll}
            className="btn-cyber-primary"
            style={{
              padding: '12px 28px',
              fontSize: '0.88rem'
            }}
          >
            <span>Explore All 30+ Arenas in Catalog</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HypedEventsSection;
