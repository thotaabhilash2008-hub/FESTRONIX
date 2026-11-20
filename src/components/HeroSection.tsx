import React from 'react';
import { Festronix3DTitle } from './Festronix3DTitle';
import { HeroAnimation } from './animations';

export const HeroSection: React.FC = () => {
  return (
    <section
      className="public-hero coming-soon-hero"
      style={{
        position: 'relative',
        minHeight: '100vh',
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
        {/* Title Presenter: Authentic Sanvi Homes Horizontal Logo & Presents */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '8px',
            marginBottom: '0px',
            position: 'relative',
            zIndex: 2
          }}
        >
          <img
            src="/sanvi_homes_horizontal.png"
            alt="Sanvi Homes"
            style={{
              height: 'clamp(32px, 4.4vw, 44px)',
              width: 'auto',
              maxWidth: '90vw',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 14px rgba(56, 189, 248, 0.32))'
            }}
          />
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(0.62rem, 1.2vw, 0.72rem)',
              fontWeight: 800,
              letterSpacing: '0.36em',
              color: '#38BDF8',
              textTransform: 'uppercase',
              marginTop: '5px'
            }}
          >
            PRESENTS
          </span>
        </div>

        {/* 3D Chrome Festronix Identity */}
        <div style={{ width: '100%', maxWidth: '820px', padding: '0' }}>
          <Festronix3DTitle />
        </div>

        <div
          className="coming-soon-message"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(8px, 1.2vh, 12px)',
            width: 'min(100%, 560px)',
            marginTop: 'clamp(4px, 1vh, 10px)',
            padding: 'clamp(16px, 2.4vh, 22px) clamp(20px, 5vw, 42px)',
            border: '1px solid rgba(199, 203, 212, 0.2)',
            borderRadius: '14px',
            background: 'linear-gradient(145deg, rgba(14, 20, 32, 0.82), rgba(8, 12, 22, 0.72))',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 14px 40px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
          }}
        >
          <span
            style={{
              color: '#88B2AE',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(0.68rem, 1.5vw, 0.78rem)',
              fontWeight: 800,
              letterSpacing: '0.24em'
            }}
          >
            A LITTLE TOO EARLY?
          </span>
          <span
            style={{
              color: '#F3F0EA',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.05rem, 2.5vw, 1.45rem)',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textShadow: '0 0 22px rgba(120, 149, 147, 0.28)'
            }}
          >
            REGISTRATIONS OPEN SOON
          </span>
          <p
            style={{
              margin: 0,
              color: '#CBD5E1',
              fontSize: 'clamp(0.82rem, 1.25vw, 0.94rem)',
              lineHeight: 1.6,
              fontWeight: 400
            }}
          >
            The excitement is building. We're getting everything ready for you.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: 'clamp(2px, 0.8vh, 8px)',
            color: '#DCE3E5',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(0.68rem, 1.3vw, 0.78rem)',
            fontWeight: 800,
            letterSpacing: '0.3em',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
          }}
        >
          <span style={{ width: 'clamp(22px, 5vw, 48px)', height: '1px', background: 'linear-gradient(90deg, transparent, #789593)' }} />
          <span>COME BACK SOON!</span>
          <span>STAY TUNED</span>
          <span style={{ width: 'clamp(22px, 5vw, 48px)', height: '1px', background: 'linear-gradient(90deg, #789593, transparent)' }} />
        </div>
      </HeroAnimation>
    </section>
  );
};

export default HeroSection;
