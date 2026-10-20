import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
  color?: string;
  reducedMotion?: boolean;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({
  count = 250,
  color = '#7dd3fc',
  reducedMotion = false
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate randomized 3D particle positions once
  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
      scl[i] = Math.random() * 0.5 + 0.5;
    }
    return [pos, scl];
  }, [count]);

  useFrame((state) => {
    if (reducedMotion || !pointsRef.current) return;
    const t = state.clock.getElapsedTime();

    // Gentle global drift
    pointsRef.current.rotation.y = t * 0.03;
    pointsRef.current.rotation.x = Math.sin(t * 0.05) * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-scale"
          args={[scales, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color={color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
