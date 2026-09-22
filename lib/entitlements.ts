/**
 * Entitlements — Feature Gating Centralizado (§5)
 * 
 * Frontend pode esconder botões, mas NUNCA é segurança (§6).
 * Backend deve validar também via server/lib/entitlements.ts (mirror).
 * 
 * Uso:
 *   import { canUseFeature, getGuestLimit, isEventExpired } from '../lib/entitlements';
 *   if (!canUseFeature(event.plan, 'music')) { toast.error(...); return; }
 */
import {
  PLANS,
  ADDONS,
  normalizePlanId,
  getPlanConfig,
  getGuestLimit,
  getValidityDays,
  calculateExpiresAt,
  isBusinessPlan,
  getEventCreationLimit,
  type PlanId,
  type FeatureId,
  type AddonId,
} from '../config/plans';

// Re-export para conveniência
export { PLANS, ADDONS, normalizePlanId, getPlanConfig, getGuestLimit, getValidityDays, calculateExpiresAt, isBusinessPlan, getEventCreationLimit };
export type { PlanId, FeatureId, AddonId };

// ---------------------------------------------------------------------------
// Feature gating (§5)
// ---------------------------------------------------------------------------

export function canUseFeature(planId: unknown, feature: FeatureId): boolean {
  const config = getPlanConfig(planId);
  return config.features.includes(feature);
}

export function hasEntitlement(planId: unknown, feature: FeatureId): boolean {
  return canUseFeature(planId, feature);
}

/** Verifica se pode adicionar mais um convidado — §7 */
export function canAddGuest(planId: unknown, currentCount: number): boolean {
  const limit = getGuestLimit(planId);
  if (!isFinite(limit)) return true;
  return currentCount < limit;
}

/** Mensagem comercial clara ao atingir limite — §7 */
export function getLimitReachedMessage(planId: unknown, currentCount: number): string {
  const limit = getGuestLimit(planId);
  const plan = getPlanConfig(planId);
  if (canAddGuest(planId, currentCount)) return '';
  return `Atingiu o limite de ${limit} convidados do plano ${plan.name}. Faça upgrade para continuar.`;
}

export function getUpgradeSuggestion(planId: unknown): { from: PlanId; to: PlanId; toPrice: number } | null {
  const id = normalizePlanId(planId);
  if (id === 'essential') return { from: 'essential', to: 'premium', toPrice: PLANS.premium.price };
  if (id === 'premium') return { from: 'premium', to: 'vip', toPrice: PLANS.vip.price };
  if (id === 'vip') return { from: 'vip', to: 'business', toPrice: PLANS.business.price };
  return null; // business já é topo
}

// ---------------------------------------------------------------------------
// Expiração (§8)
// ---------------------------------------------------------------------------

export function isEventExpired(event: { expiresAt?: string | null; scheduledBlockDate?: string | null; isBlocked?: boolean }): boolean {
  if (event.isBlocked) return true;
  if (event.expiresAt) {
    return new Date(event.expiresAt) <= new Date();
  }
  if (event.scheduledBlockDate) {
    return new Date(event.scheduledBlockDate) <= new Date();
  }
  return false;
}

export function isEventActive(event: { expiresAt?: string | null; isBlocked?: boolean; isPublished?: boolean; scheduledBlockDate?: string | null }): boolean {
  if (event.isBlocked) return false;
  if (event.isPublished === false) return false;
  return !isEventExpired(event);
}

// ---------------------------------------------------------------------------
// Conta activa (§12) — pedido pago activa a CONTA (com validade); conta paga publica.
// Leitura event-local: confirmPayment carimba accountActive/accountExpiresAt.
// planExpiresAt null (atribuído manualmente) conta como válido (retrocompatível).
// ---------------------------------------------------------------------------

export function isAccountActive(event: { accountActive?: boolean; accountExpiresAt?: string | null } | null | undefined): boolean {
  if (!event || event.accountActive !== true) return false;
  if (!event.accountExpiresAt) return true;
  return new Date(event.accountExpiresAt) > new Date();
}

export function getDaysUntilExpiration(event: { expiresAt?: string | null }): number | null {
  if (!event.expiresAt) return null;
  const diff = new Date(event.expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Validação de upgrade/downgrade (§10, §11)
// ---------------------------------------------------------------------------

export function canUpgrade(fromPlan: unknown, toPlan: unknown): boolean {
  const from = normalizePlanId(fromPlan);
  const to = normalizePlanId(toPlan);
  const order: PlanId[] = ['essential', 'premium', 'vip', 'business'];
  return order.indexOf(to) > order.indexOf(from);
}

/** Downgrade não-destrutivo — só permite se count <= limite do destino */
export function canDowngrade(fromPlan: unknown, toPlan: unknown, currentGuestCount: number): { allowed: boolean; reason?: string } {
  const toLimit = getGuestLimit(toPlan);
  if (!isFinite(toLimit) && currentGuestCount > toLimit) {
    return { allowed: false, reason: `O evento tem ${currentGuestCount} convidados e o plano ${getPlanConfig(toPlan).name} permite apenas ${toLimit}. Remova convidados ou escolha um plano superior.` };
  }
  if (currentGuestCount > toLimit) {
    return { allowed: false, reason: `O evento excede o limite do plano seleccionado (${currentGuestCount} > ${toLimit}).` };
  }
  // downgrade só se compatível ou no próximo ciclo (subscriptions)
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Helpers de UI (§26)
// ---------------------------------------------------------------------------

export function getGuestUsagePercent(planId: unknown, currentCount: number): number {
  const limit = getGuestLimit(planId);
  if (!isFinite(limit) || limit === 0) return 0;
  return Math.min(100, Math.round((currentCount / limit) * 100));
}

export function isNearLimit(planId: unknown, currentCount: number, threshold = 0.87): boolean {
  const limit = getGuestLimit(planId);
  if (!isFinite(limit)) return false;
  return currentCount / limit >= threshold;
}
