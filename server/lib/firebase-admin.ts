/**
 * Firebase Admin SDK initialization & shared database helpers.
 * Centralizes all Firebase Admin setup so route modules can import getDb/getEventDetails
 * without duplicating initialization logic.
 */
import path from 'path';
import fs from 'fs';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '../../lib/logger.js';

// --- Firebase Config ---
let firebaseConfig: Record<string, string> | null = null;
try {
  firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
} catch (e) {
  logger.error('Failed to load firebase-applet-config.json on boot', { category: 'SYSTEM', data: e });
}

// --- Firebase Admin Initialization ---
try {
  if (admin.apps.length === 0) {
    let credential;
    const projectId = firebaseConfig ? firebaseConfig.projectId : process.env.GOOGLE_CLOUD_PROJECT || 'dummy-project';
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        credential = admin.credential.cert(serviceAccount);
        logger.info("Inicializando Firebase Admin usando FIREBASE_SERVICE_ACCOUNT_KEY (JSON).", { category: 'DATABASE' });
      } catch (e: any) {
        logger.error("Erro ao fazer parse de FIREBASE_SERVICE_ACCOUNT_KEY:", { category: 'DATABASE', data: e?.message });
      }
    } 
    else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      try {
        const formattedPrivateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        credential = admin.credential.cert({
          projectId: projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: formattedPrivateKey,
        });
        logger.info("Inicializando Firebase Admin usando credenciais individuais de variáveis de ambiente.", { category: 'DATABASE' });
      } catch (e: any) {
        logger.error("Erro ao configurar credenciais individuais do Firebase:", { category: 'DATABASE', data: e?.message });
      }
    } else {
      credential = admin.credential.applicationDefault();
      logger.info("Inicializando Firebase Admin usando credenciais padrão do ambiente (Application Default Credentials).", { category: 'DATABASE' });
    }

    admin.initializeApp({
      credential,
      projectId: projectId,
    });
  }
  const dbId = firebaseConfig ? firebaseConfig.firestoreDatabaseId : undefined;
  if (dbId && dbId !== '(default)') {
    try {
      const dbInstance = admin.firestore();
      dbInstance.settings({ databaseId: dbId });
    } catch (settingsError) {
      logger.warn("Revertendo para inicialização padrão do Firestore devido a erro de configuração:", {
        category: 'DATABASE',
        data: settingsError
      });
      admin.firestore();
    }
  } else {
    admin.firestore();
  }
  logger.success("SDK do Firebase Admin Firestore inicializado com sucesso.", { category: 'DATABASE' });
} catch (error) {
  logger.error("Erro crítico ao inicializar SDK do Firebase Admin:", {
    category: 'DATABASE',
    data: error
  });
}

import { initializeApp as initClientApp } from 'firebase/app';
import { initializeFirestore as initClientFirestore, collection as clientCollection, getDocs as clientGetDocs } from 'firebase/firestore';

let clientDbInstance: any = null;

export function getClientDb() {
  if (!clientDbInstance && firebaseConfig) {
    try {
      const clientApp = initClientApp(firebaseConfig, 'server-client-fallback');
      clientDbInstance = initClientFirestore(clientApp, {}, firebaseConfig.firestoreDatabaseId);
    } catch (e) {
      logger.error('Failed to initialize Client Firestore SDK on server', { category: 'DATABASE', data: e });
    }
  }
  return clientDbInstance;
}

export async function fetchFirestoreGuestsWebSDK(eventId: string) {
  try {
    const cDb = getClientDb();
    if (!cDb) return [];
    const guestsRef = clientCollection(cDb, 'events', eventId, 'guests');
    const snap = await clientGetDocs(guestsRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err: any) {
    logger.error(`Error fetching guests via Client Web SDK on server for ${eventId}`, { category: 'DATABASE', data: err?.message || err });
    return [];
  }
}

// --- Database Helpers ---

/** Returns the Firestore instance configured for the correct database ID. */
export function getDb() {
  const dbId = firebaseConfig ? firebaseConfig.firestoreDatabaseId : undefined;
  if (dbId && dbId !== '(default)') {
    return getFirestore(undefined, dbId);
  }
  return getFirestore();
}

/** Fetches event details via Firestore REST API (public, no auth required). */
export async function getEventDetails(eventId: string) {
  try {
    const dbId = (firebaseConfig && firebaseConfig.firestoreDatabaseId) ? firebaseConfig.firestoreDatabaseId : '(default)';
    const projectId = (firebaseConfig && firebaseConfig.projectId) ? firebaseConfig.projectId : process.env.GOOGLE_CLOUD_PROJECT || 'dummy-project';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/events/${eventId}`;
    const res = await fetch(url);
    if (!res.ok) {
        return null;
    }
    const data = await res.json();
    if (data.fields) {
        const parseValue = (val: any): any => {
            if (val.stringValue !== undefined) return val.stringValue;
            if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
            if (val.booleanValue !== undefined) return val.booleanValue;
            if (val.arrayValue !== undefined) {
               return (val.arrayValue.values || []).map(parseValue);
            }
            if (val.mapValue !== undefined) {
               const map: any = {};
               for (const key in val.mapValue.fields) {
                   map[key] = parseValue(val.mapValue.fields[key]);
               }
               return map;
            }
            return null;
        };
        const parsedData: any = {};
        for (const key in data.fields) {
            parsedData[key] = parseValue(data.fields[key]);
        }
        return parsedData;
    }
  } catch (error) {
    logger.error(`Erro ao buscar detalhes do evento ID ${eventId}:`, { category: 'DATABASE', data: error });
  }
  return null;
}

// --- Local JSON DB Fallback ---
const LOCAL_DB_PATH = path.join(process.cwd(), 'local_guests_db.json');

export function readLocalGuests(eventId: string): any[] {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      return [];
    }
    const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8'));
    return data[eventId] || [];
  } catch (e) {
    return [];
  }
}

export function writeLocalGuest(eventId: string, guest: any) {
  try {
    let data: any = {};
    if (fs.existsSync(LOCAL_DB_PATH)) {
      data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8'));
    }
    if (!data[eventId]) {
      data[eventId] = [];
    }
    const idx = data[eventId].findIndex((g: any) => g.id === guest.id || (g.phone && g.phone === guest.phone));
    if (idx !== -1) {
      data[eventId][idx] = { ...data[eventId][idx], ...guest };
    } else {
      data[eventId].push(guest);
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    logger.error('Failed to write to local guests database:', { category: 'SYSTEM', data: e });
  }
}

export { admin, firebaseConfig };
