import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Filter,
  X,
  Calendar,
  MapPin,
  Users,
  Trophy,
  ArrowRight,
  Zap,
  Flame,
  Rocket,
  ChevronDown,
  Clock,
  Phone,
  Mail,
  Shield
} from 'lucide-react';
import { FestEvent } from '../types/festronix';
import { getEventRegistrationBlockReason } from '../lib/eventRegistration';

interface EventsPageProps {
  events: FestEvent[];
  onBackToHome: () => void;
  onSelectEvent: (event: FestEvent) => void;
  onRegisterEvent: (event: FestEvent) => void;
}

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Events',
  technical: 'Technical',
  workshop: 'Workshop',
  hackathon: 'Hackathon',
  'non-technical': 'Non-Technical',
  gaming: 'Gaming',
  departmental: 'Departmental'
};

// Day filter
const DAY_OPTIONS = [
  { value: 'all', label: 'Both Days' },
  { value: '1', label: 'Dec 1 (Day 1)' },
  { value: '2', label: 'Dec 2 (Day 2)' }
];

// Format filter
const FORMAT_OPTIONS = [
  { value: 'all', label: 'All Formats' },
  { value: 'individual', label: 'Solo' },
  { value: 'duo', label: 'Duo' },
  { value: 'team', label: 'Team' }
];

