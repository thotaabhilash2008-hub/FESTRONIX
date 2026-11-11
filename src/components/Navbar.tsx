import React, { useState, useRef, useEffect } from 'react';
import { Ticket, Menu, X, Flame, Building2, Layers, ShoppingBag, LogIn, LogOut } from 'lucide-react';
import { Announcement } from '../types/festronix';

interface NavbarProps {
  onOpenIntro?: () => void;
  onOpenPasses: () => void;
  onOpenMultiPass: () => void;
  announcements: Announcement[];
  passesCount: number;
  onNavigateExplore?: () => void;
  onNavigateHyped: () => void;
  onSelectDepartment?: (deptCode: string) => void;
  onSelectCategory?: (categoryKey: string) => void;
  onSelectDay?: (day: 'all' | '1' | '2') => void;
  onOpenAdmin?: () => void;
  onOpenSponsors?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenIntro,
  onOpenPasses,
  onOpenMultiPass,
  announcements,
  passesCount,
  onNavigateExplore,
  onNavigateHyped,
  onSelectDepartment,
  onSelectCategory,
  onSelectDay,
  onOpenAdmin,
  onOpenSponsors
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleScroll = () => {
      setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <nav
      className="public-navbar"
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
          {/* 1. Browse Events Simple Hyperlink */}
          <button
            onClick={() => onNavigateExplore?.()}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#94A3B8',
              fontSize: '0.84rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 8px',
              transition: 'color 0.15s ease',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#94A3B8';
            }}
          >
            <span>Browse Events</span>
          </button>

          {/* 2. Hyped Events */}
          <button
            onClick={() => {
              onNavigateHyped();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#94A3B8',
              fontSize: '0.84rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 8px',
              transition: 'color 0.15s ease',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#94A3B8';
            }}
          >
            <span>Hyped Events</span>
          </button>
        </div>

        {/* Right Action Icons & Passes */}
        <div className="navbar-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Buy Multiple Passes Link */}
          <button
            onClick={onOpenMultiPass}
            className="desktop-only"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#94A3B8',
              fontSize: '0.84rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 8px',
              transition: 'color 0.15s ease',
              fontFamily: "'Space Grotesk', sans-serif",
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#94A3B8';
            }}
          >
            <span>Multiple Passes</span>
          </button>

          {/* Public Sponsors & Partners Nav Link */}
          {onOpenSponsors && (
            <button
              onClick={onOpenSponsors}
              className="desktop-only"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#94A3B8',
                fontSize: '0.84rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 8px',
                transition: 'color 0.15s ease',
                fontFamily: "'Space Grotesk', sans-serif",
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#94A3B8';
              }}
              title="View Official Sponsors and Strategic Partners"
            >
              <span>Sponsors</span>
            </button>
          )}

          {/* View Our Registration Passes */}
          <button
            onClick={onOpenPasses}
            className="nav-action nav-passes"
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
            <span>My Passes</span>
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
            aria-expanded={mobileMenuOpen}
            aria-controls="festronix-mobile-navigation"
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
            id="festronix-mobile-navigation"
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
              {/* Mobile Navigation: Passes & Direct Event Access */}

              {/* Option 2: View Registration Passes */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPasses();
                }}
                className="mobile-menu-action mobile-passes"
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

              {/* Compact event entry point */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateExplore?.();
                }}
                className="mobile-menu-action mobile-browse"
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
                <Layers size={18} color="#38BDF8" />
                <span>Browse All Events</span>
              </button>

              {/* Option 3: Buy Multiple Passes */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMultiPass();
                }}
                className="mobile-menu-action mobile-multipass"
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

              {/* Option 4: Sponsors & Strategic Partners Page Button */}
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
                className="mobile-menu-action mobile-partners"
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
                className="mobile-menu-action mobile-hyped"
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
