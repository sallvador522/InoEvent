import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFirebase } from './FirebaseProvider';
import { toast } from 'react-hot-toast';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useFirebase();
  const location = useLocation();

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'antoniosalvador522@gmail.com';
  const isAdmin = user?.email?.toLowerCase() === 'antoniosalvador522@gmail.com' || user?.email === adminEmail;
  
  React.useEffect(() => {
    if (user && !isAdmin && !loading) {
      toast.error('Acesso negado: Somente administradores podem acessar esta página.');
    }
  }, [user, isAdmin, loading]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
