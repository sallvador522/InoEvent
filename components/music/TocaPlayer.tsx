import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface TocaPlayerProps {
  trackName: string;
  isDark?: boolean;
}

export const TocaPlayer: React.FC<TocaPlayerProps> = ({ trackName, isDark = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="fixed top-12 right-5 z-40 animate-fade-in-down">
      <motion.button 
        onClick={() => setIsPlaying(!isPlaying)}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          flex items-center gap-2 pl-3 pr-4 py-2 
          backdrop-blur-md border rounded-full shadow-lg transition-all
          ${isDark 
            ? 'bg-surface-dark/90 border-white/10 text-white' 
            : 'bg-white/90 border-primary/20 text-gray-800'}
        `}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary animate-pulse">
          <span className="material-symbols-outlined text-lg">
            {isPlaying ? 'pause' : 'music_note'}
          </span>
        </div>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-semibold tracking-wide uppercase opacity-70">Música por TocaAI</span>
          {isPlaying && (
            <span className="text-[10px] font-bold truncate max-w-[80px]">{trackName}</span>
          )}
        </div>
      </motion.button>
    </div>
  );
};