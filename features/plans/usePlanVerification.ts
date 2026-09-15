import { useState, useEffect, useCallback } from "react";

export interface AuthoritativeFeatures {
  rsvpLimit: number;
  backgroundMusic: boolean;
  customDomain: boolean;
  tableMaps: boolean;
  guestBook: boolean;
  whiteLabel: boolean;
  staffAccess: boolean;
}

export interface PlanVerificationResult {
  eventId: string;
  plan: string;
  isBlocked: boolean;
  features: AuthoritativeFeatures;
  verifiedAt: string;
}

export function usePlanVerification(eventId: string | undefined) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PlanVerificationResult | null>(null);

  const verifyPlan = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      // Find proper API host origin — §5 authoritative via entitlements (§6 server)
      const origin = window.location.origin;
      // Tenta novo endpoint entitlements, fallback para verify-plan legado
      let response = await fetch(`${origin}/api/events/${eventId}/entitlements`);
      if (!response.ok) {
        response = await fetch(`${origin}/api/events/${eventId}/verify-plan`);
      }
      if (!response.ok) {
        throw new Error(`Erro ao validar plano: status ${response.status}`);
      }
      const raw: any = await response.json();
      // Normaliza entitlements → PlanVerificationResult
      const json: PlanVerificationResult = raw.features ? raw : {
        eventId,
        plan: raw.plan || raw.planName || 'essential',
        isBlocked: !!raw.isBlocked || !!raw.isExpired,
        features: {
          rsvpLimit: raw.guestLimit ?? raw.rsvpLimit ?? 100,
          backgroundMusic: raw.features?.includes('music') || !!raw.features?.music || false,
          customDomain: raw.features?.includes('custom_domain') || false,
          tableMaps: raw.features?.includes('tables') || raw.features?.tableMaps || false,
          guestBook: raw.features?.includes('guestbook') ?? false,
          whiteLabel: raw.features?.includes('remove_branding') ?? false,
          staffAccess: raw.features?.includes('team_management') ?? false,
        },
        verifiedAt: raw.verifiedAt || new Date().toISOString(),
      };
      setData(json);
    } catch (err: any) {
      console.error("[usePlanVerification ERROR]", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    verifyPlan();
  }, [verifyPlan]);

  return {
    loading,
    error,
    data,
    verifyPlan,
    isPremium: data ? ['premium','vip','business','Premium','VIP','Business','Corporate'].includes(data.plan) : false,
    isBusiness: data ? ['business','Business','Corporate'].includes(data.plan.toLowerCase()) : false,
  };
}
