import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { CameraController } from './CameraController';
import { MetallicSphere } from './MetallicSphere';
import { FuturisticPortal } from './FuturisticPortal';
import { ReflectivePlatform } from './ReflectivePlatform';
import { ParticleField } from './ParticleField';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWebGLSupport } from '../../hooks/useWebGLSupport';

interface Scene3DProps {
  className?: string;
  showPortal?: boolean;
  showSphere?: boolean;
  showPlatform?: boolean;
  showParticles?: boolean;
  cameraZ?: number;
  cameraY?: number;
}

export const Scene3D: React.FC<Scene3DProps> = ({
  className = 'w-full h-full min-h-[480px]',
  showPortal = true,
  showSphere = true,
  showPlatform = true,
  showParticles = true,
  cameraZ = 6.2,
  cameraY = 0.2
}) => {
  const reducedMotion = useReducedMotion();
  const { isSupported: webglSupported, isChecking } = useWebGLSupport();

  // Graceful fallback for non-WebGL devices or while checking
  if (!webglSupported && !isChecking) {
    return (
      <div className={`relative flex items-center justify-center bg-radial from-slate-900 to-[#0e172e] ${className}`}>
        <div className="text-center p-6 text-slate-400">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full border border-sky-400/30 bg-sky-500/10 flex items-center justify-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 opacity-80" />
          </div>
          <p className="text-xs uppercase tracking-widest text-sky-300 font-semibold">FESTRONIX 3D ENGINE</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ pointerEvents: 'auto' }}>
      <Canvas
        camera={{ position: [0, cameraY, cameraZ], fov: 42 }}
        dpr={[1, 1.8]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        {/* Subtle Atmospheric Environmental Fog */}
        <fog attach="fog" args={['#0e172e', 7, 24]} />

        <Suspense fallback={null}>
          {/* Lighting: Pearl, Soft Blue & Lavender Key Lights */}
          <ambientLight intensity={0.8} color="#f8fafc" />

          {/* Primary Top Sunlight on Chrome */}
          <directionalLight
            position={[4, 9, 6]}
            intensity={2.8}
            color="#ffffff"
            castShadow
          />

          {/* Ice Blue Volumetric-Style Fill */}
          <pointLight
            position={[-5, -1, 4]}
            intensity={2.4}
            color="#38bdf8"
            distance={18}
          />

          {/* Soft Lavender Rim Light */}
          <pointLight
            position={[5, -2, -2]}
            intensity={2.0}
            color="#c084fc"
            distance={16}
          />

          {/* Studio Environment Reflections for Realistic Metallics */}
          <Environment preset="city" />

          {/* 3D Scene Composition */}
          {showPlatform && (
            <ReflectivePlatform
              position={[0, -1.8, 0]}
              radius={3.8}
              reducedMotion={reducedMotion}
            />
          )}

          {showPortal && (
            <FuturisticPortal
              position={[0, 0.1, -0.8]}
              scale={1.3}
              reducedMotion={reducedMotion}
            />
          )}

          {showSphere && (
            <MetallicSphere
              position={[0, 0.05, 0.5]}
              scale={0.92}
              reducedMotion={reducedMotion}
            />
          )}

          {showParticles && (
            <ParticleField
              count={260}
              color="#93c5fd"
              reducedMotion={reducedMotion}
            />
          )}

          {/* Interactive Parallax Camera Movement */}
          <CameraController
            intensity={0.45}
            damping={0.05}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene3D;
