import React, { useState, useRef, useEffect } from 'react';
import { Ticket, Menu, X, Bell, Flame, ChevronDown, Building2, Sparkles, Layers, ShoppingBag, LogIn, LogOut, ShieldCheck, Rocket } from 'lucide-react';
import { Announcement, User as UserType } from '../types/festronix';
import { DEPARTMENTS } from '../data/mockData';

interface NavbarProps {
  onOpenIntro?: () => void;
  onOpenPasses: () => void;
  onOpenMultiPass: () => void;
  currentUser: UserType | null;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onSignOut: () => void;
  announcements: Announcement[];
  passesCount: number;
  onNavigateExplore?: () => void;
  onNavigateHyped: () => void;
  onSelectDepartment: (deptCode: string) => void;
  onSelectCategory: (categoryKey: string) => void;
  onOpenAdmin?: () => void;
  onOpenSponsors?: () => void;
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
  onOpenAdmin,
  onOpenSponsors
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileAnnouncements, setShowMobileAnnouncements] = useState(false);

  // Lock body scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);
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
        maxWidth: '1300px',
        margin: '0 auto',
        padding: '0 16px',
        width: '100%'
      }}
    >
      <div
        className="navbar-pill-container"
        style={{
          WebkitBackdropFilter: 'blur(24px)',
          backgroundColor: 'rgba(8, 9, 13, 0.88)',
          border: '1px solid rgba(199, 203, 212, 0.16)',
          borderRadius: '9999px',
          height: '66px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.9), 0 0 25px rgba(255, 107, 53, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Brand / Logos Cluster: Vardhaman + Connect Club + Vencorpia */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href="#"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none'
            }}
            title="Vardhaman College of Engineering"
          >
            <img
              src="/vce_logo.png"
              alt="VCE Logo"
              className="navbar-brand-logo"
              style={{
                height: '40px',
                width: 'auto',
                maxHeight: '42px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 10px rgba(255, 107, 53, 0.15))'
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span
                className="navbar-brand-vce-text"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: '1.12rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  color: '#F3F0EA',
                  lineHeight: 1.15
                }}
              >
                VARDHAMAN
              </span>
              <span
                className="navbar-brand-vce-subtext"
                style={{
                  fontSize: '0.58rem',
                  color: '#94A3B8',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontFamily: "'Space Grotesk', sans-serif",
                  lineHeight: 1.1,
                  marginTop: '1px'
                }}
              >
                College of Engineering
              </span>
            </div>
          </a>

          {/* Vertical Divider */}
          <div
            className="navbar-partner-divider"
            style={{
              height: '24px',
              width: '1px',
              background: 'linear-gradient(to bottom, transparent, rgba(199, 203, 212, 0.28), transparent)',
              margin: '0 2px'
            }}
          />

          {/* Partner Logos: Connect Club & Vencorpia */}
          <div className="navbar-partner-logos">
            {/* Connect Club */}
            <a
              href="https://connectclub.in"
              target="_blank"
              rel="noopener noreferrer"
              title="Connect Club"
              className="navbar-partner-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '3px 6px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <img
                src="/connect_club_transparent.png"
                alt="Connect Club"
                className="navbar-partner-img-connect"
              />
            </a>

            {/* Vencorpia */}
            <a
              href="https://vencorpia.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Vencorpia — One Stop for Effortless Events"
              className="navbar-partner-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '3px 6px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.35)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <img
                src="/vencorpia_transparent.png"
                alt="Vencorpia"
                className="navbar-partner-img-vencorpia"
              />
            </a>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
          className="desktop-nav"
        >
          {/* 1. Browse Dropdown: Select by Department & Select by Event Category */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsBrowseDropdownOpen(!isBrowseDropdownOpen)}
              style={{
                background: isBrowseDropdownOpen ? 'rgba(111, 150, 147, 0.14)' : 'rgba(21, 24, 32, 0.8)',
                border: isBrowseDropdownOpen ? '1px solid #88B2AE' : '1px solid rgba(199, 203, 212, 0.18)',
                borderRadius: '9999px',
                color: isBrowseDropdownOpen ? '#FFFFFF' : '#DCE3E8',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 15px',
                transition: 'all 0.2s ease',
                fontFamily: "'Space Grotesk', sans-serif"
              }}
              onMouseEnter={e => {
                if (!isBrowseDropdownOpen) {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#88B2AE';
                  e.currentTarget.style.background = 'rgba(111, 150, 147, 0.1)';
                }
              }}
              onMouseLeave={e => {
                if (!isBrowseDropdownOpen) {
                  e.currentTarget.style.color = '#DCE3E8';
                  e.currentTarget.style.borderColor = 'rgba(199, 203, 212, 0.18)';
                  e.currentTarget.style.background = 'rgba(21, 24, 32, 0.8)';
                }
              }}
            >
              <Layers size={14} color="#88B2AE" />
              <span>Browse Events</span>
              <ChevronDown
                size={13}
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
                  background: 'rgba(15, 17, 23, 0.98)',
                  border: '1px solid rgba(199, 203, 212, 0.22)',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(255, 107, 53, 0.1)',
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
                      background: 'rgba(255, 107, 53, 0.08)',
                      border: '1px solid rgba(255, 107, 53, 0.25)',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255, 107, 53, 0.16)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(111, 150, 147, 0.12)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} color="#3D68B2" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F0F4F8' }}>
                        Select by Department
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#88B2AE', fontWeight: 600 }}>
                      View All →
                    </span>
                  </div>

                  {/* Department Quick Chips (3x3 grid for 9 departments) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {DEPARTMENTS.map(dept => (
                      <button
                        key={dept.id}
                        onClick={() => {
                          onSelectDepartment(dept.code);
                          setIsBrowseDropdownOpen(false);
                        }}
                        style={{
                          background: 'rgba(21, 24, 32, 0.85)',
                          border: '1px solid rgba(199, 203, 212, 0.14)',
                          borderRadius: '6px',
                          padding: '6px 4px',
                          color: '#C7CBD4',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          textAlign: 'center',
                          fontFamily: "'Space Grotesk', sans-serif"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#88B2AE';
                          e.currentTarget.style.color = '#FFFFFF';
                          e.currentTarget.style.background = 'rgba(111, 150, 147, 0.16)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(199, 203, 212, 0.14)';
                          e.currentTarget.style.color = '#C7CBD4';
                          e.currentTarget.style.background = 'rgba(21, 24, 32, 0.85)';
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
                      background: 'rgba(111, 150, 147, 0.1)',
                      border: '1px solid rgba(111, 150, 147, 0.3)',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(111, 150, 147, 0.18)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(111, 150, 147, 0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="#88B2AE" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F0F4F8' }}>
                        Select by Event Category
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#88B2AE', fontWeight: 600 }}>
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
                          background: 'rgba(21, 24, 32, 0.85)',
                          border: '1px solid rgba(199, 203, 212, 0.14)',
                          borderRadius: '6px',
                          padding: '5px 9px',
                          color: '#C7CBD4',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          fontFamily: "'Space Grotesk', sans-serif"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#88B2AE';
                          e.currentTarget.style.color = '#FFFFFF';
                          e.currentTarget.style.background = 'rgba(111, 150, 147, 0.16)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(199, 203, 212, 0.14)';
                          e.currentTarget.style.color = '#C7CBD4';
                          e.currentTarget.style.background = 'rgba(21, 24, 32, 0.85)';
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

          {/* 2. Hyped Events */}
          <button
            onClick={() => {
              setIsBrowseDropdownOpen(false);
              onNavigateHyped();
            }}
            style={{
              background: 'rgba(255, 107, 53, 0.08)',
              border: '1px solid rgba(255, 107, 53, 0.3)',
              borderRadius: '9999px',
              color: '#F3F0EA',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              fontFamily: "'Space Grotesk', sans-serif",
              padding: '7px 15px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(46, 78, 140, 0.22)';
              e.currentTarget.style.borderColor = '#3D68B2';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(61, 104, 178, 0.4)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(46, 78, 140, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(61, 104, 178, 0.35)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.color = '#F0F4F8';
            }}
          >
            <Flame size={14} color="#3D68B2" />
            <span>Hyped Events</span>
          </button>
        </div>

        {/* Right Action Icons & Passes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Announcements Popover (Desktop) */}
          <div style={{ position: 'relative' }} className="desktop-only">
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
                  background: 'rgba(15, 17, 23, 0.98)',
                  border: '1px solid rgba(199, 203, 212, 0.22)',
                  borderRadius: '14px',
                  padding: '16px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 20px rgba(61, 104, 178, 0.2)',
                  zIndex: 100
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: '#88B2AE',
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
                        background: 'rgba(21, 24, 32, 0.75)',
                        borderLeft: `3px solid ${ann.type === 'urgent' ? '#88B2AE' : 'rgba(199, 203, 212, 0.4)'}`,
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F3F0EA', marginBottom: '2px' }}>
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

          {/* Buy Multiple Passes Button */}
          <button
            onClick={onOpenMultiPass}
            className="desktop-only"
            style={{
              background: 'rgba(21, 24, 32, 0.85)',
              border: '1px solid rgba(199, 203, 212, 0.2)',
              borderRadius: '9999px',
              padding: '7px 14px',
              color: '#C7CBD4',
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
              e.currentTarget.style.borderColor = '#88B2AE';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.background = 'rgba(111, 150, 147, 0.14)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(199, 203, 212, 0.2)';
              e.currentTarget.style.color = '#C7CBD4';
              e.currentTarget.style.background = 'rgba(21, 24, 32, 0.85)';
            }}
          >
            <ShoppingBag size={14} color="#88B2AE" />
            <span>Buy Multiple Passes</span>
          </button>

          
          {/* Public Sponsors & Partners Nav Link */}
          {onOpenSponsors && (
            <button
              onClick={onOpenSponsors}
              className="desktop-only"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '9999px',
                padding: '7px 14px',
                color: '#C7CBD4',
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
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#C7CBD4';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
              title="View Official Sponsors and Strategic Partners"
            >
              <Building2 size={14} color="#38BDF8" />
              <span>Sponsors & Partners</span>
            </button>
          )}

          {/* Admin Console Quick Link */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="desktop-only"
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '9999px',
                padding: '7px 13px',
                color: '#38BDF8',
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
              title="SAC Executive Portal"
            >
              <ShieldCheck size={14} color="#38BDF8" />
              <span>Admin Console</span>
            </button>
          )}

          {/* User Account / Sign In */}
          {currentUser ? (
            <div ref={userMenuRef} style={{ position: 'relative' }} className="desktop-only">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{
                  background: 'rgba(21, 24, 32, 0.85)',
                  border: '1px solid rgba(199, 203, 212, 0.25)',
                  borderRadius: '9999px',
                  padding: '5px 12px 5px 6px',
                  color: '#F3F0EA',
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
                    background: 'linear-gradient(135deg, #243C74 0%, #4E7C77 100%)',
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
                <ChevronDown size={12} color="#94A3B8" />
              </button>

              {isUserMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '46px',
                    right: 0,
                    width: '260px',
                    background: 'rgba(15, 17, 23, 0.98)',
                    border: '1px solid rgba(199, 203, 212, 0.22)',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 20px rgba(61, 104, 178, 0.2)',
                    zIndex: 100
                  }}
                >
                  <div style={{ marginBottom: '12px', borderBottom: '1px solid rgba(199, 203, 212, 0.1)', paddingBottom: '10px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F3F0EA' }}>{currentUser.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#88B2AE', fontFamily: 'monospace' }}>Roll: {currentUser.rollNumber}</div>
                    <div style={{ fontSize: '0.72rem', color: '#CBD5E1', marginTop: '2px' }}>{currentUser.email}</div>
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
                        color: '#C7CBD4',
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
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(111, 150, 147, 0.14)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <Ticket size={14} color="#88B2AE" />
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
                        color: '#C7CBD4',
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
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(111, 150, 147, 0.14)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <ShoppingBag size={14} color="#88B2AE" />
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
                        borderTop: '1px solid rgba(199, 203, 212, 0.1)',
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
                background: 'rgba(21, 24, 32, 0.8)',
                border: '1px solid rgba(199, 203, 212, 0.2)',
                borderRadius: '9999px',
                padding: '7px 15px',
                color: '#F3F0EA',
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
                e.currentTarget.style.borderColor = '#88B2AE';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.background = 'rgba(111, 150, 147, 0.14)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(199, 203, 212, 0.2)';
                e.currentTarget.style.color = '#F3F0EA';
                e.currentTarget.style.background = 'rgba(21, 24, 32, 0.8)';
              }}
            >
              <LogIn size={14} color="#88B2AE" />
              <span>Sign In / Sign Up</span>
            </button>
          )}

          {/* View Our Registration Passes */}
          <button
            onClick={onOpenPasses}
            style={{
              background: 'linear-gradient(135deg, #243C74 0%, #2E4E8C 45%, #4E7C77 100%)',
              border: '1px solid rgba(220, 227, 232, 0.35)',
              borderRadius: '9999px',
              padding: '7px 16px',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 20px rgba(46, 78, 140, 0.65), 0 0 16px rgba(111, 150, 147, 0.35)',
              transition: 'all 0.2s ease',
              fontFamily: "'Space Grotesk', sans-serif",
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 6px 26px rgba(46, 78, 140, 0.85), 0 0 24px rgba(111, 150, 147, 0.5)';
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(46, 78, 140, 0.65), 0 0 16px rgba(111, 150, 147, 0.35)';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
          >
            <Ticket size={14} color="#FFFFFF" />
            <span className="desktop-only">Passes</span>
            {passesCount > 0 && (
              <span
                style={{
                  background: '#080C16',
                  color: '#88B2AE',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(111, 150, 147, 0.6)'
                }}
              >
                {passesCount}
              </span>
            )}
          </button>



          {/* Mobile Menu Toggle (Three Lines Button) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            title="Navigation Menu"
            className="mobile-only mobile-menu-btn"
            style={{
              background: mobileMenuOpen ? 'rgba(239, 68, 68, 0.2)' : 'rgba(21, 24, 32, 0.95)',
              border: mobileMenuOpen ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(199, 203, 212, 0.3)',
              borderRadius: '12px',
              color: mobileMenuOpen ? '#FCA5A5' : '#F3F0EA',
              cursor: 'pointer',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {mobileMenuOpen ? <X size={22} color="#FCA5A5" /> : <Menu size={22} color="#F3F0EA" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-in Sidebar Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="mobile-sidebar-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(5, 7, 12, 0.82)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 99998
            }}
          />

          {/* Slide-in Drawer Container */}
          <div
            className="mobile-sidebar-drawer"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(380px, 88vw)',
              backgroundColor: '#090C13',
              backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(46, 78, 140, 0.3) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(111, 150, 147, 0.2) 0%, transparent 50%)',
              borderLeft: '1px solid rgba(199, 203, 212, 0.2)',
              boxShadow: '-16px 0 50px rgba(0, 0, 0, 0.95)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}
          >
            {/* Drawer Top Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(199, 203, 212, 0.12)',
                background: 'rgba(15, 17, 23, 0.95)',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src="/vce_logo.png"
                  alt="Vardhaman Logo"
                  style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
                />
                <div>
                  <div
                    style={{
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      color: '#F3F0EA',
                      fontFamily: "var(--font-heading)"
                    }}
                  >
                    FESTRONIX '26
                  </div>
                  <div
                    style={{
                      fontSize: '0.62rem',
                      color: '#88B2AE',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase'
                    }}
                  >
                    Navigation Sidebar
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(199, 203, 212, 0.2)',
                  borderRadius: '10px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sidebar Scrollable Body: All Options One by One */}
            <div
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1
              }}
            >
              {/* Option 1: User Profile or Sign In Button */}
              {currentUser ? (
                <div
                  style={{
                    padding: '14px',
                    background: 'rgba(21, 24, 32, 0.9)',
                    border: '1px solid rgba(199, 203, 212, 0.22)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #243C74 0%, #4E7C77 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.9rem'
                      }}
                    >
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: '#F3F0EA',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}
                      >
                        {currentUser.fullName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#88B2AE', fontFamily: 'monospace' }}>
                        Roll: {currentUser.rollNumber}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignOut();
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#FCA5A5',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signin');
                  }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(36, 60, 116, 0.4) 0%, rgba(78, 124, 119, 0.4) 100%)',
                    border: '1px solid rgba(136, 178, 174, 0.4)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                  }}
                >
                  <LogIn size={16} color="#88B2AE" />
                  <span>Sign In / Register Account</span>
                </button>
              )}

              {/* Option 2: View Registration Passes */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPasses();
                }}
                style={{
                  background: 'linear-gradient(135deg, #243C74 0%, #2E4E8C 45%, #4E7C77 100%)',
                  border: '1px solid rgba(220, 227, 232, 0.35)',
                  borderRadius: '12px',
                  padding: '13px 16px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 20px rgba(46, 78, 140, 0.5)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Ticket size={18} color="#FFFFFF" />
                  <span>My Passes & Tickets</span>
                </div>
                <span
                  style={{
                    background: '#080C16',
                    color: '#88B2AE',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(111, 150, 147, 0.6)'
                  }}
                >
                  {passesCount > 0 ? `${passesCount} Active` : 'View Passes'}
                </span>
              </button>

              {/* Option 3: Buy Multiple Passes */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMultiPass();
                }}
                style={{
                  background: 'rgba(21, 24, 32, 0.85)',
                  border: '1px solid rgba(199, 203, 212, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#F3F0EA',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <ShoppingBag size={18} color="#88B2AE" />
                <span>Buy Multiple Passes</span>
              </button>

              {/* Option 4: Campus Announcements & Bulletins */}
              <div
                style={{
                  background: 'rgba(21, 24, 32, 0.85)',
                  border: '1px solid rgba(199, 203, 212, 0.2)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => setShowMobileAnnouncements(!showMobileAnnouncements)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '12px 16px',
                    color: '#F3F0EA',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bell size={18} color="#38BDF8" />
                    <span>Campus Announcements</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        color: '#38BDF8',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '9999px'
                      }}
                    >
                      {announcements.length}
                    </span>
                    <ChevronDown
                      size={14}
                      color="#94A3B8"
                      style={{
                        transform: showMobileAnnouncements ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}
                    />
                  </div>
                </button>
                {showMobileAnnouncements && (
                  <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {announcements.map(ann => (
                      <div
                        key={ann.id}
                        style={{
                          padding: '10px',
                          background: 'rgba(10, 13, 20, 0.8)',
                          borderLeft: `3px solid ${ann.type === 'urgent' ? '#EF4444' : '#38BDF8'}`,
                          borderRadius: '6px'
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F3F0EA' }}>{ann.title}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>{ann.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Option 5: Sponsors & Strategic Partners Page Button */}
              {onOpenSponsors && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSponsors();
                  }}
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '12px',
                    padding: '13px 16px',
                    color: '#38BDF8',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(56, 189, 248, 0.15)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building2 size={18} color="#38BDF8" />
                    <span>Sponsors & Partners Page</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>Explore →</span>
                </button>
              )}

              {/* Option 6: Official Partners (Connect Club & Vencorpia) */}
              <div
                style={{
                  background: 'rgba(21, 24, 32, 0.6)',
                  border: '1px solid rgba(199, 203, 212, 0.14)',
                  borderRadius: '12px',
                  padding: '12px'
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: '#88B2AE',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '8px'
                  }}
                >
                  Official Event Partners
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <a
                    href="https://connectclub.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      background: 'rgba(10, 13, 20, 0.85)',
                      border: '1px solid rgba(199, 203, 212, 0.16)',
                      borderRadius: '8px',
                      padding: '10px 6px',
                      textDecoration: 'none',
                      color: '#F3F0EA'
                    }}
                  >
                    <img
                      src="/connect_club_transparent.png"
                      alt="Connect Club"
                      style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Connect Club</span>
                    <span style={{ fontSize: '0.6rem', color: '#94A3B8' }}>Student Partner</span>
                  </a>
                  <a
                    href="https://vencorpia.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      background: 'rgba(10, 13, 20, 0.85)',
                      border: '1px solid rgba(199, 203, 212, 0.16)',
                      borderRadius: '8px',
                      padding: '10px 6px',
                      textDecoration: 'none',
                      color: '#F3F0EA'
                    }}
                  >
                    <img
                      src="/vencorpia_transparent.png"
                      alt="Vencorpia"
                      style={{ height: '22px', width: 'auto', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Vencorpia</span>
                    <span style={{ fontSize: '0.6rem', color: '#94A3B8' }}>Tech Partner</span>
                  </a>
                </div>
              </div>

              {/* Option 7: Hyped Events */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateHyped();
                }}
                style={{
                  background: 'rgba(255, 107, 53, 0.1)',
                  border: '1px solid rgba(255, 107, 53, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#F3F0EA',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <Flame size={18} color="#FF6B35" />
                <span>🔥 Hyped Competitions</span>
              </button>

              {/* Option 8: Select by Department (9 Branches) */}
              <div
                style={{
                  background: 'rgba(21, 24, 32, 0.6)',
                  border: '1px solid rgba(199, 203, 212, 0.14)',
                  borderRadius: '12px',
                  padding: '12px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: '#88B2AE',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em'
                    }}
                  >
                    Select by Department
                  </span>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSelectDepartment('all');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#88B2AE',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    All Branches →
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {DEPARTMENTS.map(dept => (
                    <button
                      key={dept.id}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onSelectDepartment(dept.code);
                      }}
                      style={{
                        background: 'rgba(10, 13, 20, 0.85)',
                        border: '1px solid rgba(199, 203, 212, 0.14)',
                        borderRadius: '6px',
                        padding: '8px 4px',
                        color: '#C7CBD4',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {dept.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 9: Select by Event Category */}
              <div
                style={{
                  background: 'rgba(21, 24, 32, 0.6)',
                  border: '1px solid rgba(199, 203, 212, 0.14)',
                  borderRadius: '12px',
                  padding: '12px'
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: '#88B2AE',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '8px'
                  }}
                >
                  Select by Event Category
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {categories.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onSelectCategory(cat.key);
                      }}
                      style={{
                        background: 'rgba(10, 13, 20, 0.85)',
                        border: '1px solid rgba(199, 203, 212, 0.14)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: '#C7CBD4',
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

              {/* Option 10: Admin & Faculty Console (SAC / HOD) */}
              {onOpenAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.28)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#38BDF8',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck size={18} color="#38BDF8" />
                    <span>Admin Console (SAC & Faculty)</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>Login →</span>
                </button>
              )}
            </div>

            {/* Sidebar Bottom Footer Info */}
            <div
              style={{
                padding: '16px 20px 24px',
                borderTop: '1px solid rgba(199, 203, 212, 0.1)',
                marginTop: 'auto',
                textAlign: 'center',
                background: 'rgba(10, 13, 20, 0.95)'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F3F0EA' }}>
                Vardhaman College of Engineering
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>
                Shamshabad, Hyderabad • Oct 28–29, 2026
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};
