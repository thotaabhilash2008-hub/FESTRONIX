import React, { useState, useEffect } from 'react';
import { Flame, Swords, ArrowRight, Users, QrCode, Rocket, Trophy, Radio } from 'lucide-react';
import { Festronix3DTitle } from './Festronix3DTitle';
import { HeroAnimation } from './animations';

interface HeroSectionProps {
  onExploreEvents: () => void;
  onOpenIntro?: () => void;
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
        minHeight: 'calc(100vh - 84px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 20px 20px',
        overflow: 'hidden'
      }}
    >
      {/* Lightened, Vivid Campus Architectural Backing */}
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
            filter: 'grayscale(0.18) brightness(0.72) contrast(1.08)',
            transform: 'scale(1.02)',
            display: 'block'
          }}
        />
        {/* Soft, lightened atmospheric gradient: preserves clean visibility of campus while transitioning seamlessly at bottom */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(8, 12, 22, 0.12) 0%, rgba(8, 12, 22, 0.22) 40%, rgba(8, 12, 22, 0.58) 78%, #080C16 100%)'
          }}
        />
        {/* Subtle luminous ambient glow to illuminate the 3D logo and title area */}
        <div
          style={{
            position: 'absolute',
            top: '32%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '88%',
            maxWidth: '1000px',
            height: '420px',
            background:
              'radial-gradient(ellipse at center, rgba(61, 104, 178, 0.2) 0%, rgba(136, 178, 174, 0.09) 45%, transparent 75%)',
            pointerEvents: 'none',
            filter: 'blur(35px)'
          }}
        />
      </div>

      {/* Foreground Editorial UI with GSAP Cinematic Reveal */}
      <HeroAnimation
        delay={0.1}
        className="hero-content-wrapper"
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '1100px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(8px, 1.4vh, 12px)',
          width: '100%',
          pointerEvents: 'auto'
        } as React.CSSProperties}
      >
        {/* Top Architectural Metadata Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '5px 16px',
            borderRadius: '9999px',
            background: 'rgba(21, 24, 32, 0.88)',
            border: '1px solid rgba(199, 203, 212, 0.22)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
            maxWidth: '100%'
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#88B2AE',
                boxShadow: '0 0 10px #88B2AE'
              }}
            />
            <span
              style={{
                fontSize: 'clamp(0.68rem, 2vw, 0.76rem)',
                color: '#DCE3E8',
                letterSpacing: '0.12em',
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
                textTransform: 'uppercase'
              }}
            >
              VARDHAMAN COLLEGE OF ENGINEERING
            </span>
          </div>
          <span style={{ color: '#7E8D9F', fontSize: '0.75rem' }}>//</span>
          <span
            style={{
              fontSize: '0.7rem',
              background: 'rgba(111, 150, 147, 0.15)',
              border: '1px solid rgba(111, 150, 147, 0.45)',
              color: '#88B2AE',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap'
            }}
          >
            OCT 28–29, 2026
          </span>
        </div>

        {/* 3D Chrome Festronix Identity */}
        <div style={{ width: '100%', maxWidth: '820px', padding: '0' }}>
          <Festronix3DTitle />

          {/* Edition Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '4px',
              padding: '3px 14px',
              borderRadius: '6px',
              background: 'rgba(21, 24, 32, 0.75)',
              border: '1px solid rgba(199, 203, 212, 0.22)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)'
            }}
          >
            <Radio size={12} color="#88B2AE" />
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: '0.86rem',
                letterSpacing: '0.18em',
                color: '#F3F0EA'
              }}
            >
              2026 EDITION
            </span>
          </div>
        </div>

        {/* Editorial Narrative Subtext */}
        <p
          style={{
            maxWidth: '640px',
            fontSize: 'clamp(0.85rem, 1.2vw, 0.98rem)',
            color: '#CBD5E1',
            lineHeight: 1.55,
            margin: '0 auto',
            fontWeight: 400,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)'
          }}
        >
          The premier collegiate arena of autonomous robotics, precision algorithmic engineering,
          and national innovation — uniting 3,500+ competitors across 30+ flagship arenas.
        </p>

        {/* Action CTAs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '2px'
          }}
        >
          <button
            onClick={onExploreEvents}
            className="btn-cyber-primary"
            style={{
              padding: '10px 24px',
              fontSize: '0.88rem'
            }}
          >
            <Swords size={16} color="#C7CBD4" />
            <span>Explore 30+ Arenas</span>
            <ArrowRight size={15} />
          </button>

          <button
            onClick={onRegisterNow}
            className="btn-cyber-gold"
            style={{
              padding: '10px 24px',
              fontSize: '0.88rem'
            }}
          >
            <Rocket size={16} />
            <span>Register Now</span>
          </button>
        </div>

        {/* Architectural Countdown Metrics */}
        <div
          style={{
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 20px',
            background: 'rgba(21, 24, 32, 0.88)',
            border: '1px solid rgba(199, 203, 212, 0.2)',
            borderRadius: '12px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)'
          }}
        >
          <span
            style={{
              fontSize: '0.68rem',
              color: '#88B2AE',
              fontWeight: 800,
              letterSpacing: '0.14em',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            ARENA COMMENCES IN
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {[
              { val: timeLeft.days, label: 'DAYS' },
              { val: timeLeft.hours, label: 'HOURS' },
              { val: timeLeft.minutes, label: 'MINUTES' },
              { val: timeLeft.seconds, label: 'SECONDS' }
            ].map((unit, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    background: 'rgba(8, 12, 22, 0.85)',
                    border: '1px solid rgba(220, 227, 232, 0.16)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    textAlign: 'center',
                    minWidth: '44px'
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: '#F0F4F8',
                      lineHeight: 1
                    }}
                  >
                    {String(unit.val).padStart(2, '0')}
                  </div>
                  <div
                    style={{
                      fontSize: '0.5rem',
                      color: '#7E8D9F',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      fontFamily: "'Space Grotesk', sans-serif",
                      marginTop: '1px'
                    }}
                  >
                    {unit.label}
                  </div>
                </div>
                {i < 3 && (
                  <span style={{ color: 'rgba(220, 227, 232, 0.3)', fontSize: '0.9rem', fontWeight: 300 }}>:</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4 Feature Highlights - Sleek compact architectural metric strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            width: '100%',
            maxWidth: '880px',
            marginTop: '2px'
          }}
        >
          {[
            { icon: <Trophy size={14} color="#FBBF24" />, value: '₹5,00,000+', label: 'Prize Pool' },
            { icon: <Users size={14} color="#38BDF8" />, value: '3,500+', label: 'Competitors' },
            { icon: <Flame size={14} color="#38BDF8" />, value: '30+ Arenas', label: '9 Branches' },
            { icon: <QrCode size={14} color="#34D399" />, value: 'Crypto Pass', label: 'Instant Check-in' }
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(15, 22, 38, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                borderRadius: '8px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.7)'
              }}
            >
              {item.icon}
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#FFFFFF'
                }}
              >
                {item.value}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </HeroAnimation>
    </section>
  );
};

export default HeroSection;