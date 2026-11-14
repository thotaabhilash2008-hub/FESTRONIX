import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Code2,
  Crown,
  Gamepad2,
  Inbox,
  LayoutGrid,
  List,
  Layers,
  MapPin,
  Presentation,
  Search,
  Ticket,
  Users,
  Wrench,
  X
} from 'lucide-react';
import { FestEvent } from '../types/festronix';
import { DEPARTMENTS } from '../data/mockData';
import { getEventRegistrationBlockReason } from '../lib/eventRegistration';
import { isEventOnDay } from './EventCatalog';
import { Footer } from './Footer';

interface AllEventsPageProps {
  events: FestEvent[];
  passesCount: number;
  onBackToHome: () => void;
  onSelectEvent: (event: FestEvent) => void;
  onRegisterEvent: (event: FestEvent) => void;
  onOpenMultiPass: () => void;
  onOpenPasses: () => void;
  onOpenAdmin?: () => void;
  onOpenSponsors?: () => void;
}

type DayFilter = 'all' | '1' | '2';
type SortOption = 'popular' | 'alpha' | 'fee-asc' | 'fee-desc';
type LayoutMode = 'grid' | 'grouped' | 'list';

function getDayText(dateStr: string | undefined): string {
  if (!dateStr) return 'Dec 1–2';
  const d = dateStr.toLowerCase();
  if (d.includes('1-2') || d.includes('28-29') || d.includes('both')) return 'Day 1 & 2 (Dec 1–2)';
  if (d.includes('dec 1') || d.includes('28') || d.includes('day 1') || d.includes('day-1') || d.includes('day1')) return 'Day 1 · Dec 1';
  if (d.includes('dec 2') || d.includes('29') || d.includes('day 2') || d.includes('day-2') || d.includes('day2')) return 'Day 2 · Dec 2';
  return dateStr.split(',')[0].trim();
}

function getCategoryLabel(category: FestEvent['category']): string {
  switch (category) {
    case 'hackathon':
      return 'Hackathon';
    case 'technical':
      return 'Technical';
    case 'workshop':
      return 'Workshop';
    case 'gaming':
      return 'E-Sports';
    case 'non-technical':
      return 'Non-Tech';
    case 'departmental':
      return 'Departmental';
    default:
      return category;
  }
}

