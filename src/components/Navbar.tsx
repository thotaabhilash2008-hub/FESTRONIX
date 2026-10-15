import React, { useState, useRef, useEffect } from 'react';
import { Clapperboard, Ticket, Menu, X, Bell, Flame, ChevronDown, Building2, Sparkles, Trophy, Compass, Layers, ShoppingBag, User as UserIcon, LogIn, LogOut, Shield } from 'lucide-react';
import { Announcement, User as UserType } from '../types/festronix';
import { DEPARTMENTS } from '../data/mockData';

interface NavbarProps {
  onOpenIntro: () => void;
  onOpenPasses: () => void;
  onOpenMultiPass: () => void;
  currentUser: UserType | null;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onSignOut: () => void;
  announcements: Announcement[];
  passesCount: number;
  onNavigateExplore: () => void;
  onNavigateHyped: () => void;
  onSelectDepartment: (deptCode: string) => void;
  onSelectCategory: (categoryKey: string) => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenIntro,
  onOpenPasses,
  onOpenMultiPass,
  currentUser,
  onOpenAuth,
  onSignOut,
  announcements,
  passesCount,
  onNavigateExplore,
  onNavigateHyped,
  onSelectDepartment,
  onSelectCategory,
  onOpenAdmin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAnnouncementsDropdown, setShowAnnouncementsDropdown] = useState(false);
  const [isBrowseDropdownOpen, setIsBrowseDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBrowseDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleScroll = () => {
      setIsBrowseDropdownOpen(false);
      setIsUserMenuOpen(false);
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
          backgroundColor: 'rgba(20, 31, 62, 0.92)',
          border: '1px solid rgba(220, 227, 229, 0.22)',
          borderRadius: '9999px',
          height: '66px',
          padding: '0 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(40, 59, 120, 0.25), inset 0 1px 0 rgba(220, 227, 229, 0.1)'
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
              background: 'linear-gradient(135deg, #283B78 0%, #3E4264 50%, #789593 100%)',
              padding: '1.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(120, 149, 147, 0.45)'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '10px',
                background: '#101A35',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#BACEBB',
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
                  color: '#FFFFFF'
                }}
              >
                FESTRONIX
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(120, 149, 147, 0.15)',
                  border: '1px solid rgba(120, 149, 147, 0.4)',
                  color: '#BACEBB',
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
                color: '#A8B3C2',
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
              color: '#DCE3E5',
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
            onMouseEnter={e => (e.currentTarget.style.color = '#BACEBB')}
            onMouseLeave={e => (e.currentTarget.style.color = '#DCE3E5')}
          >
            <Compass size={15} color="#789593" />
            <span>Explore Events</span>
          </button>

          {/* 2. Hyped Events */}
          <button
            onClick={() => {
              setIsBrowseDropdownOpen(false);
              onNavigateHyped();
            }}
            style={{
              background: 'rgba(40, 59, 120, 0.3)',
              border: '1px solid rgba(120, 149, 147, 0.4)',
              borderRadius: '9999px',
              color: '#BACEBB',
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
              e.currentTarget.style.background = 'rgba(40, 59, 120, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 18px rgba(120, 149, 147, 0.45)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(40, 59, 120, 0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Flame size={14} color="#BACEBB" />
            <span>Hyped Events</span>
          </button>

          {/* 3. Browse Dropdown: Select by Department & Select by Event Category */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsBrowseDropdownOpen(!isBrowseDropdownOpen)}
              style={{
                background: isBrowseDropdownOpen ? 'rgba(40, 59, 120, 0.35)' : 'none',
                border: isBrowseDropdownOpen ? '1px solid rgba(120, 149, 147, 0.45)' : '1px solid transparent',
                borderRadius: '8px',
                color: isBrowseDropdownOpen ? '#BACEBB' : '#DCE3E5',
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
                if (!isBrowseDropdownOpen) e.currentTarget.style.color = '#BACEBB';
              }}
              onMouseLeave={e => {
                if (!isBrowseDropdownOpen) e.currentTarget.style.color = '#DCE3E5';
              }}
            >
              <Layers size={14} color="#789593" />
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
                  background: 'rgba(16, 26, 53, 0.98)',
                  border: '1px solid rgba(220, 227, 229, 0.25)',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 25px rgba(40, 59, 120, 0.3)',
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
                      background: 'rgba(40, 59, 120, 0.25)',
                      border: '1px solid rgba(120, 149, 147, 0.3)',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(40, 59, 120, 0.4)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(40, 59, 120, 0.25)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} color="#BACEBB" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                        Select by Department
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#BACEBB', fontWeight: 600 }}>
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
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(220, 227, 229, 0.15)',
                          borderRadius: '6px',
                          padding: '6px 4px',
                          color: '#DCE3E5',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          textAlign: 'center',
                          fontFamily: "'Space Grotesk', sans-serif"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#789593';
                          e.currentTarget.style.color = '#BACEBB';
                          e.currentTarget.style.background = 'rgba(40, 59, 120, 0.35)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(220, 227, 229, 0.15)';
                          e.currentTarget.style.color = '#DCE3E5';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
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
                      background: 'rgba(40, 59, 120, 0.25)',
                      border: '1px solid rgba(120, 149, 147, 0.3)',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(40, 59, 120, 0.4)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(40, 59, 120, 0.25)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="#BACEBB" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                        Select by Event Category
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#BACEBB', fontWeight: 600 }}>
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
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(220, 227, 229, 0.15)',
                          borderRadius: '6px',
                          padding: '5px 9px',
                          color: '#DCE3E5',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          fontFamily: "'Space Grotesk', sans-serif"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#789593';
                          e.currentTarget.style.color = '#BACEBB';
                          e.currentTarget.style.background = 'rgba(40, 59, 120, 0.35)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(220, 227, 229, 0.15)';
                          e.currentTarget.style.color = '#DCE3E5';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
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
              color: '#A8B3C2',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'color 0.2s',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#BACEBB')}
            onMouseLeave={e => (e.currentTarget.style.color = '#A8B3C2')}
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
                background: 'rgba(40, 59, 120, 0.25)',
                border: '1px solid rgba(220, 227, 229, 0.25)',
                borderRadius: '9999px',
                padding: '6px 12px',
                color: '#DCE3E5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              title="Fest Updates"
            >
              <Bell size={13} color="#DCE3E5" />
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
                  background: '#142042',
                  border: '1px solid rgba(220, 227, 229, 0.25)',
                  borderRadius: '14px',
                  padding: '16px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 20px rgba(40, 59, 120, 0.3)',
                  zIndex: 100
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: '#BACEBB',
                      fontWeight: 700,
                      fontFamily: "'Space Grotesk', sans-serif",
                      letterSpacing: '0.04em'
                    }}
                  >
                    LIVE BULLETINS
                  </span>
                  <button
                    onClick={() => setShowAnnouncementsDropdown(false)}
                    style={{ background: 'none', border: 'none', color: '#A8B3C2', cursor: 'pointer' }}
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
                        background: 'rgba(16, 26, 53, 0.75)',
                        borderLeft: `3px solid ${ann.type === 'urgent' ? '#F43F5E' : '#789593'}`,
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '2px' }}>
                        {ann.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>
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
              border: '1px solid rgba(220, 227, 229, 0.25)',
              borderRadius: '9999px',
              padding: '7px 13px',
              color: '#DCE3E5',
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
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = '#789593';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#DCE3E5';
              e.currentTarget.style.borderColor = 'rgba(220, 227, 229, 0.25)';
            }}
          >
            <Clapperboard size={13} color="#DCE3E5" />
            <span>Intro</span>
          </button>

          {/* Buy Multiple Passes Button */}
          <button
            onClick={onOpenMultiPass}
            className="desktop-only"
            style={{
              background: 'rgba(40, 59, 120, 0.35)',
              border: '1px solid rgba(120, 149, 147, 0.45)',
              borderRadius: '9999px',
              padding: '7px 14px',
              color: '#BACEBB',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              fontFamily: "'Space Grotesk', sans-serif",
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#BACEBB';
              e.currentTarget.style.background = 'rgba(40, 59, 120, 0.55)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(120, 149, 147, 0.45)';
              e.currentTarget.style.background = 'rgba(40, 59, 120, 0.35)';
            }}
          >
            <ShoppingBag size={14} color="#BACEBB" />
            <span>Buy Multiple Passes</span>
          </button>

          {/* User Account / Sign In */}
          {currentUser ? (
            <div ref={userMenuRef} style={{ position: 'relative' }} className="desktop-only">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{
                  background: 'rgba(16, 26, 53, 0.85)',
                  border: '1px solid rgba(120, 149, 147, 0.4)',
                  borderRadius: '9999px',
                  padding: '5px 12px 5px 6px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #283B78 0%, #789593 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.72rem'
                  }}
                >
                  {currentUser.fullName.charAt(0)}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{currentUser.rollNumber}</span>
                <ChevronDown size={12} color="#A8B3C2" />
              </button>

              {isUserMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '46px',
                    right: 0,
                    width: '260px',
                    background: '#142042',
                    border: '1px solid rgba(220, 227, 229, 0.25)',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 20px rgba(40, 59, 120, 0.3)',
                    zIndex: 100
                  }}
                >
                  <div style={{ marginBottom: '12px', borderBottom: '1px solid rgba(220, 227, 229, 0.1)', paddingBottom: '10px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>{currentUser.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#BACEBB', fontFamily: 'monospace' }}>Roll: {currentUser.rollNumber}</div>
                    <div style={{ fontSize: '0.72rem', color: '#A8B3C2', marginTop: '2px' }}>{currentUser.email}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenPasses();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#DCE3E5',
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(40, 59, 120, 0.4)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <Ticket size={14} color="#BACEBB" />
                      <span>My Passes ({passesCount})</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenMultiPass();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#DCE3E5',
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(40, 59, 120, 0.4)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <ShoppingBag size={14} color="#BACEBB" />
                      <span>Buy Multiple Passes</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSignOut();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f87171',
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderTop: '1px solid rgba(220, 227, 229, 0.08)',
                        marginTop: '4px'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('signin')}
              className="desktop-only"
              style={{
                background: 'rgba(220, 227, 229, 0.08)',
                border: '1px solid rgba(220, 227, 229, 0.25)',
                borderRadius: '9999px',
                padding: '7px 15px',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                fontFamily: "'Space Grotesk', sans-serif",
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#BACEBB';
                e.currentTarget.style.color = '#BACEBB';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(220, 227, 229, 0.25)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
            >
              <LogIn size={14} color="#BACEBB" />
              <span>Sign In / Sign Up</span>
            </button>
          )}

          {/* Replay Intro Button */}
          <button
            onClick={onOpenIntro}
            className="desktop-only"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(220, 227, 229, 0.25)',
              borderRadius: '9999px',
              padding: '7px 13px',
              color: '#DCE3E5',
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
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = '#789593';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#DCE3E5';
              e.currentTarget.style.borderColor = 'rgba(220, 227, 229, 0.25)';
            }}
          >
            <Clapperboard size={13} color="#DCE3E5" />
            <span>Intro</span>
          </button>

          {/* View Our Registration Passes */}
          <button
            onClick={onOpenPasses}
            style={{
              background: 'linear-gradient(135deg, #283B78 0%, #3B539C 50%, #4B63AA 100%)',
              border: '1px solid rgba(220, 227, 229, 0.35)',
              borderRadius: '9999px',
              padding: '7px 16px',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 20px rgba(40, 59, 120, 0.65), 0 4px 14px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.2s ease',
              fontFamily: "'Space Grotesk', sans-serif",
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 28px rgba(120, 149, 147, 0.5), 0 0 20px rgba(40, 59, 120, 0.6)';
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
              e.currentTarget.style.borderColor = '#BACEBB';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(40, 59, 120, 0.65), 0 4px 14px rgba(0, 0, 0, 0.4)';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.borderColor = 'rgba(220, 227, 229, 0.35)';
            }}
          >
            <Ticket size={14} color="#FFFFFF" />
            <span className="desktop-only">Passes</span>
            {passesCount > 0 && (
              <span
                style={{
                  background: '#101A35',
                  color: '#BACEBB',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(120, 149, 147, 0.4)'
                }}
              >
                {passesCount}
              </span>
            )}
          </button>

          {/* Admin / SAC Portal Access */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="desktop-only"
              style={{
                background: 'rgba(120, 149, 147, 0.15)',
                border: '1px solid rgba(120, 149, 147, 0.4)',
                borderRadius: '9999px',
                padding: '7px 14px',
                color: '#BACEBB',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                fontFamily: "'Space Grotesk', sans-serif",
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(40, 59, 120, 0.45)';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.borderColor = '#BACEBB';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(120, 149, 147, 0.15)';
                e.currentTarget.style.color = '#BACEBB';
                e.currentTarget.style.borderColor = 'rgba(120, 149, 147, 0.4)';
              }}
              title="Dean SAC & Department HOD / Coordinator Portal"
            >
              <Shield size={13} color="#BACEBB" />
              <span>Admin Portal</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#DCE3E5',
              cursor: 'pointer',
              padding: '6px'
            }}
            className="mobile-only"
          >
            {mobileMenuOpen ? <X size={24} color="#DCE3E5" /> : <Menu size={24} color="#DCE3E5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            marginTop: '10px',
            background: 'rgba(16, 26, 53, 0.98)',
            border: '1px solid rgba(220, 227, 229, 0.25)',
            borderRadius: '20px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 20px 45px rgba(0,0,0,0.9), 0 0 25px rgba(40, 59, 120, 0.25)'
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
              color: '#FFFFFF',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <Compass size={18} color="#789593" />
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
              color: '#BACEBB',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <Flame size={18} color="#BACEBB" />
            <span>🔥 Hyped Events</span>
          </button>

          {/* Mobile Dropdown Options */}
          <div style={{ borderTop: '1px solid rgba(220, 227, 229, 0.12)', paddingTop: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: '#A8B3C2', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
                    background: 'rgba(40, 59, 120, 0.25)',
                    border: '1px solid rgba(220, 227, 229, 0.2)',
                    borderRadius: '6px',
                    padding: '8px 4px',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {dept.code}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.75rem', color: '#A8B3C2', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
                    background: 'rgba(40, 59, 120, 0.25)',
                    border: '1px solid rgba(120, 149, 147, 0.3)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: '#BACEBB',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(220, 227, 229, 0.12)', paddingTop: '12px' }}>
            {/* User Profile / Sign In in Mobile */}
            {currentUser ? (
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(40, 59, 120, 0.3)',
                  border: '1px solid rgba(120, 149, 147, 0.4)',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>{currentUser.fullName}</div>
                  <div style={{ fontSize: '0.72rem', color: '#BACEBB', fontFamily: 'monospace' }}>Roll: {currentUser.rollNumber}</div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut();
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signin');
                }}
                style={{
                  background: 'rgba(220, 227, 229, 0.08)',
                  border: '1px solid rgba(220, 227, 229, 0.25)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <LogIn size={16} color="#BACEBB" />
                <span>Sign In / Sign Up</span>
              </button>
            )}

            {/* Buy Multiple Passes */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenMultiPass();
              }}
              style={{
                background: 'rgba(40, 59, 120, 0.35)',
                border: '1px solid rgba(120, 149, 147, 0.45)',
                color: '#BACEBB',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ShoppingBag size={16} color="#BACEBB" />
              <span>Buy Multiple Passes</span>
            </button>

            {/* View Passes */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPasses();
              }}
              style={{
                background: 'linear-gradient(135deg, #283B78 0%, #3B539C 50%, #4B63AA 100%)',
                color: '#FFFFFF',
                border: '1px solid rgba(220, 227, 229, 0.35)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(40, 59, 120, 0.65)'
              }}
            >
              <Ticket size={16} color="#FFFFFF" />
              <span>View Registration Passes {passesCount > 0 ? `(${passesCount})` : ''}</span>
            </button>

            {onOpenAdmin && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                style={{
                  background: 'rgba(120, 149, 147, 0.15)',
                  border: '1px solid rgba(120, 149, 147, 0.45)',
                  color: '#BACEBB',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Shield size={16} color="#BACEBB" />
                <span>Admin Portal (Dean SAC & HODs)</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenIntro();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(220, 227, 229, 0.25)',
                color: '#DCE3E5',
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
              <Clapperboard size={15} color="#DCE3E5" />
              <span>Watch Fullscreen Intro</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
