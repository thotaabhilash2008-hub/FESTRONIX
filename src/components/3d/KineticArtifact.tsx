import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface KineticArtifactProps {
  reducedMotion?: boolean;
}

// Normalized perimeter contour points tracing the authentic VCE crest shield
const LEFT_POINTS: [number, number][] = [
  [-0.194, 1.15],
  [-0.644, 1.077],
  [-0.862, 1.004],
  [-1.02, 0.931],
  [-1.02, 0.858],
  [-1.02, 0.785],
  [-1.008, 0.712],
  [-1.008, 0.639],
  [-1.008, 0.566],
  [-1.008, 0.493],
  [-1.008, 0.42],
  [-0.996, 0.347],
  [-0.996, 0.274],
  [-0.971, 0.201],
  [-0.971, 0.128],
  [-0.959, 0.055],
  [-0.947, -0.018],
  [-0.935, -0.091],
  [-0.911, -0.164],
  [-0.886, -0.237],
  [-0.862, -0.31],
  [-0.838, -0.383],
  [-0.814, -0.456],
  [-0.765, -0.529],
  [-0.729, -0.602],
  [-0.68, -0.675],
  [-0.619, -0.748],
  [-0.546, -0.821],
  [-0.474, -0.894],
  [-0.376, -0.967],
  [-0.267, -1.04],
  [-0.134, -1.113]
];

const RIGHT_POINTS: [number, number][] = [
  [0.194, 1.15],
  [0.644, 1.077],
  [0.874, 1.004],
  [1.02, 0.931],
  [1.02, 0.858],
  [1.02, 0.785],
  [1.02, 0.712],
  [1.008, 0.639],
  [1.008, 0.566],
  [1.008, 0.493],
  [1.008, 0.42],
  [0.996, 0.347],
  [0.996, 0.274],
  [0.984, 0.201],
  [0.971, 0.128],
  [0.959, 0.055],
  [0.947, -0.018],
  [0.935, -0.091],
  [0.911, -0.164],
  [0.899, -0.237],
  [0.862, -0.31],
  [0.838, -0.383],
  [0.814, -0.456],
  [0.765, -0.529],
  [0.729, -0.602],
  [0.68, -0.675],
  [0.619, -0.748],
  [0.559, -0.821],
  [0.474, -0.894],
  [0.389, -0.967],
  [0.279, -1.04],
  [0.134, -1.113]
];

/**
 * FESTRONIX 3D VCE Emblem & Kinetic Stage Centerpiece
 * Replaces the abstract geometric armature with a high-fidelity 3D sculpted VCE Crest:
 * 1. Physical 3D Extruded Crest with liquid-chrome beveled chamfers
 * 2. High-res dual-sided VCE Heraldic Shield face plates
 * 3. Counter-rotating concentric cyber gimbal rings (Platinum & Sapphire)
 * 4. Internal electric blue volumetric core emitter
 * 5. Dynamic scroll response and interactive mouse parallax
 */
