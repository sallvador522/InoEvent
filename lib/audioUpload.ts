import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export const MAX_AUDIO_BYTES = 6 * 1024 * 1024;

export const formatAudioSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Sobe mp3 para o Storage (events/{uid}/music-*) e devolve URL pública. Teto 6MB. */
export async function uploadEventAudio(file: File, uid: string): Promise<string> {
  return uploadEventAudioWithProgress(file, uid);
}

/**
 * Igual ao uploadEventAudio mas reporta progresso 0-100 via onProgress
 * (para barra de estado no formulário — o utilizador aguarda o fim).
 */
export function uploadEventAudioWithProgress(
  file: File,
  uid: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  if (!file.type.startsWith('audio/')) {
    return Promise.reject(new Error('O ficheiro tem de ser áudio (mp3).'));
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return Promise.reject(
      new Error(
        `Áudio com ${formatAudioSize(file.size)} — o limite é ${formatAudioSize(MAX_AUDIO_BYTES)}. Comprima ou corte a música.`
      )
    );
  }
  const storage = getStorage();
  const path = `events/${uid}/music-${Date.now()}.mp3`;
  const task = uploadBytesResumable(ref(storage, path), file, {
    contentType: file.type || 'audio/mpeg',
  });
  onProgress?.(0);
  return new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => {
        const pct = snap.totalBytes > 0
          ? Math.min(100, Math.round((snap.bytesTransferred / snap.totalBytes) * 100))
          : 0;
        onProgress?.(pct);
      },
      (err) => reject(err instanceof Error ? err : new Error('Falha no envio do áudio.')),
      async () => {
        try {
          onProgress?.(100);
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (e) {
          reject(e instanceof Error ? e : new Error('Falha ao obter o áudio enviado.'));
        }
      },
    );
  });
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
