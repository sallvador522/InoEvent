import React from 'react';
import { motion } from 'framer-motion';
import { normalizePlanId, getPlanConfig } from '../../lib/entitlements';
import { normalizeAccountType } from '../../types';

/**
 * Espelho readonly — "ver como o usuário vê" SEM tocar em nada.
 * Garantia estrutural: este componente não importa setDoc/updateDoc/addDoc
 * nem faz fetch POST — só renderiza o estado com as MESMAS regras do
 * Dashboard do evento (banner Free / Ativar evento / Pedido recebido).
 */
interface MirrorProps {
  targetUser: any;
  targetEvents: any[];
  targetOrders: any[];
  onClose: () => void;
  onInspectEvent: (event: any) => void;
}

function bannerForAccount(plan: unknown): string {
  return normalizePlanId(plan) === 'free' ? 'Conta Free — prova à vontade' : '';
}

function bannerForEvent(event: any, accountPlan: unknown, hasPendingOrder: boolean): { title: string; text: string } {
  const eventPlan = normalizePlanId(event?.plan || event?.planId);
  if (hasPendingOrder) {
    return { title: 'Pedido recebido!', text: 'Em confirmação — avisamos aqui assim que o pagamento for validado.' };
  }
  if (eventPlan === 'free' || (event?.billingStatus !== 'paid' && event?.isPublished === false)) {
    if (normalizePlanId(accountPlan) === 'free') {
      return { title: 'Conta Free — prova à vontade', text: 'Cria e prova o teu convite. Para partilhar e gerir convidados, ativa um plano.' };
    }
    return { title: 'Ativar evento', text: 'Cada evento de casamento precisa do seu próprio plano. Escolhe um plano para este evento e a equipa ativa após o pagamento.' };
  }
  return { title: 'Ativo', text: 'Convite publicado e partilhável.' };
}

export const UserMirror: React.FC<MirrorProps> = ({ targetUser, targetEvents, targetOrders, onClose, onInspectEvent }) => {
  const accountPlan = normalizePlanId(targetUser?.plan);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.97, y: 20, opacity: 0 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-amber-200 bg-amber-50 sticky top-0 z-10">
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="text-[11px] font-black text-amber-700 uppercase tracking-wider">👁 A ver como usuário — somente leitura</p>
              <h2 className="text-lg font-bold text-slate-900">{targetUser?.email || targetUser?.uid}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {getPlanConfig(accountPlan).name} · {normalizeAccountType(targetUser?.accountType) === 'professional' ? `💼 ${targetUser?.agencyName || 'Cerimonialista'}` : 'Noivo(a)/Família'}
                {targetUser?.planExpiresAt ? ` · válido até ${new Date(targetUser.planExpiresAt).toLocaleDateString('pt-AO')}` : ''}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 bg-white p-2 rounded-full cursor-pointer shrink-0" aria-label="Fechar">✕</button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {bannerForAccount(targetUser?.plan) && targetEvents.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="font-bold text-slate-800 text-sm">{bannerForAccount(targetUser?.plan)}</p>
            </div>
          )}
          {targetEvents.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">Este usuário ainda não criou eventos.</p>
          )}
          {targetEvents.map((ev: any) => {
            const pending = targetOrders.some((o: any) => o.eventId === ev.id && o.billingStatus !== 'paid' && o.billingStatus !== 'failed');
            const b = bannerForEvent(ev, targetUser?.plan, pending);
            const active = b.title === 'Ativo';
            return (
              <div key={ev.id} className={`rounded-2xl border p-4 ${active ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{ev.title || 'Sem título'}</p>
                    <p className="text-[11px] font-bold text-slate-600 mt-0.5">{b.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{b.text}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => onInspectEvent(ev)}
                      className="px-3 py-1.5 text-[11px] font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      Inspecionar
                    </button>
                    <a
                      href={`/invite/${ev.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-[11px] font-bold bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 text-center"
                    >
                      Abrir convite ↗
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-slate-400 text-center pt-1">Espelho readonly — nenhuma ação aqui altera a conta do usuário.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
