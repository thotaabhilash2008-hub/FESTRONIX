import { useState, useEffect } from 'react';

/**
 * Hook to verify WebGL support on client devices.
 * Ensures graceful fallback if GPU/hardware acceleration is unavailable.
 */
export function useWebGLSupport(): { isSupported: boolean; isChecking: boolean } {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setIsSupported(Boolean(gl));
    } catch {
      setIsSupported(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { isSupported, isChecking };
}
