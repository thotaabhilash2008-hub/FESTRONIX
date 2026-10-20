import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { MetallicSphere } from './MetallicSphere';
import { FuturisticPortal } from './FuturisticPortal';
import { ReflectivePlatform } from './ReflectivePlatform';
import { ParticleField } from './ParticleField';
import { useScrollStory } from '../../hooks/useScrollStory';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWebGLSupport } from '../../hooks/useWebGLSupport';

// Dynamic camera & scene controller reacting to scroll progress and mouse parallax
const ScrollChoreographer: React.FC<{ scrollProgress: number; reducedMotion: boolean }> = ({
  scrollProgress,
  reducedMotion
}) => {
  const currentPos = useRef(new THREE.Vector3(0, 0.15, 5.8));
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const sceneGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const { camera, pointer } = state;
    const p = Math.max(0, Math.min(1, scrollProgress));

    // Dynamic Waypoint Interpolation:
    // 0.00: Hero (Center)
    // 0.18: About (Pan left, rotate right)
    // 0.38: Hyped Events (Pan right, lower angle)
    // 0.58: Event Catalog (Wide overview, elevated)
    // 0.76: Departments (Angled cyber perspective)
    // 0.88: Prizes (Upper trophy angle, dramatic lighting)
    // 1.00: Registration Finale (Center focus, close-up)

    let targetX = 0;
    let targetY = 0.15;
    let targetZ = 5.8;
    let lookX = 0;
    let lookY = 0;
    let groupRotY = p * Math.PI * 2.5;

    if (p < 0.20) {
      // Hero -> About
      const factor = p / 0.20;
      targetX = THREE.MathUtils.lerp(0, -1.8, factor);
      targetY = THREE.MathUtils.lerp(0.15, 0.35, factor);
      targetZ = THREE.MathUtils.lerp(5.8, 4.6, factor);
      lookX = THREE.MathUtils.lerp(0, 0.65, factor);
      lookY = THREE.MathUtils.lerp(0, 0.05, factor);
    } else if (p < 0.40) {
      // About -> Hyped Events
      const factor = (p - 0.20) / 0.20;
      targetX = THREE.MathUtils.lerp(-1.8, 1.7, factor);
      targetY = THREE.MathUtils.lerp(0.35, -0.2, factor);
      targetZ = THREE.MathUtils.lerp(4.6, 5.0, factor);
      lookX = THREE.MathUtils.lerp(0.65, -0.5, factor);
      lookY = THREE.MathUtils.lerp(0.05, 0, factor);
    } else if (p < 0.60) {
      // Hyped -> Catalog
      const factor = (p - 0.40) / 0.20;
      targetX = THREE.MathUtils.lerp(1.7, 0, factor);
      targetY = THREE.MathUtils.lerp(-0.2, 0.65, factor);
      targetZ = THREE.MathUtils.lerp(5.0, 6.4, factor);
      lookX = THREE.MathUtils.lerp(-0.5, 0, factor);
      lookY = THREE.MathUtils.lerp(0, -0.15, factor);
    } else if (p < 0.80) {
      // Catalog -> Departments
      const factor = (p - 0.60) / 0.20;
      targetX = THREE.MathUtils.lerp(0, -1.5, factor);
      targetY = THREE.MathUtils.lerp(0.65, -0.3, factor);
      targetZ = THREE.MathUtils.lerp(6.4, 4.8, factor);
      lookX = THREE.MathUtils.lerp(0, 0.5, factor);
      lookY = THREE.MathUtils.lerp(-0.15, 0, factor);
    } else if (p < 0.92) {
      // Departments -> Prizes
      const factor = (p - 0.80) / 0.12;
      targetX = THREE.MathUtils.lerp(-1.5, 0, factor);
      targetY = THREE.MathUtils.lerp(-0.3, 0.8, factor);
      targetZ = THREE.MathUtils.lerp(4.8, 4.9, factor);
      lookX = THREE.MathUtils.lerp(0.5, 0, factor);
      lookY = THREE.MathUtils.lerp(0, -0.1, factor);
    } else {
      // Prizes -> Registration Finale
      const factor = (p - 0.92) / 0.08;
      targetX = THREE.MathUtils.lerp(0, 0, factor);
      targetY = THREE.MathUtils.lerp(0.8, 0.05, factor);
      targetZ = THREE.MathUtils.lerp(4.9, 3.9, factor);
      lookX = 0;
      lookY = 0;
    }

    // Add subtle mouse parallax offset
    if (!reducedMotion) {
      targetX += pointer.x * 0.45;
      targetY += pointer.y * 0.35;
    }

    // Smooth lerp camera movement
    currentPos.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.05);
    currentTarget.current.lerp(new THREE.Vector3(lookX, lookY, 0), 0.05);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentTarget.current);

    // Apply scroll-induced rotation to central 3D scene group
    if (sceneGroupRef.current && !reducedMotion) {
      sceneGroupRef.current.rotation.y = groupRotY;
    }
  });

  return (
    <group ref={sceneGroupRef}>
      <ReflectivePlatform position={[0, -1.8, 0]} radius={3.8} reducedMotion={reducedMotion} />
      <FuturisticPortal position={[0, 0.1, -0.8]} scale={1.3} reducedMotion={reducedMotion} />
      <MetallicSphere position={[0, 0.05, 0.5]} scale={0.92} reducedMotion={reducedMotion} />
      <ParticleField count={220} color="#7dd3fc" reducedMotion={reducedMotion} />
    </group>
  );
};

export const ScrollCanvas3D: React.FC = () => {
  const scrollProgress = useScrollStory();
  const reducedMotion = useReducedMotion();
  const { isSupported: webglSupported, isChecking } = useWebGLSupport();

  // Graceful fallback for non-WebGL devices
  if (!webglSupported && !isChecking) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <Canvas
        camera={{ position: [0, 0.15, 5.8], fov: 42 }}
        dpr={[1, 1.8]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        {/* Subtle Atmospheric Environmental Fog */}
        <fog attach="fog" args={['#0e172e', 6, 24]} />

        <Suspense fallback={null}>
          {/* Studio & Key Lighting */}
          <ambientLight intensity={0.7} color="#f8fafc" />

          {/* Primary Directional Sunlight */}
          <directionalLight
            position={[5, 9, 6]}
            intensity={2.8}
            color="#ffffff"
            castShadow
          />

          {/* Ice Blue Volumetric Fill Light */}
          <pointLight
            position={[-5, -1, 4]}
            intensity={2.5}
            color="#38bdf8"
            distance={18}
          />

          {/* Soft Lavender Rim Accent */}
          <pointLight
            position={[5, -2, -2]}
            intensity={2.2}
            color="#c084fc"
            distance={16}
          />

          {/* Studio reflections for realistic metallics */}
          <Environment preset="city" />

          {/* Choreographed 3D Scene */}
          <ScrollChoreographer
            scrollProgress={scrollProgress}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ScrollCanvas3D;
