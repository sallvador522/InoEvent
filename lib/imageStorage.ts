/**
 * Capas no Firebase Storage — troca base64 (Firestore) por URL pública.
 *
 * Porquê: documentos do Firestore limitam-se a 1MB e scrapers (WhatsApp/Facebook)
 * não leem `data:` URLs — a capa precisa de um URL https público para o preview
 * do link partilhado funcionar.
 *
 * Rules (storage.rules): escrita em `users/{uid}/**` exige dono + `image/*` + <5MB;
 * leitura é pública. As capas comprimidas (JPEG ~1200px) ficam em ~100-400KB.
 */
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

export function isBase64Image(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:image');
}

/** Diz se o URL é um upload NOSSO no Storage (apagável/substituível). */
export function isOwnStorageImage(url: unknown, uid?: string): boolean {
  if (typeof url !== 'string' || !url.includes('firebasestorage.googleapis.com')) return false;
  if (uid) {
    // Download URLs codificam o path: .../o/users%2F{uid}%2Fcovers%2F...
    return url.includes(`users%2F${uid}`) || url.includes(`users/${uid}`);
  }
  return url.includes('users%2F') || url.includes('/users/');
}

/** Sobe capa (data URL JPEG/PNG) para `users/{uid}/covers/` e devolve URL pública. */
export async function uploadCoverImage(
  dataUrl: string,
  uid: string,
  eventId: string,
): Promise<string> {
  if (!isBase64Image(dataUrl)) {
    throw new Error('A capa tem de ser uma imagem (data URL).');
  }
  const storage = getStorage();
  const safeEvent = (eventId || 'evt').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'evt';
  const path = `users/${uid}/covers/${safeEvent}_${Date.now()}.jpg`;
  const snap = await uploadString(ref(storage, path), dataUrl, 'data_url', {
    contentType: 'image/jpeg',
  });
  return getDownloadURL(snap.ref);
}

/** Apaga capa antiga do NOSSO Storage (best-effort). Nunca toca em URLs externas. */
export async function deleteCoverImage(
  url: string | undefined | null,
  uid?: string,
): Promise<void> {
  if (!isOwnStorageImage(url, uid)) return;
  try {
    const storage = getStorage();
    await deleteObject(ref(storage, url as string));
  } catch {
    /* best-effort — órfãos não partem nada */
  }
}

export interface CoverMigrationResult {
  url: string;
  migrated: boolean;
}

/**
 * Migra a capa para o Storage se ainda estiver em base64.
 * Nunca lança: em falha devolve a original para o save não partir
 * (nesse caso o preview do link usa a imagem padrão).
 */
export async function migrateCoverToStorage(
  current: unknown,
  uid: string,
  eventId: string,
  previousUrl?: string | null,
): Promise<CoverMigrationResult> {
  if (!isBase64Image(current)) {
    return { url: (typeof current === 'string' ? current : '') || '', migrated: false };
  }
  try {
    const url = await uploadCoverImage(current, uid, eventId);
    if (previousUrl && previousUrl !== url) {
      void deleteCoverImage(previousUrl, uid);
    }
    return { url, migrated: true };
  } catch (err) {
    console.warn('[imageStorage] Falha ao subir capa, mantendo local:', err);
    return { url: current, migrated: false };
  }
}
