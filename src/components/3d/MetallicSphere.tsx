import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MetallicSphereProps {
  position?: [number, number, number];
  scale?: number;
  reducedMotion?: boolean;
}

export const MetallicSphere: React.FC<MetallicSphereProps> = ({
  position = [0, 0, 0],
  scale = 1.3,
  reducedMotion = false
}) => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const orbitalRingRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pointer = state.pointer;

    if (sphereRef.current) {
      if (!reducedMotion) {
        // Organic vertical floating motion
        sphereRef.current.position.y = position[1] + Math.sin(t * 1.4) * 0.15;
        // Subtle mouse tilt reaction
        sphereRef.current.rotation.y = t * 0.2 + pointer.x * 0.4;
        sphereRef.current.rotation.x = Math.sin(t * 0.7) * 0.1 - pointer.y * 0.3;
      }

      // Smooth hover expansion
      const targetScale = (hovered ? 1.06 : 1.0) * scale;
      sphereRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.08
      );
    }

    if (orbitalRingRef.current && !reducedMotion) {
      orbitalRingRef.current.position.y = sphereRef.current ? sphereRef.current.position.y : position[1];
      orbitalRingRef.current.rotation.z = t * 0.45;
      orbitalRingRef.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.6) * 0.12;
      orbitalRingRef.current.rotation.y = t * 0.2;
    }
  });

  return (
    <group>
      {/* Central High-Polish Pearl-Silver Metallic Sphere */}
      <mesh
        ref={sphereRef}
        position={position}
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          emissive="#0f172a"
          emissiveIntensity={0.1}
          metalness={0.96}
          roughness={0.12}
          clearcoat={1.0}
          clearcoatRoughness={0.06}
          reflectivity={0.98}
          ior={1.65}
        />
      </mesh>

      {/* Floating Thin Gyroscopic Orbital Ring */}
      <mesh ref={orbitalRingRef} position={position}>
        <torusGeometry args={[1.5, 0.022, 16, 96]} />
        <meshStandardMaterial
          color="#e2e8f0"
          emissive="#7dd3fc"
          emissiveIntensity={0.65}
          metalness={0.95}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
};
