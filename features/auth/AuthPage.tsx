import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  Diamond,
  Eye,
  EyeOff,
  Heart,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../components/FirebaseProvider';
import { SEO } from '../../components/SEO';
import { trackPixelCompleteRegistration } from '../../lib/metaPixel';
import { TERMS_VERSION } from '../../lib/legal';
import type { AccountType } from '../../types';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  // ?mode=signup (botão Cadastrar do navbar) abre direto no cadastro.
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // KYC: tipo de conta escolhido no cadastro (obrigatório no signup).
  const [accountType, setAccountType] = useState<AccountType>('client');
  const [agencyName, setAgencyName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [celebrantRole, setCelebrantRole] = useState('noiva');
  const [suggestLogin, setSuggestLogin] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  // `from` pode ser string ('/dashboard') ou objeto Location (ProtectedRoute passa
  // `state={{ from: location }}`). Normalizar para string antes de navegar.
  const rawFrom = (location.state as any)?.from;
  const fromPath: string =
    typeof rawFrom === 'string'
      ? rawFrom
      : typeof rawFrom?.pathname === 'string'
        ? `${rawFrom.pathname}${rawFrom.search || ''}${rawFrom.hash || ''}`
        : '/dashboard';

  const goDashboardFresh = () =>
    navigate('/dashboard', { state: { justRegistered: true }, replace: true });

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setSuggestLogin(false);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const { doc, setDoc, getDocFromServer } = await import('firebase/firestore');
      const userRef = doc(db, 'users', result.user.uid);
      // Verificar existência NO SERVIDOR: a cache local pode estar vazia/offline e
      // fingir que a ficha não existe — criar por cima apagaria um plano pago
      // (foi assim que contas premium "voltavam" a free em desenvolvimento).
      let exists = false;
      try {
        exists = (await getDocFromServer(userRef)).exists();
      } catch {
        // Servidor inalcançável (offline): NÃO tocar na ficha. O snapshot do
        // FirebaseProvider carrega o perfil real quando a rede voltar.
        navigate(fromPath, { replace: true });
        return;
      }
      if (!exists) {
          // Conta nova via Google: ficha mínima + KYC na tela /bem-vindo.
          // Só campos de CREATE: o update posterior é restrito pelas rules.
          await setDoc(userRef, {
              uid: result.user.uid,
              name: result.user.displayName || '',
              email: result.user.email || 'no-email@example.com',
              plan: 'free',
              termsVersion: TERMS_VERSION,
              acceptedTermsAt: new Date().toISOString(),
          }, { merge: true });
          try {
            trackPixelCompleteRegistration(
              { method: 'google' },
              { user_data: { email: result.user.email || undefined } },
            );
          } catch {
            /* pixel nunca bloqueia o cadastro */
          }
          navigate('/bem-vindo', { state: { from: fromPath, justRegistered: true }, replace: true });
          return;
      }
      navigate(fromPath, { replace: true });
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        console.error('Google Sign-in error:', err);
      }
      setError('Erro ao entrar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuggestLogin(false);

    // Guarda o uid criado para recuperação: se o Auth criou mas o Firestore
    // falhou, ainda navegamos (o seed do Provider completa a ficha).
    let createdUid: string | null = null;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate(fromPath, { replace: true });
      } else {
        if (!name.trim()) {
           setError('Por favor, informe seu nome.');
           setLoading(false);
           return;
        }
        if (accountType === 'professional' && !agencyName.trim()) {
           setError('Informe o nome da sua agência ou marca profissional.');
           setLoading(false);
           return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        createdUid = userCredential.user.uid;

        try {
          await updateProfile(userCredential.user, {
             displayName: name
          });
        } catch (profileErr) {
          // Não-bloqueante: o displayName pode ser completado depois.
          console.warn('updateProfile falhou (não-bloqueante):', profileErr);
        }

        const { doc, setDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', userCredential.user.uid);
        // KYC gravado já no cadastro: accountType + perfil conforme o tipo.
        // Estes campos estão na allow-list de UPDATE das rules.
        const kycFields: Record<string, unknown> = {
            accountType,
            kycStatus: 'declared',
            kycCompletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        if (accountType === 'professional') {
            kycFields.agencyName = agencyName.trim();
            if (phone.trim()) kycFields.phone = phone.trim();
            if (city.trim()) kycFields.city = city.trim();
        } else {
            kycFields.celebrantRole = celebrantRole;
            if (phone.trim()) kycFields.phone = phone.trim();
        }
        // Tentativa 1 (CREATE): ficha completa de conta nova. As rules de
        // create permitem campos extra (plan/terms), então incluímos aqui.
        try {
          await setDoc(userRef, {
              uid: userCredential.user.uid,
              name: name,
              email: email,
              plan: 'free',
              termsVersion: TERMS_VERSION,
              acceptedTermsAt: new Date().toISOString(),
              ...kycFields,
          }, { merge: true });
        } catch (createErr: any) {
          const code = createErr?.code || '';
          // Tentativa 2 (UPDATE): o auto-seed do FirebaseProvider pode ter
          // criado a ficha primeiro (race). Nesse caso o write é avaliado
          // como UPDATE, que PROÍBE plan/termsVersion/acceptedTermsAt.
          // Re-tenta só com campos da allow-list (+ uid/name/email iguais).
          if (code === 'permission-denied' || code === 'permission_denied' || /permission|denied/i.test(String(createErr?.message || ''))) {
            console.warn('setDoc create negado (provável race com seed), a tentar update-safe:', createErr);
            await setDoc(userRef, {
                uid: userCredential.user.uid,
                name: name,
                email: email,
                ...kycFields,
            }, { merge: true });
          } else {
            throw createErr;
          }
        }
        // Pixel fire-and-forget: nunca pode abortar o navigate.
        try {
          trackPixelCompleteRegistration(
            { method: 'email' },
            { user_data: { email } },
          );
        } catch {
          /* pixel bloqueado — segue para o dashboard na mesma */
        }

        goDashboardFresh();
      }
    } catch (err: any) {
      // Recuperação: conta Auth já existe mas Firestore falhou (offline,
      // permission transitória, etc). Não prender o user no /auth — o seed
      // do Provider completa a ficha; levar ao dashboard com boas-vindas.
      const authUidNow = auth.currentUser?.uid || createdUid;
      const isFirestoreAftermath =
        !!authUidNow &&
        !isLogin &&
        err?.code !== 'auth/email-already-in-use' &&
        !String(err?.code || '').startsWith('auth/');
      if (isFirestoreAftermath) {
        console.warn('Cadastro Auth OK mas Firestore falhou; a recuperar para o dashboard:', err);
        goDashboardFresh();
        return;
      }
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso. Tente fazer login.');
        setSuggestLogin(true);
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha inválidos.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido. Verifique e tente de novo.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde um pouco e tente de novo.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Sem ligação à internet. Verifique a rede e tente de novo.');
      } else {
        console.error('Registration/Login error:', err);
        setError('Ocorreu um erro. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuggestLogin(false);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-display">
      <SEO 
        title={isLogin ? "Acessar Conta | InoEvents" : "Criar Conta Premium | InoEvents"}
        description="Entre ou crie sua conta premium na InoEvents para começar a criar convites digitais de alta costura com RSVP integrado e cronograma personalizado."
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white px-8 py-10 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden"
      >
        <button type="button" onClick={() => navigate(-1)} className="absolute top-6 left-6 text-slate-400 hover:text-brand-blue transition-colors outline-none cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        
        <div className="text-center mb-8 mt-2">
          <Diamond size={36} className="text-primary text-4xl mb-2" />
          <h2 className="text-3xl font-serif font-bold text-brand-blue mb-2">
            {isLogin ? 'Bem-vindo de volta' : 'Criar Sua Conta'}
          </h2>
          <p className="text-slate-500 text-sm">
            {isLogin ? 'Entre para gerenciar seus eventos.' : 'Junte-se a nós para eventos memoráveis.'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleEmailAuth}>
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Seu Nome Completo" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-slate-700 text-sm"
                  required={!isLogin}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-slate-400" />
            </div>
            <input 
              type="email" 
              placeholder="Seu E-mail" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-slate-700 text-sm"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Sua Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-slate-700 text-sm"
              required
              minLength={6}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-brand-blue transition-colors outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {isLogin && (
            <div className="flex justify-end">
               <button type="button" className="text-xs font-semibold text-primary hover:text-brand-blue transition-colors">Esqueceu a senha?</button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="kyc-field"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vou usar como</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setAccountType('client')}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center transition-all cursor-pointer ${accountType === 'client' ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <Heart size={22} />
                    <span className="text-xs font-bold">Meu evento</span>
                    <span className="text-[10px] leading-tight opacity-70">O meu próprio evento</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('professional')}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center transition-all cursor-pointer ${accountType === 'professional' ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <Briefcase size={22} />
                    <span className="text-xs font-bold">Cerimonialista</span>
                    <span className="text-[10px] leading-tight opacity-70">Eventos de clientes</span>
                  </button>
                </div>
                {accountType === 'professional' ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nome da agência / marca *"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-slate-700 text-sm"
                      required={!isLogin}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="tel"
                        placeholder="WhatsApp (opcional)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-slate-700 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Cidade (opcional)"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-slate-700 text-sm"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">O plano Business (eventos ilimitados + marca própria) é ativado pela equipa após o pagamento — declarar o perfil não libera nada sozinho.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={celebrantRole}
                      onChange={(e) => setCelebrantRole(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-slate-700 text-sm cursor-pointer"
                      aria-label="Eu sou"
                    >
                      <option value="noiva">Sou a Noiva</option>
                      <option value="noivo">Sou o Noivo</option>
                      <option value="familia">Sou Família</option>
                      <option value="outro">Outro</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="WhatsApp (opcional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-slate-700 text-sm"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-center">
              {error}
              {suggestLogin && !isLogin && (
                <button
                  type="button"
                  onClick={toggleMode}
                  className="mt-2 w-full h-10 bg-brand-blue text-white font-bold rounded-xl text-sm hover:bg-brand-blue/90 transition-colors cursor-pointer"
                >
                  Fazer login com este e-mail
                </button>
              )}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-brand-blue text-white font-bold rounded-xl shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              isLogin ? 'Entrar na Conta' : 'Criar Minha Conta'
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Ou continue com</span></div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          type="button"
          disabled={loading}
          className="w-full h-12 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 disabled:opacity-70 flex items-center justify-center gap-3 transition-colors"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-slate-300 border-t-brand-blue rounded-full animate-spin" aria-hidden="true" />
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          )}
          {loading ? 'A entrar…' : isLogin ? 'Entrar com Google' : 'Cadastrar com Google'}
        </button>

        <div className="mt-8 text-center text-sm text-slate-500">
          {isLogin ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
          <button 
            type="button"
            onClick={toggleMode}
            className="ml-1 text-brand-blue font-bold hover:underline outline-none"
          >
            {isLogin ? 'Crie uma agora' : 'Faça login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
