import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../../components/FirebaseProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import { Button } from '../../components/ui/Button';
import { normalizePlanId } from '../../lib/entitlements';
import { Building2, UploadCloud, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const CreateBusiness: React.FC = () => {
    const { user, userProfile } = useFirebase();
    const navigate = useNavigate();
    
    const [businessName, setBusinessName] = useState(userProfile?.whiteLabelName || '');
    const [businessLogo, setBusinessLogo] = useState(userProfile?.whiteLabelLogo || ''); // Handled as base64 data url for preview purposes
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!userProfile) return;
        if (normalizePlanId(userProfile.plan) !== 'business') {
            navigate('/dashboard');
        }
    }, [userProfile, navigate]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500 * 1024) {
                toast.error('A imagem deve ter no máximo 500KB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setBusinessLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !businessName) return;
        
        setIsSaving(true);
        try {
            const { getDoc, setDoc } = await import('firebase/firestore');
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email || 'no-email@example.com',
                    plan: normalizePlanId(userProfile?.plan),
                    whiteLabelName: businessName,
                    whiteLabelLogo: businessLogo
                });
            } else {
                await updateDoc(userRef, { 
                    whiteLabelName: businessName,
                    whiteLabelLogo: businessLogo 
                });
            }
            toast.success("Negócio criado com sucesso!");
            navigate('/dashboard'); // Go to UserDashboard
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar negócio.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col pt-12 items-center px-6 pb-24">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="max-w-xl w-full bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100"
            >
                <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mb-6">
                    <Building2 size={32} />
                </div>
                
                <button type="button" onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-800 font-medium flex items-center gap-2 mb-4 transition-colors outline-none cursor-pointer">
                    <ArrowRight size={16} className="rotate-180" /> Voltar
                </button>

                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                    {userProfile?.whiteLabelName ? 'Gerenciar Sua Empresa' : 'Criar Seu Negócio'}
                </h1>
                <p className="text-slate-500 mb-8">
                    {userProfile?.whiteLabelName ? 'Atualize as configurações da sua empresa (B2B).' : 'Configure sua empresa de eventos (B2B). Com isso, seus convites gerados exibirão a sua marca.'}
                </p>

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Nome da Empresa / Agência</label>
                        <input 
                            type="text" 
                            required
                            placeholder="Ex: Festas Incríveis Produções" 
                            value={businessName}
                            onChange={e => setBusinessName(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-blue/30 focus:bg-white transition-all font-medium text-slate-800" 
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Logo da Empresa (Até 500KB)</label>
                        <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden relative group">
                                {businessLogo ? (
                                    <img src={businessLogo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <UploadCloud size={24} />
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">Faça o upload do logo</p>
                                <p className="text-xs text-slate-500 mt-1">Sua marca será exibida no rodapé dos convites gerados por você.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <Button fullWidth disabled={isSaving} type="submit" className="h-12 flex items-center justify-center gap-2">
                           {isSaving ? (
                             <>
                               <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                               Salvando…
                             </>
                           ) : (
                             <>{userProfile?.whiteLabelName ? 'Salvar Configurações' : 'Criar Meu Negócio'} <ArrowRight size={18} /></>
                           )}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
