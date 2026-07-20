import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        onPlay={() => { setIsPlaying(true); setIsBlocked(false); }}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      <AnimatePresence>
        {isBlocked && !isPlaying && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[10000]"
          >
            <button 
              onClick={togglePlay}
              className="bg-brand-gold text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined">play_circle</span>
              Tocar Música do Convite
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed top-12 right-5 z-40 animate-fade-in-down">
        <motion.button 
          onClick={togglePlay}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            flex items-center gap-2 pl-3 pr-4 py-2 
            backdrop-blur-md border rounded-full shadow-lg transition-all
            ${isDark 
              ? 'bg-surface-dark/90 border-white/10 text-white' 
              : 'bg-white/90 border-primary/20 text-slate-800'}
          `}
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-blue/20 text-brand-blue animate-pulse">
            <span className="material-symbols-outlined text-lg">
              {isPlaying ? 'pause' : 'music_note'}
            </span>
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-semibold tracking-wide uppercase opacity-70">
              Convite Interativo
            </span>
            <span className="text-[10px] font-bold truncate max-w-[90px]">
              {isPlaying ? 'Tocando...' : 'Ouvir Música'}
            </span>
          </div>
        </motion.button>
      </div>
    </>
  );
};