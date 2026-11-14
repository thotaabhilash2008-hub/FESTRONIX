import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  Flame,
  Calendar,
  MapPin,
  Trophy,
  Users,
  Zap,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ArrowRight,
  LayoutGrid
} from 'lucide-react';
import { FestEvent } from '../types/festronix';
import { ScrollReveal } from './animations';

interface EventsGlimpseSectionProps {
  events: FestEvent[];
  onSelectEvent: (event: FestEvent) => void;
  onRegisterEvent: (event: FestEvent) => void;
  onViewAllEvents?: () => void;
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
          onClick={e => {
            e.stopPropagation();
            onSelect();
          }}
          className="event-glimpse-btn-secondary"
          title="View Rules & Full Details"
        >
          Details
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onRegister();
          }}
          className="event-glimpse-btn-primary"
          title="Register for Event"
        >
          Register
        </button>
      </div>
    </div>
  );
};

// Interactive Sliding Row with Full User Scroll, Drag, Arrow Buttons, and Auto-Slide
interface InteractiveRowProps {
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  title: string;
  badge: string;
  events: FestEvent[];
  direction?: 'rtl' | 'ltr';
  speed?: number;
  onSelectEvent: (event: FestEvent) => void;
  onRegisterEvent: (event: FestEvent) => void;
}

