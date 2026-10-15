import React, { useEffect, useRef } from 'react';

export const CyberHeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse coordinates for interactive perspective
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Particles system
    const particleCount = 75;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
      pulseSpeed: number;
    }> = [];

    const colors = ['#00f0ff', '#a855f7', '#ec4899', '#38bdf8', '#c084fc'];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.8,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: (Math.random() - 0.5) * 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.2,
        pulseSpeed: 0.02 + Math.random() * 0.03
      });
    }

    // Energy Ribbon curves
    let time = 0;

    const draw = () => {
      time += 0.015;

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing cosmic nebulae
      const grad1 = ctx.createRadialGradient(
        width * 0.3 + (mouse.x - width / 2) * 0.1,
        height * 0.35 + (mouse.y - height / 2) * 0.1,
        10,
        width * 0.3,
        height * 0.35,
        width * 0.4
      );
      grad1.addColorStop(0, 'rgba(0, 240, 255, 0.08)');
      grad1.addColorStop(0.5, 'rgba(168, 85, 247, 0.04)');
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(
        width * 0.7 - (mouse.x - width / 2) * 0.1,
        height * 0.6 - (mouse.y - height / 2) * 0.1,
        20,
        width * 0.7,
        height * 0.6,
        width * 0.45
      );
      grad2.addColorStop(0, 'rgba(147, 51, 234, 0.09)');
      grad2.addColorStop(0.6, 'rgba(236, 72, 153, 0.03)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // 2. Render Curved Energy Light Trails (direct motif from intro video)
      const trails = [
        { color: '#00f0ff', offset: 0, amp: 70, freq: 0.003, yBase: height * 0.45, width: 2.5 },
        { color: '#a855f7', offset: 2.2, amp: 90, freq: 0.0025, yBase: height * 0.52, width: 3 },
        { color: '#ec4899', offset: 4.5, amp: 60, freq: 0.0035, yBase: height * 0.58, width: 2 }
      ];

      trails.forEach(trail => {
        ctx.beginPath();
        ctx.strokeStyle = trail.color;
        ctx.lineWidth = trail.width;
        ctx.shadowColor = trail.color;
        ctx.shadowBlur = 18;

        for (let x = 0; x <= width; x += 15) {
          const wave = Math.sin(x * trail.freq + time + trail.offset) * trail.amp;
          const mouseInfluence = Math.sin((x / width) * Math.PI) * (mouse.y - height / 2) * 0.15;
          const y = trail.yBase + wave + mouseInfluence;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      });

      // 3. Render 3D Segmented Lightning Core (Sphere motif from intro_final.mp4)
      const sphereCenterX = width > 768 ? width * 0.78 : width * 0.5;
      const sphereCenterY = width > 768 ? height * 0.45 : height * 0.28;
      const sphereRadius = width > 768 ? 120 : 85;

      ctx.save();
      ctx.translate(sphereCenterX, sphereCenterY);

      // Outer glowing ring
      ctx.beginPath();
      ctx.arc(0, 0, sphereRadius + 18, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Second counter-rotating ring
      ctx.beginPath();
      ctx.arc(0, 0, sphereRadius + 32, -time * 0.5, Math.PI * 1.5 - time * 0.5);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4 Quadrants of the cyber metallic sphere
      const quadrants = [
        { start: 0.1, end: Math.PI / 2 - 0.1 },
        { start: Math.PI / 2 + 0.1, end: Math.PI - 0.1 },
        { start: Math.PI + 0.1, end: (3 * Math.PI) / 2 - 0.1 },
        { start: (3 * Math.PI) / 2 + 0.1, end: 2 * Math.PI - 0.1 }
      ];

      quadrants.forEach((q, idx) => {
        ctx.beginPath();
        ctx.arc(0, 0, sphereRadius, q.start + time * 0.4, q.end + time * 0.4);
        const segmentGrad = ctx.createLinearGradient(-sphereRadius, -sphereRadius, sphereRadius, sphereRadius);
        segmentGrad.addColorStop(0, idx % 2 === 0 ? '#1e293b' : '#0f172a');
        segmentGrad.addColorStop(0.5, idx % 2 === 0 ? '#334155' : '#1e1b4b');
        segmentGrad.addColorStop(1, '#020617');
        ctx.fillStyle = segmentGrad;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = idx % 2 === 0 ? '#00f0ff' : '#a855f7';
        ctx.shadowColor = idx % 2 === 0 ? '#00f0ff' : '#a855f7';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Central Pulsing Electric Lightning Core
      const corePulse = Math.sin(time * 3) * 8;
      const coreGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 45 + corePulse);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, '#c084fc');
      coreGrad.addColorStop(0.7, '#9333ea');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 45 + corePulse, 0, Math.PI * 2);
      ctx.fill();

      // Lightning bolts between segments
      if (Math.random() > 0.3) {
        ctx.beginPath();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 10;
        let lx = (Math.random() - 0.5) * 40;
        let ly = (Math.random() - 0.5) * 40;
        ctx.moveTo(lx, ly);
        for (let b = 0; b < 4; b++) {
          lx += (Math.random() - 0.5) * 35;
          ly += (Math.random() - 0.5) * 35;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      // 4. Floating particles system
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
};
