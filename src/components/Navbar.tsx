import React, { useState, useRef, useEffect } from 'react';
import { Clapperboard, Ticket, Menu, X, Bell, Flame, ChevronDown, Building2, Sparkles, Trophy, Compass, Layers } from 'lucide-react';
import { Announcement } from '../types/festronix';
import { DEPARTMENTS } from '../data/mockData';

interface NavbarProps {
  onOpenIntro: () => void;
  onOpenPasses: () => void;
  announcements: Announcement[];
  passesCount: number;
  onNavigateExplore: () => void;
  onNavigateHyped: () => void;
  onSelectDepartment: (deptCode: string) => void;
  onSelectCategory: (categoryKey: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenIntro,
  onOpenPasses,
  announcements,
  passesCount,
  onNavigateExplore,
  onNavigateHyped,
  onSelectDepartment,
  onSelectCategory
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAnnouncementsDropdown, setShowAnnouncementsDropdown] = useState(false);
  const [isBrowseDropdownOpen, setIsBrowseDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBrowseDropdownOpen(false);
      }
    };
    const handleScroll = () => {
      setIsBrowseDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const categories = [
    { key: 'all', label: 'All Categories' },
    { key: 'hackathon', label: 'Hackathons' },
    { key: 'technical', label: 'Technical' },
    { key: 'workshop', label: 'Workshops' },
    { key: 'gaming', label: 'E-Sports & Gaming' },
    { key: 'non-technical', label: 'Non-Tech & Pitch' }
  ];

  return (
    <nav
      style={{
        position: 'sticky',
        top: '12px',
        zIndex: 50,
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 16px',
        width: '100%'
      }}
    >
      <div
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          backgroundColor: 'rgba(3, 14, 38, 0.92)',
          border: '1px solid rgba(0, 140, 255, 0.38)',
          borderRadius: '9999px',
          height: '66px',
          padding: '0 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 140, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Brand / Logo */}
        <a
          href="#"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #00D2FF 0%, #0077FF 50%, #0051FF 100%)',
              padding: '1.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 210, 255, 0.6)'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '10px',
                background: '#020714',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00D2FF',
                fontWeight: 800,
                fontSize: '0.82rem',
                fontFamily: "var(--font-heading)",
                letterSpacing: '0.05em'
              }}
            >
              FX
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: '#F8FAFC'
                }}
              >
                FESTRONIX
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 140, 255, 0.12)',
                  border: '1px solid rgba(0, 210, 255, 0.45)',
                  color: '#38BDF8',
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                2026
              </span>
            </div>
            <div
              className="desktop-only"
              style={{
                fontSize: '0.62rem',
                color: '#94A3B8',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: "'Space Grotesk', sans-serif"
              }}
            >
              Vardhaman College of Engineering
            </div>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px'
          }}
          className="desktop-nav"
        >
          {/* 1. Explore Events */}
          <button
            onClick={() => {
              setIsBrowseDropdownOpen(false);
              onNavigateExplore();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#F8FAFC',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s',
              fontFamily: "'Space Grotesk', sans-serif",
              padding: '6px 10px'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00D2FF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#F8FAFC')}
          >
            <Compass size={15} color="#00D2FF" />
            <span>Explore Events</span>
          </button>

          {/* 2. Hyped Events */}
          <button
            onClick={() => {
              setIsBrowseDropdownOpen(false);
              onNavigateHyped();
            }}
            style={{
              background: 'rgba(0, 140, 255, 0.12)',
              border: '1px solid rgba(0, 210, 255, 0.4)',
              borderRadius: '9999px',
              color: '#00D2FF',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              fontFamily: "'Space Grotesk', sans-serif",
              padding: '5px 12px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0, 140, 255, 0.22)';
              e.currentTarget.style.boxShadow = '0 0 18px rgba(0, 210, 255, 0.45)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0, 140, 255, 0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Flame size={14} color="#00D2FF" />
            <span>Hyped Events</span>
          </button>

          {/* 3. Browse Dropdown: Select by Department & Select by Event Category */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsBrowseDropdownOpen(!isBrowseDropdownOpen)}
              style={{
                background: isBrowseDropdownOpen ? 'rgba(0, 140, 255, 0.15)' : 'none',
                border: isBrowseDropdownOpen ? '1px solid rgba(0, 210, 255, 0.45)' : '1px solid transparent',
                borderRadius: '8px',
                color: isBrowseDropdownOpen ? '#00D2FF' : '#CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                transition: 'all 0.2s',
                fontFamily: "'Space Grotesk', sans-serif"
              }}
              onMouseEnter={e => {
                if (!isBrowseDropdownOpen) e.currentTarget.style.color = '#00D2FF';
              }}
              onMouseLeave={e => {
                if (!isBrowseDropdownOpen) e.currentTarget.style.color = '#CBD5E1';
              }}
            >
              <Layers size={14} color="#00D2FF" />
              <span>Browse Events</span>
              <ChevronDown
                size={14}
                style={{
                  transform: isBrowseDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              />
            </button>

            {/* Dropdown Menu */}
            {isBrowseDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '42px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '380px',
                  background: 'rgba(3, 14, 38, 0.98)',
                  border: '1px solid rgba(0, 140, 255, 0.38)',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 140, 255, 0.25)',
                  backdropFilter: 'blur(20px)',
                  zIndex: 100
                }}
              >
                {/* Option A: Select by Department */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    onClick={() => {
                      onSelectDepartment('all');
                      setIsBrowseDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(0, 140, 255, 0.1)',
                      border: '1px solid rgba(0, 210, 255, 0.3)',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(0, 140, 255, 0.18)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(0, 140, 255, 0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} color="#00D2FF" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
                        Select by Department
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#00D2FF', fontWeight: 600 }}>
                      View All →
                    </span>
                  </div>

                  {/* Department Quick Chips */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {DEPARTMENTS.map(dept => (
                      <button
                        key={dept.id}
                        onClick={() => {
                          onSelectDepartment(dept.code);
                          setIsBrowseDropdownOpen(false);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '6px 4px',
                          color: '#CBD5E1',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          textAlign: 'center',
                          fontFamily: "'Space Grotesk', sans-serif"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#00D2FF';
                          e.currentTarget.style.color = '#38BDF8';
                          e.currentTarget.style.background = 'rgba(0, 140, 255, 0.15)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.color = '#CBD5E1';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }}
                      >
                        {dept.code}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Option B: Select by Event Category */}
                <div>
                  <div
                    onClick={() => {
                      onSelectCategory('all');
                      setIsBrowseDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(0, 140, 255, 0.1)',
                      border: '1px solid rgba(0, 210, 255, 0.3)',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(0, 140, 255, 0.18)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(0, 140, 255, 0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="#00D2FF" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
                        Select by Event Category
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#00D2FF', fontWeight: 600 }}>
                      View All →
                    </span>
                  </div>

                  {/* Category Quick Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {categories.slice(1).map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => {
                          onSelectCategory(cat.key);
                          setIsBrowseDropdownOpen(false);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '5px 9px',
                          color: '#CBD5E1',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          fontFamily: "'Space Grotesk', sans-serif"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#00D2FF';
                          e.currentTarget.style.color = '#38BDF8';
                          e.currentTarget.style.background = 'rgba(0, 140, 255, 0.15)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.color = '#CBD5E1';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Prizes */}
          <a
            href="#prizes"
            style={{
              color: '#94A3B8',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'color 0.2s',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00D2FF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
          >
            Prizes
          </a>
        </div>

        {/* Right Action Icons & Passes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Announcements Popover */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAnnouncementsDropdown(!showAnnouncementsDropdown)}
              style={{
                background: 'rgba(0, 140, 255, 0.12)',
                border: '1px solid rgba(0, 210, 255, 0.4)',
                borderRadius: '9999px',
                padding: '6px 12px',
                color: '#00D2FF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              title="Fest Updates"
            >
              <Bell size={13} color="#00D2FF" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                {announcements.length}
              </span>
            </button>

            {showAnnouncementsDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '320px',
                  background: '#04102c',
                  border: '1px solid rgba(0, 140, 255, 0.35)',
                  borderRadius: '14px',
                  padding: '16px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 25px rgba(0, 140, 255, 0.25)',
                  zIndex: 100
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: '#00D2FF',
                      fontWeight: 700,
                      fontFamily: "'Space Grotesk', sans-serif",
                      letterSpacing: '0.04em'
                    }}
                  >
                    LIVE BULLETINS
                  </span>
                  <button
                    onClick={() => setShowAnnouncementsDropdown(false)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {announcements.map(ann => (
                    <div
                      key={ann.id}
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(2, 25, 60, 0.65)',
                        borderLeft: `3px solid ${ann.type === 'urgent' ? '#F43F5E' : '#00D2FF'}`,
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '2px' }}>
                        {ann.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>
                        {ann.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Replay Intro Button */}
          <button
            onClick={onOpenIntro}
            className="desktop-only"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(0, 140, 255, 0.3)',
              borderRadius: '9999px',
              padding: '7px 13px',
              color: '#CBD5E1',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#00D2FF';
              e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#CBD5E1';
              e.currentTarget.style.borderColor = 'rgba(0, 140, 255, 0.3)';
            }}
          >
            <Clapperboard size={13} color="#00D2FF" />
            <span>Intro</span>
          </button>

          {/* View Our Registration Passes */}
          <button
            onClick={onOpenPasses}
            style={{
              background: 'linear-gradient(135deg, #00D2FF 0%, #0077FF 50%, #0051FF 100%)',
              border: 'none',
              borderRadius: '9999px',
              padding: '7px 16px',
              color: '#020C1E',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 22px rgba(0, 210, 255, 0.65), 0 4px 14px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.2s ease',
              fontFamily: "'Space Grotesk', sans-serif",
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 35px rgba(0, 210, 255, 0.85), 0 0 20px rgba(0, 119, 255, 0.5)';
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 0 22px rgba(0, 210, 255, 0.65), 0 4px 14px rgba(0, 0, 0, 0.4)';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
          >
            <Ticket size={14} color="#020C1E" />
            <span className="desktop-only">Registration&nbsp;</span>
            <span>Passes</span>
            {passesCount > 0 && (
              <span
                style={{
                  background: '#020C1E',
                  color: '#00D2FF',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '9999px'
                }}
              >
                {passesCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#00D2FF',
              cursor: 'pointer',
              padding: '6px'
            }}
            className="mobile-only"
          >
            {mobileMenuOpen ? <X size={24} color="#00D2FF" /> : <Menu size={24} color="#00D2FF" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            marginTop: '10px',
            background: 'rgba(3, 14, 38, 0.98)',
            border: '1px solid rgba(0, 140, 255, 0.38)',
            borderRadius: '20px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 20px 45px rgba(0,0,0,0.9), 0 0 30px rgba(0, 140, 255, 0.25)'
          }}
        >
          {/* Mobile Links */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigateExplore();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#F8FAFC',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <Compass size={18} color="#00D2FF" />
            <span>Explore Events</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigateHyped();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#00D2FF',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <Flame size={18} color="#00D2FF" />
            <span>🔥 Hyped Events</span>
          </button>

          {/* Mobile Dropdown Options */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Select by Department
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '14px' }}>
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSelectDepartment(dept.code);
                  }}
                  style={{
                    background: 'rgba(0, 140, 255, 0.1)',
                    border: '1px solid rgba(0, 210, 255, 0.3)',
                    borderRadius: '6px',
                    padding: '8px 4px',
                    color: '#F8FAFC',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {dept.code}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Select by Event Category
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {categories.slice(1).map(cat => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSelectCategory(cat.key);
                  }}
                  style={{
                    background: 'rgba(0, 140, 255, 0.1)',
                    border: '1px solid rgba(0, 210, 255, 0.3)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: '#38BDF8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPasses();
              }}
              style={{
                background: 'linear-gradient(135deg, #00D2FF 0%, #0077FF 50%, #0051FF 100%)',
                color: '#020C1E',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 25px rgba(0, 210, 255, 0.6)'
              }}
            >
              <Ticket size={16} color="#020C1E" />
              <span>View Registration Passes {passesCount > 0 ? `(${passesCount})` : ''}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenIntro();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(0, 140, 255, 0.35)',
                color: '#F8FAFC',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Clapperboard size={15} color="#00D2FF" />
              <span>Watch Fullscreen Intro</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
