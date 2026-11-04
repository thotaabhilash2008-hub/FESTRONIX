import React, { useState, useMemo } from 'react';
import { Search, CalendarDays, MapPin, Users, Crown, ArrowRight, Inbox, Flame, Gamepad2, Code2, Wrench, Presentation, Building2, LayoutGrid, Filter, X } from 'lucide-react';
import { FestEvent } from '../types/festronix';
import { DEPARTMENTS } from '../data/mockData';
import { getEventRegistrationBlockReason } from '../lib/eventRegistration';

export function isEventOnDay(dateStr: string | undefined, day: 'all' | '1' | '2'): boolean {
  if (day === 'all' || !dateStr) return true;
  const d = dateStr.toLowerCase();
  if (day === '1') {
    return d.includes('28') || d.includes('day 1') || d.includes('day-1') || d.includes('day1') || d.includes('both');
  }
  if (day === '2') {
    return d.includes('29') || d.includes('day 2') || d.includes('day-2') || d.includes('day2') || d.includes('both');
  }
  return true;
}

export function getEventDayBadge(dateStr: string | undefined): { label: string; color: string; bg: string; border: string } {
  if (!dateStr) return { label: 'Day 1 & 2', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.25)' };
  const d = dateStr.toLowerCase();
  if (d.includes('28-29') || d.includes('both')) {
    return { label: 'Day 1 & 2 (24H)', color: '#C084FC', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.35)' };
  }
  if (d.includes('28') || d.includes('day 1') || d.includes('day-1') || d.includes('day1')) {
    return { label: 'Day 1 • Oct 28', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.35)' };
  }
  if (d.includes('29') || d.includes('day 2') || d.includes('day-2') || d.includes('day2')) {
    return { label: 'Day 2 • Oct 29', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.35)' };
  }
  return { label: dateStr.split(',')[0], color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.25)' };
}

