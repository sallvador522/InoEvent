/**
 * Firebase context shell — ZERO Firebase SDK imports.
 *
 * This module is safe to import from the critical path (landing, App shell,
 * route guards): it never pulls `firebase/*` into the bundle. The real
 * `FirebaseProvider` (which owns the SDK) provides the same context value
 * once loaded; `index.tsx` renders a lightweight stub synchronously (cached
 * user from localStorage) and swaps in the real provider in the background.
 *
 * Files that touch `db`/`auth` directly keep importing from
 * `./FirebaseProvider` (their chunks need the SDK anyway).
 */
import { createContext, useContext } from 'react';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirebaseContextType {
  // `user` is typed loosely on purpose: the real provider sets the Firebase
  // `User`, the boot stub sets the localStorage-cached shape. Consumers only
  // read `uid`/`email`/etc., which both shapes carry.
  user: any | null;
  loading: boolean;
  userProfile: any | null;
  isOnline: boolean;
}

export const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  userProfile: null,
  isOnline: true,
});

export const useFirebase = () => useContext(FirebaseContext);
