import React, { useState, useEffect } from 'react';
import { Flame, Crown, Swords, ArrowRight, Sparkles, CirclePlay, Trophy, Users, QrCode, Star, Rocket } from 'lucide-react';
import { Festronix3DTitle } from './Festronix3DTitle';

interface HeroSectionProps {
  onExploreEvents: () => void;
  onOpenIntro: () => void;
  onRegisterNow: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreEvents,
  onOpenIntro,
  onRegisterNow
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 14,
    hours: 8,
    minutes: 42,
    seconds: 18
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px 80px',
        overflow: 'hidden'
      }}
    >
      {/* Cinematic Campus Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 0
        }}
      >
        <img
          src="/vce_campus_bg.jpg"
          alt="Vardhaman College of Engineering Campus"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(0.5px) brightness(0.72) saturate(1.15)',
            transform: 'scale(1.02)',
            display: 'block'
          }}
        />
        {/* Balanced cinematic gradient overlay that keeps campus visible while maintaining readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(12, 10, 20, 0.22) 0%, rgba(12, 10, 20, 0.12) 25%, rgba(12, 10, 20, 0.38) 65%, rgba(12, 10, 20, 0.96) 100%)'
          }}
        />
        {/* Subtle gold radial glow from center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255, 215, 0, 0.08) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Main Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '1100px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          width: '100%'
        }}
      >
        {/* Top Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            background: 'rgba(10, 7, 22, 0.78)',
            border: '1px solid rgba(0, 240, 208, 0.25)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 240, 208, 0.1)',
            maxWidth: '100%'
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Star size={12} color="#00F0D0" fill="#00F0D0" />
            <span
              style={{
                fontSize: 'clamp(0.68rem, 2.4vw, 0.78rem)',
                color: '#CBD5E1',
                letterSpacing: '0.06em',
                fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif"
              }}
            >
              VARDHAMAN COLLEGE OF ENGINEERING
            </span>
          </div>
          <span
            style={{
              fontSize: '0.68rem',
              background: 'linear-gradient(135deg, rgba(0, 240, 208, 0.2), rgba(192, 38, 211, 0.2))',
              border: '1px solid rgba(0, 240, 208, 0.4)',
              color: '#00F0D0',
              padding: '2px 9px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              whiteSpace: 'nowrap'
            }}
          >
            OCT 28–29
          </span>
        </div>

        {/* Interactive 3D Festronix Chrome Title with Hover Glow & Tilt */}
        <div style={{ width: '100%', maxWidth: '1000px', padding: '0' }}>
          <Festronix3DTitle />

          {/* Year badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '10px',
              padding: '4px 16px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, rgba(0, 240, 208, 0.08), rgba(192, 38, 211, 0.08))',
              border: '1px solid rgba(0, 240, 208, 0.25)',
              boxShadow: '0 0 15px rgba(0, 240, 208, 0.12)'
            }}
          >
            <Flame size={14} color="#00F0D0" />
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: '1.15rem',
                letterSpacing: '0.15em',
                background: 'linear-gradient(135deg, #00F0D0, #C026D3, #FFD700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              2026 EDITION
            </span>
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            maxWidth: '650px',
            fontSize: 'clamp(0.92rem, 1.4vw, 1.05rem)',
            color: '#CBD5E1',
            lineHeight: 1.7,
            margin: '0 auto',
            fontWeight: 400
          }}
        >
          The premier arena of collegiate engineering — 30+ adrenaline-fueled technical hackathons,
          robot combat showdowns, autonomous AI battles, and e-sports championships await.
        </p>

        {/* Hero CTAs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '6px'
          }}
        >
          <button
            onClick={onExploreEvents}
            className="btn-cyber-primary"
            style={{ padding: '14px 32px', fontSize: '0.95rem' }}
          >
            <Swords size={17} />
            <span>Explore 30+ Events</span>
            <ArrowRight size={15} />
          </button>

          <button
            onClick={onOpenIntro}
            className="btn-cyber-secondary"
            style={{ padding: '12px 24px', fontSize: '0.9rem' }}
          >
            <CirclePlay size={16} color="#00F0D0" />
            <span>Watch Intro</span>
          </button>

          <button
            onClick={onRegisterNow}
            className="btn-cyber-gold"
            style={{
              padding: '12px 26px',
              fontSize: '0.9rem'
            }}
          >
            <Rocket size={16} />
            <span>Register Now</span>
          </button>
        </div>

        {/* Countdown Timer */}
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 28px',
            background: 'rgba(10, 7, 22, 0.82)',
            border: '1px solid rgba(0, 240, 208, 0.22)',
            borderRadius: '14px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 240, 208, 0.08)'
          }}
        >
          <span
            style={{
              fontSize: '0.72rem',
              color: '#00F0D0',
              fontWeight: 700,
              letterSpacing: '0.08em',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            STARTS IN
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {[
              { val: timeLeft.days, label: 'DAYS' },
              { val: timeLeft.hours, label: 'HRS' },
              { val: timeLeft.minutes, label: 'MIN' },
              { val: timeLeft.seconds, label: 'SEC' }
            ].map((unit, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    background: 'rgba(0, 240, 208, 0.06)',
                    border: '1px solid rgba(0, 240, 208, 0.15)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    textAlign: 'center',
                    minWidth: '48px'
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      color: '#F8FAFC',
                      lineHeight: 1
                    }}
                  >
                    {String(unit.val).padStart(2, '0')}
                  </div>
                  <div
                    style={{
                      fontSize: '0.55rem',
                      color: '#94A3B8',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      fontFamily: "'Space Grotesk', sans-serif",
                      marginTop: '2px'
                    }}
                  >
                    {unit.label}
                  </div>
                </div>
                {i < 3 && (
                  <span style={{ color: 'rgba(0, 240, 208, 0.35)', fontSize: '1.1rem', fontWeight: 300 }}>:</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlights */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            width: '100%',
            maxWidth: '850px',
            marginTop: '10px'
          }}
        >
          {[
            { icon: <Crown size={20} color="#FFD700" />, value: '₹5,00,000+', label: 'Prize Pool', accent: '#FFD700' },
            { icon: <Users size={20} color="#00F0D0" />, value: '3,500+', label: 'Participants', accent: '#00F0D0' },
            { icon: <Sparkles size={20} color="#F0ABFC" />, value: '30+ Events', label: '8 Branches', accent: '#F0ABFC' },
            { icon: <QrCode size={20} color="#38BDF8" />, value: 'QR Pass', label: 'Instant Check-in', accent: '#38BDF8' }
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(12, 9, 26, 0.68)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                backdropFilter: 'blur(14px)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${item.accent}55`;
                e.currentTarget.style.boxShadow = `0 8px 24px -6px ${item.accent}33`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ marginBottom: '6px' }}>{item.icon}</div>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: '1.3rem',
                  color: item.accent,
                  lineHeight: 1.1
                }}
              >
                {item.value}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px', fontWeight: 500 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
