import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Shield, Clock, Send, Check } from 'lucide-react';

export const WhatsAppSupport: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if we are on the guest-facing invitation view page or check-in scanner
  const isInvitationPage = location.pathname.startsWith('/invite/');
  const isCheckinPage = location.pathname.startsWith('/checkin/');
  
  if (isInvitationPage || isCheckinPage) {
    return null;
  }

  const handleOpenWhatsApp = (number: string) => {
    const text = encodeURIComponent("Olá! Preciso de suporte com a plataforma InoEvents.");
    window.open(`https://wa.me/244${number}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      
      {/* Expanding Support Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-[320px] bg-white/95 border border-slate-100 shadow-2xl rounded-3xl p-5 mb-1 relative overflow-hidden backdrop-blur-xl"
          >
            {/* Ambient top status glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                    Suporte Online
                  </span>
                </div>
                <h4 className="text-base font-serif font-black text-slate-800 mt-1">
                  Canais de Suporte
                </h4>
                <p className="text-[11px] text-slate-400">
                  Fale com a nossa equipa via WhatsApp
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors shadow-sm outline-none cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Support Channels */}
            <div className="space-y-2.5 mb-4">
              {/* Channel 1 */}
              <button
                onClick={() => handleOpenWhatsApp('952815430')}
                className="w-full bg-emerald-50 hover:bg-emerald-100/80 text-emerald-950 border border-emerald-100 rounded-2xl p-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M12.031 2c-5.516 0-9.988 4.471-9.988 9.987 0 1.763.459 3.483 1.33 5.001L2 22l5.186-1.359c1.464.798 3.1 1.218 4.84 1.218 5.515 0 9.986-4.471 9.986-9.987a9.923 9.923 0 00-2.924-7.062A9.921 9.921 0 0012.031 2zm5.787 14.414c-.249.702-1.245 1.284-1.733 1.347-.478.061-.947.288-3.056-.543-2.541-1.002-4.168-3.585-4.295-3.753-.126-.167-1.026-1.365-1.026-2.604s.652-1.85.883-2.09c.231-.24.502-.302.67-.302.167 0 .334.001.48.009.155.008.363-.058.568.441.21.512.719 1.748.782 1.874.063.126.105.272.021.439-.084.167-.168.272-.252.376-.084.105-.177.219-.252.302-.084.105-.172.21-.073.376.099.168.442.729.948 1.18.653.58 1.203.76 1.371.843.168.084.267.073.368-.042.101-.115.439-.512.557-.689.117-.178.236-.146.398-.087.163.06 1.031.486 1.208.575.178.089.296.131.338.204.043.073.043.424-.206 1.126z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider leading-none">
                      Canal 1 • Principal
                    </span>
                    <span className="text-xs font-black text-emerald-950 mt-1 block">
                      +244 952 815 430
                    </span>
                  </div>
                </div>
                <Send size={14} className="text-emerald-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Channel 2 */}
              <button
                onClick={() => handleOpenWhatsApp('939384315')}
                className="w-full bg-teal-50 hover:bg-teal-100/80 text-teal-950 border border-teal-100 rounded-2xl p-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/10">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M12.031 2c-5.516 0-9.988 4.471-9.988 9.987 0 1.763.459 3.483 1.33 5.001L2 22l5.186-1.359c1.464.798 3.1 1.218 4.84 1.218 5.515 0 9.986-4.471 9.986-9.987a9.923 9.923 0 00-2.924-7.062A9.921 9.921 0 0012.031 2zm5.787 14.414c-.249.702-1.245 1.284-1.733 1.347-.478.061-.947.288-3.056-.543-2.541-1.002-4.168-3.585-4.295-3.753-.126-.167-1.026-1.365-1.026-2.604s.652-1.85.883-2.09c.231-.24.502-.302.67-.302.167 0 .334.001.48.009.155.008.363-.058.568.441.21.512.719 1.748.782 1.874.063.126.105.272.021.439-.084.167-.168.272-.252.376-.084.105-.177.219-.252.302-.084.105-.172.21-.073.376.099.168.442.729.948 1.18.653.58 1.203.76 1.371.843.168.084.267.073.368-.042.101-.115.439-.512.557-.689.117-.178.236-.146.398-.087.163.06 1.031.486 1.208.575.178.089.296.131.338.204.043.073.043.424-.206 1.126z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] text-teal-800 font-bold block uppercase tracking-wider leading-none">
                      Canal 2 • Adjunto
                    </span>
                    <span className="text-xs font-black text-teal-950 mt-1 block">
                      +244 939 384 315
                    </span>
                  </div>
                </div>
                <Send size={14} className="text-teal-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            {/* Bottom meta details */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50 pt-3">
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-slate-400" />
                <span>08h às 22h (GMT+1)</span>
              </span>
              <span className="flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <Shield size={10} />
                <span>Suporte Oficial</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip / Speech bubble */}
      <AnimatePresence>
        {isHovered && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-white/95 backdrop-blur-md border border-slate-100 shadow-xl shadow-slate-900/5 px-4 py-2.5 rounded-2xl flex items-center gap-2 pointer-events-auto mb-1"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <p className="text-xs font-semibold text-slate-800 whitespace-nowrap">
              Precisa de ajuda? Fale connosco!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', delay: 0.5 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-105 active:scale-95 flex items-center justify-center transition-all cursor-pointer outline-none select-none relative group border border-emerald-400/20"
      >
        {/* Subtle radiating pulse */}
        <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping group-hover:animate-none opacity-75" />
        
        {/* Official WhatsApp SVG Icon */}
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" className="w-6.5 h-6.5 z-10 transition-transform group-hover:scale-110">
          <path d="M12.031 2c-5.516 0-9.988 4.471-9.988 9.987 0 1.763.459 3.483 1.33 5.001L2 22l5.186-1.359c1.464.798 3.1 1.218 4.84 1.218 5.515 0 9.986-4.471 9.986-9.987a9.923 9.923 0 00-2.924-7.062A9.921 9.921 0 0012.031 2zm5.787 14.414c-.249.702-1.245 1.284-1.733 1.347-.478.061-.947.288-3.056-.543-2.541-1.002-4.168-3.585-4.295-3.753-.126-.167-1.026-1.365-1.026-2.604s.652-1.85.883-2.09c.231-.24.502-.302.67-.302.167 0 .334.001.48.009.155.008.363-.058.568.441.21.512.719 1.748.782 1.874.063.126.105.272.021.439-.084.167-.168.272-.252.376-.084.105-.177.219-.252.302-.084.105-.172.21-.073.376.099.168.442.729.948 1.18.653.58 1.203.76 1.371.843.168.084.267.073.368-.042.101-.115.439-.512.557-.689.117-.178.236-.146.398-.087.163.06 1.031.486 1.208.575.178.089.296.131.338.204.043.073.043.424-.206 1.126z" />
        </svg>

        {/* Micro active indicator badge */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-400 border-2 border-white rounded-full z-20 flex items-center justify-center">
          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse" />
        </span>
      </motion.button>
    </div>
  );
};

