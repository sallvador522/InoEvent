/**
 * IBAN Angola — padrão AO06 (AO + dígitos de controlo 06 + 19 dígitos BBAN).
 *
 * Regra de negócio: o prefixo é SEMPRE AO06. Para nunca corromper dados,
 * NADA é "adivinhado": prefixo estrangeiro (ex. AO07) é inválido, não convertido.
 *
 * - `cleanIban()`: maiúsculas, sem espaços/pontos/traços.
 * - `splitIban()`: separa prefixo fixo do corpo digitável (chip AO06 + input).
 * - `canonicalIban()`: forma canónica para guardar/copiar ("AO06" + 19 dígitos).
 * - `isValidAngolaIban()`: exatamente AO06 + 19 dígitos.
 * - `formatIbanGroups()`: exibição agrupada (estética).
 * - `ibanError()`: texto curto de erro para o formulário.
 */

export const IBAN_PREFIX = 'AO06';
/** Dígitos após o prefixo fixo. */
export const IBAN_BODY_LENGTH = 19;
/** Comprimento total canónico. */
export const IBAN_LENGTH = IBAN_PREFIX.length + IBAN_BODY_LENGTH; // 25

/** Remove espaços, pontos, traços e barras; maiúsculas. */
export function cleanIban(raw: string | null | undefined): string {
  return (raw || '').toUpperCase().replace(/[\s.\-_/]/g, '');
}

/**
 * Extrai os dígitos do corpo:
 * - com prefixo AO06 exato → remove-o (evita duplo AO06 ao colar);
 * - só dígitos → usa direto;
 * - prefixo AO diferente (ex. AO07) → vazio (inválido, SEM coerção silenciosa).
 */
export function ibanBody(raw: string | null | undefined): string {
  const v = cleanIban(raw);
  if (!v) return '';
  if (v.startsWith(IBAN_PREFIX)) return v.slice(IBAN_PREFIX.length).replace(/\D/g, '').slice(0, IBAN_BODY_LENGTH);
  if (/^AO/.test(v)) return '';
  return v.replace(/\D/g, '').slice(0, IBAN_BODY_LENGTH);
}

/** Forma canónica para guardar/copiar. Vazio se não houver dígitos. */
export function canonicalIban(raw: string | null | undefined): string {
  const body = ibanBody(raw);
  return body ? IBAN_PREFIX + body : '';
}

/** Parte digitável (sem o prefixo fixo) — para inputs com chip AO06. */
export function splitIban(raw: string | null | undefined): { prefix: string; body: string } {
  return { prefix: IBAN_PREFIX, body: ibanBody(raw) };
}

/** IBAN angolano válido: exatamente AO06 + 19 dígitos. */
export function isValidAngolaIban(raw: string | null | undefined): boolean {
  return new RegExp(`^${IBAN_PREFIX}\\d{${IBAN_BODY_LENGTH}}$`).test(canonicalIban(raw));
}

/** Exibição agrupada: "AO06 1234 5678 ..." (estética; copiar usa o canónico). */
export function formatIbanGroups(canonical: string | null | undefined): string {
  const v = canonicalIban(canonical);
  if (!v) return '';
  return v.replace(/(.{4})/g, '$1 ').trim();
}

/** Texto curto de erro para o formulário (null = ok). */
export function ibanError(raw: string | null | undefined): string | null {
  const cleaned = cleanIban(raw);
  if (!cleaned) return 'Preencha os 19 dígitos após o AO06.';
  if (/^AO/.test(cleaned) && !cleaned.startsWith(IBAN_PREFIX)) {
    return 'IBAN deve começar por AO06.';
  }
  const body = ibanBody(raw);
  if (body.length !== IBAN_BODY_LENGTH) {
    return `IBAN incompleto: faltam ${IBAN_BODY_LENGTH - body.length} dígitos.`;
  }
  return null;
}
