import { useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface CameraWaypoint {
  pos: [number, number, number];
  target: [number, number, number];
  sphereRot: [number, number, number];
  portalScale: number;
  lightIntensity: number;
}

// Key waypoint configurations mapped to scroll milestones
export const SCROLL_WAYPOINTS: Record<string, CameraWaypoint> = {
  hero: {
    pos: [0, 0.15, 5.8],
    target: [0, 0, 0],
    sphereRot: [0, 0, 0],
    portalScale: 1.25,
    lightIntensity: 2.6
  },
  about: {
    pos: [-1.9, 0.35, 4.6],
    target: [0.7, 0.05, 0],
    sphereRot: [0.2, 0.8, 0.1],
    portalScale: 1.45,
    lightIntensity: 3.0
  },
  hyped: {
    pos: [1.8, -0.2, 5.0],
    target: [-0.6, 0, 0],
    sphereRot: [-0.15, 1.6, -0.1],
    portalScale: 1.35,
    lightIntensity: 2.8
  },
  catalog: {
    pos: [0, 0.7, 6.4],
    target: [0, -0.2, 0],
    sphereRot: [0.1, 2.4, 0],
    portalScale: 1.2,
    lightIntensity: 2.5
  },
  departments: {
    pos: [-1.5, -0.3, 4.9],
    target: [0.5, 0, 0],
    sphereRot: [-0.2, 3.2, 0.15],
    portalScale: 1.4,
    lightIntensity: 3.1
  },
  showcase: {
    pos: [1.5, 0.4, 4.7],
    target: [-0.5, 0.1, 0],
    sphereRot: [0.2, 4.0, -0.1],
    portalScale: 1.3,
    lightIntensity: 2.9
  },
  prizes: {
    pos: [0, 0.85, 4.8],
    target: [0, -0.1, 0],
    sphereRot: [0.3, 4.8, 0],
    portalScale: 1.4,
    lightIntensity: 3.4
  },
  register: {
    pos: [0, 0.05, 3.9],
    target: [0, 0, 0],
    sphereRot: [0, 6.28, 0],
    portalScale: 1.55,
    lightIntensity: 3.6
  }
};

/**
 * Hook to synchronize 3D camera and object choreography with user scroll progress.
 * Uses GSAP ScrollTrigger scrub to smoothly compute current interpolated values.
 */
export function useScrollStory() {
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        setScrollProgress(self.progress);
      }
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return scrollProgress;
}