// Status badge color helper
const getStatusStyle = (event: FestEvent) => {
  const isFull = event.status === 'full' || event.registeredCount >= event.capacity;
  if (isFull) return { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#f87171', label: 'Full' };
  if (event.status === 'closed') return { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.4)', text: '#94A3B8', label: 'Closed' };
  if (event.fee === 0) return { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.4)', text: '#34D399', label: 'Free' };
  return { bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.35)', text: '#38BDF8', label: 'Open' };
};

// Full Event Card for the Events Page
const EventCard: React.FC<{
  event: FestEvent;
  onSelect: () => void;
  onRegister: () => void;
}> = ({ event, onSelect, onRegister }) => {
  const blockReason = getEventRegistrationBlockReason(event);
  const status = getStatusStyle(event);
  const fillPct = event.capacity > 0 ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 0;

  return (
    <div
      className="events-page-card"
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span className="event-glimpse-dept-badge">{event.departmentCode}</span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '5px',
              textTransform: 'uppercase',
              background: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.3)',
              color: '#A855F7'
            }}
          >
            {event.category}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '9999px',
            background: status.bg,
            border: `1px solid ${status.border}`,
            color: status.text,
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          {status.label}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 800,
          color: '#F8FAFC',
          margin: '0 0 4px 0',
          lineHeight: 1.3,
          fontFamily: "'Space Grotesk', sans-serif"
        }}
      >
        {event.title}
      </h3>

      {event.tagline && (
        <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 10px 0', fontStyle: 'italic' }}>
          {event.tagline}
        </p>
      )}

      {/* Meta Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94A3B8' }}>
          <Calendar size={12} color="#38BDF8" style={{ flexShrink: 0 }} />
          <span>{event.date} • {event.time.split('(')[0].trim()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94A3B8' }}>
          <MapPin size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
          <span>{event.venue}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94A3B8' }}>
          <Users size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
          <span>
            {event.format === 'individual' ? 'Solo' : event.format === 'duo' ? 'Duo (2 members)' : `Team (${event.minTeamSize}–${event.maxTeamSize} members)`}
          </span>
        </div>
      </div>

      {/* Prize & Fee */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 10px',
          background: 'rgba(15,23,42,0.6)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#F59E0B', fontSize: '0.78rem', fontWeight: 700 }}>
          <Trophy size={13} color="#F59E0B" />
          <span>{event.prizes.first.replace(/Cash Prize|Worth Prizes/gi, '').trim()}</span>
        </div>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: event.fee === 0 ? '#34D399' : '#38BDF8' }}>
          {event.fee === 0 ? 'FREE' : `₹${event.fee}`}
        </div>
      </div>

      {/* Capacity Bar */}
      {event.capacity > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748B', marginBottom: '4px' }}>
            <span>{event.registeredCount} registered</span>
            <span>{event.capacity} capacity ({fillPct}%)</span>
          </div>
          <div style={{ height: '3px', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${fillPct}%`,
                borderRadius: '9999px',
                background: fillPct >= 90 ? '#f87171' : fillPct >= 70 ? '#F59E0B' : '#38BDF8',
                transition: 'width 0.5s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onSelect(); }}
          className="event-glimpse-btn-secondary"
          style={{ flex: 1 }}
        >
          Details
        </button>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRegister(); }}
          disabled={Boolean(blockReason)}
          title={blockReason || undefined}
          className="event-glimpse-btn-primary"
          style={{
            flex: 2,
            opacity: blockReason ? 0.5 : 1,
            cursor: blockReason ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <span>{blockReason ? 'Closed' : 'Register'}</span>
          {!blockReason && <ArrowRight size={12} />}
        </button>
      </div>
    </div>
  );
};

export const EventsPage: React.FC<EventsPageProps> = ({
  events,
  onBackToHome,
  onSelectEvent,
  onRegisterEvent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [feeFilter, setFeeFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'fee-asc' | 'fee-desc' | 'name'>('popular');

  // Extract all unique departments for filter
  const departments = useMemo(() => {
    const depts = [...new Set(events.map(e => e.departmentCode))].sort();
    return depts;
  }, [events]);

  // Extract all unique categories
  const categories = useMemo(() => {
    return [...new Set(events.map(e => e.category))].sort();
  }, [events]);

  // Filter + sort events
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.departmentCode.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.tagline || '').toLowerCase().includes(q)
      );
    }

    // Category
    if (categoryFilter !== 'all') {
      result = result.filter(e => e.category === categoryFilter);
    }

    // Department
    if (deptFilter !== 'all') {
      result = result.filter(e => e.departmentCode === deptFilter);
    }

    // Format
    if (formatFilter !== 'all') {
      result = result.filter(e => e.format === formatFilter);
    }

    // Day
    if (dayFilter !== 'all') {
      result = result.filter(e => {
        const d = (e.date || '').toLowerCase();
        if (dayFilter === '1') return d.includes('dec 1') || d.includes('day 1');
        if (dayFilter === '2') return d.includes('dec 2') || d.includes('day 2');
        return true;
      });
    }

    // Fee
    if (feeFilter === 'free') result = result.filter(e => e.fee === 0);
    if (feeFilter === 'paid') result = result.filter(e => e.fee > 0);

    // Sort
    if (sortBy === 'popular') result.sort((a, b) => b.registeredCount - a.registeredCount);
    else if (sortBy === 'fee-asc') result.sort((a, b) => a.fee - b.fee);
    else if (sortBy === 'fee-desc') result.sort((a, b) => b.fee - a.fee);
    else if (sortBy === 'name') result.sort((a, b) => a.title.localeCompare(b.title));

    return result;
  }, [events, searchQuery, categoryFilter, dayFilter, formatFilter, deptFilter, feeFilter, sortBy]);

  const freeCount = events.filter(e => e.fee === 0).length;
  const totalPrizePool = events.reduce((acc, e) => {
    const match = e.prizes.first.match(/(\d[\d,]*)/);
    return acc + (match ? parseInt(match[1].replace(/,/g, '')) : 0);
  }, 0);

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setDayFilter('all');
    setFormatFilter('all');
    setDeptFilter('all');
    setFeeFilter('all');
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || dayFilter !== 'all' ||
    formatFilter !== 'all' || deptFilter !== 'all' || feeFilter !== 'all';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080C16',
        color: '#F0F4F8',
        fontFamily: "'Space Grotesk', 'Inter', sans-serif"
      }}
    >
      {/* Sticky Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(8,12,22,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 20px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          {/* Back + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onBackToHome}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#94A3B8',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '6px 12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#F8FAFC';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = '#94A3B8';
              }}
            >
              <ArrowLeft size={15} />
              <span className="events-page-back-text">Home</span>
            </button>

            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: '1.08rem',
                color: '#F8FAFC',
                letterSpacing: '-0.01em'
              }}
            >
              All Events
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(56,189,248,0.15)',
                border: '1px solid rgba(56,189,248,0.3)',
                color: '#38BDF8'
              }}
            >
              {filteredEvents.length}/{events.length}
            </span>
          </div>

          {/* Search Bar */}
          <div
            style={{
              flex: 1,
              maxWidth: '400px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Search
              size={15}
              color="#64748B"
              style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder="Search events, departments…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 36px 8px 36px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#F0F4F8',
                fontSize: '0.84rem',
                outline: 'none',
                fontFamily: "'Space Grotesk', sans-serif",
                transition: 'border-color 0.2s ease'
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: showFilters ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showFilters ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: showFilters ? '#38BDF8' : '#94A3B8',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              position: 'relative'
            }}
          >
            <Filter size={14} />
            <span className="events-page-filter-text">Filters</span>
            {hasActiveFilters && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#38BDF8'
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div
          style={{
            background: 'rgba(11,19,43,0.98)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              padding: '16px 20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            {/* Category Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Category</span>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="events-page-select"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Department</span>
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="events-page-select"
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Day Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Day</span>
              <select
                value={dayFilter}
                onChange={e => setDayFilter(e.target.value)}
                className="events-page-select"
              >
                {DAY_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Format Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Format</span>
              <select
                value={formatFilter}
                onChange={e => setFormatFilter(e.target.value)}
                className="events-page-select"
              >
                {FORMAT_OPTIONS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Fee Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Entry</span>
              <select
                value={feeFilter}
                onChange={e => setFeeFilter(e.target.value as any)}
                className="events-page-select"
              >
                <option value="all">Free + Paid</option>
                <option value="free">Free Only</option>
                <option value="paid">Paid Only</option>
              </select>
            </div>

            {/* Sort */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sort By</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="events-page-select"
              >
                <option value="popular">Most Popular</option>
                <option value="name">Name A–Z</option>
                <option value="fee-asc">Fee: Low → High</option>
                <option value="fee-desc">Fee: High → Low</option>
              </select>
            </div>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 'auto'
                }}
              >
                <X size={12} />
                <span>Clear filters</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div
        style={{
          background: 'rgba(11,19,43,0.5)',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '12px 20px',
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94A3B8' }}>
            <Zap size={13} color="#38BDF8" />
            <span><strong style={{ color: '#38BDF8' }}>{events.length}</strong> total events</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94A3B8' }}>
            <Flame size={13} color="#34D399" />
            <span><strong style={{ color: '#34D399' }}>{freeCount}</strong> free events</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94A3B8' }}>
            <Trophy size={13} color="#F59E0B" />
            <span>Prize pool worth <strong style={{ color: '#F59E0B' }}>₹1,00,000+</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94A3B8' }}>
            <Rocket size={13} color="#A855F7" />
            <span><strong style={{ color: '#A855F7' }}>Dec 1–2</strong> at VCE, Hyderabad</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 20px 60px' }}>
        {/* Category Quick Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '24px'
          }}
        >
          {['all', ...categories].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '5px 14px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: categoryFilter === cat ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${categoryFilter === cat ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: categoryFilter === cat ? '#38BDF8' : '#94A3B8'
              }}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        {/* Result Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2
            style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
              fontWeight: 800,
              color: '#F8FAFC',
              margin: 0,
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            {hasActiveFilters ? (
              <>
                {filteredEvents.length} Result{filteredEvents.length !== 1 ? 's' : ''}
                <span style={{ color: '#64748B', fontWeight: 500, fontSize: '0.85em' }}> matching your filters</span>
              </>
            ) : (
              <>All <span style={{ color: '#38BDF8' }}>Festronix</span> Events</>
            )}
          </h2>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="events-page-grid">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={() => onSelectEvent(event)}
                onRegister={() => onRegisterEvent(event)}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#64748B'
            }}
          >
            <Search size={48} color="#1E293B" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#94A3B8', fontSize: '1.2rem', marginBottom: '8px' }}>No events found</h3>
            <p style={{ fontSize: '0.88rem', marginBottom: '20px' }}>
              Try different filters or search terms.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'rgba(56,189,248,0.15)',
                border: '1px solid rgba(56,189,248,0.3)',
                color: '#38BDF8',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
