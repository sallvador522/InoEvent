import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFirebase, db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { doc, setDoc, collection, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const EventCreator: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryObj = new URLSearchParams(location.search);
    const initialTemplate = queryObj.get('template');
    
    const { user, userProfile } = useFirebase();
    const isBridalShower = location.pathname.includes('bridal');

    const [isLoading, setIsLoading] = useState(false);
    const [selectedLayout, setSelectedLayout] = useState(initialTemplate || (isBridalShower ? 'BRIDAL_ROMANTIC' : 'ESSENTIAL'));
    const [title, setTitle] = useState(isBridalShower ? 'Chá de Panela' : 'João & Maria');
    const [date, setDate] = useState('');
    const autoCreateAttempted = useRef(false);

    const handleCreate = async (autoDate = date, autoTitle = title) => {
        if (!autoDate || !autoTitle) {
            toast.error('Preencha o título e a data.');
            return;
        }
        if (!user) {
            toast.error('Você precisa estar logado.');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('A preparar o seu template...');

        try {
            if (userProfile?.plan !== 'Business' && userProfile?.plan !== 'Corporate') {
                const creditCost = 2; // FIX: Every event costs 2 credits
                if ((userProfile?.credits || 0) < creditCost) {
                    toast.error('Créditos insuficientes.', { id: toastId });
                    setIsLoading(false);
                    return;
                }
                const newCredits = (userProfile?.credits || 0) - creditCost;
                await updateDoc(doc(db, 'users', user.uid), { credits: newCredits });
                
                const newTransRef = doc(collection(db, 'transactions'));
                await setDoc(newTransRef, {
                    ownerId: user.uid,
                    amount: creditCost,
                    type: 'DEBIT',
                    description: `Criação do evento: ${autoTitle}`,
                    date: new Date().toISOString(),
                    eventId: newTransRef.id
                });
            }

            const newEventId = "evt_" + Math.random().toString(36).substr(2, 9);
            const docRef = doc(db, 'events', newEventId);
            
            await setDoc(docRef, {
                title: autoTitle,
                date: autoDate,
                time: '18:00',
                type: isBridalShower ? 'BRIDAL_SHOWER' : 'WEDDING',
                layoutMode: selectedLayout,
                ownerId: user.uid,
                plan: userProfile?.plan || 'Essencial',
                createdAt: new Date().toISOString(),
                description: 'Estamos ansiosos para celebrar este momento com você!',
                locationName: 'Local do Evento',
                address: 'Morada'
            });

            toast.success('Template gerado!', { id: toastId });
            navigate(`/invite/${newEventId}?edit=true`);
        } catch (err: any) {
             console.error(err);
             toast.error('Erro ao criar evento.', { id: toastId });
        } finally {
             setIsLoading(false);
        }
    };

    useEffect(() => {
        if (initialTemplate && user && userProfile && !autoCreateAttempted.current) {
            autoCreateAttempted.current = true;
            // Generate a default date (e.g., 30 days from now)
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            const formattedDate = futureDate.toISOString().split('T')[0];
            
            if (!date) setDate(formattedDate);
            
            // Trigger automatic creation
            handleCreate(formattedDate, isBridalShower ? 'Meu Chá de Panela' : 'João & Maria');
        }
    }, [initialTemplate, user, userProfile]);

    if (initialTemplate && (!autoCreateAttempted.current || isLoading)) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold font-sans text-slate-800">A preparar o seu template...</h2>
                <p className="text-slate-500 mt-2">Isto pode demorar alguns segundos.</p>
            </div>
        );
    }

    if (initialTemplate && autoCreateAttempted.current && !isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                 <div className="text-4xl mb-4">⚠️</div>
                 <h2 className="text-xl font-bold font-sans text-slate-800 mb-2">Ação Interrompida</h2>
                 <p className="text-slate-500 mb-6">Não foi possível criar o seu convite. Verifique se possui créditos suficientes ou o seu plano atual.</p>
                 <button onClick={() => navigate('/plans')} className="px-6 py-3 bg-brand-blue text-white rounded-full font-bold shadow-lg">Ver Planos e Créditos</button>
                 <button onClick={() => navigate(-1)} className="mt-4 px-6 py-3 bg-white text-slate-600 rounded-full font-bold border border-slate-200">Voltar</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100"
            >
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-serif text-slate-800 mb-2">Novo {isBridalShower ? 'Chá de Panela' : 'Casamento'}</h1>
                    <p className="text-slate-500 text-sm">Configure o básico. O resto fará diretamente no convite (edição visual inline).</p>
                </div>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Título do Evento</label>
                        <input 
                            className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-brand-blue outline-none" 
                            value={title} onChange={(e) => setTitle(e.target.value)} 
                            placeholder={isBridalShower ? 'Chá de Panela da...' : 'Nome 1 & Nome 2'} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Data</label>
                        <input 
                            type="date"
                            className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-brand-blue outline-none" 
                            value={date} onChange={(e) => setDate(e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tema / Layout Inicial</label>
                        <select 
                            className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-brand-blue outline-none"
                            value={selectedLayout} 
                            onChange={(e) => setSelectedLayout(e.target.value)}
                        >
                            {isBridalShower ? (
                                <>
                                    <option value="BRIDAL_ROMANTIC">Romântico (Padrão)</option>
                                    <option value="BRIDAL_MINIMAL">Minimalista</option>
                                    <option value="BRIDAL_RUSTIC">Rústico</option>
                                </>
                            ) : (
                                <>
                                    <option value="ESSENTIAL">Essencial (Limpo & Rápido)</option>
                                    <option value="CLASSIC">Clássico Romântico</option>
                                    <option value="MODERN">Moderno / Minimalista</option>
                                    <option value="GARDEN">Jardim / Elegante</option>
                                    <option value="RUSTIC">Rústico / Natural</option>
                                    <option value="INDUSTRIAL">Industrial / Editorial</option>
                                    <option value="LUXURY">Luxo Formal</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>

                <button 
                  onClick={handleCreate} 
                  disabled={isLoading}
                  className="w-full bg-brand-blue text-white rounded-full py-4 font-bold text-sm hover:bg-brand-blue/90 disabled:opacity-50"
                >
                  {isLoading ? 'A preparar espaço de trabalho...' : 'Criar e Entrar no Modo de Edição'}
                </button>
            </motion.div>
        </div>
    );
};