export const AllEventsPage: React.FC<AllEventsPageProps> = ({
  events,
  passesCount,
  onBackToHome,
  onSelectEvent,
  onRegisterEvent,
  onOpenMultiPass,
  onOpenPasses,
  onOpenAdmin,
  onOpenSponsors
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDay, setSelectedDay] = useState<DayFilter>('all');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');

  const departmentOptions = useMemo(() => {
    const knownCodes = new Set(DEPARTMENTS.map(d => d.code.toUpperCase()));
    const extraCodes = [...new Set(events.map(e => e.departmentCode.trim()).filter(Boolean))]
      .filter(code => !knownCodes.has(code.toUpperCase()))
      .sort((a, b) => a.localeCompare(b));

    return [
      ...DEPARTMENTS.map(d => ({ code: d.code, name: d.name })),
      ...extraCodes.map(code => ({
        code,
        name: code.toUpperCase() === 'SAC' ? 'Student Activity Council' : `${code} Events`
      }))
    ];
  }, [events]);

  const categories = [
    { key: 'all', label: 'All', icon: <LayoutGrid size={14} /> },
    { key: 'hackathon', label: 'Hackathons', icon: <Code2 size={14} /> },
    { key: 'technical', label: 'Technical', icon: <Wrench size={14} /> },
    { key: 'workshop', label: 'Workshops', icon: <Presentation size={14} /> },
    { key: 'gaming', label: 'E-Sports', icon: <Gamepad2 size={14} /> },
    { key: 'non-technical', label: 'Non-Tech', icon: <Users size={14} /> }
  ];

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = events.filter(evt => {
      const matchesSearch =
        !q ||
        evt.title.toLowerCase().includes(q) ||
        evt.description.toLowerCase().includes(q) ||
        evt.departmentCode.toLowerCase().includes(q) ||
        evt.venue.toLowerCase().includes(q) ||
        evt.coordinatorName.toLowerCase().includes(q);

      const matchesDept = selectedDept === 'all' || evt.departmentCode === selectedDept;
      const matchesCategory = selectedCategory === 'all' || evt.category === selectedCategory;
      const matchesFormat = selectedFormat === 'all' || evt.format === selectedFormat;
      const matchesDay = isEventOnDay(evt.date, selectedDay);

      return matchesSearch && matchesDept && matchesCategory && matchesFormat && matchesDay;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'alpha') return a.title.localeCompare(b.title);
      if (sortBy === 'fee-asc') return a.fee - b.fee;
      if (sortBy === 'fee-desc') return b.fee - a.fee;
      return b.registeredCount - a.registeredCount;
    });
  }, [events, searchQuery, selectedDept, selectedCategory, selectedFormat, selectedDay, sortBy]);

  const groupedByDept = useMemo(() => {
    const map = new Map<string, { code: string; name: string; items: FestEvent[] }>();
    const nameLookup = new Map(departmentOptions.map(d => [d.code, d.name]));

    filteredEvents.forEach(evt => {
      const code = evt.departmentCode || 'GENERAL';
      if (!map.has(code)) {
        map.set(code, {
          code,
          name: nameLookup.get(code) || `${code} Department`,
          items: []
        });
      }
      map.get(code)!.items.push(evt);
    });

    return Array.from(map.values());
  }, [filteredEvents, departmentOptions]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedDept !== 'all' ||
    selectedCategory !== 'all' ||
    selectedDay !== 'all' ||
    selectedFormat !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDept('all');
    setSelectedCategory('all');
    setSelectedDay('all');
    setSelectedFormat('all');
  };

  const renderEventCard = (event: FestEvent) => {
    const seatsRemaining = Math.max(0, event.capacity - event.registeredCount);
    const isFull = event.status === 'full' || seatsRemaining === 0;
    const blockReason = getEventRegistrationBlockReason(event);
    const isBlocked = Boolean(blockReason);

    return (
      <article
        key={event.id}
        className="cyber-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '22px',
          background: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '14px'
        }}
      >
        <div>
          {/* Clean Unboxed Metadata Line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              marginBottom: '12px',
              fontSize: '0.76rem',
              fontWeight: 600
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', minWidth: 0, flexWrap: 'wrap' }}>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>{event.departmentCode}</span>
              <span aria-hidden="true">·</span>
              <span>{getDayText(event.date)}</span>
              <span aria-hidden="true">·</span>
              <span>{getCategoryLabel(event.category)}</span>
            </div>

            <span
              style={{
                color: isFull ? '#FB7185' : isBlocked ? '#FBBF24' : '#34D399',
                fontWeight: 700,
                fontSize: '0.74rem',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {isFull ? 'Full' : isBlocked ? 'Closed' : 'Open'}
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: '0 0 8px 0',
              lineHeight: 1.25
            }}
          >
            {event.title}
          </h3>

          {/* Description */}
          <p
            style={{
              fontSize: '0.86rem',
              color: '#CBD5E1',
              lineHeight: 1.55,
              margin: '0 0 16px 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {event.description}
          </p>

          {/* Schedule, Venue, Team Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '16px', fontSize: '0.8rem', color: '#E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={14} color="#38BDF8" style={{ flexShrink: 0 }} />
              <span className="truncate">{event.date} · {event.time}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} color="#38BDF8" style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {event.venue}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={14} color="#38BDF8" style={{ flexShrink: 0 }} />
              <span>
                {event.format === 'individual'
                  ? 'Solo Entry'
                  : event.format === 'duo'
                  ? 'Duo (2 Members)'
                  : `Team (${event.minTeamSize}–${event.maxTeamSize} Members)`}
              </span>
              <span aria-hidden="true" style={{ color: '#64748B' }}>·</span>
              <span style={{ color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>
                {seatsRemaining} / {event.capacity} seats left
              </span>
            </div>
          </div>

          {/* 1st Prize */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 12px',
              borderRadius: '8px',
              background: '#162238',
              border: '1px solid #1E293B',
              marginBottom: '18px'
            }}
          >
            <Crown size={14} color="#FBBF24" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: '#FBBF24', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              1st Prize: {event.prizes?.first || 'Trophy & Certificate'}
            </span>
          </div>
        </div>

        {/* Bottom Pricing & Actions */}
        <div
          style={{
            borderTop: '1px solid rgba(220, 227, 232, 0.1)',
            paddingTop: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>Entry Fee</div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: event.fee === 0 ? '#34D399' : '#FFFFFF',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {event.fee === 0 ? 'FREE' : `₹${event.fee}`}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onSelectEvent(event)}
              className="btn-cyber-secondary"
              style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => !isBlocked && onRegisterEvent(event)}
              disabled={isBlocked}
              className={isBlocked ? 'btn-cyber-secondary' : 'btn-cyber-gold'}
              style={{
                padding: '8px 16px',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                opacity: isBlocked ? 0.55 : 1,
                cursor: isBlocked ? 'not-allowed' : 'pointer'
              }}
              title={blockReason || `Register for ${event.title}`}
            >
              <span>{isFull ? 'Full' : isBlocked ? 'Closed' : 'Register'}</span>
              {!isBlocked && <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderEventRow = (event: FestEvent) => {
    const seatsRemaining = Math.max(0, event.capacity - event.registeredCount);
    const isFull = event.status === 'full' || seatsRemaining === 0;
    const blockReason = getEventRegistrationBlockReason(event);
    const isBlocked = Boolean(blockReason);

    return (
      <div
        key={event.id}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 2fr) minmax(140px, 1.2fr) minmax(130px, 1fr) minmax(120px, 0.9fr) auto',
          gap: '16px',
          alignItems: 'center',
          padding: '16px 20px',
          background: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '12px'
        }}
        className="all-events-list-row"
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#38BDF8', fontWeight: 700 }}>{event.departmentCode}</span>
            <span aria-hidden="true">·</span>
            <span>{getCategoryLabel(event.category)}</span>
            <span aria-hidden="true">·</span>
            <span style={{ color: isFull ? '#FB7185' : isBlocked ? '#FBBF24' : '#34D399', fontWeight: 700 }}>
              {isFull ? 'Full' : isBlocked ? 'Closed' : 'Open'}
            </span>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.title}
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#CBD5E1', minWidth: 0 }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getDayText(event.date)}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.venue}</div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
          <div>
            {event.format === 'individual'
              ? 'Solo'
              : event.format === 'duo'
              ? 'Duo (2)'
              : `Team (${event.minTeamSize}–${event.maxTeamSize})`}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>
            {seatsRemaining}/{event.capacity} seats
          </div>
        </div>

        <div style={{ fontVariantNumeric: 'tabular-nums' }}>
          <div style={{ fontSize: '0.98rem', fontWeight: 800, color: event.fee === 0 ? '#34D399' : '#FFFFFF' }}>
            {event.fee === 0 ? 'FREE' : `₹${event.fee}`}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#FBBF24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
            {event.prizes?.first || 'Trophy'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => onSelectEvent(event)}
            className="btn-cyber-secondary"
            style={{ padding: '7px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => !isBlocked && onRegisterEvent(event)}
            disabled={isBlocked}
            className={isBlocked ? 'btn-cyber-secondary' : 'btn-cyber-gold'}
            style={{
              padding: '7px 14px',
              fontSize: '0.78rem',
              whiteSpace: 'nowrap',
              opacity: isBlocked ? 0.55 : 1,
              cursor: isBlocked ? 'not-allowed' : 'pointer'
            }}
          >
            {isFull ? 'Full' : isBlocked ? 'Closed' : 'Register'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080C16',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Sticky Bar (3-Zone Layout) */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(8, 12, 22, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(220, 227, 232, 0.12)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={onBackToHome}
            className="btn-cyber-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/vce_logo.png"
              alt="Vardhaman College of Engineering"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#FFFFFF',
                whiteSpace: 'nowrap'
              }}
            >
              FESTRONIX '26
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onOpenMultiPass}
            className="btn-cyber-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            <Layers size={14} color="#38BDF8" />
            <span>Multiple Passes</span>
          </button>

          <button
            type="button"
            onClick={onOpenPasses}
            className="btn-cyber-gold"
            style={{ padding: '8px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            <Ticket size={14} />
            <span>My Passes{passesCount > 0 ? ` (${passesCount})` : ''}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, width: '100%', maxWidth: '1320px', margin: '0 auto', padding: '36px 24px 72px' }}>
        {/* Page Heading */}
        <section style={{ marginBottom: '28px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.78rem',
              color: '#94A3B8',
              marginBottom: '10px',
              fontWeight: 600
            }}
          >
            <span style={{ color: '#38BDF8', fontWeight: 700 }}>All Festival Arenas</span>
            <span aria-hidden="true">·</span>
            <span>Dec 1–2, 2026</span>
            <span aria-hidden="true">·</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{events.length} Total Events</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.1,
              margin: '0 0 10px 0',
              textWrap: 'balance'
            }}
          >
            Browse All Events at Once
          </h1>

          <p style={{ color: '#CBD5E1', maxWidth: '720px', fontSize: '0.98rem', lineHeight: 1.6, margin: 0 }}>
            Every hackathon, technical competition, workshop, e-sports tournament, and non-technical challenge in one searchable catalog.
          </p>
        </section>

        {/* Filter & View Controls */}
        <section
          aria-label="Filter and sort events"
          style={{
            background: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '14px',
            padding: '18px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {/* Row 1: Search + Department Select + Sort + Layout Switcher */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            <div className="all-events-search-wrap" style={{ position: 'relative', gridColumn: 'span 2' }}>
              <Search
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by event name, department, venue, or coordinator..."
                aria-label="Search events"
                className="cyber-input"
                style={{
                  paddingLeft: '40px',
                  paddingRight: searchQuery ? '36px' : '14px',
                  height: '42px',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  background: '#080C16',
                  border: '1px solid #334155'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              aria-label="Filter by department"
              className="cyber-input"
              style={{
                height: '42px',
                padding: '0 12px',
                borderRadius: '8px',
                fontSize: '0.86rem',
                background: '#080C16',
                border: '1px solid #334155'
              }}
            >
              <option value="all">All Departments ({events.length})</option>
              {departmentOptions.map(dept => {
                const count = events.filter(e => e.departmentCode === dept.code).length;
                return (
                  <option key={dept.code} value={dept.code}>
                    {dept.code} — {dept.name} ({count})
                  </option>
                );
              })}
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              aria-label="Sort events"
              className="cyber-input"
              style={{
                height: '42px',
                padding: '0 12px',
                borderRadius: '8px',
                fontSize: '0.86rem',
                background: '#080C16',
                border: '1px solid #334155'
              }}
            >
              <option value="popular">Sort: Most Popular</option>
              <option value="alpha">Sort: Name (A–Z)</option>
              <option value="fee-asc">Sort: Entry Fee (Low to High)</option>
              <option value="fee-desc">Sort: Entry Fee (High to Low)</option>
            </select>
          </div>

          {/* Row 2: Category Tabs, Day Tabs, Format Tabs, Layout Mode */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Category Tabs */}
            <div className="all-events-categories-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {categories.map(cat => {
                const active = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: active ? '1px solid #38BDF8' : '1px solid #1E293B',
                      background: active ? 'rgba(56, 189, 248, 0.16)' : '#162238',
                      color: active ? '#FFFFFF' : '#CBD5E1',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Day + Format + View Switcher */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              {/* Day Segmented Control */}
              <div style={{ display: 'inline-flex', background: '#080C16', border: '1px solid #1E293B', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                {([
                  { key: 'all', label: 'All Days' },
                  { key: '1', label: 'Day 1' },
                  { key: '2', label: 'Day 2' }
                ] as { key: DayFilter; label: string }[]).map(d => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSelectedDay(d.key)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: selectedDay === d.key ? '#2563EB' : 'transparent',
                      color: selectedDay === d.key ? '#FFFFFF' : '#94A3B8',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Format Segmented Control */}
              <div style={{ display: 'inline-flex', background: '#080C16', border: '1px solid #1E293B', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                {[
                  { key: 'all', label: 'All Formats' },
                  { key: 'individual', label: 'Solo' },
                  { key: 'duo', label: 'Duo' },
                  { key: 'team', label: 'Team' }
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setSelectedFormat(f.key)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: selectedFormat === f.key ? '#2563EB' : 'transparent',
                      color: selectedFormat === f.key ? '#FFFFFF' : '#94A3B8',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Layout Mode Switcher */}
              <div style={{ display: 'inline-flex', background: '#080C16', border: '1px solid #1E293B', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setLayoutMode('grid')}
                  title="Grid View"
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: layoutMode === 'grid' ? '#1E293B' : 'transparent',
                    color: layoutMode === 'grid' ? '#38BDF8' : '#94A3B8',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <LayoutGrid size={13} />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('grouped')}
                  title="Group by Department"
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: layoutMode === 'grouped' ? '#1E293B' : 'transparent',
                    color: layoutMode === 'grouped' ? '#38BDF8' : '#94A3B8',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Layers size={13} />
                  <span>By Dept</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('list')}
                  title="Compact List View"
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: layoutMode === 'list' ? '#1E293B' : 'transparent',
                    color: layoutMode === 'list' ? '#38BDF8' : '#94A3B8',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <List size={13} />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Results Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(220, 227, 232, 0.08)',
              fontSize: '0.82rem',
              color: '#CBD5E1'
            }}
          >
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              Showing <strong style={{ color: '#FFFFFF' }}>{filteredEvents.length}</strong> of {events.length} events
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  color: '#38BDF8',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <X size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </section>

        {/* Events Display */}
        {events.length === 0 ? (
          <div
            className="cyber-card"
            style={{ padding: '64px 24px', textAlign: 'center', color: '#94A3B8' }}
          >
            <h2 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '8px' }}>
              Loading Festival Events...
            </h2>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>
              Fetching the complete FESTRONIX 2026 event schedule.
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div
            className="cyber-card"
            style={{ padding: '64px 24px', textAlign: 'center', color: '#94A3B8' }}
          >
            <Inbox size={40} color="#38BDF8" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '8px' }}>
              No Matching Events Found
            </h2>
            <p style={{ fontSize: '0.9rem', marginBottom: '18px' }}>
              Try clearing a filter or searching with another keyword.
            </p>
            <button type="button" onClick={resetFilters} className="btn-cyber-gold">
              Show All Events
            </button>
          </div>
        ) : layoutMode === 'grouped' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            {groupedByDept.map(group => (
              <section key={group.code}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: '12px',
                    paddingBottom: '12px',
                    marginBottom: '18px',
                    borderBottom: '1px solid rgba(220, 227, 232, 0.12)'
                  }}
                >
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {group.code} · {group.name}
                    </h2>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#38BDF8', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {group.items.length} {group.items.length === 1 ? 'Event' : 'Events'}
                  </span>
                </div>

                <div
                  className="all-events-cards-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                    gap: '18px'
                  }}
                >
                  {group.items.map(renderEventCard)}
                </div>
              </section>
            ))}
          </div>
        ) : layoutMode === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredEvents.map(renderEventRow)}
          </div>
        ) : (
          <div
            className="all-events-cards-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: '18px'
            }}
          >
            {filteredEvents.map(renderEventCard)}
          </div>
        )}
      </main>

      <Footer onOpenAdmin={onOpenAdmin} onOpenSponsors={onOpenSponsors} />
    </div>
  );
};

export default AllEventsPage;
