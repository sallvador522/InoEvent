import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFirebase, db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const BridalShowerCreator: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user, userProfile } = useFirebase();
    const [formData, setFormData] = useState({
        type: 'BRIDAL_SHOWER',
        brideName: '',
        date: '',
        time: '',
        locationName: '',
        description: 'Você é uma pessoa muito especial na minha vida e por isso, quero que esteja presente no meu chá de panela!\n\nVamos reunir a mulherada e comemorar!',
        layoutMode: new URLSearchParams(window.location.search).get('template') || 'BRIDAL_ROMANTIC'
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(!!id);

    useEffect(() => {
        const loadEvent = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, 'events', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        type: 'BRIDAL_SHOWER',
                        brideName: data.brideName || '',
                        date: data.date || '',
                        time: data.time || '',
                        locationName: data.locationName || '',
                        description: data.description || '',
                        layoutMode: data.layoutMode || 'BRIDAL_ROMANTIC'
                    });
                }
            } catch (error) {
                handleFirestoreError(error, OperationType.GET, `events/${id}`);
                toast.error("Erro ao carregar os dados do evento.");
            } finally {
                setIsLoading(false);
            }
        };
        loadEvent();
    }, [id]);
    
    const handleSubmit = async () => {
        if (!formData.brideName) {
            toast.error('Por favor, preencha o nome da homenageada!');
            return;
        }

        if (!formData.date || !formData.locationName || !formData.time) {
            toast.error('Por favor, preencha a Data, Hora e o Local!');
            return;
        }

        if (!user) {
            toast.error('Você precisa estar logado para salvar um evento.');
            return;
        }

        const isNewEvent = !id;
        setIsSaving(true);
        try {
            const eventTitle = `Chá de Panela da ${formData.brideName}`.substring(0, 100);
            const isoDateStr = formData.date && formData.time ? new Date(`${formData.date}T${formData.time}:00`).toISOString() : new Date().toISOString();
            
            const finalData: any = { 
                ...formData, 
                type: 'BRIDAL_SHOWER',
                title: eventTitle,
                isoDate: isoDateStr,
                ownerId: user.uid,
                whiteLabelName: (userProfile?.plan === 'Business' || userProfile?.plan === 'Corporate') ? (userProfile?.whiteLabelName || null) : null,
                whiteLabelLogo: (userProfile?.plan === 'Business' || userProfile?.plan === 'Corporate') ? (userProfile?.whiteLabelLogo || null) : null,
            };
            
            if (isNewEvent) {
                finalData.createdAt = new Date().toISOString();
                const newEventId = "evt_" + Math.random().toString(36).substr(2, 9);
                const docRef = doc(db, 'events', newEventId);
                await setDoc(docRef, finalData);
                navigate(`/invite/${newEventId}`);
            } else {
                const docRef = doc(db, 'events', id);
                await updateDoc(docRef, finalData);
                navigate(`/invite/${id}`);
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'events');
            toast.error('Erro ao salvar o evento.');
        } finally {
            setIsSaving(false);
        }
    }
    
    if (isLoading) {
        return (
            <div className="min-h-screen bg-pink-50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-pink-50/30 p-6 md:p-12 font-sans">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-sm border border-pink-100"
            >
                <div className="flex items-center mb-8">
                    <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 text-slate-400 hover:text-pink-500 transition-colors mr-4">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-serif text-slate-900">{id ? "Editar Chá de Panela" : "Novo Chá de Panela"}</h1>
                        <p className="text-sm text-slate-500 mt-1">Preencha os detalhes do convite.</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identidade Visual</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { mode: 'BRIDAL_BEAUTY', label: 'Tema 1 (Floral Suave)', preview: '/bridal-templates/templateCha1.png' },
                                { mode: 'BRIDAL_TEA_PARTY', label: 'Tema 2 (Romântico Rosa)', preview: '/bridal-templates/templateCha2.png' },
                                { mode: 'BRIDAL_MINIMAL', label: 'Tema 3 (Minimalista Nuvem)', preview: '/bridal-templates/templateCha3.png' },
                                { mode: 'BRIDAL_CHEF', label: 'Tema 4 (Pêssego)', preview: '/bridal-templates/templateCha4.png' }
                            ].map(theme => (
                                <button 
                                    key={theme.mode}
                                    onClick={() => setFormData({...formData, layoutMode: theme.mode})}
                                    className={`p-2 rounded-xl border-2 text-center text-xs font-bold transition-all relative overflow-hidden group flex flex-col items-center gap-2 ${formData.layoutMode === theme.mode ? 'border-pink-400 bg-pink-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                >
                                    <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-slate-50 relative">
                                        <img src={theme.preview} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={theme.label} />
                                    </div>
                                    <span className={formData.layoutMode === theme.mode ? 'text-pink-500' : 'text-slate-500'}>{theme.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nome da Noiva/Homenageada</label>
                            <input type="text" placeholder="Ex: Jussineide" value={formData.brideName} onChange={e => setFormData({...formData, brideName: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-pink-300 focus:bg-white outline-none transition-all" />
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Frase do Convite</label>
                            <textarea placeholder="Ex: Você é muito especial..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-pink-300 focus:bg-white outline-none transition-all resize-none min-h-[120px]"></textarea>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Local</label>
                            <input type="text" placeholder="Ex: Casa da Noiva" value={formData.locationName} onChange={e => setFormData({...formData, locationName: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-pink-300 focus:bg-white outline-none transition-all" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Data</label>
                                <input type="text" placeholder="Ex: 20 de Junho de 2026" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-pink-300 focus:bg-white outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Horário</label>
                                <input type="text" placeholder="Ex: 14h às 19h" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-pink-300 focus:bg-white outline-none transition-all" />
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSaving}
                        className="w-full bg-pink-500 text-white font-bold py-4 rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 mt-8 shadow-lg shadow-pink-500/20"
                    >
                        <Save size={18} />
                        {isSaving ? "SALVANDO..." : (id ? "ATUALIZAR CONVITE" : "CRIAR CONVITE")}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

