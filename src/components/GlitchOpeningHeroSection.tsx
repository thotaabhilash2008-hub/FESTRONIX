import React from 'react';
import { Festronix3DTitle } from './Festronix3DTitle';
import { HeroAnimation } from './animations';

/**
 * Production opening page: same campus backdrop, brand lockup, and 3D title as
 * the original coming-soon page, with a glitch/restoration status treatment.
 */
export const GlitchOpeningHeroSection: React.FC = () => {
  return (
    <section
      className="public-hero glitch-opening-hero"
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
      {/* Same lightened campus backing as the original coming-soon page */}
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(8, 12, 22, 0.12) 0%, rgba(8, 12, 22, 0.22) 40%, rgba(8, 12, 22, 0.58) 78%, #080C16 100%)'
          }}
        />
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

        {/* Glitch atmosphere — decorative only */}
        <div className="glitch-scanlines" aria-hidden="true" />
        <div className="glitch-noise" aria-hidden="true" />
        <div className="glitch-tear glitch-tear-a" aria-hidden="true" />
        <div className="glitch-tear glitch-tear-b" aria-hidden="true" />
        <div className="glitch-tear glitch-tear-c" aria-hidden="true" />
      </div>

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

        <div className="glitch-title-wrap" style={{ width: '100%', maxWidth: '820px', padding: '0' }}>
          <Festronix3DTitle />
        </div>

        <div
          className="glitch-status-panel"
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(8px, 1.2vh, 12px)',
            width: 'min(100%, 580px)',
            marginTop: 'clamp(4px, 1vh, 10px)',
            padding: 'clamp(16px, 2.4vh, 22px) clamp(20px, 5vw, 42px)',
            borderRadius: '14px',
            backdropFilter: 'blur(18px)'
          }}
        >
          <span className="glitch-kicker">SIGNAL INTERRUPTED</span>

          <h2 className="glitch-headline">
            <span className="glitch-headline-base">WE&apos;RE FACING A GLITCH</span>
            <span className="glitch-layer glitch-layer-a" aria-hidden="true">WE&apos;RE FACING A GLITCH</span>
            <span className="glitch-layer glitch-layer-b" aria-hidden="true">WE&apos;RE FACING A GLITCH</span>
          </h2>

          <p className="glitch-copy">
            Our systems are being restored. We&apos;ll reopen soon — please check back shortly.
          </p>

          <div className="glitch-progress" aria-hidden="true"><span /></div>
          <span className="glitch-progress-label">RESTORING CONNECTION...</span>
        </div>

        <div className="glitch-footer-line">
          <span className="glitch-footer-rule" />
          <span>COME BACK SOON!</span>
          <span className="glitch-footer-dot">•</span>
          <span>STAY TUNED</span>
          <span className="glitch-footer-rule glitch-footer-rule-end" />
        </div>
      </HeroAnimation>
    </section>
  );
};

export default GlitchOpeningHeroSection;
