import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const Festronix3DLogo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let model: THREE.Object3D | null = null;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const fov = 28;
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Studio Environment Map for Realistic Chrome Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTexture;

    // Lighting (Cinematic Chrome Studio Lighting)
    // 1. Ambient baseline
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // 2. Direct Front Light (ensures chrome letter faces are bright, sharp & legible)
    const frontLight = new THREE.DirectionalLight(0xffffff, 4.5);
    frontLight.position.set(0, 2, 8);
    scene.add(frontLight);

    // 3. Top-Left Warm Gold Sunlight
    const goldSunLight = new THREE.DirectionalLight(0xffe57f, 3.8);
    goldSunLight.position.set(-6, 7, 5);
    scene.add(goldSunLight);

    // 4. Bottom-Right Vibrant Violet Rim (matching intro video bevels)
    const violetLight = new THREE.DirectionalLight(0xa855f7, 5.5);
    violetLight.position.set(6, -5, 4);
    scene.add(violetLight);

    // 5. Back Edge Rim Light
    const backRim = new THREE.DirectionalLight(0x93c5fd, 2.5);
    backRim.position.set(0, 5, -6);
    scene.add(backRim);

    // 6. Interactive Cursor point light for specular shine
    const cursorLight = new THREE.PointLight(0xfff7d6, 5.0, 18);
    cursorLight.position.set(0, 1, 5);
    scene.add(cursorLight);

    // Camera Auto-Fit
    const fitCamera = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const currentAspect = width / height;

      camera.aspect = currentAspect;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      // Model bounding box: Width ~8.0, Height ~0.95
      const fovRad = (camera.fov * Math.PI) / 180;
      const halfFovTan = Math.tan(fovRad / 2);
      
      // Target visible span
      const targetWidth = 8.3;
      const targetHeight = 1.35;

      const distForWidth = (targetWidth / currentAspect) / (2 * halfFovTan);
      const distForHeight = targetHeight / (2 * halfFovTan);
      const distance = Math.max(distForWidth, distForHeight, 5.8);

      camera.position.set(0, 0, distance);
      camera.lookAt(0, 0, 0);
    };

    fitCamera();

    // Load 3D GLB Model
    const loader = new GLTFLoader();
    loader.load(
      '/FESTRONIX_3D_Chrome.glb',
      gltf => {
        model = gltf.scene;

        // Center pivot offset
        model.position.set(0, 0, -0.1);

        // Enhance chrome metallic material
        model.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const chromeMaterial = new THREE.MeshStandardMaterial({
              color: new THREE.Color(0xffffff),
              metalness: 0.94,
              roughness: 0.12,
              envMapIntensity: 2.4,
              emissive: new THREE.Color(0x1a0f2e),
              emissiveIntensity: 0.25
            });

            mesh.material = chromeMaterial;
          }
        });

        scene.add(model);
        setIsLoaded(true);
      },
      undefined,
      err => {
        console.error('Error loading 3D Festronix logo:', err);
      }
    );

    // Mouse Tracking
    let targetRotY = 0;
    let targetRotX = 0;
    let currentRotY = 0;
    let currentRotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const nx = (x - 0.5) * 2;
      const ny = (y - 0.5) * 2;

      targetRotY = nx * 0.18;
      targetRotX = -ny * 0.12;

      // Position specular cursor light
      cursorLight.position.x = nx * 5.0;
      cursorLight.position.y = -ny * 2.5 + 0.5;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', fitCamera);

    // Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Smooth lerp towards mouse position
      currentRotY += (targetRotY - currentRotY) * 0.08;
      currentRotX += (targetRotX - currentRotX) * 0.08;

      if (model) {
        // Idle gentle float & breathing
        const hoverY = Math.sin(elapsed * 1.5) * 0.05;
        const idleSway = Math.cos(elapsed * 1.0) * 0.02;

        model.position.y = hoverY;
        model.rotation.y = currentRotY + idleSway;
        model.rotation.x = currentRotX;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', fitCamera);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      pmremGenerator.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1050px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Dynamic Backlight Halo */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          height: '180px',
          background: 'radial-gradient(ellipse 65% 45% at 50% 50%, rgba(255, 215, 0, 0.28) 0%, rgba(168, 85, 247, 0.2) 40%, transparent 75%)',
          filter: 'blur(32px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Screen Reader and SEO Heading */}
      <h1
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        FESTRONIX 2026 — National Level Technical Fest
      </h1>

      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(160px, 25vw, 260px)',
          cursor: 'grab',
          zIndex: 1,
          opacity: isLoaded ? 1 : 0.2,
          transition: 'opacity 0.4s ease',
          filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.8))'
        }}
      />
    </div>
  );
};
