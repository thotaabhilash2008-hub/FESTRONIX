import React, { useState, useRef } from 'react';

export const Festronix3DTitle: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Normalised [-1, 1]
    const nx = (x - 0.5) * 2;
    const ny = (y - 0.5) * 2;

    setTilt({
      x: -ny * 12, // tilt up/down
      y: nx * 16   // tilt left/right
    });

    setMousePos({
      x: x * 100,
      y: y * 100
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 'clamp(380px, 46vw, 680px)',
        margin: '0 auto',
        perspective: '1200px',
        cursor: 'pointer',
        userSelect: 'none',
        padding: '0'
      }}
    >
      {/* Hidden Accessible H1 for Screen Readers and SEO */}
      <h1
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        FESTRONIX 2026 — National Level Technical Fest | Vardhaman College of Engineering
      </h1>

      {/* Dynamic Interactive Glow Aura behind the logo */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isHovered ? '95%' : '80%',
          height: isHovered ? '240px' : '150px',
          background: isHovered
            ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(120, 149, 147, 0.4) 0%, rgba(40, 59, 120, 0.35) 35%, rgba(62, 66, 100, 0.25) 55%, transparent 85%)`
            : 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(40, 59, 120, 0.3) 0%, rgba(120, 149, 147, 0.2) 40%, transparent 75%)',
          filter: isHovered ? 'blur(35px)' : 'blur(25px)',
          transition: 'width 0.4s ease, height 0.4s ease, filter 0.4s ease',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* 3D Tilted Container */}
      <div
        style={{
          position: 'relative',
          transform: isHovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.04, 1.04, 1.04)`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transformStyle: 'preserve-3d',
          transition: isHovered
            ? 'transform 0.1s ease-out'
            : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* High-Resolution 3D Chrome Festronix Logo Image */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 'clamp(440px, 52vw, 760px)' }}>
          <img
            src="/festronix_3d_title_clean.png"
            alt="FESTRONIX 3D Chrome Logo"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              filter: isHovered
                ? 'drop-shadow(0 0 25px rgba(186, 206, 187, 0.75)) drop-shadow(0 0 50px rgba(40, 59, 120, 0.65)) drop-shadow(0 15px 30px rgba(0, 0, 0, 0.9))'
                : 'drop-shadow(0 0 16px rgba(120, 149, 147, 0.4)) drop-shadow(0 0 24px rgba(40, 59, 120, 0.35)) drop-shadow(0 10px 25px rgba(0, 0, 0, 0.75))',
              transition: 'filter 0.35s ease',
              pointerEvents: 'none'
            }}
          />

          {/* Specular Gleam Sweep on Hover (Masked precisely to logo silhouette) */}
          {isHovered && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.75) 45%, rgba(186, 206, 187, 0.85) 50%, rgba(120, 149, 147, 0.7) 55%, transparent 75%)',
                backgroundSize: '200% 100%',
                animation: 'gleamSweep 1.6s infinite',
                pointerEvents: 'none',
                mixBlendMode: 'color-dodge',
                WebkitMaskImage: 'url(/festronix_3d_title_clean.png)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskImage: 'url(/festronix_3d_title_clean.png)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center'
              }}
            />
          )}
        </div>

        {/* Subtitle matching the reference: NATIONAL LEVEL TECHNICAL FEST */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(6px, 1.5vw, 16px)',
            marginTop: '10px',
            maxWidth: '100%',
            padding: '0 10px',
            transform: 'translateZ(20px)', // subtle 3D pop
            transition: 'transform 0.3s ease'
          }}
        >
          <span
            style={{
              height: '2px',
              width: 'clamp(12px, 3.5vw, 45px)',
              background: 'linear-gradient(90deg, transparent, #789593)',
              flexShrink: 0
            }}
          />
          <span
            style={{
              fontSize: 'clamp(0.68rem, 2.2vw, 1.35rem)',
              color: isHovered ? '#FFFFFF' : '#DCE3E5',
              letterSpacing: 'clamp(0.08em, 1vw, 0.25em)',
              fontWeight: 800,
              textTransform: 'uppercase',
              fontFamily: "'Space Grotesk', sans-serif",
              textAlign: 'center',
              textShadow: isHovered
                ? '0 0 15px rgba(120, 149, 147, 0.7), 0 0 30px rgba(40, 59, 120, 0.5)'
                : '0 2px 10px rgba(0, 0, 0, 0.8)',
              transition: 'all 0.3s ease'
            }}
          >
            NATIONAL LEVEL TECHNICAL FEST
          </span>
          <span
            style={{
              height: '2px',
              width: 'clamp(12px, 3.5vw, 45px)',
              background: 'linear-gradient(90deg, #789593, transparent)',
              flexShrink: 0
            }}
          />
        </div>
      </div>
    </div>
  );
};
