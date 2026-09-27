import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Shield, Clock, Ticket, Send } from 'lucide-react';
import { normalizePlanId } from '../lib/entitlements';
import { auth } from './FirebaseProvider';
import toast from 'react-hot-toast';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan?: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, userPlan }) => {
  const isBusiness = normalizePlanId(userPlan) === "business";
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  // Tickets com SLA (alternativa ao WhatsApp, com fila e prazo).
  const [tab, setTab] = useState<'whatsapp' | 'tickets'>('whatsapp');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('duvida');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      lastFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  const handleOpenWhatsApp = (number: string) => {
    const text = encodeURIComponent("Olá! Preciso de suporte com a plataforma InoEvents.");
    window.open(`https://wa.me/244${number}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const fetchMyTickets = async () => {
    if (!auth.currentUser) return;
    setTicketsLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/tickets/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMyTickets(data.tickets || []);
    } catch { /* mantém lista */ }
    finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tab === 'tickets' && auth.currentUser) fetchMyTickets();
  }, [isOpen, tab]);

  const handleOpenTicket = async () => {
    if (!auth.currentUser) {
      toast.error('Entra na tua conta para abrir um ticket.');
      return;
    }
    if (!subject.trim() || !message.trim() || sending) return;
    setSending(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim(), category }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Falha ao abrir ticket');
      setSubject('');
      setMessage('');
      toast.success('Ticket aberto! Respondemos dentro do prazo da categoria.');
      fetchMyTickets();
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível abrir. Tenta de novo.');
    } finally {
      setSending(false);
    }
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
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Falar com o suporte"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-2xl z-10 overflow-hidden outline-none"
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

            {/* Tabs: WhatsApp imediato vs Ticket com prazo */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-5">
              <button
                onClick={() => setTab('whatsapp')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${tab === 'whatsapp' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >
                WhatsApp
              </button>
              <button
                onClick={() => setTab('tickets')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${tab === 'tickets' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >
                Meus tickets
              </button>
            </div>

            {tab === 'whatsapp' ? (
            <>
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
            </>
            ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Assunto (ex: pagamento não ativou)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              />
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none cursor-pointer"
                  title="Categoria define o prazo de resposta"
                >
                  <option value="pagamento">Pagamento (4h)</option>
                  <option value="tecnico">Técnico (8h)</option>
                  <option value="duvida">Dúvida (24h)</option>
                </select>
                <input
                  type="text"
                  placeholder="Descreve o problema…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                />
              </div>
              <button
                onClick={handleOpenTicket}
                disabled={sending || !subject.trim() || !message.trim()}
                className="w-full bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-60 text-white rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={16} /> {sending ? 'A abrir…' : 'Abrir ticket'}
              </button>
              <div className="max-h-56 overflow-y-auto space-y-2 pt-1">
                {ticketsLoading ? (
                  <p className="text-xs text-slate-400 text-center py-4">A carregar tickets…</p>
                ) : myTickets.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Sem tickets ainda. O WhatsApp continua disponível na outra aba.</p>
                ) : (
                  myTickets.map((t: any) => (
                    <div key={t.id} className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50">
                      <button onClick={() => setExpandedId(expandedId === t.id ? null : t.id)} className="w-full text-left cursor-pointer">
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Ticket size={14} className="shrink-0" /> {t.subject}
                          <span className={`ml-auto text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${t.status === 'resolvido' ? 'bg-emerald-100 text-emerald-700' : t.status === 'em_atendimento' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {t.status}
                          </span>
                        </p>
                      </button>
                      {expandedId === t.id && (
                        <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                          {(t.messages || []).map((m: any) => (
                            <div key={m.id} className={`text-xs rounded-xl px-3 py-2 ${m.from === 'admin' ? 'bg-brand-blue/10 text-slate-700' : 'bg-white border border-slate-100 text-slate-600'}`}>
                              <span className="font-bold">{m.from === 'admin' ? 'Equipa: ' : 'Tu: '}</span>{m.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
