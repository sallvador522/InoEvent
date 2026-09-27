import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, signOut, useFirebase } from '../../components/FirebaseProvider';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { TERMS_VERSION_LABEL } from '../../lib/legal';
import toast from 'react-hot-toast';

/**
 * Privacidade (LGPD auto-atendimento): exportar meus dados + apagar conta.
 * Apagar é IRREVERSÍVEL: confirmação dupla (checkbox + digitar APAGAR).
 */
export const PrivacyPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useFirebase();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [ack, setAck] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleExport = async () => {
    if (!auth.currentUser || exporting) return;
    setExporting(true);
    const toastId = toast.loading('A reunir os teus dados…');
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/privacy/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('export failed');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inoevents-meus-dados-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Dados exportados!', { id: toastId });
    } catch {
      toast.error('Não foi possível exportar. Tente de novo.', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!auth.currentUser || deleting) return;
    if (!ack || confirmText.trim().toUpperCase() !== 'APAGAR') {
      toast.error('Confirma os dois passos para apagar.');
      return;
    }
    if (!window.confirm('ÚLTIMA CONFIRMAÇÃO: apagar conta, eventos, convidados e tudo? Não há volta.')) return;
    setDeleting(true);
    const toastId = toast.loading('A apagar todos os teus dados…');
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/privacy/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirm: 'APAGAR' }),
      });
      if (!res.ok) throw new Error('delete failed');
      toast.success('Conta apagada. Até um dia!', { id: toastId });
      try {
        await signOut(auth);
      } catch { /* sessão morre na mesma */ }
      navigate('/', { replace: true });
    } catch {
      toast.error('Não foi possível apagar. Fale connosco.', { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-display text-slate-900 flex flex-col">
      <SEO title="Privacidade e meus dados | InoEvents" description="Exporta ou apaga os teus dados na InoEvents." />
      <Navbar />
      <main className="max-w-2xl mx-auto w-full px-4 py-10 pt-28 flex-1">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-blue text-sm font-bold mb-6 cursor-pointer">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck size={28} className="text-brand-blue" />
          <h1 className="text-3xl font-serif font-bold text-[#1B365D]">Privacidade e meus dados</h1>
        </div>
        <p className="text-slate-500 text-sm mb-1">Conta: <strong>{user?.email || (userProfile as any)?.email || ''}</strong></p>
        <p className="text-slate-400 text-xs mb-8">Termos aceites: versão {TERMS_VERSION_LABEL}{(userProfile as any)?.acceptedTermsAt ? ` em ${new Date((userProfile as any).acceptedTermsAt).toLocaleDateString('pt-AO')}` : ''}</p>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4 shadow-sm">
          <h2 className="font-bold text-lg mb-1">Cookies e tracking</h2>
          <p className="text-sm text-slate-500 mb-4">Escolhe se permites medição de visitas e Pixel. A app funciona igual.</p>
          <button
            onClick={() => window.dispatchEvent(new Event('ino:open-consent'))}
            className="inline-flex items-center gap-2 px-5 h-12 rounded-full border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
          >
            Gerir cookies
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4 shadow-sm">
          <h2 className="font-bold text-lg mb-1">Exportar meus dados</h2>
          <p className="text-sm text-slate-500 mb-4">Descarrega tudo o que temos sobre ti (perfil, eventos, convidados, pedidos, tickets) em JSON.</p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-5 h-12 rounded-full bg-[#1B365D] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#224373] disabled:opacity-60 cursor-pointer"
          >
            <Download size={16} /> {exporting ? 'A exportar…' : 'Exportar JSON'}
          </button>
        </div>

        <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-1 text-red-700">Apagar minha conta</h2>
          <p className="text-sm text-slate-500 mb-4">
            Apaga conta, eventos, convidados, pedidos pendentes, tickets e ficheiros. Pedidos pagos viram registo anónimo (obrigação fiscal).
            <strong className="text-red-600"> Irreversível.</strong>
          </p>
          <label className="flex items-start gap-2 text-sm text-slate-600 mb-3 cursor-pointer">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1 w-4 h-4 accent-red-600" />
            Entendo que tudo será apagado para sempre.
          </label>
          <input
            type="text"
            placeholder='Escreve APAGAR para confirmar'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-3 mb-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-400"
          />
          <button
            onClick={handleDelete}
            disabled={deleting || !ack || confirmText.trim().toUpperCase() !== 'APAGAR'}
            className="inline-flex items-center gap-2 px-5 h-12 rounded-full bg-red-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 size={16} /> {deleting ? 'A apagar…' : 'Apagar tudo'}
          </button>
        </div>
      </main>
    </div>
  );
};