const InteractiveGlimpseRow: React.FC<InteractiveRowProps> = ({
  icon,
  iconBg,
  iconBorder,
  title,
  badge,
  events,
  direction = 'rtl',
  speed = 0.75,
  onSelectEvent,
  onRegisterEvent
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Drag tracking refs
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragDistRef = useRef(0);
  const wasDraggingRef = useRef(false);

  // User manual interaction timeout (pauses auto-scroll while user is actively scrolling)
  const userInteractingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserScrollingRef = useRef(false);

  // Duplicated list to enable infinite seamless loop
  const displayEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    let base = [...events];
    while (base.length < 8) {
      base = [...base, ...events];
    }
    return [...base, ...base];
  }, [events]);

  // Initial scroll position setup for LTR so it has room to scroll backwards
  useEffect(() => {
    const el = containerRef.current;
    if (el && direction === 'ltr') {
      const half = el.scrollWidth / 2;
      if (half > 0) {
        el.scrollLeft = half;
      }
    }
  }, [direction, displayEvents]);

  // Helper to mark user as active and pause auto-slide
  const registerUserActivity = useCallback(() => {
    isUserScrollingRef.current = true;
    if (userInteractingTimeoutRef.current) {
      clearTimeout(userInteractingTimeoutRef.current);
    }
    // Resume auto-slide after 3.5s of no user input
    userInteractingTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 3500);
  }, []);

  // Smooth Auto-Slide Loop with Wrap-around
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const el = containerRef.current;
      if (el && isAutoPlaying && !isHovered && !isMouseDownRef.current && !isUserScrollingRef.current) {
        const half = el.scrollWidth / 2;
        if (half > 0) {
          if (direction === 'rtl') {
            el.scrollLeft += speed;
            if (el.scrollLeft >= half) {
              el.scrollLeft -= half;
            }
          } else {
            el.scrollLeft -= speed;
            if (el.scrollLeft <= 0) {
              el.scrollLeft += half;
            }
          }
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isAutoPlaying, isHovered, direction, speed]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    isMouseDownRef.current = true;
    setIsDragging(true);
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    dragDistRef.current = 0;
    registerUserActivity();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    dragDistRef.current += Math.abs(walk);
    el.scrollLeft = scrollLeftRef.current - walk;

    // Infinite wrap check during drag
    const half = el.scrollWidth / 2;
    if (half > 0) {
      if (el.scrollLeft >= half) {
        el.scrollLeft -= half;
        scrollLeftRef.current -= half;
      } else if (el.scrollLeft <= 0) {
        el.scrollLeft += half;
        scrollLeftRef.current += half;
      }
    }
    registerUserActivity();
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    setIsDragging(false);
    if (dragDistRef.current > 6) {
      wasDraggingRef.current = true;
      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 180);
    }
    registerUserActivity();
  };

  // Touch handlers
  const handleTouchStart = () => {
    registerUserActivity();
  };

  const handleTouchMove = () => {
    const el = containerRef.current;
    if (el) {
      const half = el.scrollWidth / 2;
      if (half > 0) {
        if (el.scrollLeft >= half) {
          el.scrollLeft -= half;
        } else if (el.scrollLeft <= 0) {
          el.scrollLeft += half;
        }
      }
    }
    registerUserActivity();
  };

  // Wheel scroll handler
  const handleWheel = (e: React.WheelEvent) => {
    registerUserActivity();
    const el = containerRef.current;
    if (!el) return;
    // If user is scrolling horizontally, or shift-scrolling
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const half = el.scrollWidth / 2;
      if (half > 0) {
        if (el.scrollLeft >= half) el.scrollLeft -= half;
        else if (el.scrollLeft <= 0) el.scrollLeft += half;
      }
    }
  };

  // Arrow button navigation (slides by ~280px, one card width)
  const slideBy = (amount: number) => {
    registerUserActivity();
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });

    // Handle wrap after smooth scroll finishes
    setTimeout(() => {
      if (!el) return;
      const half = el.scrollWidth / 2;
      if (half > 0) {
        if (el.scrollLeft >= half) el.scrollLeft -= half;
        else if (el.scrollLeft <= 0) el.scrollLeft += half;
      }
    }, 350);
  };

  if (!events || events.length === 0) return null;

  return (
    <div className="events-glimpse-row-wrap">
      {/* Sub Header: Title, Badge, Controls */}
      <div className="events-glimpse-sub-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="events-glimpse-sub-icon" style={{ background: iconBg, borderColor: iconBorder }}>
            {icon}
          </div>
          <h3 className="events-glimpse-sub-title">{title}</h3>
          <span className="events-glimpse-sub-badge">{badge}</span>
        </div>

        {/* User Interactive Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="events-glimpse-hint" style={{ marginRight: '4px' }}>
            {isAutoPlaying ? 'Swipe or drag to scroll' : 'Manual mode'}
          </span>

          {/* Auto-Slide Toggle Button */}
          <button
            type="button"
            onClick={() => setIsAutoPlaying(prev => !prev)}
            className={`events-glimpse-toggle-btn ${isAutoPlaying ? 'active' : ''}`}
            title={isAutoPlaying ? 'Pause automatic slide' : 'Resume automatic slide'}
          >
            {isAutoPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isAutoPlaying ? 'Auto' : 'Paused'}</span>
          </button>

          {/* Slide Left Button */}
          <button
            type="button"
            onClick={() => slideBy(-280)}
            className="events-glimpse-nav-btn"
            title="Slide Left"
            aria-label="Slide Left"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Slide Right Button */}
          <button
            type="button"
            onClick={() => slideBy(280)}
            className="events-glimpse-nav-btn"
            title="Slide Right"
            aria-label="Slide Right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Interactive Horizontal Scroll & Drag Track */}
      <div className="events-glimpse-interactive-wrapper">
        <div
          ref={containerRef}
          className="events-glimpse-scroll-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            if (isMouseDownRef.current) handleMouseUp();
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onWheel={handleWheel}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          <div className="events-glimpse-scroll-track">
            {displayEvents.map((event, idx) => (
              <CompactEventCard
                key={`${title}-${event.id}-${idx}`}
                event={event}
                onSelect={() => {
                  if (!wasDraggingRef.current) {
                    onSelectEvent(event);
                  }
                }}
                onRegister={() => {
                  if (!wasDraggingRef.current) {
                    onRegisterEvent(event);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const EventsGlimpseSection: React.FC<EventsGlimpseSectionProps> = ({
  events,
  onSelectEvent,
  onRegisterEvent,
  onViewAllEvents
}) => {
  // 1. Popular Events (sorted by registeredCount descending)
  const popularEvents = useMemo(() => {
    return [...events].sort((a, b) => b.registeredCount - a.registeredCount);
  }, [events]);

  // 2. Day 1 Events
  const day1Events = useMemo(() => {
    return events.filter(e => {
      const dateStr = (e.date || '').toLowerCase();
      return dateStr.includes('dec 1') || dateStr.includes('1-2') || dateStr.includes('day 1');
    });
  }, [events]);

  // 3. Day 2 Events
  const day2Events = useMemo(() => {
    return events.filter(e => {
      const dateStr = (e.date || '').toLowerCase();
      return dateStr.includes('dec 2') || dateStr.includes('1-2') || dateStr.includes('day 2');
    });
  }, [events]);

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

          {onViewAllEvents && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={onViewAllEvents}
                className="btn-cyber-gold"
                style={{
                  padding: '11px 24px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  whiteSpace: 'nowrap'
                }}
              >
                <LayoutGrid size={16} />
                <span>Browse Events{events.length > 0 ? ` (${events.length})` : ''}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </ScrollReveal>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>
        {/* SUB SECTION 1: Popular Events (Right to Left slide, with full user manual scroll/drag) */}
        <InteractiveGlimpseRow
          icon={<Flame size={15} color="#EF4444" />}
          iconBg="rgba(239, 68, 68, 0.15)"
          iconBorder="rgba(239, 68, 68, 0.35)"
          title="Popular Events"
          badge="High Demand"
          events={popularEvents}
          direction="rtl"
          speed={0.8}
          onSelectEvent={onSelectEvent}
          onRegisterEvent={onRegisterEvent}
        />

        {/* SUB SECTION 2: Day 1 Arenas (Left to Right slide, with full user manual scroll/drag) */}
        <InteractiveGlimpseRow
          icon={<Zap size={15} color="#38BDF8" />}
          iconBg="rgba(56, 189, 248, 0.15)"
          iconBorder="rgba(56, 189, 248, 0.35)"
          title="Day 1 Arenas"
          badge="Dec 1"
          events={day1Events}
          direction="ltr"
          speed={0.8}
          onSelectEvent={onSelectEvent}
          onRegisterEvent={onRegisterEvent}
        />

        {/* SUB SECTION 3: Day 2 Arenas (Right to Left slide, with full user manual scroll/drag) */}
        <InteractiveGlimpseRow
          icon={<Rocket size={15} color="#A855F7" />}
          iconBg="rgba(168, 85, 247, 0.15)"
          iconBorder="rgba(168, 85, 247, 0.35)"
          title="Day 2 Arenas"
          badge="Dec 2"
          events={day2Events}
          direction="rtl"
          speed={0.8}
          onSelectEvent={onSelectEvent}
          onRegisterEvent={onRegisterEvent}
        />
      </div>

      {onViewAllEvents && (
        <div style={{ marginTop: '36px', display: 'flex', justifyContent: 'center', padding: '0 20px' }}>
          <button
            type="button"
            onClick={onViewAllEvents}
            className="btn-cyber-primary"
            style={{
              padding: '12px 26px',
              fontSize: '0.9rem',
              fontWeight: 700,
              borderRadius: '10px',
              whiteSpace: 'nowrap'
            }}
          >
            <LayoutGrid size={16} color="#38BDF8" />
            <span>Browse Events{events.length > 0 ? ` (${events.length})` : ''}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </section>
  );
};

export default EventsGlimpseSection;
