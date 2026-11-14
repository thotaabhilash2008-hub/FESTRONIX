import React, { useState, useEffect } from 'react';
import {
  Building2,
  ExternalLink,
  MapPin,
  Calendar,
  Download,
  Mail,
  PhoneCall,
  ArrowLeft,
  ShieldCheck,
  Ticket,
  Users,
  Compass
} from 'lucide-react';
import { SponsorProfile } from './partners/partnerData';
import { PartnerStorageService } from '../services/partnerStorageService';
import { GlitterBackground } from './GlitterBackground';

interface PublicSponsorsPageProps {
  onBackToHome: () => void;
  onExploreEvents?: () => void;
  onRegisterNow?: () => void;
}

export const PublicSponsorsPage: React.FC<PublicSponsorsPageProps> = ({ 
  onBackToHome, 
  onExploreEvents, 
  onRegisterNow 
}) => {
  const [sponsors, setSponsors] = useState<SponsorProfile[]>(() => PartnerStorageService.getSponsors());
  const [activeTier, setActiveTier] = useState<string>('all');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    PartnerStorageService.initRealtime();
    void PartnerStorageService.fetchSponsors()
      .then(setSponsors)
      .catch(error => console.warn('Public sponsor sync warning:', error));

    const handleUpdate = (e: any) => {
      if (Array.isArray(e.detail)) {
        setSponsors(e.detail);
      }
    };
    window.addEventListener('festronix:sponsors-updated', handleUpdate);
    return () => window.removeEventListener('festronix:sponsors-updated', handleUpdate);
  }, []);

  const filteredSponsors = sponsors.filter(s => {
    if (activeTier === 'all') return true;
    return s.tier.toLowerCase().includes(activeTier.toLowerCase());
  });

  const officialSponsors = sponsors.filter(sponsor =>
    ['Title Sponsor', 'Platinum Partner', 'Gold Sponsor', 'Official Event Partner', 'Official Tech Partner']
      .includes(sponsor.tier)
  ).slice(0, 4);

  const handleDownloadBrochure = () => {
    const blob = new Blob([
      `FESTRONIX 2026 • OFFICIAL CORPORATE SPONSORSHIP BROCHURE\nVardhaman College of Engineering, Hyderabad\nNational Level Technical Fest (Dec 1-2, 2026)\n\nKey Arenas: Autonomous Robotics, AI Hackathon, Drone Racing, 30+ Flagship Tracks.\nExpected Footfall: 35,000+ Students across 45+ Engineering Colleges.\nPrize Pool: ₹1,00,000+\n\nContact Central Desk:\nPhone: +91 98480 99112\nEmail: sponsorship.festronix@vardhaman.org\nWebsite: https://festronix-fawn.vercel.app/`
    ], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Festronix_2026_Sponsorship_Brochure.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="public-sponsors-shell" style={{ position: 'relative', minHeight: '100vh', width: '100%', background: '#080C16', color: '#F3F0EA', overflowX: 'hidden' }}>
      
      {/* Background Starfield & Subtle Grid */}
      <GlitterBackground />
      <div className="glitter-stardust-layer" />
      <div className="cyber-grid-overlay" />

      {/* Top Floating Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(8, 12, 22, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(199, 203, 212, 0.14)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBackToHome}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(199, 203, 212, 0.2)',
              borderRadius: '9999px',
              padding: '8px 16px',
              color: '#F3F0EA',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(199, 203, 212, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/vce_logo.png" 
              alt="Vardhaman Logo" 
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }} 
            />
            <div>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                FESTRONIX '26
              </span>
              <div style={{ fontSize: '0.62rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Vardhaman College of Engineering
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Button: Explore */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Action Button: Explore Arenas */}
          {onExploreEvents && (
            <button
              onClick={onExploreEvents}
              style={{
                background: 'linear-gradient(135deg, #243C74 0%, #2E4E8C 45%, #4E7C77 100%)',
                border: '1px solid rgba(220, 227, 232, 0.35)',
                borderRadius: '9999px',
                padding: '8px 18px',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(46, 78, 140, 0.5)'
              }}
            >
              <Compass size={14} />
              <span>Explore 30+ Arenas</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '50px 24px 20px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '9999px',
            padding: '6px 16px',
            fontSize: '0.75rem',
            color: '#38BDF8',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '20px'
          }}
        >
          <Building2 size={14} />
          <span>FESTRONIX 2026 // OFFICIAL SPONSORS & STRATEGIC PARTNERS</span>
        </div>

        <h1 
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 'clamp(2rem, 5vw, 3.4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '0.02em',
            margin: '0 0 18px 0',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #DCE3E8 40%, #BACEBB 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          POWERING NATIONAL INNOVATION
        </h1>

        <p 
          style={{
            maxWidth: '780px',
            margin: '0 auto 36px',
            color: '#94A3B8',
            fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
            lineHeight: 1.6
          }}
        >
          Meet the industry leaders, technology innovators, and community partners collaborating with Vardhaman College of Engineering to deliver South India's premier collegiate tech battleground.
        </p>

        {/* Tier Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {[
            { id: 'all', label: 'All Partners' },
            { id: 'partner', label: 'Event & Tech Partners' },
            { id: 'gold', label: 'Gold Sponsors' },
            { id: 'title', label: 'Title Sponsors' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTier(tab.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                background: activeTier === tab.id ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.3) 100%)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: activeTier === tab.id ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                color: activeTier === tab.id ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.2s ease',
                boxShadow: activeTier === tab.id ? '0 0 16px rgba(56, 189, 248, 0.2)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Official Sponsors Spotlight */}
      {officialSponsors.length > 0 && (
        <section
          aria-labelledby="official-sponsors-heading"
          style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 42px', position: 'relative', zIndex: 10 }}
        >
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '26px',
              padding: '30px',
              background: 'linear-gradient(115deg, rgba(12, 23, 48, 0.98) 0%, rgba(9, 17, 32, 0.98) 55%, rgba(16, 37, 56, 0.96) 100%)',
              border: '1px solid rgba(125, 211, 252, 0.28)',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ position: 'absolute', inset: '-80px auto auto 58%', width: '280px', height: '180px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.14)', filter: 'blur(48px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '18px', flexWrap: 'wrap', position: 'relative' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#FBBF24', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  <ShieldCheck size={15} />
                  Official ecosystem partners
                </div>
                <h2 id="official-sponsors-heading" style={{ margin: 0, color: '#FFFFFF', fontSize: 'clamp(1.45rem, 3vw, 2.15rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>
                  The brands powering the arena
                </h2>
                <p style={{ margin: '9px 0 0', maxWidth: '650px', color: '#A7B7CD', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  Meet the official sponsors and technology partners helping students turn ambitious ideas into working prototypes, products, and careers.
                </p>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 13px', borderRadius: '999px', color: '#7DD3FC', background: 'rgba(56, 189, 248, 0.09)', border: '1px solid rgba(125, 211, 252, 0.22)', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 12px #34D399' }} />
                Verified partner network
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginTop: '26px', position: 'relative' }}>
              {officialSponsors.map((sponsor, index) => (
                <a
                  key={`official-${sponsor.id}`}
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    minHeight: '142px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '18px',
                    borderRadius: '17px',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    background: index === 0 ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.045))' : 'rgba(255, 255, 255, 0.055)',
                    border: `1px solid ${sponsor.tierBadgeColor}45`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 28px ${sponsor.tierBadgeColor}12`,
                    transition: 'transform 180ms ease, border-color 180ms ease, background 180ms ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = sponsor.tierBadgeColor;
                    e.currentTarget.style.background = `${sponsor.tierBadgeColor}18`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = `${sponsor.tierBadgeColor}45`;
                    e.currentTarget.style.background = index === 0 ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.045))' : 'rgba(255, 255, 255, 0.055)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ width: '112px', height: '48px', display: 'grid', placeItems: 'center', padding: '6px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.92)' }}>
                      <img src={sponsor.logo} alt={`${sponsor.companyName} logo`} style={{ maxWidth: '94px', maxHeight: '34px', objectFit: 'contain' }} />
                    </div>
                    <ExternalLink size={15} color={sponsor.tierBadgeColor} />
                  </div>
                  <div>
                    <div style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 850 }}>{sponsor.companyName}</div>
                    <div style={{ marginTop: '4px', color: sponsor.tierBadgeColor, fontSize: '0.66rem', fontWeight: 850, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{sponsor.tier}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Sponsors Showcase Grid */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 60px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
          {filteredSponsors.map(sponsor => (
            <div
              key={sponsor.id}
              style={{
                background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.9) 0%, rgba(11, 16, 28, 0.95) 100%)',
                border: '1px solid rgba(199, 203, 212, 0.16)',
                borderRadius: '20px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = sponsor.tierBadgeColor;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px ${sponsor.tierBadgeColor}25`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(199, 203, 212, 0.16)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
              }}
            >
              {/* Subtle Ambient Color Glow inside Card */}
              <div
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: sponsor.tierBadgeColor,
                  opacity: 0.15,
                  filter: 'blur(40px)',
                  pointerEvents: 'none'
                }}
              />

              <div>
                {/* Logo & Tier Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div
                    style={{
                      height: '64px',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img 
                      src={sponsor.logo} 
                      alt={sponsor.companyName} 
                      style={{ maxHeight: '44px', maxWidth: '140px', width: 'auto', objectFit: 'contain' }} 
                    />
                  </div>

                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      background: `${sponsor.tierBadgeColor}15`,
                      color: sponsor.tierBadgeColor,
                      border: `1px solid ${sponsor.tierBadgeColor}40`,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}
                  >
                    {sponsor.tier}
                  </span>
                </div>

                {/* Company Name & Tagline */}
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0' }}>
                  {sponsor.companyName}
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                  {sponsor.tagline}
                </p>

                {/* Event Highlights & Presence */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#C7CBD4' }}>
                    <MapPin size={16} color={sponsor.tierBadgeColor} style={{ flexShrink: 0 }} />
                    <span>Campus Presence: <strong style={{ color: '#FFFFFF' }}>{sponsor.stallNumber}</strong> ({sponsor.stallLocation})</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#C7CBD4' }}>
                    <Calendar size={16} color="#FBBF24" style={{ flexShrink: 0 }} />
                    <span>Keynote / Workshop: <strong style={{ color: '#FFFFFF' }}>{sponsor.metrics.stageKeynoteTime}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#C7CBD4' }}>
                    <Users size={16} color="#34D399" style={{ flexShrink: 0 }} />
                    <span>Audience Reach: <strong style={{ color: '#34D399' }}>{sponsor.metrics.estimatedReach}</strong></span>
                  </div>
                </div>

                {/* Deliverables / Collaboration Highlights */}
                {sponsor.deliverables && sponsor.deliverables.length > 0 && (
                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '8px' }}>
                      Key Collaboration Focus
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {sponsor.deliverables.slice(0, 3).map(del => (
                        <span
                          key={del.id}
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#C7CBD4'
                          }}
                        >
                          ✓ {del.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Link to Official Website */}
              <div style={{ borderTop: '1px solid rgba(199, 203, 212, 0.1)', paddingTop: '16px' }}>
                <a
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${sponsor.tierBadgeColor}20`;
                    e.currentTarget.style.borderColor = sponsor.tierBadgeColor;
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                >
                  <span>Visit {sponsor.companyName}</span>
                  <ExternalLink size={14} />
                </a>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* Campus Stalls & Interactive Booths Banner */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 60px', position: 'relative', zIndex: 10 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(20, 29, 50, 0.8) 0%, rgba(12, 18, 32, 0.95) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '20px',
            padding: '36px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ON-GROUND CAMPUS EXPO
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0' }}>
              Visit Partner Tech Stalls at Festronix 2026
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
              All registered competitors and attendees can visit the Central Block Atrium & Innovation Arena booths to experience live product demos, interactive developer challenges, recruitment discussions, and collect exclusive tech swags.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {onRegisterNow && (
              <button
                onClick={onRegisterNow}
                style={{
                  background: 'linear-gradient(135deg, #243C74 0%, #2E4E8C 45%, #4E7C77 100%)',
                  border: '1px solid rgba(220, 227, 232, 0.35)',
                  borderRadius: '9999px',
                  padding: '12px 24px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(46, 78, 140, 0.65)'
                }}
              >
                <Ticket size={16} />
                <span>Get Event Pass</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Become a Sponsor / Strategic Collaboration CTA */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 80px', position: 'relative', zIndex: 10 }}>
        <div
          style={{
            background: 'rgba(15, 20, 32, 0.85)',
            border: '1px solid rgba(199, 203, 212, 0.16)',
            borderRadius: '20px',
            padding: '36px 30px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
            alignItems: 'center'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px 0' }}>
              Interested in Sponsoring Festronix 2026?
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              Connect your brand with 35,000+ top engineering minds, robotics enthusiasts, and software developers across India. Custom sponsorship packages and tier deliverables are managed directly by the Student Affairs Council (SAC).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: '#C7CBD4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={14} color="#38BDF8" />
                <span>Corporate Desk: <strong>+91 98480 99112</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="#34D399" />
                <span>Email: <strong>sponsorship.festronix@vardhaman.org</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '14px' }}>
            <button
              onClick={handleDownloadBrochure}
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 22px',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Download size={16} />
              <span>Download Sponsorship Brochure</span>
            </button>

            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Includes tier deliverables, stall allocation layouts, and reach telemetry.
            </span>
          </div>
        </div>
      </section>

      {/* Footer Copyright */}
      <footer
        style={{
          borderTop: '1px solid rgba(199, 203, 212, 0.1)',
          padding: '24px 20px',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: '#94A3B8'
        }}
      >
        © 2026 FESTRONIX • Vardhaman College of Engineering, Hyderabad. All rights reserved.
      </footer>

    </div>
  );
};
