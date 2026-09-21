/**
 * Validação central de uploads de imagem — fonte única da verdade.
 *
 * Regras (decisão de produto):
 *   - Tamanho máximo do ficheiro de entrada: 2MB
 *   - Formatos aceites: JPEG (.jpg/.jpeg) e PNG (.png)
 *   - A saída dos compressores continua normalizada para JPEG (base64),
 *     por isso a validação incide sobre o ficheiro ORIGINAL escolhido.
 *
 * Uso:
 *   const v = validateImageFile(file);
 *   if (!v.ok) { toast.error(v.error); return; }
 */

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png'] as const;

/** Valor para o atributo `accept` dos <input type="file">. */
export const IMAGE_ACCEPT = 'image/jpeg,image/png';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface ImageValidationResult {
  ok: boolean;
  /** Mensagem pronta a mostrar com toast quando `ok === false` ('' quando ok). */
  error: string;
}

/**
 * Valida tipo + tamanho. Não lança — devolve o erro pronto a mostrar com toast.
 * Nota: alguns browsers reportam `.jpg` como `image/jpeg` (correto) e ficheiros
 * sem extensão podem vir com `type === ''` — tratados como formato inválido.
 */
export function validateImageFile(file: File | undefined | null): ImageValidationResult {
  if (!file) {
    return { ok: false, error: 'Nenhum ficheiro selecionado.' };
  }
  const mime = (file.type || '').toLowerCase();
  if (!(ALLOWED_IMAGE_MIMES as readonly string[]).includes(mime)) {
    if (mime === 'image/heic' || mime === 'image/heif') {
      return {
        ok: false,
        error:
          'Fotos do iPhone (HEIC) não são suportadas. Converte para JPEG ou PNG e tenta de novo.',
      };
    }
    return {
      ok: false,
      error: 'Formato não suportado. Usa apenas JPEG (.jpg) ou PNG (.png).',
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: `Imagem com ${formatFileSize(file.size)} — o limite é ${formatFileSize(MAX_IMAGE_BYTES)}. Escolhe uma foto mais leve.`,
    };
  }
  return { ok: true, error: '' };
}
