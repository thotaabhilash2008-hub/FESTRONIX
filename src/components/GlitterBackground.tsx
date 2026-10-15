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

    // Color palette matching: Cool Silver, Soft Sage, Champagne Gold, Pure White, Cyber Cyan
    const GLITTER_COLORS = [
      'rgba(220, 227, 229, ', // Cool Silver
      'rgba(186, 206, 187, ', // Soft Sage
      'rgba(255, 255, 255, ', // Pure White
      'rgba(251, 191, 36, ',  // Champagne Gold
      'rgba(120, 149, 147, ', // Sage Green
      'rgba(147, 197, 253, '  // Soft Astral Blue
    ];

    // Determine particle count based on screen size (smooth 60fps performance)
    const particleCount = Math.min(Math.floor((width * height) / 14000), 110);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const isStar = Math.random() < 0.28; // 28% of particles are twinkling 4-point diamond stars
      const color = GLITTER_COLORS[Math.floor(Math.random() * GLITTER_COLORS.length)];
      const baseAlpha = 0.25 + Math.random() * 0.55;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: isStar ? 1.5 + Math.random() * 2.5 : 0.7 + Math.random() * 1.8,
        baseAlpha,
        alpha: baseAlpha,
        twinkleSpeed: 0.015 + Math.random() * 0.035,
        twinkleOffset: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.08 - Math.random() * 0.22, // gentle upward floating drift
        color,
        isStar,
        starRotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.01
      });
    }

    // Floating Bokeh Orbs (larger ambient colored glows)
    const orbs = [
      { x: width * 0.2, y: height * 0.25, r: 180, color: 'rgba(40, 59, 120, 0.16)', vx: 0.05, vy: 0.03 },
      { x: width * 0.8, y: height * 0.35, r: 240, color: 'rgba(120, 149, 147, 0.12)', vx: -0.04, vy: 0.06 },
      { x: width * 0.5, y: height * 0.75, r: 220, color: 'rgba(40, 59, 120, 0.18)', vx: 0.03, vy: -0.05 },
      { x: width * 0.15, y: height * 0.85, r: 160, color: 'rgba(62, 66, 100, 0.15)', vx: -0.04, vy: -0.03 }
    ];

    let time = 0;

    const render = () => {
      time += 0.03;
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
        p.alpha = Math.max(0.1, Math.min(1, p.baseAlpha + twinkle * 0.45));

        const fillStyle = `${p.color}${p.alpha})`;

        if (p.isStar && p.alpha > 0.4) {
          // Draw sparkling 4-pointed diamond star with cross-flare
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.starRotation);

          const r = p.size * (0.8 + (twinkle + 1) * 0.5);
          const flare = r * 2.8;

          // Cross flare lines
          ctx.strokeStyle = fillStyle;
          ctx.lineWidth = 0.8;
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

          // Outer luminous glow
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          ctx.restore();
        } else {
          // Draw glittering circular particle with soft halo
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = fillStyle;
          ctx.shadowBlur = p.alpha > 0.6 ? 8 : 3;
          ctx.shadowColor = p.color + '0.8)';
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
            'radial-gradient(circle at 20% 15%, rgba(120, 149, 147, 0.12) 0%, transparent 40%), ' +
            'radial-gradient(circle at 80% 80%, rgba(40, 59, 120, 0.22) 0%, transparent 50%), ' +
            'radial-gradient(circle at 50% 50%, rgba(186, 206, 187, 0.05) 0%, transparent 60%)',
          animation: 'glitterAuroraPulse 12s ease-in-out infinite alternate'
        }}
      />
    </div>
  );
};
