import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Briefcase } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db, useFirebase } from '../../components/FirebaseProvider';
import { SEO } from '../../components/SEO';
import toast from 'react-hot-toast';
import type { AccountType } from '../../types';

/**
 * KYC pós-cadastro (Google) e completar perfil (contas antigas).
 * Grava accountType + perfil via merge — rules permitem ao dono editar
 * estes campos; upgrade client→professional livre, downgrade só via admin.
 */
export const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useFirebase();
  const from = (location.state as any)?.from || '/dashboard';

  const [accountType, setAccountType] = useState<AccountType>('client');
  const [agencyName, setAgencyName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [celebrantRole, setCelebrantRole] = useState('noiva');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }
    if (accountType === 'professional' && !agencyName.trim()) {
      toast.error('Informe o nome da sua agência ou marca profissional.');
      return;
    }
    setSaving(true);
    try {
      const fields: Record<string, unknown> = {
        accountType,
        kycStatus: 'declared',
        kycCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (accountType === 'professional') {
        fields.agencyName = agencyName.trim();
        if (phone.trim()) fields.phone = phone.trim();
        if (city.trim()) fields.city = city.trim();
      } else {
        fields.celebrantRole = celebrantRole;
        if (phone.trim()) fields.phone = phone.trim();
      }
      await setDoc(doc(db, 'users', user.uid), fields, { merge: true });
      toast.success(accountType === 'professional' ? 'Perfil profissional pronto!' : 'Perfil pronto!');
      navigate(from, { replace: true });
    } catch {
      toast.error('Não foi possível guardar. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-display">
      <SEO title="O teu perfil | InoEvents" description="Diz-nos como vais usar a InoEvents para personalizarmos a tua experiência." />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white px-8 py-10 rounded-3xl shadow-xl border border-slate-100"
      >
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-primary text-4xl mb-2">diamond</span>
          <h2 className="text-3xl font-serif font-bold text-brand-blue mb-2">Como vais usar?</h2>
          <p className="text-slate-500 text-sm">Escolhe o teu perfil para personalizarmos tudo.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setAccountType('client')}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-5 text-center transition-all cursor-pointer ${accountType === 'client' ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
          >
            <Heart size={26} />
            <span className="text-sm font-bold">Noivo(a) / Família</span>
            <span className="text-[11px] leading-tight opacity-70">O meu próprio evento</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountType('professional')}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-5 text-center transition-all cursor-pointer ${accountType === 'professional' ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
          >
            <Briefcase size={26} />
            <span className="text-sm font-bold">Cerimonialista</span>
            <span className="text-[11px] leading-tight opacity-70">Eventos de clientes</span>
          </button>
        </div>

        {accountType === 'professional' ? (
          <div className="space-y-3 mb-6">
            <input
              type="text"
              placeholder="Nome da agência / marca *"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-slate-700 text-sm"
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
            <p className="text-[11px] text-slate-400 leading-relaxed">O plano Business é ativado pela equipa após o pagamento — declarar o perfil não libera nada sozinho.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-6">
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

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 bg-brand-blue text-white font-bold rounded-xl shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {saving ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Continuar'
          )}
        </button>
      </motion.div>
    </div>
  );
};
