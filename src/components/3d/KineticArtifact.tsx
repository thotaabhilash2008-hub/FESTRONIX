import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface KineticArtifactProps {
  reducedMotion?: boolean;
}

/**
 * FESTRONIX Bespoke 3D Kinetic Artifact
 * A precision-engineered sculptural convergence of:
 * 1. Faceted Liquid Silver polyhedral armature (PBR high-reflectance chrome)
 * 2. Deep Graphite mechanical gimbal chassis
 * 3. Counter-rotating concentric silver orbital rings
 * 4. Internal Electric Amber core emitter (#FF6B35)
 * 5. Monolithic ground collimator pedestal with recessed amber alignment channels
 */
export const KineticArtifact: React.FC<KineticArtifactProps> = ({ reducedMotion = false }) => {
  const coreRef = useRef<THREE.Group>(null);
  const outerGimbalRef = useRef<THREE.Mesh>(null);
  const innerGimbalRef = useRef<THREE.Mesh>(null);
  const amberSingularityRef = useRef<THREE.Mesh>(null);
  const pedestalRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pointer = state.pointer;

    if (!reducedMotion) {
      // 1. Organic levitation float
      if (coreRef.current) {
        coreRef.current.position.y = Math.sin(t * 1.1) * 0.12;
        // Subtle responsive mouse rotation
        coreRef.current.rotation.y = t * 0.22 + pointer.x * 0.35;
        coreRef.current.rotation.x = Math.sin(t * 0.6) * 0.1 - pointer.y * 0.25;
      }

      // 2. Dual-axis gimbal counter-rotations
      if (outerGimbalRef.current) {
        outerGimbalRef.current.rotation.z = t * 0.3;
        outerGimbalRef.current.rotation.x = Math.PI / 4 + Math.sin(t * 0.5) * 0.15;
      }

      if (innerGimbalRef.current) {
        innerGimbalRef.current.rotation.z = -t * 0.45;
        innerGimbalRef.current.rotation.y = Math.cos(t * 0.4) * 0.2;
      }

      // 3. Electric Amber singularity pulse
      if (amberSingularityRef.current) {
        const pulse = 1 + Math.sin(t * 3.0) * 0.08;
        amberSingularityRef.current.scale.set(pulse, pulse, pulse);
      }

      // 4. Pedestal track rotation
      if (pedestalRef.current) {
        pedestalRef.current.rotation.z = -t * 0.05;
      }
    }
  });

  return (
    <group position={[0, -0.42, 0]} scale={0.88}>
      {/* ========================================================
          1. GROUND COLLIMATOR PEDESTAL (Graphite + Liquid Silver)
          ======================================================== */}
      <group position={[0, -1.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Monolithic Graphite Base Disc */}
        <mesh receiveShadow>
          <circleGeometry args={[4.2, 64]} />
          <meshStandardMaterial
            color="#0E1017"
            roughness={0.25}
            metalness={0.9}
            envMapIntensity={1.4}
          />
        </mesh>

        {/* Polished Liquid Silver Perimeter Chamfer */}
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[3.95, 4.2, 64]} />
          <meshPhysicalMaterial
            color="#C7CBD4"
            roughness={0.08}
            metalness={0.98}
            clearcoat={1.0}
            envMapIntensity={2.2}
          />
        </mesh>

        {/* Recessed Electric Amber Laser Channel */}
        <mesh ref={pedestalRef} position={[0, 0, 0.02]}>
          <ringGeometry args={[2.8, 2.84, 64]} />
          <meshStandardMaterial
            color="#FF6B35"
            emissive="#FF6B35"
            emissiveIntensity={1.8}
            roughness={0.2}
          />
        </mesh>

        {/* Inner Liquid Silver Alignment Ring */}
        <mesh position={[0, 0, 0.025]}>
          <ringGeometry args={[1.5, 1.52, 64]} />
          <meshStandardMaterial
            color="#C7CBD4"
            roughness={0.15}
            metalness={0.95}
          />
        </mesh>
      </group>

      {/* ========================================================
          2. KINETIC CORE & GIMBALS
          ======================================================== */}
      <group ref={coreRef}>
        {/* Internal Glowing Amber Singularity Core */}
        <mesh ref={amberSingularityRef}>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshStandardMaterial
            color="#FF6B35"
            emissive="#FF6B35"
            emissiveIntensity={2.5}
            roughness={0.1}
          />
        </mesh>

        {/* Faceted Liquid Silver Polyhedral Armature */}
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[0.95, 0]} />
          <meshPhysicalMaterial
            color="#F3F0EA"
            emissive="#08090D"
            emissiveIntensity={0.1}
            roughness={0.06}
            metalness={0.98}
            clearcoat={1.0}
            clearcoatRoughness={0.03}
            reflectivity={1.0}
            ior={1.65}
          />
        </mesh>

        {/* Precision Beveled Graphite Outer Frame */}
        <mesh>
          <octahedronGeometry args={[1.18, 0]} />
          <meshStandardMaterial
            color="#151820"
            wireframe
            wireframeLinewidth={2}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>

        {/* Precision Chamfered Liquid Silver Gimbal Ring */}
        <mesh ref={outerGimbalRef}>
          <torusGeometry args={[1.65, 0.045, 16, 96]} />
          <meshPhysicalMaterial
            color="#C7CBD4"
            roughness={0.08}
            metalness={0.98}
            clearcoat={1.0}
            envMapIntensity={2.4}
          />
        </mesh>

        {/* Counter-Rotating Graphite Inner Gimbal Ring */}
        <mesh ref={innerGimbalRef}>
          <torusGeometry args={[1.35, 0.03, 16, 80]} />
          <meshStandardMaterial
            color="#252A36"
            emissive="#FF6B35"
            emissiveIntensity={0.4}
            roughness={0.25}
            metalness={0.9}
          />
        </mesh>

        {/* Equatorial Laser Tick Horizon */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.0, 2.02, 64]} />
          <meshBasicMaterial
            color="#FF6B35"
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};

export default KineticArtifact;
