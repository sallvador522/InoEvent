import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Glow ambient background elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-64 h-64 bg-[#DFB135]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full flex flex-col items-center">
        {/* Animated Badge */}
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-3 py-1 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6 shadow-sm"
        >
          Erro 404
        </motion.span>

        {/* Large Styled "404" Title */}
        <div className="relative mb-6">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="text-9xl font-black text-slate-900 tracking-tighter"
          >
            404
          </motion.h1>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[#DFB135] rounded-full" />
        </div>

        {/* Description */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl font-extrabold text-slate-800 tracking-tight mb-3"
        >
          Página Não Encontrada
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm text-slate-500 leading-relaxed mb-10 max-w-xs"
        >
          A página que procura não existe, foi removida ou você não possui permissão para aceder.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 w-full"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 px-6 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
          >
            <ArrowLeft size={14} />
            Voltar
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 px-6 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-900/10 active:scale-98"
          >
            <Home size={14} />
            Início
          </button>
        </motion.div>
      </div>
    </div>
  );
};
