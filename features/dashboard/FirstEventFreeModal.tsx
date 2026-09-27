import React from 'react';
import { motion } from 'framer-motion';
import { Gift, MessageSquare, X } from 'lucide-react';

/**
 * Boas-vindas + promo 1º evento GRÁTIS (Premium completo, via assistente).
 * Puramente informativo: a ativação acontece no WhatsApp + admin.
 * Props: nome do evento + handlers; o pai decide quando mostrar.
 */
interface Props {
  eventTitle: string;
  eventId: string;
  userUid: string;
  userEmail: string;
  onClose: () => void;
  onDismiss: () => void;
}

export const FirstEventFreeModal: React.FC<Props> = ({ eventTitle, eventId, userUid, userEmail, onClose, onDismiss }) => {
  const openAssistantWhatsApp = (number: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.inoevent.online';
    const msg =
      `Olá InoEvents! Quero a promo do PRIMEIRO EVENTO GRÁTIS 🎉\n\n` +
      `Evento: "${eventTitle}" (${eventId})\n` +
      `ID da Plataforma: ${userUid}\n` +
      `E-mail: ${userEmail || 'Não informado'}\n` +
      `Ver convite: ${origin}/invite/${eventId}\n\n` +
      `Aguardo a ativação aqui. Obrigado!`;
    window.open(`https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="relative w-full max-w-md bg-[#FFFDF8] rounded-3xl border border-[#C5A028]/40 shadow-2xl p-6 md:p-8 text-center overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C5A028] via-[#e8c766] to-[#C5A028]" />
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#C5A028]/15 border border-[#C5A028]/40 flex items-center justify-center">
          <Gift size={30} className="text-[#8a6d1c]" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a6d1c] mb-2">Bem-vindo à InoEvents</p>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#1B365D] leading-tight mb-2">
          O teu primeiro evento é <span className="italic text-[#8a6d1c]">totalmente grátis</span>
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-1">
          Ativamos <strong>"{eventTitle}"</strong> em <strong>Premium</strong> sem pagares nada:
        </p>
        <ul className="text-[13px] text-slate-600 my-4 space-y-1.5 text-left max-w-xs mx-auto">
          <li>✓ Até 50 convidados com RSVP</li>
          <li>✓ QR individual + check-in na porta</li>
          <li>✓ Música, galeria e livro de assinaturas</li>
          <li>✓ Válido por 180 dias</li>
        </ul>
        <p className="text-xs text-slate-500 mb-5">
          Fala com um assistente no WhatsApp com a referência pronta — ele ativa em minutos.
        </p>

        <button
          onClick={() => openAssistantWhatsApp('244952815430')}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full py-3.5 px-5 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] mb-2"
        >
          <MessageSquare size={16} /> Ativar grátis no WhatsApp
        </button>
        <button
          onClick={() => openAssistantWhatsApp('244939384315')}
          className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-full py-3 px-5 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
        >
          Canal 2 (939 384 315)
        </button>
        <button onClick={onClose} className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 cursor-pointer">
          Agora não
        </button>
      </motion.div>
    </div>
  );
};
