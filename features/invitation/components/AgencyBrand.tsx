import React from 'react';
import { normalizePlanId, canUseFeature } from '../../../lib/entitlements';

/**
 * Faixa da agência (white-label B2B): SÓ em eventos com 'white_label'
 * (Business). Marca carimbada pelo servidor a partir da ficha do dono —
 * o cliente nunca forja. Pílula auto-suficiente legível em tema claro/escuro.
 */
export const AgencyBrand: React.FC<{ event: any }> = ({ event }) => {
  const plan = normalizePlanId((event as any)?.plan ?? (event as any)?.planId);
  if (!canUseFeature(plan, 'white_label')) return null;
  const name = (event as any)?.whiteLabelName as string | undefined;
  const logo = (event as any)?.whiteLabelLogo as string | undefined;
  if (!name && !logo) return null;
  return (
    <div className="flex justify-center px-6 pb-10" aria-label={name || 'Agência organizadora'}>
      <span className="inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md border border-white/15 px-4 py-2 shadow-lg">
        {logo ? (
          <img src={logo} alt={name || 'Agência'} className="h-5 w-5 rounded-full object-cover" />
        ) : null}
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/85">
          {name || 'Organização'}
        </span>
      </span>
    </div>
  );
};
