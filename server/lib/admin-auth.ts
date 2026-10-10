/**
 * Admin Auth — autoridade administrativa centralizada.
 *
 * Fonte da verdade: custom claim `admin:true` no Firebase Auth (+ espelho
 * `users/{uid}.role` só para display/filtro — nunca autoridade).
 * Bootstrap: o e-mail principal vale como admin e como SUPER até a migração
 * (depois o fallback por e-mail pode sair das rules).
 *
 * - requireAdmin: claim admin OU e-mail bootstrap (operação do dia a dia).
 * - requireSuperAdmin: SÓ e-mail bootstrap (gerir equipa).
 */
import { admin } from './firebase-admin.js';

export const ADMIN_BOOTSTRAP_EMAIL = 'antoniosalvador522@gmail.com';

export type AdminAuthUser = {
  uid: string;
  email?: string;
  isAdminClaim: boolean;
  /** Provider de login (ex.: 'google.com', 'password', 'anonymous') — base da
   *  regra anti-farming da promo self-serve. Ausente = desconhecido. */
  signInProvider?: string;
  emailVerified?: boolean;
};

export async function getAdminAuthUser(req: any): Promise<AdminAuthUser | null> {
  const hdr = req.headers.authorization as string | undefined;
  if (!hdr || !hdr.startsWith('Bearer ')) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(hdr.slice(7));
    return {
      uid: decoded.uid,
      email: (decoded as any).email,
      isAdminClaim: (decoded as any).admin === true,
      signInProvider: (decoded as any)?.firebase?.sign_in_provider,
      emailVerified: !!(decoded as any)?.email_verified,
    };
  } catch {
    return null;
  }
}

export function isAdmin(u: AdminAuthUser | null): boolean {
  if (!u) return false;
  if (u.isAdminClaim) return true;
  return (u.email || '').toLowerCase() === ADMIN_BOOTSTRAP_EMAIL;
}

export function isSuperAdmin(u: AdminAuthUser | null): boolean {
  if (!u) return false;
  return (u.email || '').toLowerCase() === ADMIN_BOOTSTRAP_EMAIL;
}
