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
 * 4. Internal VCE Sapphire Blue core emitter (#3D68B2)
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
    <group position={[0, -0.3, 0]} scale={0.72}>
      {/* ========================================================
          1. GROUND COLLIMATOR PEDESTAL (Graphite + Liquid Silver)
          ======================================================== */}
      <group position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Monolithic Graphite Base Disc */}
        <mesh receiveShadow>
          <circleGeometry args={[2.7, 64]} />
          <meshStandardMaterial
            color="#0B0E17"
            roughness={0.3}
            metalness={0.92}
            envMapIntensity={1.4}
          />
        </mesh>

        {/* Polished Liquid Silver Perimeter Chamfer */}
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[2.55, 2.7, 64]} />
          <meshPhysicalMaterial
            color="#DCE3E8"
            roughness={0.08}
            metalness={0.98}
            clearcoat={1.0}
            envMapIntensity={2.2}
          />
        </mesh>

        {/* Recessed Electric Laser Channel */}
        <mesh ref={pedestalRef} position={[0, 0, 0.02]}>
          <ringGeometry args={[1.85, 1.88, 64]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={2.2}
            roughness={0.15}
          />
        </mesh>

        {/* Inner Liquid Silver Alignment Ring */}
        <mesh position={[0, 0, 0.025]}>
          <ringGeometry args={[1.05, 1.07, 64]} />
          <meshStandardMaterial
            color="#E2E8F0"
            roughness={0.12}
            metalness={0.96}
          />
        </mesh>
      </group>

      {/* ========================================================
          2. KINETIC CORE & GIMBALS (VCE Electric Sapphire & Silver)
          ======================================================== */}
      <group ref={coreRef}>
        {/* Internal Glowing Electric Sapphire Core */}
        <mesh ref={amberSingularityRef}>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#1D4ED8"
            emissiveIntensity={2.6}
            roughness={0.08}
          />
        </mesh>

        {/* Faceted Liquid Silver Polyhedral Armature */}
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[0.92, 0]} />
          <meshPhysicalMaterial
            color="#F1F5F9"
            emissive="#080C16"
            emissiveIntensity={0.08}
            roughness={0.06}
            metalness={0.98}
            clearcoat={1.0}
            clearcoatRoughness={0.03}
            reflectivity={1.0}
            ior={1.65}
          />
        </mesh>

        {/* Precision Beveled Deep Frame */}
        <mesh>
          <octahedronGeometry args={[1.14, 0]} />
          <meshStandardMaterial
            color="#1E293B"
            wireframe
            wireframeLinewidth={2}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>

        {/* Precision Chamfered Liquid Silver Gimbal Ring */}
        <mesh ref={outerGimbalRef}>
          <torusGeometry args={[1.52, 0.038, 16, 96]} />
          <meshPhysicalMaterial
            color="#E2E8F0"
            roughness={0.08}
            metalness={0.98}
            clearcoat={1.0}
            envMapIntensity={2.4}
          />
        </mesh>

        {/* Counter-Rotating Sapphire Inner Gimbal Ring */}
        <mesh ref={innerGimbalRef}>
          <torusGeometry args={[1.24, 0.026, 16, 80]} />
          <meshStandardMaterial
            color="#0F172A"
            emissive="#2563EB"
            emissiveIntensity={0.6}
            roughness={0.25}
            metalness={0.9}
          />
        </mesh>

        {/* Equatorial Laser Tick Horizon */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.82, 1.84, 64]} />
          <meshBasicMaterial
            color="#38BDF8"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};

export default KineticArtifact;
