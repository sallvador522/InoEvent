/**
 * Audit — trilha de auditoria das ações administrativas (§12).
 *
 * Toda ação sensível do admin (confirmar pagamento, bloquear/ativar/apagar
 * evento, suspender conta, trocar plano, renovar/cancelar subscrição) grava
 * um documento em `audit` via Admin SDK. Clientes nunca escrevem (rules deny)
 * e só `isAdmin()` lê. A verdade vem do backend, nunca do browser.
 */
import { getDb } from './firebase-admin.js';
import { logger } from '../../lib/logger.js';

export type AuditAction =
  | 'order.confirm'
  | 'order.fail'
  | 'event.block'
  | 'event.activate'
  | 'event.delete'
  | 'user.disable'
  | 'user.enable'
  | 'user.plan_change'
  | 'user.renew'
  | 'subscription.renew'
  | 'subscription.cancel'
  | 'accounts.backfill'
  | 'order_titles.backfill'
  | 'admin.grant'
  | 'admin.revoke'
  | 'admin.resync'
  | 'admin.mirror_view'
  | 'ticket.reply'
  | 'ticket.status'
  | 'promo.first_event'
  | 'privacy.export'
  | 'privacy.delete';

export async function logAudit(input: {
  actorEmail: string;
  action: AuditAction;
  targetType: 'order' | 'event' | 'user' | 'subscription' | 'system';
  targetId: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const db = getDb();
    const id = `aud_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
    await db.collection('audit').doc(id).set({
      id,
      at: new Date().toISOString(),
      actorEmail: input.actorEmail,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      detail: typeof input.detail === 'string' ? input.detail.slice(0, 500) : null,
      metadata: input.metadata || {},
    });
  } catch (err: any) {
    // Auditoria nunca quebra a ação principal — regista e segue.
    logger.error('Falha ao gravar audit', { category: 'SYSTEM', data: err?.message || err });
  }
}
