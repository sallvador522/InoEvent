import React from 'react';
import { useFirebase } from './FirebaseProvider';
import { NotFound } from './NotFound';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useFirebase();

  const adminEmail = (import.meta as any).env.VITE_ADMIN_EMAIL || 'antoniosalvador522@gmail.com';
  const isAdmin = user?.email?.toLowerCase() === 'antoniosalvador522@gmail.com' || user?.email === adminEmail;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFBF7]" id="admin-loader">
        <div className="relative w-10 h-10 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-t-2 border-slate-900 animate-spin" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-medium animate-pulse">
          A verificar credenciais...
        </span>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <NotFound />;
  }

  return <>{children}</>;
};

