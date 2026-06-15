import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TocaPlayerProps {
  trackName: string;
  isDark?: boolean;
}

export const TocaPlayer: React.FC<TocaPlayerProps> = ({ trackName, isDark = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    let interactionListenersActive = false;

    // Helper functions for gesture listener
    const playOnGesture = () => {
      if (audio) {
        audio.play()
          .then(() => {
            setIsPlaying(true);
            cleanupGestureListeners();
          })
          .catch((err) => {
            console.log("Play on gesture failed:", err);
          });
      }
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

    if (trackName && (trackName.startsWith('http') || trackName.startsWith('data:audio'))) {
      audio = new Audio(trackName);
      audio.loop = true;
      audioRef.current = audio;

      // 1. Try playing immediately (Autoplay)
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.log("Autoplay locked by browser policy. Falling back to gesture listeners...", error);
          setIsPlaying(false);
          
          // 2. Add standard event listeners as dynamic backup fallback
          document.addEventListener('click', playOnGesture, { once: true });
          document.addEventListener('touchstart', playOnGesture, { once: true });
          document.addEventListener('scroll', playOnGesture, { once: true });
          document.addEventListener('keydown', playOnGesture, { once: true });
          interactionListenersActive = true;
        });
    } else {
      audioRef.current = null;
      setIsPlaying(false);
    }

    return () => {
      cleanupGestureListeners();
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [trackName]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Playback failed", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!trackName) return null;

  return (
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
  );
};