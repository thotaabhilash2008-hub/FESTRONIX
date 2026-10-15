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
        maxWidth: '1000px',
        margin: '0 auto',
        perspective: '1200px',
        cursor: 'pointer',
        userSelect: 'none',
        padding: '10px 0'
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
            ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(0, 240, 208, 0.45) 0%, rgba(192, 38, 211, 0.35) 30%, rgba(124, 58, 237, 0.25) 55%, rgba(255, 215, 0, 0.15) 75%, transparent 85%)`
            : 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0, 240, 208, 0.2) 0%, rgba(192, 38, 211, 0.2) 40%, transparent 75%)',
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
        <div style={{ position: 'relative', width: '100%', maxWidth: '920px' }}>
          <img
            src="/festronix_3d_title_clean.png"
            alt="FESTRONIX 3D Chrome Logo"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              filter: isHovered
                ? 'drop-shadow(0 0 25px rgba(0, 240, 208, 0.9)) drop-shadow(0 0 50px rgba(192, 38, 211, 0.75)) drop-shadow(0 0 75px rgba(255, 215, 0, 0.45)) drop-shadow(0 15px 30px rgba(0, 0, 0, 0.9))'
                : 'drop-shadow(0 0 16px rgba(0, 240, 208, 0.4)) drop-shadow(0 0 24px rgba(192, 38, 211, 0.35)) drop-shadow(0 10px 25px rgba(0, 0, 0, 0.75))',
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
                  'linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.7) 45%, rgba(0, 240, 208, 0.85) 50%, rgba(217, 70, 239, 0.7) 55%, transparent 75%)',
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
            gap: '16px',
            marginTop: '10px',
            transform: 'translateZ(20px)', // subtle 3D pop
            transition: 'transform 0.3s ease'
          }}
        >
          <span
            style={{
              height: '2px',
              width: '50px',
              background: 'linear-gradient(90deg, transparent, #FFD700)'
            }}
          />
          <span
            style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.35rem)',
              color: isHovered ? '#FFFFFF' : '#F5F0E8',
              letterSpacing: '0.28em',
              fontWeight: 800,
              textTransform: 'uppercase',
              fontFamily: "'Space Grotesk', sans-serif",
              textShadow: isHovered
                ? '0 0 15px rgba(255, 215, 0, 0.8), 0 0 30px rgba(168, 85, 247, 0.6)'
                : '0 2px 10px rgba(0, 0, 0, 0.8)',
              transition: 'all 0.3s ease'
            }}
          >
            NATIONAL LEVEL TECHNICAL FEST
          </span>
          <span
            style={{
              height: '2px',
              width: '50px',
              background: 'linear-gradient(90deg, #FFD700, transparent)'
            }}
          />
        </div>
      </div>
    </div>
  );
};
