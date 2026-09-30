/**
 * passExport — export do passe elegante para PNG com tolerância a falhas.
 *
 * O toPng (html-to-image) rejeita se QUALQUER recurso falhar (imagem sem
 * CORS, fonte externa bloqueada...). Esta função:
 *  1. espera as fontes + descodificação das imagens do nó;
 *  2. tenta pixelRatio 2 → 1.5 → 1 (canvas gigante rebenta em telemóveis fracos);
 *  3. usa imagePlaceholder para uma imagem má nunca matar o export inteiro.
 * Se tudo falhar, lança — o chamador deve cair no download do QR simples.
 */
import { toPng } from 'html-to-image';

// Pixel 1x1 transparente: substitui imagens que falharem no fetch.
const PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export async function exportPassPng(node: HTMLElement): Promise<string> {
  try {
    await (document as any).fonts?.ready;
  } catch {
    /* segue sem fontes */
  }
  // Pré-aquecer: garante que as <img> do nó já descodificaram antes do snapshot.
  try {
    const imgs = Array.from(node.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) =>
        (img as HTMLImageElement).decode?.().catch(() => undefined),
      ),
    );
  } catch {
    /* segue na mesma */
  }
  let lastErr: unknown = null;
  for (const pixelRatio of [2, 1.5, 1]) {
    try {
      return await toPng(node, {
        pixelRatio,
        cacheBust: true,
        imagePlaceholder: PLACEHOLDER,
      });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('pass-export-failed');
}
