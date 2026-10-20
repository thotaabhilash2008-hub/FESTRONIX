import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  vx: number;
  vy: number;
  color: string;
  isStar: boolean;
  starRotation: number;
  rotSpeed: number;
}

export const GlitterBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // VCE Official Emblem Palette: VCE Cobalt Blue, VCE Slate Sage, Cool Silver, Pure White
    const GLITTER_COLORS = [
      'rgba(220, 227, 229, ', // Cool Silver
      'rgba(186, 206, 187, ', // Soft Sage (VCE)
      'rgba(255, 255, 255, ', // Pure White
      'rgba(46, 78, 140, ',   // VCE Cobalt Navy
      'rgba(111, 150, 147, ', // VCE Slate Sage
      'rgba(61, 104, 178, '   // VCE Sapphire Blue
    ];

    // Determine particle count based on screen size - gentle, moderate ambient glitter
    const particleCount = Math.min(Math.floor((width * height) / 32000), 45);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const isStar = Math.random() < 0.10; // 10% are subtle 4-point diamond stars
      const color = GLITTER_COLORS[Math.floor(Math.random() * GLITTER_COLORS.length)];
      const baseAlpha = 0.10 + Math.random() * 0.25;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: isStar ? 0.9 + Math.random() * 1.3 : 0.5 + Math.random() * 0.9,
        baseAlpha,
        alpha: baseAlpha,
        twinkleSpeed: 0.010 + Math.random() * 0.020,
        twinkleOffset: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.04 - Math.random() * 0.10, // smooth, calm upward floating drift
        color,
        isStar,
        starRotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.008
      });
    }

    // Floating Bokeh Orbs (subtle ambient colored glows)
    const orbs = [
      { x: width * 0.2, y: height * 0.25, r: 180, color: 'rgba(40, 59, 120, 0.09)', vx: 0.03, vy: 0.02 },
      { x: width * 0.8, y: height * 0.35, r: 240, color: 'rgba(120, 149, 147, 0.06)', vx: -0.02, vy: 0.03 },
      { x: width * 0.5, y: height * 0.75, r: 220, color: 'rgba(40, 59, 120, 0.10)', vx: 0.02, vy: -0.03 },
      { x: width * 0.15, y: height * 0.85, r: 160, color: 'rgba(62, 66, 100, 0.08)', vx: -0.02, vy: -0.02 }
    ];

    let time = 0;

    const render = () => {
      time += 0.025;
      ctx.clearRect(0, 0, width, height);

      // 1. Render soft ambient bokeh orbs in the background
      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x < -100) orb.x = width + 100;
        if (orb.x > width + 100) orb.x = -100;
        if (orb.y < -100) orb.y = height + 100;
        if (orb.y > height + 100) orb.y = -100;

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, 'rgba(16, 26, 53, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Render sparkling glitter & diamond stars
      for (const p of particles) {
        // Update positions with subtle floating motion
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Twinkle calculation
        p.starRotation += p.rotSpeed;
        const twinkle = Math.sin(time * p.twinkleSpeed * 60 + p.twinkleOffset);
        p.alpha = Math.max(0.04, Math.min(0.48, p.baseAlpha + twinkle * 0.18));

        const fillStyle = `${p.color}${p.alpha})`;

        if (p.isStar && p.alpha > 0.25) {
          // Draw sparkling 4-pointed diamond star with gentle micro-flare
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.starRotation);

          const r = p.size * (0.8 + (twinkle + 1) * 0.35);
          const flare = r * 1.5;

          // Cross flare lines
          ctx.strokeStyle = fillStyle;
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          ctx.moveTo(-flare, 0);
          ctx.lineTo(flare, 0);
          ctx.moveTo(0, -flare);
          ctx.lineTo(0, flare);
          ctx.stroke();

          // Diamond center core
          ctx.fillStyle = fillStyle;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.35, 0);
          ctx.lineTo(0, r);
          ctx.lineTo(-r * 0.35, 0);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        } else {
          // Draw glittering circular particle with soft halo
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = fillStyle;
          if (p.alpha > 0.3) {
            ctx.shadowBlur = 3;
            ctx.shadowColor = p.color + '0.4)';
          }
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}
    >
      {/* Dynamic Animated Canvas for 60fps Glitter Stars & Diamond Sparks */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />

      {/* Subtle Aurora Ambient Shimmer Grid */}
      <div
        className="glitter-ambient-aurora"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 15%, rgba(120, 149, 147, 0.06) 0%, transparent 40%), ' +
            'radial-gradient(circle at 80% 80%, rgba(40, 59, 120, 0.10) 0%, transparent 50%), ' +
            'radial-gradient(circle at 50% 50%, rgba(186, 206, 187, 0.02) 0%, transparent 60%)',
          animation: 'glitterAuroraPulse 14s ease-in-out infinite alternate'
        }}
      />
    </div>
  );
};
