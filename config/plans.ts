/**
 * InoEvents — Fonte Central da Verdade Comercial (§3, §14, §31)
 * 
 * NÃO espalhar preços/limites/features pelo código.
 * Todos os ficheiros devem importar daqui:
 *   import { PLANS, getPlanConfig, getGuestLimit } from '../config/plans';
 *   import { PLANS } from '../../config/plans.js'; // server-side com .js
 * 
 * Moeda principal: AOA / Kz (§14)
 * Modelo: B2C pagamento único por evento + B2B subscription + Add-ons (§16)
 */

// ---------------------------------------------------------------------------
// Tipos base
// ---------------------------------------------------------------------------
export type PlanId = 'essential' | 'premium' | 'vip' | 'business' | 'free';
export type BillingType = 'one_time' | 'subscription';
export type AddonId = 'concierge';

export type FeatureId =
  // Essencial (§5)
  | 'rsvp'
  | 'qr'
  | 'gallery_basic'
  | 'location'
  | 'countdown'
  | 'sharing'
  // Premium (+)
  | 'individual_guests'
  | 'gallery_premium'
  | 'music'
  | 'guestbook'
  | 'tables'
  | 'remove_branding'
  | 'basic_analytics'
  | 'guest_management'
  | 'premium_themes'
  // VIP (+)
  | 'individual_qr'
  | 'checkin'
  | 'plus_one'
  | 'advanced_tables'
  | 'reminders'
  | 'advanced_analytics'
  | 'advanced_customization'
  | 'priority_support'
  | 'custom_domain'
  // Business (+)
  | 'multiple_events'
  | 'client_management'
  | 'dashboard'
  | 'white_label'
  | 'team_management';

export interface PlanConfig {
  id: PlanId;
  name: string;               // display name
  displayName?: string;
  price: number;              // em Kz (AOA) — §14 nunca duplicar
  currency: 'AOA';
  billingType: BillingType;
  /** validade em dias a partir de paidAt/publishedAt — §8 */
  validityDays: number | null; // null = ilimitado (business)
  guestLimit: number;         // §7 — Infinity para business
  popular?: boolean;          // §2 VIP é o mais popular
  /** fora de venda (legado): não listar em catálogos, mas continua válido
      para fichas/eventos antigos (quota e validade originais). */
  retired?: boolean;
  subtitle?: string;
  description?: string;
  features: FeatureId[];
}

export interface AddonConfig {
  id: AddonId;
  name: string;
  price: number;
  currency: 'AOA';
  type: 'one_time';
  description?: string;
}