interface EventCatalogProps {
  events: FestEvent[];
  onSelectEvent: (event: FestEvent) => void;
  onRegisterEvent: (event: FestEvent) => void;
  selectedDept?: string;
  onSelectDept?: (dept: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  selectedDay?: 'all' | '1' | '2';
  onSelectDay?: (day: 'all' | '1' | '2') => void;
  activeViewMode?: 'all' | 'department' | 'category' | 'day';
  onSetActiveViewMode?: (mode: 'all' | 'department' | 'category' | 'day') => void;
}

export const EventCatalog: React.FC<EventCatalogProps> = ({
  events,
  onSelectEvent,
  onRegisterEvent,
  selectedDept: extSelectedDept,
  onSelectDept: extOnSelectDept,
  selectedCategory: extSelectedCategory,
  onSelectCategory: extOnSelectCategory,
  selectedDay: extSelectedDay,
  onSelectDay: extOnSelectDay,
  activeViewMode: extActiveViewMode,
  onSetActiveViewMode: extOnSetActiveViewMode
}) => {
  // Local state fallbacks if external not supplied
  const [localSearch, setLocalSearch] = useState('');
  const [localDept, setLocalDept] = useState('all');
  const [localCategory, setLocalCategory] = useState('all');
  const [localDay, setLocalDay] = useState<'all' | '1' | '2'>('all');
  const [localViewMode, setLocalViewMode] = useState<'all' | 'department' | 'category' | 'day'>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  const selectedDept = extSelectedDept !== undefined ? extSelectedDept : localDept;
  const setSelectedDept = extOnSelectDept || setLocalDept;

  const selectedCategory = extSelectedCategory !== undefined ? extSelectedCategory : localCategory;
  const setSelectedCategory = extOnSelectCategory || setLocalCategory;

  const selectedDay = extSelectedDay !== undefined ? extSelectedDay : localDay;
  const setSelectedDay = extOnSelectDay || setLocalDay;

  const viewMode = extActiveViewMode !== undefined ? extActiveViewMode : localViewMode;
  const setViewMode = extOnSetActiveViewMode || setLocalViewMode;

  const day1Count = useMemo(() => events.filter(e => isEventOnDay(e.date, '1')).length, [events]);
  const day2Count = useMemo(() => events.filter(e => isEventOnDay(e.date, '2')).length, [events]);

  const departmentOptions = useMemo(() => {
    const knownCodes = new Set(DEPARTMENTS.map(department => department.code.toUpperCase()));
    const additionalCodes = [...new Set(events.map(event => event.departmentCode.trim()).filter(Boolean))]
      .filter(code => !knownCodes.has(code.toUpperCase()))
      .sort((left, right) => left.localeCompare(right));

    return [
      ...DEPARTMENTS,
      ...additionalCodes.map(code => ({
        id: `dept-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        code,
        name: code.toUpperCase() === 'SAC' ? 'Student Activity Council' : `${code} Events`,
        description: 'Additional event organizing unit.',
        chiefCoordinator: '',
        contact: '',
        iconName: 'Building'
      }))
    ];
  }, [events]);

  const categories = [
    { key: 'all', label: 'All Categories', icon: <LayoutGrid size={14} /> },
    { key: 'hackathon', label: 'Hackathons', icon: <Code2 size={14} /> },
    { key: 'technical', label: 'Technical Events', icon: <Wrench size={14} /> },
    { key: 'workshop', label: 'Workshops', icon: <Presentation size={14} /> },
    { key: 'gaming', label: 'E-Sports & Gaming', icon: <Gamepad2 size={14} /> },
    { key: 'non-technical', label: 'Non-Tech & Pitch', icon: <Presentation size={14} /> }
  ];

  // Filtered Events calculation
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      const matchesSearch =
        evt.title.toLowerCase().includes(localSearch.toLowerCase()) ||
        evt.description.toLowerCase().includes(localSearch.toLowerCase()) ||
        evt.departmentCode.toLowerCase().includes(localSearch.toLowerCase()) ||
        evt.venue.toLowerCase().includes(localSearch.toLowerCase());

      const matchesDept = selectedDept === 'all' || evt.departmentCode === selectedDept;
      const matchesCategory = selectedCategory === 'all' || evt.category === selectedCategory;
      const matchesFormat = selectedFormat === 'all' || evt.format === selectedFormat;
      const matchesDay = isEventOnDay(evt.date, selectedDay);

      return matchesSearch && matchesDept && matchesCategory && matchesFormat && matchesDay;
    });
  }, [events, localSearch, selectedDept, selectedCategory, selectedFormat, selectedDay]);

  const resetFilters = () => {
    setSelectedDept('all');
    setSelectedCategory('all');
    setSelectedFormat('all');
    setSelectedDay('all');
    setLocalSearch('');
    setViewMode('all');
  };

  const hasActiveFilters = selectedDept !== 'all' || selectedCategory !== 'all' || selectedFormat !== 'all' || selectedDay !== 'all' || localSearch !== '';

  return (
    <section id="events" className="public-section events-section" style={{ padding: '60px 20px 80px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#38BDF8',
            fontSize: '0.78rem',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.15em',
            marginBottom: '8px',
            fontWeight: 800
          }}
        >
          <Flame size={14} color="#38BDF8" />
          <span>EVENT DIRECTORY</span>
        </div>

        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: 800,
            margin: '0 0 10px 0',
            letterSpacing: '0.02em',
            display: 'inline-block',
            color: '#FFFFFF',
            textShadow: '0 2px 16px rgba(0,0,0,0.85)'
          }}
        >
          EVENT DIRECTORY
        </h2>

        <p style={{ color: '#CBD5E1', maxWidth: '640px', margin: '0 auto', fontSize: '0.98rem', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          Explore competitions across 9 departments or filter by branch, category, and festival day.
        </p>

        {/* 4 View Modes Switcher: All Events, Select by Department, Select by Event Category, Schedule by Day */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(21, 24, 32, 0.9)',
            border: '1px solid rgba(199, 203, 212, 0.18)',
            borderRadius: '9999px',
            padding: '4px',
            marginTop: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.8), 0 0 20px rgba(255, 107, 53, 0.08)',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <button
            onClick={() => {
              setViewMode('all');
              setSelectedDay('all');
            }}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              border: viewMode === 'all' ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
              background: viewMode === 'all' ? 'linear-gradient(135deg, #243C74 0%, #2E4E8C 45%, #4E7C77 100%)' : 'transparent',
              color: viewMode === 'all' ? '#FFFFFF' : '#C7CBD4',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: viewMode === 'all' ? '0 0 18px rgba(46, 78, 140, 0.5)' : 'none',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <LayoutGrid size={14} color={viewMode === 'all' ? '#FFFFFF' : '#88B2AE'} />
            <span>All Events ({events.length})</span>
          </button>

          <button
            onClick={() => {
              setViewMode('department');
              if (selectedDept === 'all') setSelectedDept('CSE');
            }}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              border: viewMode === 'department' ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
              background: viewMode === 'department' ? 'linear-gradient(135deg, #243C74 0%, #2E4E8C 45%, #4E7C77 100%)' : 'transparent',
              color: viewMode === 'department' ? '#FFFFFF' : '#C7CBD4',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: viewMode === 'department' ? '0 0 18px rgba(46, 78, 140, 0.5)' : 'none',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <Building2 size={14} color={viewMode === 'department' ? '#FFFFFF' : '#C7CBD4'} />
            <span>Select by Department</span>
          </button>

          <button
            onClick={() => {
              setViewMode('category');
              if (selectedCategory === 'all') setSelectedCategory('hackathon');
            }}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              border: viewMode === 'category' ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
              background: viewMode === 'category' ? 'linear-gradient(135deg, #243C74 0%, #2E4E8C 45%, #4E7C77 100%)' : 'transparent',
              color: viewMode === 'category' ? '#FFFFFF' : '#C7CBD4',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: viewMode === 'category' ? '0 0 18px rgba(46, 78, 140, 0.5)' : 'none',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <Flame size={14} color={viewMode === 'category' ? '#FFFFFF' : '#88B2AE'} />
            <span>Select by Event Category</span>
          </button>

          <button
            onClick={() => {
              setViewMode('day');
              if (selectedDay === 'all') setSelectedDay('1');
            }}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              border: viewMode === 'day' ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
              background: viewMode === 'day' ? 'linear-gradient(135deg, #243C74 0%, #2E4E8C 45%, #4E7C77 100%)' : 'transparent',
              color: viewMode === 'day' ? '#FFFFFF' : '#C7CBD4',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: viewMode === 'day' ? '0 0 18px rgba(46, 78, 140, 0.5)' : 'none',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <CalendarDays size={14} color={viewMode === 'day' ? '#FFFFFF' : '#38BDF8'} />
            <span>Day-Wise Schedule (Day 1 & 2)</span>
          </button>
        </div>
      </div>

      {/* View-Specific Control Panel */}
      <div style={{ marginBottom: '32px' }}>
        {/* Mode 1: Select by Department */}
        {viewMode === 'department' && (
          <div
            style={{
              background: 'rgba(15, 17, 23, 0.95)',
              border: '1px solid rgba(199, 203, 212, 0.18)',
              borderRadius: '18px',
              padding: '20px',
              marginBottom: '20px',
              backdropFilter: 'blur(16px)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#88B2AE', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Interactive Filtering
                </span>
                <h4 style={{ margin: '4px 0 0 0', color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 700 }}>
                  Select Engineering Department
                </h4>
              </div>
              <button
                onClick={() => setSelectedDept('all')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: selectedDept === 'all' ? '#88B2AE' : '#94A3B8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Reset to All Departments
              </button>
            </div>

            {/* Department Grid Cards */}
            <div className="public-six-grid catalog-department-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
              {departmentOptions.map(dept => {
                const isSelected = selectedDept === dept.code;
                const deptCount = events.filter(e => e.departmentCode === dept.code).length;

                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.code)}
                    style={{
                      background: isSelected ? 'rgba(111, 150, 147, 0.2)' : 'rgba(21, 24, 32, 0.85)',
                      border: isSelected ? '1.5px solid #88B2AE' : '1px solid rgba(199, 203, 212, 0.14)',
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isSelected ? '#FFFFFF' : '#E2E8F0', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {dept.code}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                        {dept.name}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: isSelected ? '#88B2AE' : 'rgba(255,255,255,0.08)',
                        color: isSelected ? '#000000' : '#C7CBD4',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}
                    >
                      {deptCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode 2: Select by Event Category */}
        {viewMode === 'category' && (
          <div
            style={{
              background: 'rgba(15, 17, 23, 0.95)',
              border: '1px solid rgba(199, 203, 212, 0.18)',
              borderRadius: '18px',
              padding: '20px',
              marginBottom: '20px',
              backdropFilter: 'blur(16px)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#88B2AE', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Thematic Competitions
                </span>
                <h4 style={{ margin: '4px 0 0 0', color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 700 }}>
                  Select Event Category
                </h4>
              </div>
              <button
                onClick={() => setSelectedCategory('all')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: selectedCategory === 'all' ? '#88B2AE' : '#94A3B8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Reset to All Categories
              </button>
            </div>

            {/* Category Cards */}
            <div className="public-six-grid catalog-category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {categories.map(cat => {
                const isSelected = selectedCategory === cat.key;
                const catCount = cat.key === 'all' ? events.length : events.filter(e => e.category === cat.key).length;

                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.16)' : 'rgba(21, 24, 32, 0.85)',
                      border: isSelected ? '1.5px solid #38BDF8' : '1px solid rgba(199, 203, 212, 0.14)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div style={{ color: isSelected ? '#38BDF8' : '#88B2AE' }}>
                      {cat.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#FFFFFF' : '#E2E8F0', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {cat.label}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: isSelected ? '#38BDF8' : '#94A3B8', fontWeight: 600 }}>
                        {catCount} {catCount === 1 ? 'Event' : 'Events'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode 3: Schedule by Day (Day 1 & Day 2) */}
        {viewMode === 'day' && (
          <div
            style={{
              background: 'rgba(15, 17, 23, 0.95)',
              border: '1px solid rgba(199, 203, 212, 0.18)',
              borderRadius: '18px',
              padding: '20px',
              marginBottom: '20px',
              backdropFilter: 'blur(16px)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Festival Schedule & Daywise Classification
                </span>
                <h4 style={{ margin: '4px 0 0 0', color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 700 }}>
                  Select Festival Day
                </h4>
              </div>
              <button
                onClick={() => setSelectedDay('all')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: selectedDay === 'all' ? '#38BDF8' : '#94A3B8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Reset to All Days
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {/* Day 1 Card */}
              <button
                onClick={() => setSelectedDay('1')}
                style={{
                  background: selectedDay === '1' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(21, 24, 32, 0.85)',
                  border: selectedDay === '1' ? '1.5px solid #38BDF8' : '1px solid rgba(199, 203, 212, 0.14)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    DAY 1 • WEDNESDAY
                  </span>
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', fontWeight: 700 }}>
                    {day1Count} Events
                  </span>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Oct 28, 2026
                </div>
                <div style={{ fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.45 }}>
                  Inaugural Ceremonies, RoboWars Combat, 24H Hackathon Kickoff, Drone Racing & Technical Battles.
                </div>
              </button>

              {/* Day 2 Card */}
              <button
                onClick={() => setSelectedDay('2')}
                style={{
                  background: selectedDay === '2' ? 'rgba(251, 191, 36, 0.14)' : 'rgba(21, 24, 32, 0.85)',
                  border: selectedDay === '2' ? '1.5px solid #FBBF24' : '1px solid rgba(199, 203, 212, 0.14)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    DAY 2 • THURSDAY
                  </span>
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', fontWeight: 700 }}>
                    {day2Count} Events
                  </span>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Oct 29, 2026
                </div>
                <div style={{ fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.45 }}>
                  Venture Tank Startup Pitches, BGMI & Valorant Arena, 24H Hackathon Demo Day & Grand Valedictory.
                </div>
              </button>

              {/* Both Days Card */}
              <button
                onClick={() => setSelectedDay('all')}
                style={{
                  background: selectedDay === 'all' ? 'rgba(168, 85, 247, 0.14)' : 'rgba(21, 24, 32, 0.85)',
                  border: selectedDay === 'all' ? '1.5px solid #C084FC' : '1px solid rgba(199, 203, 212, 0.14)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#C084FC', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    FULL LINEUP
                  </span>
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(168, 85, 247, 0.2)', color: '#C084FC', fontWeight: 700 }}>
                    {events.length} Events
                  </span>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Both Days (Oct 28–29)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.45 }}>
                  Browse the comprehensive schedule across all 9 academic branches and flagship arenas.
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Global Search & Multi-Filter Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search
              size={16}
              color="#88B2AE"
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="cyber-input"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search by event title, technology, rules or venue..."
              style={{
                paddingLeft: '44px',
                height: '44px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                background: 'rgba(15, 17, 23, 0.9)',
                border: '1px solid rgba(199, 203, 212, 0.2)',
                backdropFilter: 'blur(16px)',
                color: '#F3F0EA'
              }}
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filter Group: Day Filter & Format Filter */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Quick Day Filter */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', marginRight: '4px', fontWeight: 700 }}>
                Day:
              </span>
              {[
                { key: 'all', label: 'All Days' },
                { key: '1', label: 'Day 1' },
                { key: '2', label: 'Day 2' }
              ].map(d => (
                <button
                  key={d.key}
                  onClick={() => setSelectedDay(d.key as 'all' | '1' | '2')}
                  style={{
                    padding: '5px 11px',
                    borderRadius: '6px',
                    border: selectedDay === d.key ? '1px solid #38BDF8' : '1px solid rgba(148, 163, 184, 0.18)',
                    background: selectedDay === d.key ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 22, 38, 0.8)',
                    color: selectedDay === d.key ? '#FFFFFF' : '#94A3B8',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Quick Format Filter */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', marginRight: '4px', fontWeight: 700 }}>
                Format:
              </span>
              {[
                { key: 'all', label: 'All' },
                { key: 'individual', label: 'Solo' },
                { key: 'duo', label: 'Duo' },
                { key: 'team', label: 'Team' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setSelectedFormat(f.key)}
                  style={{
                    padding: '5px 11px',
                    borderRadius: '6px',
                    border: selectedFormat === f.key ? '1px solid #38BDF8' : '1px solid rgba(148, 163, 184, 0.18)',
                    background: selectedFormat === f.key ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 22, 38, 0.8)',
                    color: selectedFormat === f.key ? '#FFFFFF' : '#94A3B8',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}
                >
                  {f.label}
                </button>
              ))}

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: '#38BDF8',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '4px'
                  }}
                >
                  <X size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Counter Bar */}
        <div style={{ marginTop: '14px', fontSize: '0.78rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>Showing <strong style={{ color: '#FFFFFF' }}>{filteredEvents.length}</strong> of {events.length} events</span>
          {selectedDay !== 'all' && (
            <span style={{ background: selectedDay === '1' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(251, 191, 36, 0.14)', color: selectedDay === '1' ? '#38BDF8' : '#FBBF24', border: `1px solid ${selectedDay === '1' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`, padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
              Day {selectedDay} ({selectedDay === '1' ? 'Oct 28' : 'Oct 29'})
            </span>
          )}
          {selectedDept !== 'all' && (
            <span style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
              Dept: {selectedDept}
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
              Category: {selectedCategory}
            </span>
          )}
        </div>
      </div>

      {/* Events Cards Grid */}
      {filteredEvents.length === 0 ? (
        <div
          className="cyber-card"
          style={{ padding: '60px 20px', textAlign: 'center', color: '#9B8E7B' }}
        >
          <Inbox size={44} color="#FFD700" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: '#F5F0E8', fontSize: '1.2rem', marginBottom: '6px', fontFamily: "var(--font-heading)", fontWeight: 700, letterSpacing: '0.02em' }}>
            No Matching Events Found
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Try switching days, departments, or categories to find more events.</p>
          <button onClick={resetFilters} className="btn-cyber-secondary">
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="public-six-grid event-catalog-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}
        >
          {filteredEvents.map(event => {
            const seatsRemaining = Math.max(0, event.capacity - event.registeredCount);
            const isFull = event.status === 'full' || seatsRemaining === 0;
            const registrationBlockReason = getEventRegistrationBlockReason(event);
            const isRegistrationBlocked = Boolean(registrationBlockReason);
            const dayBadge = getEventDayBadge(event.date);

            return (
              <article key={event.id} className="event-card-reset">
                <div
                  className="cyber-card event-card-surface"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '22px',
                    height: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div>
                    {/* Card Header Tags */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#60A5FA',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            fontFamily: "'Space Grotesk', sans-serif"
                          }}
                        >
                          {event.departmentCode}
                        </span>

                        {/* Day Badge */}
                        <span
                          style={{
                            backgroundColor: dayBadge.bg,
                            border: `1px solid ${dayBadge.border}`,
                            color: dayBadge.color,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            fontFamily: "'Space Grotesk', sans-serif"
                          }}
                        >
                          {dayBadge.label}
                        </span>

                        <span
                          style={{
                            textTransform: 'capitalize',
                            fontSize: '0.7rem',
                            color: '#C7CBD4',
                            background: '#1E293B', border: '1px solid #334155',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontFamily: "'Space Grotesk', sans-serif"
                          }}
                        >
                          {event.category}
                        </span>
                      </div>

                      <span className={`badge-status ${isFull ? 'badge-full' : 'badge-open'}`}>
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: isFull ? '#F43F5E' : '#22c55e'
                          }}
                        />
                        {isFull ? 'Full' : 'Open'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#F3F0EA',
                        marginBottom: '8px',
                        lineHeight: 1.25,
                        letterSpacing: '0.02em'
                      }}
                    >
                      {event.title}
                    </h3>

                    {/* Snippet */}
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: '#CBD5E1',
                        marginBottom: '14px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.55
                      }}
                    >
                      {event.description}
                    </p>

                    {/* Metadata Rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#E2E8F0' }}>
                        <CalendarDays size={13} color="#38BDF8" />
                        <span>{event.date} • {event.time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#E2E8F0' }}>
                        <MapPin size={13} color="#38BDF8" />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {event.venue}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#E2E8F0' }}>
                        <Users size={13} color="#38BDF8" />
                        <span>
                          {event.format === 'individual'
                            ? 'Solo Participation'
                            : event.format === 'duo'
                            ? 'Duo (2 Members)'
                            : `Team (${event.minTeamSize}–${event.maxTeamSize} Members)`}
                        </span>
                      </div>
                    </div>

                    {/* 1st Prize Tag */}
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: '#162238', border: '1px solid #1E293B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '16px'
                      }}
                    >
                      <Crown size={14} color="#FBBF24" />
                      <span style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                        1st: {event.prizes.first}
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Area: Pricing & Actions */}
                  <div
                    className="event-card-actions"
                    style={{
                      borderTop: '1px solid rgba(220, 227, 232, 0.1)',
                      paddingTop: '14px',
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Entry Fee
                      </div>
                      <div
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: event.fee === 0 ? '#34D399' : '#F3F0EA',
                          fontFamily: "'Space Grotesk', sans-serif"
                        }}
                      >
                        {event.fee === 0 ? 'FREE' : `₹${event.fee}`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSelectEvent(event);
                        }}
                        className="btn-cyber-secondary"
                        style={{ padding: '7px 14px', fontSize: '0.78rem' }}
                      >
                        Details
                      </button>

                      <button
                        type="button"
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRegisterEvent(event);
                        }}
                        disabled={isRegistrationBlocked}
                        title={registrationBlockReason || undefined}
                        style={{
                          background: isRegistrationBlocked
                            ? 'rgba(255, 255, 255, 0.05)'
                            : '#2563EB',
                          color: isRegistrationBlocked ? '#94A3B8' : '#FFFFFF',
                          border: isRegistrationBlocked ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #3B82F6',
                          borderRadius: '8px',
                          padding: '7px 15px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: isRegistrationBlocked ? 'not-allowed' : 'pointer',
                          boxShadow: isRegistrationBlocked ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          position: 'relative',
                          zIndex: 40,
                          pointerEvents: 'auto',
                          transition: 'all 0.2s',
                          fontFamily: "'Space Grotesk', sans-serif"
                        }}
                      >
                        <span>{isFull ? 'Full' : registrationBlockReason ? 'Closed' : event.fee === 0 ? 'Register Free' : 'Register'}</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default EventCatalog;
