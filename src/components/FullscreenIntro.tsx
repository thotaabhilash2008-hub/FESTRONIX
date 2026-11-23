import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, ArrowRight, Play, Loader2 } from 'lucide-react';

interface FullscreenIntroProps {
  isOpen: boolean;
  onFinish: () => void;
}

// Determines if device is in portrait orientation (phones/tablets in portrait)
// versus landscape (desktops, laptops, horizontal tablets/phones)
const getIntroVideoSrc = (): string => {
  if (typeof window === 'undefined') return '/intro_final2.mp4';

  const width = window.innerWidth;
  const height = window.innerHeight;

  // Portrait mode: height > width, or standard portrait media query
  const isPortrait = height > width ||
    (window.matchMedia && window.matchMedia('(orientation: portrait)').matches);

  if (isPortrait) {
    return '/intro_mobile.mp4';
  }

  // Desktop landscape devices
  return '/intro_final2.mp4';
};

export const FullscreenIntro: React.FC<FullscreenIntroProps> = ({
  isOpen,
  onFinish
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoSrc, setVideoSrc] = useState<string>(getIntroVideoSrc);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

  // Dynamically update source if screen orientation or viewport changes
  useEffect(() => {
    const handleResize = () => {
      const nextSrc = getIntroVideoSrc();
      setVideoSrc(prev => (prev !== nextSrc ? nextSrc : prev));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Safe play helper that handles iOS/Android autoplay policy & power saving mode
  const attemptPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Explicitly enforce muted on the DOM element for mobile autoplay eligibility
    video.muted = isMuted;
    video.defaultMuted = isMuted;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsAutoplayBlocked(false);
          setIsLoading(false);
        })
        .catch(err => {
          console.warn("Autoplay requires user interaction:", err);
          setIsAutoplayBlocked(true);
          setIsLoading(false);
        });
    }
  }, [isMuted]);

  useEffect(() => {
    if (!isOpen) return;

    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      if (video.currentTime > 0) {
        try {
          video.currentTime = 0;
        } catch {
          // ignore
        }
      }
      attemptPlay();
    }

    // Complete scroll lock for body & html on mobile and desktop
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const preventDefaultTouch = (e: TouchEvent) => {
      // Allow button and interactable taps
      if ((e.target as HTMLElement)?.closest('button, .intro-interactive')) {
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
  }, [isOpen, videoSrc, attemptPlay]);

  if (!isOpen) return null;

  // Immediately enters the main Festronix site
  const handleEnterFestronix = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // ignore
      }
    }
    onFinish();
  };

  const handleEnded = () => {
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // ignore
      }
    }
    onFinish();
  };

  const toggleSound = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      const nextMuted = !video.muted;
      video.muted = nextMuted;
      setIsMuted(nextMuted);
      // If paused or autoplay blocked, this click gesture unlocks audio & plays!
      if (video.paused || isAutoplayBlocked) {
        video.play().then(() => {
          setIsPlaying(true);
          setIsAutoplayBlocked(false);
          setIsLoading(false);
        }).catch(console.error);
      }
    }
  };

  // Tapping anywhere on the container or play button initiates playback
  const handleContainerTap = () => {
    const video = videoRef.current;
    if (video && (video.paused || isAutoplayBlocked)) {
      video.play().then(() => {
        setIsPlaying(true);
        setIsAutoplayBlocked(false);
        setIsLoading(false);
      }).catch(console.error);
    }
  };

  return (
    <div
      onClick={handleContainerTap}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        minHeight: '100dvh',
        zIndex: 999999,
        backgroundColor: '#000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        overscrollBehavior: 'none',
        cursor: isAutoplayBlocked ? 'pointer' : 'default'
      }}
    >
      {/* Fullscreen Video (intro_mobile.mp4 for portrait mobile, intro_final2.mp4 for desktop/landscape) */}
      <video
        ref={videoRef}
        key={videoSrc}
        src={videoSrc}
        autoPlay
        playsInline
        muted={isMuted}
        preload="auto"
        onPlay={() => {
          setIsPlaying(true);
          setIsAutoplayBlocked(false);
          setIsLoading(false);
        }}
        onPlaying={() => {
          setIsPlaying(true);
          setIsAutoplayBlocked(false);
          setIsLoading(false);
        }}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => {
          setIsLoading(false);
          attemptPlay();
        }}
        onEnded={handleEnded}
        onError={(err) => {
          console.error("Intro video loading error:", err);
          setIsLoading(false);
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />

      {/* Buffering Loader Spinner */}
      {isLoading && !isPlaying && (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            color: '#38BDF8',
            zIndex: 15,
            pointerEvents: 'none'
          }}
        >
          <Loader2 size={36} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.85rem', color: '#CBD5E1', letterSpacing: '0.08em', fontWeight: 600 }}>
            LOADING FESTRONIX...
          </span>
        </div>
      )}

      {/* Tap to Play Overlay (if browser policy or Low Power Mode blocked unprompted autoplay) */}
      {isAutoplayBlocked && (
        <div
          className="intro-interactive"
          onClick={handleContainerTap}
          style={{
            position: 'absolute',
            zIndex: 25,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            cursor: 'pointer',
            padding: '24px',
            background: 'rgba(8, 9, 13, 0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '24px',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 0 50px rgba(56, 189, 248, 0.25)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1C2B59 0%, #38BDF8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(56, 189, 248, 0.6)'
            }}
          >
            <Play size={28} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: '3px' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#F3F0EA', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.02em' }}>
              Tap to Play Intro Video
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '4px' }}>
              Experience Festronix 2026
            </div>
          </div>
        </div>
      )}

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
          className="intro-interactive"
          aria-label={isMuted ? 'Turn Sound On' : 'Mute Sound'}
          style={{
            background: 'rgba(16, 26, 53, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(120, 149, 147, 0.45)',
            color: '#DCE3E5',
            borderRadius: '9999px',
            padding: '10px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            transition: 'all 0.2s ease',
            fontFamily: "'Space Grotesk', sans-serif",
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#38BDF8';
            e.currentTarget.style.color = '#38BDF8';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(120, 149, 147, 0.45)';
            e.currentTarget.style.color = '#DCE3E5';
          }}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span>{isMuted ? 'Sound' : 'Mute'}</span>
        </button>

        {/* Enter Festronix / Skip button */}
        <button
          onClick={handleEnterFestronix}
          className="intro-interactive"
          style={{
            background: 'linear-gradient(135deg, #283B78 0%, #3B539C 50%, #4B63AA 100%)',
            border: '1px solid rgba(220, 227, 229, 0.35)',
            color: '#FFFFFF',
            borderRadius: '9999px',
            padding: '12px 24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            fontWeight: 800,
            letterSpacing: '0.03em',
            boxShadow: '0 0 30px rgba(40, 59, 120, 0.65), 0 10px 30px rgba(0, 0, 0, 0.7)',
            transition: 'all 0.25s ease',
            justifyContent: 'center',
            fontFamily: "'Space Grotesk', sans-serif",
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 0 45px rgba(56, 189, 248, 0.6), 0 14px 36px rgba(0, 0, 0, 0.8)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(40, 59, 120, 0.65), 0 10px 30px rgba(0, 0, 0, 0.7)';
          }}
        >
          <span>Enter Festronix</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
