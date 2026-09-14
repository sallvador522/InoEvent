
export enum ThemeType {
  WEDDING = 'WEDDING',
  BIRTHDAY = 'BIRTHDAY',
  CORPORATE = 'CORPORATE',
  BRIDAL_SHOWER = 'BRIDAL_SHOWER',
  BABY_SHOWER = 'BABY_SHOWER'
}

export type LayoutMode = 'CLASSIC' | 'MODERN' | 'LUXURY' | 'GARDEN' | 'RUSTIC' | 'INDUSTRIAL' | 'BRIDAL_BEAUTY' | 'BRIDAL_ROMANTIC' | 'BRIDAL_MINIMAL' | 'BRIDAL_TEA_PARTY' | 'BRIDAL_CHEF' | 'BRIDAL_TROPICAL' | 'BABY_BOY' | 'BABY_GIRL' | 'BABY_NEUTRAL' | 'LIMINTSO_GOLD' | 'LIMINTSO_ME';

export interface TimelineItem {
  time: string;
  title: string;
  description: string;
}

export interface GiftItem {
  type: 'IBAN' | 'LINK' | 'BANK'; 
  title: string;
  value: string; 
  description?: string;
  bankName?: string;
  accountName?: string;
  qrCode?: string;
}

export interface TipItem {
  category: 'HOTEL' | 'SALON' | 'INFO';
  title: string;
  description: string;
  link?: string; // Google Maps or Website
  actionLabel?: string;
}

export interface DressCode {
  title: string;
  description: string;
  image?: string; // URL to an example image or icon
}

// ---------------------------------------------------------------------------
// Business Model — Single Source of Truth imports from config/plans.ts
// Re-export for convenience (§3, §4)
// ---------------------------------------------------------------------------
export type PlanId = 'essential' | 'premium' | 'vip' | 'business';
export type BillingType = 'one_time' | 'subscription';
export type AddonId = 'concierge';

export type EventStatus = 'active' | 'expired' | 'renewed' | 'blocked';
export type BillingStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'expired';
export type PaymentProvider = 'whatsapp_manual' | 'manual' | 'stripe' | 'paystack';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired' | 'trial';

export interface AddonSelection {
  concierge?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  organizationId?: string | null;
  eventId: string;
  plan: PlanId;
  amount: number;
  currency: 'AOA';
  billingStatus: BillingStatus;
  paymentProvider: PaymentProvider;
  providerTransactionId?: string | null;
  addons?: AddonSelection;
  subtotal?: number;
  total?: number;
  createdAt: string;
  paidAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  userId: string;
  organizationId?: string | null;
  plan: Extract<PlanId, 'business'>;
  status: SubscriptionStatus;
  price: number;
  currency: 'AOA';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  cancelledAt?: string | null;
}

export interface EventDetails {
  id: string;
      type: ThemeType;
  layoutMode: LayoutMode; 
  title: string;
  hosts: string;
  brideName?: string;
  groomName?: string;
  brideParents?: string;
  groomParents?: string;
  date: string;
  isoDate: string; 
  time: string;
  
  // Locations
  locationName: string;
  address: string;
  mapLink?: string;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  receptionName?: string; // Optional separate reception
  receptionAddress?: string;

  heroImage: string;
  description: string;
  musicTrack: string;
  timeline: TimelineItem[];
  mapImage?: string;
  gallery?: Array<string | { id: string; url: string; likes: number }>;
  /** @deprecated use plan as PlanId ('essential'|'premium'|'vip'|'business') via normalizePlanId */
  plan?: string;
  /** Novo campo canónico — preferir sobre plan legado */
  planId?: PlanId;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  /** §8 — expiração calculada no backend a partir de paidAt/publishedAt */
  expiresAt?: string | null;
  /** §9 — status do evento */
  status?: EventStatus;
  /** §12-13 — ligação a Order */
  orderId?: string | null;
  billingStatus?: BillingStatus;
  addons?: AddonSelection;
  themeColor?: string;
  
  hiddenSections?: string[];
  
  // New Sections
  gifts?: GiftItem[];
  tips?: TipItem[];
  dressCode?: DressCode;
  phone?: string; // Add phone
  brideQuote?: string;
  groomQuote?: string;
  coupleTitle?: string;
  footerMessage?: string;
  welcomeMessage?: string;
  editableContent?: Record<string, string>;
  isBlocked?: boolean;
  scheduledBlockDate?: string;
  draftData?: any;
  isPublished?: boolean;
  dailyAccesses?: Record<string, number>;
  accessCount?: number;
  blockedTitle?: string;
  blockedMessage?: string;
}

export interface ThemeConfig {
  bg: string;
  text: string;
  accent: string;
  fontHead: string;
  fontBody: string;
  button: string;
  nav: string;
}