// ---------------------------------------------------------------------------
// Definição central — valores do estudo brutal §25 + prompt §2/§14
// ---------------------------------------------------------------------------
export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'AOA',
    billingType: 'one_time',
    validityDays: 30,
    guestLimit: 0,
    subtitle: 'Degustação sem custo',
    description: 'Para ver modelos, criar e provar o convite. Partilha e convidados só após um plano.',
    features: [
      'rsvp',
    ],
  },
  essential: {
    id: 'essential',
    name: 'Essencial',
    price: 7500,
    currency: 'AOA',
    billingType: 'one_time',
    validityDays: 90,          // §8: 90 dias (legado)
    guestLimit: 100,           // §7 (legado)
    retired: true,             // FORA DE VENDA — só fichas/eventos antigos
    subtitle: 'Pagamento Único por Evento',
    description: 'O convite digital profissional para o seu evento.',
    features: [
      'rsvp',
      'qr',
      'gallery_basic',
      'location',
      'countdown',
      'sharing',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 15000,
    currency: 'AOA',
    billingType: 'one_time',
    validityDays: 180,         // §8: 180 dias
    guestLimit: 50,            // §7 — 1 casamento por plano, até 50 nomes
    subtitle: 'Pagamento Único por Evento',
    description: 'Tenha controlo total dos seus convidados.',
    features: [
      // tudo do essencial
      'rsvp',
      'qr',
      'gallery_basic',
      'location',
      'countdown',
      'sharing',
      // + premium (sem marca SÓ no Business: 'white_label' é business-only)
      'individual_guests',
      'gallery_premium',
      'music',
      'guestbook',
      'tables',
      'basic_analytics',
      'guest_management',
      'premium_themes',
    ],
  },
  vip: {
    id: 'vip',
    name: 'VIP',
    price: 25000,
    currency: 'AOA',
    billingType: 'one_time',
    validityDays: 365,         // §8: 365 dias
    guestLimit: 200,           // §7 — 1 casamento por plano, até 200 nomes
    popular: true,             // §2: mais popular/recomendado
    subtitle: 'Pagamento Único por Evento',
    description: 'Experiência premium completa com controlo absoluto.',
    features: [
      // tudo do premium (sem marca SÓ no Business)
      'rsvp',
      'qr',
      'gallery_basic',
      'location',
      'countdown',
      'sharing',
      'individual_guests',
      'gallery_premium',
      'music',
      'guestbook',
      'tables',
      'basic_analytics',
      'guest_management',
      'premium_themes',
      // + vip
      'individual_qr',
      'checkin',
      'plus_one',
      'advanced_tables',
      // 'reminders' e 'custom_domain' removidos do catálogo (sem implementação);
      // mantidos aqui como reserva técnica, sem efeito em gates.
      'reminders',
      'advanced_analytics',
      'advanced_customization',
      'priority_support',
      'custom_domain',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    displayName: 'Business (B2B)',
    price: 39900,
    currency: 'AOA',
    billingType: 'subscription', // §16
    validityDays: null,          // recorrente
    guestLimit: Infinity,        // §7: conforme política Business (ilimitado)
    subtitle: 'Assinatura Mensal',
    description: 'Para wedding planners e agências — eventos ilimitados.',
    features: [
      // business tem tudo de vip + capacidades B2B
      'rsvp',
      'qr',
      'gallery_basic',
      'location',
      'countdown',
      'sharing',
      'individual_guests',
      'gallery_premium',
      'music',
      'guestbook',
      'tables',
      'remove_branding',
      'basic_analytics',
      'guest_management',
      'premium_themes',
      'individual_qr',
      'checkin',
      'plus_one',
      'advanced_tables',
      'reminders',
      'advanced_analytics',
      'advanced_customization',
      'priority_support',
      'custom_domain',
      // + b2b
      'multiple_events',
      'client_management',
      'dashboard',
      'white_label',
      'team_management',
    ],
  },
};

export const ADDONS: Record<AddonId, AddonConfig> = {
  concierge: {
    id: 'concierge',
    name: 'Concierge',
    price: 10000,                // §14 + §18
    currency: 'AOA',
    type: 'one_time',
    description: 'A equipa InoEvent configura o evento por si.',
  },
};

// ---------------------------------------------------------------------------
// Helpers — nunca fazer `if (plan === "premium")` espalhado. Usar isto:
// ---------------------------------------------------------------------------

/** Normaliza valores legados: "Essencial" | "Premium" | "Business" | "Corporate" → planId.
 *  Omissão/desconhecido = 'free' (identidade do registo em AuthPage): por defeito
 *  nega-se (0 convidados) em vez de se oferecer Essencial (100). */
export function normalizePlanId(raw: unknown): PlanId {
  if (!raw || typeof raw !== 'string') return 'free';
  const v = raw.trim().toLowerCase();
  if (v === 'essential' || v === 'essencial') return 'essential';
  if (v === 'free' || v === 'gratis' || v === 'grátis' || v === 'gratuito') return 'free';
  if (v === 'premium') return 'premium';
  if (v === 'vip') return 'vip';
  if (v === 'business' || v === 'corporate' || v === 'b2b') return 'business';
  return 'free';
}

export function getPlanConfig(planId: unknown): PlanConfig {
  const id = normalizePlanId(planId);
  return PLANS[id];
}

export function getPlanPrice(planId: unknown): number {
  return getPlanConfig(planId).price;
}

export function getGuestLimit(planId: unknown): number {
  return getPlanConfig(planId).guestLimit;
}

export function getValidityDays(planId: unknown): number | null {
  return getPlanConfig(planId).validityDays;
}

/** Calcula expiresAt a partir de paidAt/publishedAt — fonte segura (§8) */
export function calculateExpiresAt(planId: unknown, fromDate: Date = new Date()): Date | null {
  const days = getValidityDays(planId);
  if (days === null) return null; // business não expira por evento
  const d = new Date(fromDate);
  d.setDate(d.getDate() + days);
  return d;
}

export function isBusinessPlan(planId: unknown): boolean {
  return normalizePlanId(planId) === 'business';
}

export function isOneTimePlan(planId: unknown): boolean {
  return getPlanConfig(planId).billingType === 'one_time';
}

export function formatPrice(price: number, currency: string = 'AOA'): string {
  // Formato angolano: 15.000 Kz
  return `${price.toLocaleString('pt-AO')} Kz`;
}

export function getAddonPrice(addonId: AddonId): number {
  return ADDONS[addonId].price;
}

/** Limite de criação de eventos B2C por plano — §7.
 *  Regra: 1 evento de casamento por plano (chás não contam); vários só Business.
 *  'essential' mantém 2 para o legado (fora de venda, fichas antigas intactas). */
export const EVENT_CREATION_LIMITS: Record<PlanId, number> = {
  free: 1,
  essential: 2,
  premium: 1,
  vip: 1,
  business: Infinity,
};

export function getEventCreationLimit(planId: unknown): number {
  const id = normalizePlanId(planId);
  return EVENT_CREATION_LIMITS[id];
}

/** Total = plano + addons — §18 não alterar preço do plano */
export function calculateOrderTotal(planId: unknown, addons: Partial<Record<AddonId, boolean>> = {}): number {
  let total = getPlanPrice(planId);
  for (const [aid, enabled] of Object.entries(addons)) {
    if (enabled && ADDONS[aid as AddonId]) total += ADDONS[aid as AddonId].price;
  }
  return total;
}

// Compat: preços centralizados para SEO/checkout — nunca duplicar
export const PRICING = {
  ESSENTIAL: PLANS.essential.price,
  PREMIUM: PLANS.premium.price,
  VIP: PLANS.vip.price,
  CONCIERGE: ADDONS.concierge.price,
  BUSINESS: PLANS.business.price,
  CURRENCY: 'AOA' as const,
} as const;
