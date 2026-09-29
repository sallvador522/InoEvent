import React from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, X, Sparkles, CalendarHeart, Gift } from 'lucide-react';

interface Props {
  name: string;
  onClose: () => void;
  onCreateEvent: () => void;
  onViewPlans: () => void;
}

/**
 * Modal de boas-vindas pós-cadastro (e-mail + Google).
 * Exibido 1x no dashboard quando a navegação traz `state.justRegistered`.
 * O pai (UserDashboard) decide a prioridade vs OnboardingWizard/promo.
 */
export const WelcomeModal: React.FC<Props> = ({ name, onClose, onCreateEvent, onViewPlans }) => {
  const firstName = (name || '').trim().split(' ')[0] || 'bem-vindo(a)';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Bem-vindo à InoEvents">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 md:p-8 text-center overflow-hidden border border-slate-100"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C5A028] via-[#e8c766] to-[#C5A028]" />
        <button
          onClick={onClose}
          aria-label="Fechar boas-vindas"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>

        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
          <PartyPopper size={30} className="text-brand-blue" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-blue mb-2">
          Conta criada com sucesso
        </p>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-2">
          Bem-vindo(a), {firstName}!
        </h2>

        {/* Faixa promo — 1º evento grátis */}
        <div className="mb-4 rounded-2xl border border-[#C5A028]/40 bg-gradient-to-br from-amber-50 to-orange-50 p-4 relative overflow-hidden">
          <span className="inline-flex items-center gap-1.5 bg-[#C5A028] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 shadow-sm">
            <Gift size={12} /> Promoção de boas-vindas
          </span>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            Estamos em promoção! Criar o teu <strong>primeiro evento é totalmente grátis</strong> —
            convite Premium com RSVP até 50 convidados, QR de check-in, galeria e música, sem pagar nada.
          </p>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          A tua conta InoEvents está pronta. Aproveita a promoção e cria o teu convite digital em minutos — sem cartão, sem complicação.
        </p>

        <button
          onClick={onCreateEvent}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 mb-2"
        >
          <CalendarHeart size={16} /> Criar o meu 1º evento grátis
        </button>
        <button
          onClick={onViewPlans}
          className="w-full h-12 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles size={16} /> Ver planos
        </button>
        <button
          onClick={onClose}
          className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 cursor-pointer"
        >
          Explorar o painel primeiro
        </button>
      </motion.div>
    </div>
  );
};
