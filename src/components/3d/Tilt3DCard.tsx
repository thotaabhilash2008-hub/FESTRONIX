import React, { useRef, useState, useCallback } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  glare?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  className = '',
  maxTilt = 7,
  scale = 1.02,
  glare = true,
  style = {},
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Normalize from -1 to 1
    const nx = (x - 0.5) * 2;
    const ny = (y - 0.5) * 2;

    setTilt({
      x: -ny * maxTilt,
      y: nx * maxTilt
    });

    setGlarePos({
      x: x * 100,
      y: y * 100
    });
  }, [maxTilt, prefersReducedMotion]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      className={`relative ${className}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        ...style
      }}
    >
      <div
        style={{
          transform: isHovered && !prefersReducedMotion
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${scale}, ${scale}, ${scale})`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: isHovered
            ? 'transform 0.08s ease-out'
            : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          transformStyle: 'preserve-3d',
          height: '100%',
          width: '100%',
          position: 'relative'
        }}
      >
        {children}

        {/* Dynamic Specular Glare Layer */}
        {glare && isHovered && !prefersReducedMotion && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              pointerEvents: 'none',
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(220, 227, 229, 0.18) 0%, rgba(56, 189, 248, 0.08) 25%, transparent 65%)`,
              zIndex: 30,
              mixBlendMode: 'screen',
              transition: 'opacity 0.2s ease'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Tilt3DCard;
