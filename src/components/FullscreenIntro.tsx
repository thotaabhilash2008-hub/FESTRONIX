import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';

interface FullscreenIntroProps {
  isOpen: boolean;
  onFinish: () => void;
}

export const FullscreenIntro: React.FC<FullscreenIntroProps> = ({
  isOpen,
  onFinish
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.log("Autoplay waiting for user gesture:", err);
      });
    }

    // Complete scroll lock for body & html on mobile and desktop
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const preventDefaultTouch = (e: TouchEvent) => {
      // Allow button taps
      if ((e.target as HTMLElement)?.closest('button')) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    window.addEventListener('touchmove', preventDefaultTouch, { passive: false });

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevBodyTouchAction;
      window.removeEventListener('touchmove', preventDefaultTouch);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Immediately enters the main Festronix site without freezing on the last frame
  const handleEnterFestronix = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onFinish();
  };

  const handleEnded = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onFinish();
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        minHeight: '100dvh',
        zIndex: 999999,
        backgroundColor: '#000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        overscrollBehavior: 'none'
      }}
    >
      {/* Fullscreen Video */}
      <video
        ref={videoRef}
        src="/intro_final2.mp4"
        autoPlay
        playsInline
        muted={isMuted}
        onEnded={handleEnded}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          pointerEvents: 'none'
        }}
      />

      {/* Bottom ambient gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '160px',
          background: 'linear-gradient(to top, rgba(2, 2, 6, 0.95) 0%, rgba(2, 2, 6, 0.4) 60%, transparent 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* Bottom right watermark mask */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '280px',
          height: '140px',
          background: 'radial-gradient(circle at bottom right, rgba(2, 2, 6, 0.98) 0%, rgba(2, 2, 6, 0.85) 50%, transparent 90%)',
          pointerEvents: 'none',
          zIndex: 8
        }}
      />

      {/* Bottom controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
          left: 'max(16px, env(safe-area-inset-left, 16px))',
          right: 'max(16px, env(safe-area-inset-right, 16px))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          zIndex: 20
        }}
      >
        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          style={{
            background: 'rgba(3, 14, 38, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 140, 255, 0.35)',
            color: '#E2E8F0',
            borderRadius: '9999px',
            padding: '10px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            transition: 'all 0.2s ease',
            fontFamily: "'Space Grotesk', sans-serif",
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#00D2FF';
            e.currentTarget.style.color = '#00D2FF';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(0, 140, 255, 0.35)';
            e.currentTarget.style.color = '#E2E8F0';
          }}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span>{isMuted ? 'Sound' : 'Mute'}</span>
        </button>

        {/* Enter Festronix button */}
        <button
          onClick={handleEnterFestronix}
          style={{
            background: 'linear-gradient(135deg, #00D2FF 0%, #0077FF 50%, #0051FF 100%)',
            border: 'none',
            color: '#020C1E',
            borderRadius: '9999px',
            padding: '12px 24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            fontWeight: 800,
            letterSpacing: '0.03em',
            boxShadow: '0 0 30px rgba(0, 210, 255, 0.65), 0 10px 30px rgba(0, 0, 0, 0.7)',
            transition: 'all 0.25s ease',
            justifyContent: 'center',
            fontFamily: "'Space Grotesk', sans-serif",
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 0 45px rgba(0, 210, 255, 0.9), 0 14px 36px rgba(0, 0, 0, 0.8)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 210, 255, 0.65), 0 10px 30px rgba(0, 0, 0, 0.7)';
          }}
        >
          <span>Enter Festronix</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
