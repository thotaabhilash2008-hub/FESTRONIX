import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FuturisticPortalProps {
  position?: [number, number, number];
  scale?: number;
  reducedMotion?: boolean;
}

export const FuturisticPortal: React.FC<FuturisticPortalProps> = ({
  position = [0, 0, -1.2],
  scale = 2.0,
  reducedMotion = false
}) => {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const midRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const energyDiscRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * 0.2;
    }

    if (midRingRef.current) {
      midRingRef.current.rotation.z = -t * 0.35;
      midRingRef.current.rotation.x = Math.sin(t * 0.4) * 0.08;
    }

    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = t * 0.5;
    }

    if (energyDiscRef.current) {
      const pulse = 1 + Math.sin(t * 2.5) * 0.04;
      energyDiscRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Heavy Brushed Silver Outer Arch Ring */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[2.4, 0.08, 20, 100]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.94}
          roughness={0.2}
          envMapIntensity={2.0}
        />
      </mesh>

      {/* Ice Blue Neon Propulsion Channel */}
      <mesh ref={midRingRef}>
        <torusGeometry args={[2.0, 0.045, 16, 90]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={1.4}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      {/* Soft Lavender Energy Counter-Ring */}
      <mesh ref={innerRingRef}>
        <torusGeometry args={[1.65, 0.03, 16, 80]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#9333ea"
          emissiveIntensity={1.0}
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>

      {/* Dimensional Depth Disc */}
      <mesh ref={energyDiscRef} position={[0, 0, -0.05]}>
        <circleGeometry args={[1.6, 64]} />
        <meshBasicMaterial
          color="#0b1329"
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
