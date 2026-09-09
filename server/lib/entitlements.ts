/**
 * Server-side Entitlements — Mirror de lib/entitlements.ts
 * 
 * IMPORTANTE: Backend é fonte da verdade (§6). Nunca confiar só no frontend.
 * Importa de config/plans.js (ESM exige .js) — §31 Strict ESM Imports.
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
} from '../../config/plans.js';

export { PLANS, ADDONS, normalizePlanId, getPlanConfig, getGuestLimit, getValidityDays, calculateExpiresAt, isBusinessPlan, getEventCreationLimit };
export type { PlanId, FeatureId, AddonId } from '../../config/plans.js';
import type { FeatureId } from '../../config/plans.js';

// ---------------------------------------------------------------------------
// Feature gating — server authoritative (§6)
// ---------------------------------------------------------------------------
export function canUseFeature(planId: unknown, feature: FeatureId): boolean {
  const config = getPlanConfig(planId);
  return config.features.includes(feature);
}

export function canAddGuest(planId: unknown, currentCount: number): boolean {
  const limit = getGuestLimit(planId);
  if (!isFinite(limit)) return true;
  return currentCount < limit;
}

export function getLimitReachedMessage(planId: unknown): string {
  const limit = getGuestLimit(planId);
  const plan = getPlanConfig(planId);
  return `Atingiu o limite de ${limit} convidados do plano ${plan.name}. Faça upgrade para continuar.`;
}

export function isEventExpired(event: { expiresAt?: string | null; scheduledBlockDate?: string | null; isBlocked?: boolean }): boolean {
  if (event.isBlocked) return true;
  if (event.expiresAt) return new Date(event.expiresAt) <= new Date();
  if (event.scheduledBlockDate) return new Date(event.scheduledBlockDate) <= new Date();
  return false;
}

export function isEventActive(event: { expiresAt?: string | null; isBlocked?: boolean; isPublished?: boolean; scheduledBlockDate?: string | null }): boolean {
  if (event.isBlocked) return false;
  if (event.isPublished === false) return false;
  return !isEventExpired(event);
}

export function canUpgrade(fromPlan: unknown, toPlan: unknown): boolean {
  const from = normalizePlanId(fromPlan);
  const to = normalizePlanId(toPlan);
  const order = ['essential', 'premium', 'vip', 'business'] as const;
  return order.indexOf(to as any) > order.indexOf(from as any);
}

export function canDowngrade(toPlan: unknown, currentGuestCount: number): { allowed: boolean; reason?: string } {
  const toLimit = getGuestLimit(toPlan);
  if (currentGuestCount > toLimit) {
    return { allowed: false, reason: `O evento tem ${currentGuestCount} convidados e excede o limite de ${toLimit} do plano ${getPlanConfig(toPlan).name}.` };
  }
  return { allowed: true };
}
