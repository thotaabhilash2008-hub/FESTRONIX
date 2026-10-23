import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { KineticArtifact } from './KineticArtifact';
import { useScrollStory } from '../../hooks/useScrollStory';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWebGLSupport } from '../../hooks/useWebGLSupport';

/**
 * Stage Camera & Lighting Choreographer
 * Drives continuous macro -> spatial -> architectural -> focal camera movement
 * tied directly to GSAP ScrollTrigger progress.
 */
const StageChoreographer: React.FC<{ reducedMotion: boolean }> = ({
  reducedMotion
}) => {
  const smoothP = useRef(0);
  const currentPos = useRef(new THREE.Vector3(0, -0.55, 6.6));
  const currentTarget = useRef(new THREE.Vector3(0, -0.3, 0));
  const artifactGroupRef = useRef<THREE.Group>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const amberFillRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const { camera, pointer } = state;

    // Direct scroll interpolation: Silky smooth 60fps tracking with zero React re-render churn
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const targetScroll = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    smoothP.current = THREE.MathUtils.lerp(smoothP.current, targetScroll, 0.08);
    const p = smoothP.current;

    // Fluid Peripheral Waypoint Trajectory:
    // Guarantees the kinetic artifact stays on margins and deep in space, NEVER obstructing text
    let targetX = 0;
    let targetY = -0.55;
    let targetZ = 6.6;
    let lookX = 0;
    let lookY = -0.3;
    let rotY = p * Math.PI * 2.4;
    let keyIntensity = 2.4;
    let amberIntensity = 2.4;

    if (p < 0.16) {
      // Sequence A: Hero View (Anchored low center as architectural pedestal below title)
      const f = p / 0.16;
      targetX = 0;
      targetY = THREE.MathUtils.lerp(-0.55, -0.45, f);
      targetZ = THREE.MathUtils.lerp(6.6, 6.8, f);
      lookX = 0;
      lookY = THREE.MathUtils.lerp(-0.3, -0.2, f);
      keyIntensity = THREE.MathUtils.lerp(2.2, 2.6, f);
    } else if (p < 0.36) {
      // Sequence B: About Section (Sweeps to the right flank; text on left/center is 100% unobstructed)
      const f = (p - 0.16) / 0.20;
      targetX = THREE.MathUtils.lerp(0, 2.4, f);
      targetY = THREE.MathUtils.lerp(-0.45, 0.15, f);
      targetZ = THREE.MathUtils.lerp(6.8, 7.0, f);
      lookX = THREE.MathUtils.lerp(0, 0.6, f);
      lookY = THREE.MathUtils.lerp(-0.2, 0.0, f);
      keyIntensity = 2.8;
    } else if (p < 0.56) {
      // Sequence C: Hyped Events & Catalog (Sweeps to high left periphery; catalog cards take center stage)
      const f = (p - 0.36) / 0.20;
      targetX = THREE.MathUtils.lerp(2.4, -2.3, f);
      targetY = THREE.MathUtils.lerp(0.15, 0.85, f);
      targetZ = THREE.MathUtils.lerp(7.0, 7.4, f);
      lookX = THREE.MathUtils.lerp(0.6, -0.5, f);
      lookY = THREE.MathUtils.lerp(0.0, 0.1, f);
      keyIntensity = 3.0;
      amberIntensity = 2.8;
    } else if (p < 0.76) {
      // Sequence D: Engineering Faculties (Frames right margin at dynamic lower angle)
      const f = (p - 0.56) / 0.20;
      targetX = THREE.MathUtils.lerp(-2.3, 2.2, f);
      targetY = THREE.MathUtils.lerp(0.85, -0.4, f);
      targetZ = THREE.MathUtils.lerp(7.4, 7.2, f);
      lookX = THREE.MathUtils.lerp(-0.5, 0.5, f);
      lookY = THREE.MathUtils.lerp(0.1, -0.05, f);
      amberIntensity = 3.2;
    } else if (p < 0.90) {
      // Sequence E: Cash Prizes & Awards (Frames left flank with vivid electric rim lighting)
      const f = (p - 0.76) / 0.14;
      targetX = THREE.MathUtils.lerp(2.2, -2.1, f);
      targetY = THREE.MathUtils.lerp(-0.4, 0.2, f);
      targetZ = THREE.MathUtils.lerp(7.2, 7.0, f);
      lookX = THREE.MathUtils.lerp(0.5, -0.45, f);
      lookY = THREE.MathUtils.lerp(-0.05, 0.05, f);
      amberIntensity = 3.4;
    } else {
      // Sequence F: Registration Finale (Centered comfortably in lower atmosphere below CTA card)
      const f = (p - 0.90) / 0.10;
      targetX = THREE.MathUtils.lerp(-2.1, 0, f);
      targetY = THREE.MathUtils.lerp(0.2, -0.45, f);
      targetZ = THREE.MathUtils.lerp(7.0, 6.4, f);
      lookX = THREE.MathUtils.lerp(-0.45, 0, f);
      lookY = THREE.MathUtils.lerp(0.05, -0.2, f);
      keyIntensity = THREE.MathUtils.lerp(2.8, 3.4, f);
      amberIntensity = THREE.MathUtils.lerp(2.6, 3.6, f);
    }

    // Subtle pointer parallax
    if (!reducedMotion) {
      targetX += pointer.x * 0.25;
      targetY += pointer.y * 0.2;
    }

    // Smooth lerp camera movement
    currentPos.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.065);
    currentTarget.current.lerp(new THREE.Vector3(lookX, lookY, 0), 0.065);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentTarget.current);

    // Continuous artifact rotation
    if (artifactGroupRef.current && !reducedMotion) {
      artifactGroupRef.current.rotation.y = rotY;
    }

    // Dynamic light updating
    if (keyLightRef.current) keyLightRef.current.intensity = keyIntensity;
    if (amberFillRef.current) amberFillRef.current.intensity = amberIntensity;
  });

  return (
    <>
      {/* Precision Studio Three-Point Lighting */}
      {/* 1. Crisp White Key Light */}
      <directionalLight
        ref={keyLightRef}
        position={[6, 9, 6]}
        intensity={2.6}
        color="#F8FAFC"
        castShadow
      />

      {/* 2. Electric Sapphire Fill Light */}
      <pointLight
        ref={amberFillRef}
        position={[-6, -1, 4]}
        intensity={2.8}
        color="#38BDF8"
        distance={18}
      />

      {/* 3. Cyan Rim Accent Light */}
      <pointLight
        position={[5, -3, -3]}
        intensity={2.4}
        color="#0284C7"
        distance={16}
      />

      {/* Baseline Ambient */}
      <ambientLight intensity={0.6} color="#0B132B" />

      {/* Studio HDRI Environment */}
      <Environment preset="city" />

      {/* Choreographed Kinetic Artifact */}
      <group ref={artifactGroupRef}>
        <KineticArtifact reducedMotion={reducedMotion} />
      </group>
    </>
  );
};

export const KineticStage3D: React.FC = () => {
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
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 60px, black 120px)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 60px, black 120px)'
      }}
    >
      {/* Dark Ambient Readability Shield: Diffuses center background to ensure 100% crisp text readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(8, 12, 22, 0.55) 0%, rgba(8, 12, 22, 0.2) 65%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      <Canvas
        camera={{ position: [0, -0.55, 6.6], fov: 40 }}
        dpr={[1, 1.8]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        {/* Distance Fog to blend deep into obsidian space */}
        <fog attach="fog" args={['#080C16', 6, 22]} />

        <Suspense fallback={null}>
          <StageChoreographer reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default KineticStage3D;
