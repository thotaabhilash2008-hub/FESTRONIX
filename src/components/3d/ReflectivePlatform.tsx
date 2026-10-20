import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ReflectivePlatformProps {
  position?: [number, number, number];
  radius?: number;
  reducedMotion?: boolean;
}

export const ReflectivePlatform: React.FC<ReflectivePlatformProps> = ({
  position = [0, -1.8, 0],
  radius = 3.6,
  reducedMotion = false
}) => {
  const platformRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (reducedMotion || !ringRef.current) return;
    const t = state.clock.getElapsedTime();
    ringRef.current.rotation.z = -t * 0.1;
  });

  return (
    <group ref={platformRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Primary Reflective Metallic Pedestal Disc */}
      <mesh receiveShadow>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial
          color="#0c162d"
          metalness={0.92}
          roughness={0.18}
          envMapIntensity={1.8}
        />
      </mesh>

      {/* Outer Polished Bevel Ring */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[radius * 0.94, radius, 64]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.98}
          roughness={0.1}
          envMapIntensity={2.2}
        />
      </mesh>

      {/* Cyber Luminous Track Ring */}
      <mesh ref={ringRef} position={[0, 0, 0.02]}>
        <ringGeometry args={[radius * 0.75, radius * 0.77, 64]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={1.4}
          roughness={0.3}
        />
      </mesh>

      {/* Subtle Inner Accent Ring (Soft Lavender) */}
      <mesh position={[0, 0, 0.025]}>
        <ringGeometry args={[radius * 0.45, radius * 0.46, 64]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#9333ea"
          emissiveIntensity={0.8}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
};
