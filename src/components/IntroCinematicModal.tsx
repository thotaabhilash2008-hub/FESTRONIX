import React, { useState, useRef, useEffect } from 'react';
import { Play, Volume2, VolumeX, X, Maximize2, Sparkles, ArrowRight } from 'lucide-react';

interface IntroCinematicModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialGreeting?: boolean;
}

export const IntroCinematicModal: React.FC<IntroCinematicModalProps> = ({
  isOpen,
  onClose,
  isInitialGreeting = false
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.log("Autoplay was prevented, waiting for user click", err);
      });
      setIsPlaying(true);
    }

    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 11;
      setProgress((current / total) * 100);
      setDuration(total);
    }
  };

  const handleVideoEnded = () => {
    onClose();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div 
      className="modal-backdrop" 
      style={{ 
        zIndex: 9999, 
        backgroundColor: 'rgba(3, 5, 14, 0.96)', 
        padding: '16px' 
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '1100px',
          background: '#030e26',
          border: '1px solid rgba(0, 140, 255, 0.45)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(0, 140, 255, 0.35), 0 0 80px rgba(0, 210, 255, 0.25)',
          position: 'relative'
        }}
      >
        {/* Top Header Bar */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 22px',
            borderBottom: '1px solid rgba(0, 140, 255, 0.25)',
            background: 'rgba(3, 14, 38, 0.92)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span 
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#00D2FF',
                boxShadow: '0 0 10px #00D2FF'
              }}
            />
            <span className="font-display" style={{ fontSize: '0.88rem', color: '#00D2FF', letterSpacing: '0.08em' }}>
              FESTRONIX 2026 // OFFICIAL CINEMATIC INTRO
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '6px' }}>
              Vardhaman College of Engineering
            </span>
          </div>

          <button
            onClick={onClose}
            className="btn-cyber-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            {isInitialGreeting ? (
              <>
                <span>Enter Festronix</span>
                <ArrowRight size={14} />
              </>
            ) : (
              <>
                <X size={16} />
                <span>Close</span>
              </>
            )}
          </button>
        </div>

        {/* Video Player Container */}
        <div style={{ position: 'relative', width: '100%', backgroundColor: '#000', aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            src="/intro_final2.mp4"
            autoPlay
            playsInline
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />

          {/* Video Floating Controls Overlay */}
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '24px 20px 16px',
              background: 'linear-gradient(to top, rgba(2,7,20,0.95) 0%, rgba(2,7,20,0.4) 70%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Progress Bar */}
            <div 
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div 
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00D2FF, #0077FF)',
                  boxShadow: '0 0 10px #00D2FF'
                }}
              />
            </div>

            {/* Bottom Controls Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  onClick={togglePlay}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(0, 140, 255, 0.4)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Play size={16} fill={isPlaying ? '#00D2FF' : 'none'} color="#00D2FF" />
                  <span style={{ fontSize: '0.8rem' }}>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  onClick={toggleMute}
                  style={{
                    background: isMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 140, 255, 0.15)',
                    border: `1px solid ${isMuted ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 210, 255, 0.4)'}`,
                    color: isMuted ? '#f87171' : '#38BDF8',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  <span>{isMuted ? 'Unmute Audio 🔊' : 'Audio On'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={toggleFullscreen}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '6px'
                  }}
                  title="Fullscreen"
                >
                  <Maximize2 size={18} />
                </button>

                <button
                  onClick={onClose}
                  className="btn-cyber-primary"
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                >
                  <span>Skip Intro & Enter</span>
                  <Sparkles size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
