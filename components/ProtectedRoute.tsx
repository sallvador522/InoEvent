import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFirebase } from './FirebaseProvider';

const AuthLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#FDFBF7]" role="status" aria-live="polite">
    <div className="relative w-10 h-10 mb-4">
      <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
      <div className="absolute inset-0 rounded-full border-t-2 border-[#1B365D] animate-spin" />
    </div>
    <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-medium animate-pulse">
      A verificar sessão…
    </span>
  </div>
);

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useFirebase();
  const location = useLocation();

  if (loading) {
    return <AuthLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
