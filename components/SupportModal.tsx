import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Shield, Clock } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan?: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, userPlan }) => {
  const isBusiness = userPlan === "Business" || userPlan === "Corporate";

  const handleOpenWhatsApp = (number: string) => {
    const text = encodeURIComponent("Olá! Preciso de suporte com a plataforma InoEvents.");
    window.open(`https://wa.me/244${number}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-2xl z-10 overflow-hidden"
          >
            {/* Ambient Top Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Suporte Imediato
                </span>
                <h3 className="text-xl font-serif font-black text-slate-800 mt-2.5">
                  Falar com o Suporte
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione um dos nossos agentes disponíveis para lhe atender.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors shadow-sm"
              >
                <X size={16} />
              </button>
            </div>

            {/* Badges/Info */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 flex items-center gap-2">
                <Clock size={14} className="text-emerald-500" />
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wide">Resposta</span>
                  <span className="text-xs font-bold text-slate-700 truncate block">Em minutos</span>
                </div>
              </div>
              <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 flex items-center gap-2">
                <Shield size={14} className="text-brand-blue" />
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wide">Garantia</span>
                  <span className="text-xs font-bold text-slate-700 truncate block">Apoio VIP</span>
                </div>
              </div>
            </div>

            {/* Agent Options */}
            <div className="space-y-3">
              <button 
                onClick={() => handleOpenWhatsApp('952815430')}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 px-5 font-bold text-sm transition-all duration-200 flex items-center justify-between shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 text-left select-none cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                    <MessageSquare size={18} className="animate-pulse text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-100 block font-bold uppercase tracking-wider">{isBusiness ? "Gestor de Conta Dedicado" : "Agente Principal"}</span>
                    <span className="font-bold text-sm text-white">+244 952 815 430</span>
                  </div>
                </div>
                <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wide">
                  Canal 1
                </span>
              </button>

              <button 
                onClick={() => handleOpenWhatsApp('939384315')}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 px-5 font-bold text-sm transition-all duration-200 flex items-center justify-between shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 text-left select-none cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                    <MessageSquare size={18} className="animate-pulse text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-100 block font-bold uppercase tracking-wider">Agente Adjunto</span>
                    <span className="font-bold text-sm text-white">+244 939 384 315</span>
                  </div>
                </div>
                <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wide">
                  Canal 2
                </span>
              </button>
            </div>

            {/* Footer notice */}
            <p className="text-[10px] text-slate-400 text-center font-medium mt-6">
              Nosso atendimento está disponível das 08h às 22h (GMT+1).
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
