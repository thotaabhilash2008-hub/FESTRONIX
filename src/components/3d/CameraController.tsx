import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  intensity?: number;
  damping?: number;
  reducedMotion?: boolean;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  intensity = 0.5,
  damping = 0.05,
  reducedMotion = false
}) => {
  const { camera, pointer } = useThree();
  const targetPos = useRef(new THREE.Vector3());

  useFrame(() => {
    if (reducedMotion) return;

    // Target position calculation based on normalized pointer [-1, 1]
    const targetX = pointer.x * intensity;
    const targetY = pointer.y * intensity;

    targetPos.current.set(targetX, targetY, camera.position.z);
    camera.position.lerp(targetPos.current, damping);
    camera.lookAt(0, 0, 0);
  });

  return null;
};
