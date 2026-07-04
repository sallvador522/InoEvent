import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, getDocFromServer, initializeFirestore, setLogLevel, updateDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Enable Firestore Local Cache Offline Persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log('[InoEvents Offline Sync] Persistência do cache local do Firestore ativada.');
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('[InoEvents Offline Sync] Múltiplas abas abertas, persistência ativada em apenas uma delas.');
      } else if (err.code === 'unimplemented') {
        console.warn('[InoEvents Offline Sync] Navegador sem suporte para persistência do Firestore.');
      } else {
        console.error('[InoEvents Offline Sync] Falha ao configurar persistência offline do Firestore:', err);
      }
    });
}

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

  console.error('Firestore Error: ', JSON.stringify(errInfo));

  if (isNetworkOrOffline) {
    console.warn(`[InoEvents Offline Sync] Operação Firestore em modo offline (${operationType} em ${path}). O aplicativo continuará a funcionar usando cache.`);
    return;
  }

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
  } catch (e) {}
  return null;
};

const getCachedProfile = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem('ino_events_profile_cache');
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return null;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getCachedUser());
  const [loading, setLoading] = useState(!getCachedUser());
  const [userProfile, setUserProfile] = useState<any | null>(getCachedProfile());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
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
      } else {
        localStorage.removeItem('ino_events_user_cache');
        localStorage.removeItem('ino_events_profile_cache');
      }
      setUser(user);
      setLoading(false);
    }, (error) => {
      console.warn('Auth State Error (Normal for iframe previews): ', error);
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
        if (uData.plan && uData.plan !== 'Essencial' && uData.plan !== 'Free' && uData.planExpiresAt) {
          const expiresAtDate = new Date(uData.planExpiresAt);
          if (expiresAtDate < new Date()) {
             console.warn("Plan expired, changing to Essencial");
             uData = { ...uData, plan: 'Essencial', planExpiresAt: null };
             updateDoc(doc(db, 'users', snapshot.id), { plan: 'Essencial', planExpiresAt: null }).catch(console.error);
          }
        }
        localStorage.setItem('ino_events_profile_cache', JSON.stringify(uData));
        setUserProfile(uData);

      } else {
        setUserProfile(null);
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
