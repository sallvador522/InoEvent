import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const MAX_AUDIO_BYTES = 6 * 1024 * 1024;

export const formatAudioSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Sobe mp3 para o Storage (events/{uid}/music-*) e devolve URL pública. Teto 6MB. */
export async function uploadEventAudio(file: File, uid: string): Promise<string> {
  if (!file.type.startsWith('audio/')) {
    throw new Error('O ficheiro tem de ser áudio (mp3).');
  }
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error(
      `Áudio com ${formatAudioSize(file.size)} — o limite é ${formatAudioSize(MAX_AUDIO_BYTES)}. Comprima ou corte a música.`
    );
  }
  const storage = getStorage();
  const path = `events/${uid}/music-${Date.now()}.mp3`;
  const snap = await uploadBytes(ref(storage, path), file, {
    contentType: file.type || 'audio/mpeg',
  });
  return getDownloadURL(snap.ref);
}

/** Apaga áudio antigo do NOSSO Storage (best-effort). Nunca toca em URLs externas. */
export async function deleteEventAudio(url: string | undefined | null): Promise<void> {
  if (!url || !url.includes('firebasestorage.googleapis.com')) return;
  try {
    const storage = getStorage();
    await deleteObject(ref(storage, url));
  } catch {
    /* best-effort */
  }
}

/** Diz se a track é um upload nosso (apagável/substituível). */
export function isOwnStorageAudio(url: string | undefined | null): boolean {
  return !!url && url.includes('firebasestorage.googleapis.com');
}
