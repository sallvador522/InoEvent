import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { logger } from '../../lib/logger';

interface TocaPlayerProps {
  trackName: string;
  isDark?: boolean;
}

export const TocaPlayer: React.FC<TocaPlayerProps> = ({ trackName, isDark = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Determine the actual URL/path to play
  const getAudioUrl = () => {
    if (!trackName || trackName === "" || trackName === "romantic_piano.mp3" || trackName === "romantic") {
      // Default fallback music
      return '/audio/oracao_do_amor.m4a';
    }
    if (trackName === 'none' || trackName === 'No Music') {
      return null;
    }
    // If it's a direct URL, base64 data, or custom path
    if (trackName.startsWith('http') || trackName.startsWith('data:') || trackName.startsWith('/')) {
      return trackName;
    }
    // Default fallback for any other chosen names
    return '/audio/oracao_do_amor.m4a';
  };

  const audioUrl = getAudioUrl();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let interactionListenersActive = false;

    // Helper functions for gesture listener
    const playOnGesture = () => {
      audio.play()
        .then(() => {
          logger.success("Playback started successfully via gesture.", { category: 'SYSTEM' });
          setIsBlocked(false);
          cleanupGestureListeners();
        })
        .catch((err) => {
          logger.error("Play on gesture failed:", { category: 'SYSTEM', data: err });
        });
    };

    const cleanupGestureListeners = () => {
      if (interactionListenersActive) {
        document.removeEventListener('click', playOnGesture);
        document.removeEventListener('touchstart', playOnGesture);
        document.removeEventListener('scroll', playOnGesture);
        document.removeEventListener('keydown', playOnGesture);
        interactionListenersActive = false;
      }
    };

    // 1. Try playing immediately (Autoplay)
    audio.play()
      .then(() => {
        logger.success("Autoplay succeeded.", { category: 'SYSTEM' });
        setIsBlocked(false);
      })
      .catch((error) => {
        logger.warn("Autoplay locked by browser policy. Falling back to gesture listeners...", { category: 'SYSTEM', data: error });
        setIsBlocked(true);
        
        // 2. Add standard event listeners as dynamic backup fallback
        document.addEventListener('click', playOnGesture, { once: true });
        document.addEventListener('touchstart', playOnGesture, { once: true });
        document.addEventListener('scroll', playOnGesture, { once: true });
        document.addEventListener('keydown', playOnGesture, { once: true });
        interactionListenersActive = true;
      });

    return () => {
      cleanupGestureListeners();
      audio.pause();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play()
          .then(() => setIsBlocked(false))
          .catch(e => logger.error("Playback failed", { category: 'SYSTEM', data: e }));
      }
    }
  };

  if (!audioUrl) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={audioUrl}
        loop
        preload="metadata"
        onPlay={() => { setIsPlaying(true); setIsBlocked(false); }}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      <div className="fixed top-12 right-5 z-40" style={{ top: 'max(3rem, calc(env(safe-area-inset-top) + 2rem))' }}>
        <motion.button
          onClick={togglePlay}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileTap={{ scale: 0.92 }}
          aria-pressed={isPlaying}
          aria-label={isPlaying ? "Pausar música do convite" : "Ouvir música do convite"}
          className={`
            flex items-center justify-center w-12 h-12 rounded-full shadow-lg cursor-pointer
            backdrop-blur-md border
            ${isDark
              ? 'bg-white/10 border-white/20 text-white'
              : 'bg-white/90 border-[#C5A028]/30 text-[#1B365D]'}
          `}
        >
          {isPlaying ? (
            <span className="flex items-end gap-[3px] h-4" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`w-[3px] rounded-full ${isDark ? 'bg-white' : 'bg-[#1B365D]'}`}
                  style={{
                    animation: `toca-eq 0.9s ease-in-out ${i * 0.18}s infinite alternate`,
                    height: '100%',
                    transformOrigin: 'bottom',
                  }}
                />
              ))}
            </span>
          ) : (
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              music_note
            </span>
          )}
        </motion.button>
      </div>
      <style>{`@keyframes toca-eq { from { transform: scaleY(0.25); } to { transform: scaleY(1); } }`}</style>
    </>
  );
};