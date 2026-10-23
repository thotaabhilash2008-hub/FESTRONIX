import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '../../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  yOffset?: number;
  threshold?: string;
  duration?: number;
}

/**
 * GSAP ScrollTrigger reveal component.
 * Progressively reveals section content or staggered cards as they enter the viewport.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  stagger = 0.08,
  yOffset = 30,
  threshold = 'top 85%',
  duration = 0.9
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (prefersReducedMotion) {
      gsap.set(el.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.children,
        {
          opacity: 0,
          y: Math.min(yOffset, 24),
          scale: 0.985
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: Math.min(duration, 0.75),
          stagger,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: threshold || 'top 88%',
            toggleActions: 'play none none none',
            once: true
          }
        }
      );
    }, el);

    return () => ctx.revert();
  }, [duration, prefersReducedMotion, stagger, threshold, yOffset]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default ScrollReveal;
