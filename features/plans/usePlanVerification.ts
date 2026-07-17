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
      // Find proper API host origin
      const origin = window.location.origin;
      const response = await fetch(`${origin}/api/events/${eventId}/verify-plan`);
      if (!response.ok) {
        throw new Error(`Erro ao validar plano: status ${response.status}`);
      }
      const json: PlanVerificationResult = await response.json();
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
    isPremium: data ? ['Premium', 'Business', 'Corporate'].includes(data.plan) : false,
    isBusiness: data ? ['Business', 'Corporate'].includes(data.plan) : false,
  };
}
