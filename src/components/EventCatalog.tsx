import React, { useState, useMemo } from 'react';
import { Search, CalendarDays, MapPin, Users, Crown, ArrowRight, Inbox, Flame, Gamepad2, Code2, Wrench, Presentation, Building2, Sparkles, Filter, X } from 'lucide-react';
import { FestEvent } from '../types/festronix';
import { DEPARTMENTS } from '../data/mockData';

interface EventCatalogProps {
  events: FestEvent[];
  onSelectEvent: (event: FestEvent) => void;
  onRegisterEvent: (event: FestEvent) => void;
  selectedDept?: string;
  onSelectDept?: (dept: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  activeViewMode?: 'all' | 'department' | 'category';
  onSetActiveViewMode?: (mode: 'all' | 'department' | 'category') => void;
}

export const EventCatalog: React.FC<EventCatalogProps> = ({
  events,
  onSelectEvent,
  onRegisterEvent,
  selectedDept: extSelectedDept,
  onSelectDept: extOnSelectDept,
  selectedCategory: extSelectedCategory,
  onSelectCategory: extOnSelectCategory,
  activeViewMode: extActiveViewMode,
  onSetActiveViewMode: extOnSetActiveViewMode
}) => {
  // Local state fallbacks if external not supplied
  const [localSearch, setLocalSearch] = useState('');
  const [localDept, setLocalDept] = useState('all');
  const [localCategory, setLocalCategory] = useState('all');
  const [localViewMode, setLocalViewMode] = useState<'all' | 'department' | 'category'>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  const selectedDept = extSelectedDept !== undefined ? extSelectedDept : localDept;
  const setSelectedDept = extOnSelectDept || setLocalDept;

  const selectedCategory = extSelectedCategory !== undefined ? extSelectedCategory : localCategory;
  const setSelectedCategory = extOnSelectCategory || setLocalCategory;

  const viewMode = extActiveViewMode !== undefined ? extActiveViewMode : localViewMode;
  const setViewMode = extOnSetActiveViewMode || setLocalViewMode;

  const categories = [
    { key: 'all', label: 'All Categories', icon: <Sparkles size={14} /> },
    { key: 'hackathon', label: 'Hackathons', icon: <Code2 size={14} /> },
    { key: 'technical', label: 'Technical Battles', icon: <Wrench size={14} /> },
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

      return matchesSearch && matchesDept && matchesCategory && matchesFormat;
    });
  }, [events, localSearch, selectedDept, selectedCategory, selectedFormat]);

  const resetFilters = () => {
    setSelectedDept('all');
    setSelectedCategory('all');
    setSelectedFormat('all');
    setLocalSearch('');
    setViewMode('all');
  };

  const hasActiveFilters = selectedDept !== 'all' || selectedCategory !== 'all' || selectedFormat !== 'all' || localSearch !== '';

  return (
    <section id="events" style={{ padding: '60px 20px 80px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#00F0D0',
            fontSize: '0.78rem',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.15em',
            marginBottom: '8px',
            fontWeight: 700
          }}
        >
          <Flame size={14} color="#00F0D0" />
          <span>FESTRONIX ARENA 2026</span>
        </div>

        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
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
          EVENT DIRECTORY
        </h2>

        <p style={{ color: '#CBD5E1', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
          Explore competitions across 8 branches or filter directly by department and category.
        </p>

        {/* Primary View Switcher Tabs: All Events, Select by Department, Select by Event Category */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(12, 8, 24, 0.88)',
            border: '1px solid rgba(0, 240, 208, 0.25)',
            borderRadius: '9999px',
            padding: '4px',
            marginTop: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.7), 0 0 20px rgba(0, 240, 208, 0.1)',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <button
            onClick={() => setViewMode('all')}
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              border: 'none',
              background: viewMode === 'all' ? 'linear-gradient(135deg, #00F0D0 0%, #7C3AED 50%, #C026D3 100%)' : 'transparent',
              color: viewMode === 'all' ? '#FFFFFF' : '#CBD5E1',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: viewMode === 'all' ? '0 0 18px rgba(0, 240, 208, 0.4)' : 'none',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <Sparkles size={14} />
            <span>All Events ({events.length})</span>
          </button>

          <button
            onClick={() => {
              setViewMode('department');
              if (selectedDept === 'all') setSelectedDept('CSE');
            }}
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              border: 'none',
              background: viewMode === 'department' ? 'linear-gradient(135deg, #00F0D0 0%, #7C3AED 50%, #C026D3 100%)' : 'transparent',
              color: viewMode === 'department' ? '#FFFFFF' : '#CBD5E1',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: viewMode === 'department' ? '0 0 18px rgba(0, 240, 208, 0.4)' : 'none',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <Building2 size={14} />
            <span>Select by Department</span>
          </button>

          <button
            onClick={() => {
              setViewMode('category');
              if (selectedCategory === 'all') setSelectedCategory('hackathon');
            }}
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              border: 'none',
              background: viewMode === 'category' ? 'linear-gradient(135deg, #C026D3 0%, #7C3AED 50%, #00F0D0 100%)' : 'transparent',
              color: viewMode === 'category' ? '#ffffff' : '#CBD5E1',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: viewMode === 'category' ? '0 0 18px rgba(192, 38, 211, 0.4)' : 'none',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <Flame size={14} />
            <span>Select by Event Category</span>
          </button>
        </div>
      </div>

      {/* View-Specific Control Panel */}
      <div style={{ marginBottom: '32px' }}>
        {/* If Mode is Select by Department */}
        {viewMode === 'department' && (
          <div
            style={{
              background: 'rgba(18, 14, 30, 0.65)',
              border: '1px solid rgba(255, 215, 0, 0.18)',
              borderRadius: '18px',
              padding: '20px',
              marginBottom: '20px',
              backdropFilter: 'blur(16px)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="#FFD700" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F5F0E8', fontFamily: "'Space Grotesk', sans-serif" }}>
                  BROWSE BY ENGINEERING DEPARTMENT
                </span>
              </div>
              <button
                onClick={() => setSelectedDept('all')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: selectedDept === 'all' ? '#FFD700' : '#9B8E7B',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Show All Departments
              </button>
            </div>

            {/* Department Grid Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px'
              }}
            >
              {DEPARTMENTS.map(dept => {
                const isSelected = selectedDept === dept.code;
                const deptCount = events.filter(e => e.departmentCode === dept.code).length;

                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.code)}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.18) 0%, rgba(245, 166, 35, 0.25) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '12px 8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 0 15px rgba(255, 215, 0, 0.2)' : 'none'
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '1.25rem',
                        color: isSelected ? '#FFD700' : '#F5F0E8',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {dept.code}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: isSelected ? '#D4C5A9' : '#6B5E4E', marginTop: '2px' }}>
                      {deptCount} {deptCount === 1 ? 'Event' : 'Events'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* If Mode is Select by Event Category */}
        {viewMode === 'category' && (
          <div
            style={{
              background: 'rgba(18, 14, 30, 0.65)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              borderRadius: '18px',
              padding: '20px',
              marginBottom: '20px',
              backdropFilter: 'blur(16px)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={18} color="#A78BFA" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F5F0E8', fontFamily: "'Space Grotesk', sans-serif" }}>
                  BROWSE BY EVENT CATEGORY
                </span>
              </div>
              <button
                onClick={() => setSelectedCategory('all')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: selectedCategory === 'all' ? '#A78BFA' : '#9B8E7B',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Show All Categories
              </button>
            </div>

            {/* Category Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '10px'
              }}
            >
              {categories.slice(1).map(cat => {
                const isSelected = selectedCategory === cat.key;
                const catCount = events.filter(e => e.category === cat.key).length;

                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(167, 139, 250, 0.15) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #A78BFA' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '14px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 0 15px rgba(124, 58, 237, 0.25)' : 'none'
                    }}
                  >
                    <div style={{ color: isSelected ? '#FFD700' : '#A78BFA' }}>
                      {cat.icon}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#FFFFFF' : '#F5F0E8' }}>
                        {cat.label}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: isSelected ? '#A78BFA' : '#6B5E4E' }}>
                        {catCount} {catCount === 1 ? 'Event' : 'Events'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Search & Format Bar */}
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
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search
              size={16}
              color="#FFD700"
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
                height: '46px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(16px)'
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
                  color: '#9B8E7B',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Format Filter Buttons: Solo, Duo, Team */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#6B5E4E', textTransform: 'uppercase', marginRight: '4px' }}>
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
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: selectedFormat === f.key ? '1px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: selectedFormat === f.key ? 'rgba(255, 215, 0, 0.12)' : 'transparent',
                  color: selectedFormat === f.key ? '#FFD700' : '#9B8E7B',
                  fontSize: '0.75rem',
                  fontWeight: 600,
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
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  background: 'rgba(244, 63, 94, 0.1)',
                  color: '#F43F5E',
                  fontSize: '0.75rem',
                  fontWeight: 600,
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

        {/* Results Counter Bar */}
        <div style={{ marginTop: '14px', fontSize: '0.78rem', color: '#9B8E7B', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Showing <strong style={{ color: '#FFD700' }}>{filteredEvents.length}</strong> of {events.length} events</span>
          {selectedDept !== 'all' && (
            <span style={{ background: 'rgba(255, 215, 0, 0.1)', color: '#FFD700', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
              Dept: {selectedDept}
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#A78BFA', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
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
          <h3 style={{ color: '#F5F0E8', fontSize: '1.2rem', marginBottom: '6px', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}>
            No Matching Events Found
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Try switching departments or categories to find more events.</p>
          <button onClick={resetFilters} className="btn-cyber-secondary">
            Clear All Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}
        >
          {filteredEvents.map(event => {
            const seatsRemaining = Math.max(0, event.capacity - event.registeredCount);
            const fillPercentage = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));
            const isFull = event.status === 'full' || seatsRemaining === 0;

            return (
              <div
                key={event.id}
                className="cyber-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '22px'
                }}
              >
                <div>
                  {/* Card Header Tags */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(0, 240, 208, 0.1)',
                          border: '1px solid rgba(0, 240, 208, 0.3)',
                          color: '#00F0D0',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          fontFamily: "'Space Grotesk', sans-serif"
                        }}
                      >
                        {event.departmentCode}
                      </span>
                      <span
                        style={{
                          textTransform: 'capitalize',
                          fontSize: '0.7rem',
                          color: '#C4B5FD',
                          background: 'rgba(192, 38, 211, 0.1)',
                          border: '1px solid rgba(192, 38, 211, 0.25)',
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
                          backgroundColor: isFull ? '#F43F5E' : '#00F0D0'
                        }}
                      />
                      {isFull ? 'Full' : 'Open'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '1.35rem',
                      fontWeight: 400,
                      color: '#F8FAFC',
                      marginBottom: '8px',
                      lineHeight: 1.2,
                      letterSpacing: '0.03em'
                    }}
                  >
                    {event.title}
                  </h3>

                  {/* Snippet */}
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: '#94A3B8',
                      marginBottom: '14px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.5
                    }}
                  >
                    {event.description}
                  </p>

                  {/* Metadata Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#CBD5E1' }}>
                      <CalendarDays size={13} color="#00F0D0" />
                      <span>{event.date} • {event.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#CBD5E1' }}>
                      <MapPin size={13} color="#C026D3" />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {event.venue}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#CBD5E1' }}>
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
                      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(0, 240, 208, 0.05))',
                      border: '1px solid rgba(255, 215, 0, 0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Crown size={13} color="#FFD700" />
                      <span style={{ fontSize: '0.73rem', color: '#FFD700', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
                        1st Prize
                      </span>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFE55C', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {event.prizes.first}
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                      <span style={{ color: '#94A3B8', fontFamily: "'Space Grotesk', sans-serif" }}>Slots Enrolled</span>
                      <span style={{ color: isFull ? '#FB7185' : '#00F0D0', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
                        {event.registeredCount} / {event.capacity} ({fillPercentage}%)
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '9999px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${fillPercentage}%`,
                          height: '100%',
                          background: isFull
                            ? '#F43F5E'
                            : 'linear-gradient(90deg, #00F0D0, #C026D3)',
                          borderRadius: '9999px',
                          transition: 'width 0.5s ease'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div
                  style={{
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#6B5E4E', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
                      Entry Fee
                    </div>
                    <div
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '1.2rem',
                        color: event.fee === 0 ? '#10B981' : '#F5F0E8'
                      }}
                    >
                      {event.fee === 0 ? 'FREE' : `₹${event.fee}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => onSelectEvent(event)}
                      className="btn-cyber-secondary"
                      style={{ padding: '7px 14px', fontSize: '0.78rem' }}
                    >
                      Details
                    </button>

                    <button
                      onClick={() => onRegisterEvent(event)}
                      disabled={isFull}
                      className="btn-cyber-primary"
                      style={{
                        padding: '7px 16px',
                        fontSize: '0.78rem',
                        opacity: isFull ? 0.5 : 1,
                        cursor: isFull ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <span>{isFull ? 'Full' : 'Register'}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
