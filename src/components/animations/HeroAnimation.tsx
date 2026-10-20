import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface HeroAnimationProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}

/**
 * GSAP-based cinematic entrance animation wrapper.
 * Staggers children or animates container elements smoothly into view.
 */
export const HeroAnimation: React.FC<HeroAnimationProps> = ({
  children,
  className = '',
  delay = 0.2,
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: 40,
          scale: 0.98,
          filter: 'blur(8px)'
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.2,
          delay,
          ease: 'power3.out'
        }
      );
    }, el);

    return () => ctx.revert(); // GSAP clean teardown
  }, [delay, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        opacity: 0,
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default HeroAnimation;
