import React, { useMemo } from 'react';
import { Flame, Calendar, MapPin, Trophy, Users, Zap, Rocket } from 'lucide-react';
import { FestEvent } from '../types/festronix';
import { ScrollReveal } from './animations';

interface EventsGlimpseSectionProps {
  events: FestEvent[];
  onSelectEvent: (event: FestEvent) => void;
  onRegisterEvent: (event: FestEvent) => void;
}

// Compact Event Card Component
const CompactEventCard: React.FC<{
  event: FestEvent;
  onSelect: () => void;
  onRegister: () => void;
}> = ({ event, onSelect, onRegister }) => {
  const cleanPrize = (event.prizes?.first || 'Trophy')
    .replace(/Cash Prize|Worth Prizes/gi, '')
    .trim();

  return (
    <div className="event-glimpse-card">
      {/* Top Header: Dept & Format */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span className="event-glimpse-dept-badge">{event.departmentCode || 'TECH'}</span>
        <span className="event-glimpse-format-badge">
          <Users size={11} style={{ marginRight: '3px' }} />
          {event.format === 'individual' ? 'Solo' : event.format === 'duo' ? 'Duo' : `Team (${event.minTeamSize}-${event.maxTeamSize})`}
        </span>
      </div>

      {/* Title */}
      <h4 className="event-glimpse-title" title={event.title}>
        {event.title}
      </h4>

      {/* Meta: Date & Venue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
        <div className="event-glimpse-meta">
          <Calendar size={11} color="#38BDF8" style={{ flexShrink: 0 }} />
          <span className="truncate">{event.date} • {event.time.split('(')[0].trim()}</span>
        </div>
        <div className="event-glimpse-meta">
          <MapPin size={11} color="#94A3B8" style={{ flexShrink: 0 }} />
          <span className="truncate">{event.venue}</span>
        </div>
      </div>

      {/* Prize & Fee Row */}
      <div className="event-glimpse-prize-fee">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B', fontSize: '0.74rem', fontWeight: 700 }}>
          <Trophy size={12} color="#F59E0B" />
          <span>{cleanPrize}</span>
        </div>
        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#38BDF8' }}>
          {event.fee === 0 ? 'Free Entry' : `₹${event.fee}`}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <button
          type="button"
          onClick={onSelect}
          className="event-glimpse-btn-secondary"
          title="View Rules & Full Details"
        >
          Details
        </button>
        <button
          type="button"
          onClick={onRegister}
          className="event-glimpse-btn-primary"
          title="Register for Event"
        >
          Register
        </button>
      </div>
    </div>
  );
};

export const EventsGlimpseSection: React.FC<EventsGlimpseSectionProps> = ({
  events,
  onSelectEvent,
  onRegisterEvent
}) => {
  // 1. Popular Events (sorted by registeredCount descending)
  const popularEvents = useMemo(() => {
    return [...events].sort((a, b) => b.registeredCount - a.registeredCount);
  }, [events]);

  // 2. Day 1 Events (contains '28' or 'day 1')
  const day1Events = useMemo(() => {
    return events.filter(e => {
      const dateStr = (e.date || '').toLowerCase();
      return dateStr.includes('dec 1') || dateStr.includes('1-2') || dateStr.includes('day 1');
    });
  }, [events]);

  // 3. Day 2 Events (contains '29' or 'day 2')
  const day2Events = useMemo(() => {
    return events.filter(e => {
      const dateStr = (e.date || '').toLowerCase();
      return dateStr.includes('dec 2') || dateStr.includes('1-2') || dateStr.includes('day 2');
    });
  }, [events]);

  // Ensure seamless marquee duplication (minimum 12 items, duplicated for seamless 50% loop)
  const buildMarqueeTrack = (list: FestEvent[]) => {
    if (!list || list.length === 0) return [];
    let base = [...list];
    while (base.length < 8) {
      base = [...base, ...list];
    }
    return [...base, ...base];
  };

  const marqueePopular = useMemo(() => buildMarqueeTrack(popularEvents), [popularEvents]);
  const marqueeDay1 = useMemo(() => buildMarqueeTrack(day1Events), [day1Events]);
  const marqueeDay2 = useMemo(() => buildMarqueeTrack(day2Events), [day2Events]);

  return (
    <section
      id="events"
      className="public-section events-glimpse-section"
      style={{
        padding: '70px 0 60px',
        maxWidth: '100%',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
        overflow: 'hidden'
      }}
    >
      {/* Anchor for hyped-events compatibility */}
      <div id="hyped-events" style={{ position: 'absolute', top: 0, left: 0 }} />

      {/* Section Header */}
      <ScrollReveal threshold="top 90%" duration={0.8}>
        <div style={{ textAlign: 'center', marginBottom: '36px', padding: '0 20px' }}>
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
              marginBottom: '12px'
            }}
          >
            <Zap size={14} color="#38BDF8" />
            <span>EVENT SPOTLIGHT</span>
          </div>

          <h2
            className="text-editorial-headline"
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
              fontWeight: 800,
              margin: '0 0 12px 0',
              display: 'inline-block'
            }}
          >
            FESTIVAL ARENAS & <span style={{ color: '#38BDF8' }}>COMPETITIONS</span>
          </h2>

          <p style={{ color: '#CBD5E1', maxWidth: '660px', margin: '0 auto', fontSize: 'clamp(0.92rem, 1.3vw, 1.02rem)', lineHeight: 1.6 }}>
            A glimpse into Vardhaman's flagship battlegrounds. Select any arena for full rules, prizes, and registrations.
          </p>
        </div>
      </ScrollReveal>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* SUB SECTION 1: Popular Events (Scrolling Right to Left) */}
        <div className="events-glimpse-row-wrap">
          <div className="events-glimpse-sub-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="events-glimpse-sub-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.35)' }}>
                <Flame size={15} color="#EF4444" />
              </div>
              <h3 className="events-glimpse-sub-title">Popular Events</h3>
              <span className="events-glimpse-sub-badge">High Demand</span>
            </div>
            <span className="events-glimpse-hint">Hover to pause</span>
          </div>

          <div className="events-glimpse-marquee-container">
            <div className="events-glimpse-marquee-track-rtl">
              {marqueePopular.map((event, idx) => (
                <CompactEventCard
                  key={`pop-${event.id}-${idx}`}
                  event={event}
                  onSelect={() => onSelectEvent(event)}
                  onRegister={() => onRegisterEvent(event)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* SUB SECTION 2: Day 1 (Scrolling Left to Right) */}
        <div className="events-glimpse-row-wrap">
          <div className="events-glimpse-sub-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="events-glimpse-sub-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.35)' }}>
                <Zap size={15} color="#38BDF8" />
              </div>
              <h3 className="events-glimpse-sub-title">Day 1 Arenas</h3>
              <span className="events-glimpse-sub-badge">Dec 1</span>
            </div>
            <span className="events-glimpse-hint">Hover to pause</span>
          </div>

          <div className="events-glimpse-marquee-container">
            <div className="events-glimpse-marquee-track-ltr">
              {marqueeDay1.map((event, idx) => (
                <CompactEventCard
                  key={`day1-${event.id}-${idx}`}
                  event={event}
                  onSelect={() => onSelectEvent(event)}
                  onRegister={() => onRegisterEvent(event)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* SUB SECTION 3: Day 2 (Scrolling Right to Left) */}
        <div className="events-glimpse-row-wrap">
          <div className="events-glimpse-sub-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="events-glimpse-sub-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.35)' }}>
                <Rocket size={15} color="#A855F7" />
              </div>
              <h3 className="events-glimpse-sub-title">Day 2 Arenas</h3>
              <span className="events-glimpse-sub-badge">Dec 2</span>
            </div>
            <span className="events-glimpse-hint">Hover to pause</span>
          </div>

          <div className="events-glimpse-marquee-container">
            <div className="events-glimpse-marquee-track-rtl">
              {marqueeDay2.map((event, idx) => (
                <CompactEventCard
                  key={`day2-${event.id}-${idx}`}
                  event={event}
                  onSelect={() => onSelectEvent(event)}
                  onRegister={() => onRegisterEvent(event)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
