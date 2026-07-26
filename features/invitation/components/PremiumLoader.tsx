import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PERSUASIVE_LOADER_MESSAGES = [
  "Preparando uma experiência digital sublime...",
  "InoEvents: Crie convites interativos que encantam desde o primeiro toque.",
  "Rastreador inteligente de presença, mapas integrados e contagem regressiva em tempo real.",
  "Diga adeus aos convites de papel. Adote a alta costura digital com designs exclusivos.",
  "Lista de presentes elegante, dress code interativo e galeria de fotos integradas.",
  "Sua história de amor merece um design impecável. Crie e publique o seu em poucos minutos!",
];

export const PremiumLoader: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % PERSUASIVE_LOADER_MESSAGES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden relative">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[12000ms]" />

      <div className="z-10 flex flex-col items-center max-w-lg text-center px-4">
        {/* Glowing breathing & rotating outer ring */}
        <div className="relative w-24 h-24 mb-10 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border border-violet-500/20"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-t-2 border-r-2 border-violet-400"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-4 rounded-full border border-rose-400/30"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          />
          {/* Inner sparkling center */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-rose-400 opacity-80 blur-[4px] animate-pulse" />
        </div>

        {/* Premium Badge */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20 mb-6 backdrop-blur-md">
          InoEvents Premium
        </span>

        {/* Persuasive message carousel */}
        <div className="h-24 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-lg md:text-xl font-light text-slate-100 leading-relaxed font-sans max-w-md antialiased"
            >
              {PERSUASIVE_LOADER_MESSAGES[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Subtitle helper */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-[11px] uppercase tracking-wider text-slate-400 mt-12 animate-pulse"
        >
          Carregando convite interativo...
        </motion.p>

        {/* Brand foot credit */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <span className="text-xs text-slate-400">Criado com</span>
          <span className="text-xs font-semibold bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent tracking-wider">
            InoEvents
          </span>
        </div>
      </div>
    </div>
  );
};
