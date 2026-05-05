import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../components/FirebaseProvider';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Erro ao entrar com Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-display">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden"
      >
        <Link to="/" className="absolute top-6 left-6 text-slate-400 hover:text-brand-blue transition-colors">
          <ArrowLeft size={20} />
        </Link>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-brand-blue mb-2">
            {isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}
          </h2>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full h-12 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2 mb-4"
        >
          <Mail className="w-5 h-5 text-gray-500" />
          Entrar com Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Ou</span></div>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* ... (keep form structure for email/pass if needed, though with Google login we might skip) */}
        </form>
      </motion.div>
    </div>
  );
};
