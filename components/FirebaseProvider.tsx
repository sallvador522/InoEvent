import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, getDocFromServer, initializeFirestore, setLogLevel, setDoc, updateDoc, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { logger } from '../lib/logger';
import { normalizePlanId } from '../config/plans';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);

setLogLevel('error');



export { signOut };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isNetworkOrOffline = 
    errorMessage.includes('network-request-failed') ||
    errorMessage.includes('Could not reach Cloud Firestore backend') ||
    errorMessage.includes('offline') ||
    errorMessage.includes('unavailable') ||
    errorMessage.includes('Connection failed') ||
    errorMessage.includes('auth/network-request-failed');

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isNetworkOrOffline) {
    logger.warn(`Operação Firestore em modo offline (${operationType} em ${path}). O aplicativo continuará a funcionar usando cache local.`, {
      category: 'DATABASE',
      data: errInfo
    });
    return;
  }

  logger.error(`Falha na operação Firestore [${operationType.toUpperCase()}] em [${path || 'unknown_path'}]: ${errorMessage}`, {
    category: 'DATABASE',
    data: errInfo
  });

  throw new Error(JSON.stringify(errInfo));
}

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  userProfile: any | null;
  isOnline: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({ user: null, loading: true, userProfile: null, isOnline: true });


const getCachedUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem('ino_events_user_cache');
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.debug('[InoEvents] Erro ao ler cache de utilizador', e);
  }
  return null;
};

const getCachedProfile = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem('ino_events_profile_cache');
    if (cached) return JSON.parse(cached);
  } catch (e) {
    logger.debug('Erro ao ler cache de perfil', { category: 'SYSTEM', data: e });
  }
  return null;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getCachedUser());
  const [loading, setLoading] = useState(!getCachedUser());
  const [userProfile, setUserProfile] = useState<any | null>(getCachedProfile());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      setIsOnline(true);
      logger.success('Dispositivo restabeleceu ligação à Internet.', { category: 'SYSTEM' });
    };
    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('Dispositivo offline. Ativando cache offline do Firestore.', { category: 'SYSTEM' });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        localStorage.setItem('ino_events_user_cache', JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, isAnonymous: user.isAnonymous, emailVerified: user.emailVerified }));
        logger.info(`Utilizador autenticado com sucesso: ${user.email}`, { category: 'AUTH' });
      } else {
        localStorage.removeItem('ino_events_user_cache');
        localStorage.removeItem('ino_events_profile_cache');
        logger.info('Utilizador não autenticado ou sessão encerrada.', { category: 'AUTH' });
      }
      setUser(user);
      setLoading(false);
    }, (error) => {
      logger.warn('Erro na monitorização de estado da Auth (Normal em previews do iframe):', { category: 'AUTH', data: error });
      localStorage.removeItem('ino_events_user_cache');
      localStorage.removeItem('ino_events_profile_cache');
      setUser(null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (snapshot: any) => {
      if (snapshot.exists()) {
        
        let uData = snapshot.data();
        // Plano pago com validade passada → mostra free (não grava: a ficha mantém
        // os valores originais). Usa o normalizador central: cobre 'Essencial'/
        // 'Corporate'/legados em qualquer capitalização (antes o lower() manual
        // deixava 'Essencial' escapar da expiração).
        if (uData.planExpiresAt) {
          const paidPlans = ['essential', 'premium', 'vip', 'business'];
          const pid = normalizePlanId(uData.plan);
          if (paidPlans.includes(pid)) {
            const expiresAtDate = new Date(uData.planExpiresAt);
            if (expiresAtDate < new Date()) {
               logger.warn('O plano pago do utilizador expirou, revertendo para Free de forma segura.', { category: 'AUTH' });
               uData = { ...uData, plan: 'free', planExpiresAt: null };
            }
          }
        }
        localStorage.setItem('ino_events_profile_cache', JSON.stringify(uData));
        setUserProfile(uData);

      } else {
        // Ficha inexistente com login válido (conta antiga/migrada ou registo
        // interrompido): cria a mínima com plano free em vez de deixar o perfil
        // null para sempre (era isso que prendia selos em "…"). Merge: nunca apaga.
        const seed: any = {
          uid: user.uid,
          email: user.email || 'no-email@example.com',
          plan: 'free',
        };
        if (user.displayName) seed.name = user.displayName;
        setDoc(doc(db, 'users', user.uid), seed, { merge: true }).catch((e) => {
          logger.warn('Não foi possível criar a ficha do utilizador:', { category: 'AUTH', data: e });
        });
        setUserProfile((prev: any) => prev ?? { ...seed });
      }
    }, (error: any) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });
    return unsubscribeProfile;
  }, [user]);

  return (
    <FirebaseContext.Provider value={{ user, loading, userProfile, isOnline }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
