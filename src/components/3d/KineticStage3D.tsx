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
const StageChoreographer: React.FC<{ scrollProgress: number; reducedMotion: boolean }> = ({
  scrollProgress,
  reducedMotion
}) => {
  const currentPos = useRef(new THREE.Vector3(0.15, 0.08, 2.7));
  const currentTarget = useRef(new THREE.Vector3(0, 0.05, 0));
  const artifactGroupRef = useRef<THREE.Group>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const amberFillRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const { camera, pointer } = state;
    const p = Math.max(0, Math.min(1, scrollProgress));

    // Dynamic Waypoint Interpolation:
    // 0.00 - 0.16: Sequence A (Hero Macro -> Authority Pull-back)
    // 0.16 - 0.36: Sequence B (About Lateral Sweep, Left Flank)
    // 0.36 - 0.56: Sequence C (Event Discovery High Architectural Angle)
    // 0.56 - 0.76: Sequence D (Technical Showcase Dynamic Low Angle)
    // 0.76 - 0.90: Sequence E (Campus Gallery Multi-layer Parallax)
    // 0.90 - 1.00: Sequence F (Registration Finale Direct Optical Alignment)

    let targetX = 0;
    let targetY = 0.18;
    let targetZ = 4.6;
    let lookX = 0;
    let lookY = -0.22;
    let rotY = p * Math.PI * 2.2;
    let keyIntensity = 2.4;
    let amberIntensity = 2.4;

    if (p < 0.16) {
      // Sequence A: Hero View (Centered lower with clean headroom below navbar)
      const f = p / 0.16;
      targetX = THREE.MathUtils.lerp(0, 0, f);
      targetY = THREE.MathUtils.lerp(0.18, 0.15, f);
      targetZ = THREE.MathUtils.lerp(4.6, 5.2, f);
      lookX = 0;
      lookY = THREE.MathUtils.lerp(-0.22, 0, f);
      keyIntensity = THREE.MathUtils.lerp(2.2, 2.8, f);
    } else if (p < 0.36) {
      // Sequence B: Transition into About (Camera sweeps left, framing right)
      const f = (p - 0.16) / 0.20;
      targetX = THREE.MathUtils.lerp(0, -2.1, f);
      targetY = THREE.MathUtils.lerp(0.15, 0.3, f);
      targetZ = THREE.MathUtils.lerp(5.2, 4.4, f);
      lookX = THREE.MathUtils.lerp(0, 0.75, f);
      lookY = THREE.MathUtils.lerp(0, 0.05, f);
      keyIntensity = 3.0;
    } else if (p < 0.56) {
      // Sequence C: Event Discovery (High architectural bird's eye angle)
      const f = (p - 0.36) / 0.20;
      targetX = THREE.MathUtils.lerp(-2.1, 1.8, f);
      targetY = THREE.MathUtils.lerp(0.3, 1.4, f);
      targetZ = THREE.MathUtils.lerp(4.4, 5.4, f);
      lookX = THREE.MathUtils.lerp(0.75, -0.4, f);
      lookY = THREE.MathUtils.lerp(0.05, -0.3, f);
      keyIntensity = 3.2;
      amberIntensity = 3.0;
    } else if (p < 0.76) {
      // Sequence D: Technical Showcase / Departments (Low dynamic angle looking up)
      const f = (p - 0.56) / 0.20;
      targetX = THREE.MathUtils.lerp(1.8, -1.6, f);
      targetY = THREE.MathUtils.lerp(1.4, -0.6, f);
      targetZ = THREE.MathUtils.lerp(5.4, 4.6, f);
      lookX = THREE.MathUtils.lerp(-0.4, 0.45, f);
      lookY = THREE.MathUtils.lerp(-0.3, 0.2, f);
      amberIntensity = 3.5;
    } else if (p < 0.90) {
      // Sequence E: Gallery & Campus Arena (Lateral spatial depth)
      const f = (p - 0.76) / 0.14;
      targetX = THREE.MathUtils.lerp(-1.6, 1.4, f);
      targetY = THREE.MathUtils.lerp(-0.6, 0.35, f);
      targetZ = THREE.MathUtils.lerp(4.6, 4.8, f);
      lookX = THREE.MathUtils.lerp(0.45, -0.4, f);
      lookY = THREE.MathUtils.lerp(0.2, 0.05, f);
    } else {
      // Sequence F: Registration Finale (Direct optical center-line aperture)
      const f = (p - 0.90) / 0.10;
      targetX = THREE.MathUtils.lerp(1.4, 0, f);
      targetY = THREE.MathUtils.lerp(0.35, 0.05, f);
      targetZ = THREE.MathUtils.lerp(4.8, 3.4, f);
      lookX = 0;
      lookY = 0;
      keyIntensity = THREE.MathUtils.lerp(3.0, 3.8, f);
      amberIntensity = THREE.MathUtils.lerp(2.5, 4.2, f);
    }

    // Gentle mouse parallax damping
    if (!reducedMotion) {
      targetX += pointer.x * 0.35;
      targetY += pointer.y * 0.25;
    }

    // Smooth lerp camera movement
    currentPos.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.055);
    currentTarget.current.lerp(new THREE.Vector3(lookX, lookY, 0), 0.055);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentTarget.current);

    // Apply scroll-induced rotation to central artifact
    if (artifactGroupRef.current && !reducedMotion) {
      artifactGroupRef.current.rotation.y = rotY;
    }

    // Update light intensities
    if (keyLightRef.current) keyLightRef.current.intensity = keyIntensity;
    if (amberFillRef.current) amberFillRef.current.intensity = amberIntensity;
  });

  return (
    <>
      {/* Precision Studio Three-Point Lighting */}
      {/* 1. Warm White Key Light */}
      <directionalLight
        ref={keyLightRef}
        position={[5, 8, 5]}
        intensity={2.8}
        color="#F3F0EA"
        castShadow
      />

      {/* 2. VCE Royal Cobalt Sapphire Fill Light */}
      <pointLight
        ref={amberFillRef}
        position={[-5, -1, 3]}
        intensity={2.6}
        color="#3D68B2"
        distance={16}
      />

      {/* 3. VCE Sage Rim Accent */}
      <pointLight
        position={[4, -3, -3]}
        intensity={2.4}
        color="#6F9693"
        distance={14}
      />

      {/* Baseline Ambient baseline */}
      <ambientLight intensity={0.55} color="#0E1626" />

      {/* Studio HDRI Environment for Liquid Silver reflections */}
      <Environment preset="city" />

      {/* Choreographed Bespoke Kinetic Artifact */}
      <group ref={artifactGroupRef}>
        <KineticArtifact reducedMotion={reducedMotion} />
      </group>
    </>
  );
};

export const KineticStage3D: React.FC = () => {
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
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 80px, black 135px)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 80px, black 135px)'
      }}
    >
      <Canvas
        camera={{ position: [0, -0.32, 4.4], fov: 42 }}
        dpr={[1, 1.8]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        {/* VCE Midnight Atmospheric Distance Fog */}
        <fog attach="fog" args={['#080C16', 5, 22]} />

        <Suspense fallback={null}>
          <StageChoreographer
            scrollProgress={scrollProgress}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default KineticStage3D;