export const KineticArtifact: React.FC<KineticArtifactProps> = ({ reducedMotion = false }) => {
  const shieldGroupRef = useRef<THREE.Group>(null);
  const outerGimbalRef = useRef<THREE.Mesh>(null);
  const innerGimbalRef = useRef<THREE.Mesh>(null);
  const coreAuraRef = useRef<THREE.PointLight>(null);
  const pedestalRef = useRef<THREE.Mesh>(null);

  // Load and configure high-res textures
  const { frontTexture, backTexture } = useMemo(() => {
    const loader = new THREE.TextureLoader();
    
    // Front face texture
    const front = loader.load('/vce_crest_hires.png', undefined, undefined, () => {
      // Fallback to standard logo if needed
      loader.load('/vce_logo.png', (fallback) => {
        front.image = fallback.image;
        front.needsUpdate = true;
      });
    });
    front.colorSpace = THREE.SRGBColorSpace;
    front.generateMipmaps = true;
    front.minFilter = THREE.LinearMipmapLinearFilter;
    front.magFilter = THREE.LinearFilter;

    // Back face texture (horizontally oriented for seamless legibility from rear)
    const back = loader.load('/vce_crest_hires_back.png', undefined, undefined, () => {
      loader.load('/vce_logo.png', (fallback) => {
        back.image = fallback.image;
        back.needsUpdate = true;
      });
    });
    back.colorSpace = THREE.SRGBColorSpace;
    back.generateMipmaps = true;
    back.minFilter = THREE.LinearMipmapLinearFilter;
    back.magFilter = THREE.LinearFilter;

    return { frontTexture: front, backTexture: back };
  }, []);

  // Construct 3D Shield Extrusion and Face Geometries
  const { extrudeGeometry, frontFaceGeometry, backFaceGeometry, contourLineGeometry } = useMemo(() => {
    const shape = new THREE.Shape();
    // Top center arch
    shape.moveTo(LEFT_POINTS[0][0], LEFT_POINTS[0][1]);
    shape.quadraticCurveTo(0, LEFT_POINTS[0][1] + 0.04, RIGHT_POINTS[0][0], RIGHT_POINTS[0][1]);

    // Right perimeter downwards
    for (let i = 1; i < RIGHT_POINTS.length; i++) {
      shape.lineTo(RIGHT_POINTS[i][0], RIGHT_POINTS[i][1]);
    }
    // Bottom tip
    shape.lineTo(0, -1.15);
    // Left perimeter upwards (reverse order)
    for (let i = LEFT_POINTS.length - 1; i >= 1; i--) {
      shape.lineTo(LEFT_POINTS[i][0], LEFT_POINTS[i][1]);
    }
    shape.closePath();

    // 1. 3D Beveled Extrusion
    const extrude = new THREE.ExtrudeGeometry(shape, {
      depth: 0.20,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.04,
      bevelThickness: 0.04
    });
    extrude.center();

    // 2. Front Face with planar UV mapping
    const frontFace = new THREE.ShapeGeometry(shape, 16);
    frontFace.computeBoundingBox();
    const bb = frontFace.boundingBox!;
    const pos = frontFace.attributes.position;
    const frontUvs = new Float32Array(pos.count * 2);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      frontUvs[i * 2] = (x - bb.min.x) / (bb.max.x - bb.min.x);
      frontUvs[i * 2 + 1] = (y - bb.min.y) / (bb.max.y - bb.min.y);
    }
    frontFace.setAttribute('uv', new THREE.BufferAttribute(frontUvs, 2));
    frontFace.center();

    // 3. Back Face (mirrored UV for left-to-right text readability when turned)
    const backFace = new THREE.ShapeGeometry(shape, 16);
    const backPos = backFace.attributes.position;
    const backUvs = new Float32Array(backPos.count * 2);

    for (let i = 0; i < backPos.count; i++) {
      const x = backPos.getX(i);
      const y = backPos.getY(i);
      backUvs[i * 2] = (x - bb.min.x) / (bb.max.x - bb.min.x);
      backUvs[i * 2 + 1] = (y - bb.min.y) / (bb.max.y - bb.min.y);
    }
    backFace.setAttribute('uv', new THREE.BufferAttribute(backUvs, 2));
    backFace.center();

    // 4. Perimeter glowing accent contour
    const contourPoints: THREE.Vector3[] = [];
    contourPoints.push(new THREE.Vector3(LEFT_POINTS[0][0], LEFT_POINTS[0][1], 0));
    for (let i = 0; i < RIGHT_POINTS.length; i++) {
      contourPoints.push(new THREE.Vector3(RIGHT_POINTS[i][0], RIGHT_POINTS[i][1], 0));
    }
    contourPoints.push(new THREE.Vector3(0, -1.15, 0));
    for (let i = LEFT_POINTS.length - 1; i >= 0; i--) {
      contourPoints.push(new THREE.Vector3(LEFT_POINTS[i][0], LEFT_POINTS[i][1], 0));
    }
    const contourLine = new THREE.BufferGeometry().setFromPoints(contourPoints);
    contourLine.center();

    return {
      extrudeGeometry: extrude,
      frontFaceGeometry: frontFace,
      backFaceGeometry: backFace,
      contourLineGeometry: contourLine
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pointer = state.pointer;

    if (!reducedMotion) {
      // 1. Organic levitation floating & interactive mouse parallax
      if (shieldGroupRef.current) {
        shieldGroupRef.current.position.y = Math.sin(t * 1.2) * 0.12;
        shieldGroupRef.current.rotation.x = Math.sin(t * 0.8) * 0.06 - pointer.y * 0.22;
        shieldGroupRef.current.rotation.z = Math.cos(t * 0.7) * 0.04 + pointer.x * 0.12;
      }

      // 2. Dual-axis cyber orbital ring rotations
      if (outerGimbalRef.current) {
        outerGimbalRef.current.rotation.z = t * 0.24;
        outerGimbalRef.current.rotation.x = Math.PI / 4 + Math.sin(t * 0.4) * 0.12;
      }

      if (innerGimbalRef.current) {
        innerGimbalRef.current.rotation.z = -t * 0.38;
        innerGimbalRef.current.rotation.y = Math.cos(t * 0.5) * 0.18;
      }

      // 3. Electric sapphire core aura pulse
      if (coreAuraRef.current) {
        coreAuraRef.current.intensity = 1.8 + Math.sin(t * 2.5) * 0.5;
      }

      // 4. Pedestal track rotation
      if (pedestalRef.current) {
        pedestalRef.current.rotation.z = -t * 0.04;
      }
    }
  });

  return (
    <group position={[0, -0.15, 0]} scale={0.88}>
      {/* ========================================================
          1. 3D VCE CREST SCULPTURE (Front, Back & Chrome Bevel)
          ======================================================== */}
      <group ref={shieldGroupRef}>
        {/* Core Electric Blue Volumetric Aura */}
        <pointLight
          ref={coreAuraRef}
          position={[0, 0, 0]}
          color="#38BDF8"
          intensity={2.0}
          distance={6}
        />

        {/* 3D Liquid Chrome Extruded Shield Body */}
        <mesh geometry={extrudeGeometry} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#E2E8F0"
            roughness={0.10}
            metalness={0.96}
            clearcoat={1.0}
            clearcoatRoughness={0.04}
            reflectivity={1.0}
            envMapIntensity={2.4}
          />
        </mesh>

        {/* Front Shield Face Plate (High-Res VCE Crest) */}
        <mesh geometry={frontFaceGeometry} position={[0, 0, 0.142]}>
          <meshPhysicalMaterial
            map={frontTexture}
            transparent
            alphaTest={0.02}
            roughness={0.16}
            metalness={0.35}
            clearcoat={0.95}
            clearcoatRoughness={0.06}
            reflectivity={0.9}
            envMapIntensity={1.8}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Back Shield Face Plate (Readable VCE Crest) */}
        <mesh geometry={backFaceGeometry} position={[0, 0, -0.142]} rotation={[0, Math.PI, 0]}>
          <meshPhysicalMaterial
            map={backTexture}
            transparent
            alphaTest={0.02}
            roughness={0.16}
            metalness={0.35}
            clearcoat={0.95}
            clearcoatRoughness={0.06}
            reflectivity={0.9}
            envMapIntensity={1.8}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Perimeter Glowing Electric Sapphire Rim Trim */}
        <lineLoop geometry={contourLineGeometry} position={[0, 0, 0.143]}>
          <lineBasicMaterial color="#38BDF8" linewidth={2} transparent opacity={0.7} />
        </lineLoop>
        <lineLoop geometry={contourLineGeometry} position={[0, 0, -0.143]}>
          <lineBasicMaterial color="#38BDF8" linewidth={2} transparent opacity={0.7} />
        </lineLoop>

        {/* Outer Liquid Silver Orbital Ring */}
        <mesh ref={outerGimbalRef}>
          <torusGeometry args={[1.72, 0.032, 16, 96]} />
          <meshPhysicalMaterial
            color="#F1F5F9"
            roughness={0.08}
            metalness={0.98}
            clearcoat={1.0}
            envMapIntensity={2.4}
          />
        </mesh>

        {/* Inner Electric Sapphire Laser Gimbal */}
        <mesh ref={innerGimbalRef}>
          <torusGeometry args={[1.44, 0.022, 16, 80]} />
          <meshStandardMaterial
            color="#0284C7"
            emissive="#38BDF8"
            emissiveIntensity={1.6}
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>

        {/* Equatorial Laser Tick Horizon */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.92, 1.94, 64]} />
          <meshBasicMaterial
            color="#38BDF8"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ========================================================
          2. GROUND COLLIMATOR PEDESTAL (Graphite & Sapphire)
          ======================================================== */}
      <group position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Monolithic Graphite Base Disc */}
        <mesh receiveShadow>
          <circleGeometry args={[2.7, 64]} />
          <meshStandardMaterial
            color="#080C16"
            roughness={0.28}
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
            emissiveIntensity={2.4}
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
    </group>
  );
};

export default KineticArtifact;
