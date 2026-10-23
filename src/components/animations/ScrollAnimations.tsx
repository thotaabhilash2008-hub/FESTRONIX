import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Register ScrollTrigger plugin with GSAP
gsap.registerPlugin(ScrollTrigger);

interface ScrollAnimationsProviderProps {
  children: React.ReactNode;
  enableSmoothScroll?: boolean;
}

/**
 * Initializes Lenis smooth scrolling and coordinates with GSAP ScrollTrigger.
 * Cleans up listeners, instances, and ticker events when unmounted.
 */
export const ScrollAnimationsProvider: React.FC<ScrollAnimationsProviderProps> = ({
  children,
  enableSmoothScroll = true
}) => {
  const lenisRef = useRef<Lenis | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // If reduced motion is requested or smooth scrolling is disabled, skip Lenis
    if (prefersReducedMotion || !enableSmoothScroll) {
      return;
    }

    const lenis = new Lenis({
      duration: 0.95,
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // cubic ease-out for immediate, responsive control
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.2
    });

    lenisRef.current = lenis;

    // Synchronize Lenis scroll updates with ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Synchronize GSAP ticker with Lenis frame updates
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef.current = null;
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [enableSmoothScroll, prefersReducedMotion]);

  return <>{children}</>;
};

export default ScrollAnimationsProvider;
