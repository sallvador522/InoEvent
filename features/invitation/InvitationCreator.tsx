import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { QRCodeSVG } from 'qrcode.react'; 
import { Save, QrCode, ArrowLeft, MapPin, Clock, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFirebase, db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { doc, setDoc, getDoc, getDocs, updateDoc, collection, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const InvitationCreator: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user, userProfile } = useFirebase();
    const [formData, setFormData] = useState({
        groomName: '',
        brideName: '',
        date: '',
        time: '',
        locationName: '',
        address: '',
        location: '',
        description: 'Estamos ansiosos para celebrar nosso amor com você!',
        iban: '',
        accountName: '',
        bankName: '',
        contactPhone: '',
        gallery: [] as string[],
        timeline: [] as { time: string, title: string, description: string }[],
        dressCodeTitle: '',
        dressCodeDescription: '',
        plan: 'Essencial',
        layoutMode: new URLSearchParams(window.location.search).get('template') || 'MODERN'
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(!!id);

    // Update plan from userProfile for new events
    useEffect(() => {
        if (!id && userProfile?.plan) {
            setFormData(prev => ({ ...prev, plan: userProfile.plan || 'Essencial' }));
        }
    }, [id, userProfile]);
    
    // Bloco para prevenir que o plano Essencial use templates premium
    useEffect(() => {
        if (userProfile === null) return; // Aguarda o perfil carregar
        
        const actualPlan = userProfile?.plan || formData.plan;
        if (actualPlan === 'Essencial' && formData.layoutMode !== 'MODERN') {
            const requestedMode = formData.layoutMode;
            setFormData(prev => ({ ...prev, layoutMode: 'MODERN' }));
            // Instead of an aggressive alert, we seamlessly fallback. We can offer a gentle confirmation.
            setTimeout(() => {
                toast.custom((t) => (
                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl flex flex-col border border-slate-100 overflow-hidden`}>
                        <div className="p-4">
                            <h3 className="font-bold text-slate-900 mb-1">Modelo Exclusivo</h3>
                            <p className="text-sm text-slate-500">O modelo {requestedMode} é exclusivo para planos pagos. Você usará o Moderno padrão.</p>
                        </div>
                        <div className="flex border-t border-slate-100">
                            <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">OK</button>
                            <div className="w-px bg-slate-100" />
                            <button onClick={() => { toast.dismiss(t.id); navigate('/plans'); }} className="flex-1 px-4 py-3 text-sm font-bold text-brand-blue hover:bg-slate-50 transition-colors">Ver Planos</button>
                        </div>
                    </div>
                ), { duration: 5000 });
            }, 500);
        }
    }, [userProfile, formData.layoutMode, navigate]);

    useEffect(() => {
        const loadEvent = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, 'events', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        groomName: data.groomName || '',
                        brideName: data.brideName || '',
                        date: data.date || '',
                        time: data.time || '',
                        locationName: data.locationName || '',
                        address: data.address || '',
                        location: data.location || '',
                        description: data.description || '',
                        iban: data.iban || '',
                        accountName: data.accountName || '',
                        bankName: data.bankName || '',
                        contactPhone: data.contactPhone || '',
                        gallery: data.gallery || [],
                        timeline: data.timeline || [],
                        dressCodeTitle: data.dressCodeTitle || '',
                        dressCodeDescription: data.dressCodeDescription || '',
                        plan: data.plan || 'Essencial',
                        layoutMode: data.layoutMode || 'MODERN'
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
        if (!formData.groomName || !formData.brideName || !formData.date || !formData.location) {
            toast.error('Por favor, preencha todos os campos obrigatórios!');
            return;
        }

        if (!user) {
            toast.error('Você precisa estar logado para salvar um evento.');
            return;
        }

        const isNewEvent = !id;
        if (isNewEvent) {
             if (userProfile?.plan === 'Essencial') {
                  const eventsRef = collection(db, 'events');
                  const q = query(eventsRef, where("ownerId", "==", user.uid));
                  const snap = await getDocs(q);
                  
                  const now = new Date();
                  const currentMonthEvents = snap.docs.filter(doc => {
                       const data = doc.data();
                       const eventDate = data.createdAt ? new Date(data.createdAt) : new Date(0);
                       return eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() === now.getMonth();
                  });

                  if (currentMonthEvents.length >= 5) {
                      toast.custom((t) => (
                          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl flex flex-col border border-slate-100 overflow-hidden`}>
                              <div className="p-4">
                                  <h3 className="font-bold text-slate-900 mb-1">Limite Atingido</h3>
                                  <p className="text-sm text-slate-500">O plano Essencial permite até 5 eventos por mês. Atualize para o Premium.</p>
                              </div>
                              <div className="flex border-t border-slate-100">
                                  <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
                                  <div className="w-px bg-slate-100" />
                                  <button onClick={() => { toast.dismiss(t.id); navigate('/plans'); }} className="flex-1 px-4 py-3 text-sm font-bold text-brand-blue hover:bg-slate-50 transition-colors">Ver Planos</button>
                              </div>
                          </div>
                      ), { duration: 5000 });
                      return;
                  }
             } else if ((userProfile?.credits || 0) < 1) {
                  toast.error('Você não tem créditos B2B suficientes para criar este evento. Por favor, adquira mais pacotes no seu painel.');
                  return;
             }
        }

        setIsSaving(true);
        try {
            const finalData: any = { 
                ...formData, 
                title: `${formData.groomName} & ${formData.brideName}`,
                ownerId: user.uid,
                whiteLabelName: (userProfile?.plan === 'Business' || userProfile?.plan === 'Corporate') ? (userProfile?.whiteLabelName || null) : null,
                whiteLabelLogo: (userProfile?.plan === 'Business' || userProfile?.plan === 'Corporate') ? (userProfile?.whiteLabelLogo || null) : null
            };
            if (isNewEvent) {
                finalData.createdAt = new Date().toISOString();
            }
            
            if (!isNewEvent) {
                const docRef = doc(db, 'events', id);
                await updateDoc(docRef, finalData);
                navigate(`/invite/${id}`);
            } else {
                // Deduct credits and save transaction for B2B
                if (userProfile?.plan !== 'Essencial') {
                    const newCredits = (userProfile?.credits || 0) - 1;
                    await updateDoc(doc(db, 'users', user.uid), { credits: newCredits });
                    
                    const newTransRef = doc(collection(db, 'transactions'));
                    await setDoc(newTransRef, {
                        ownerId: user.uid,
                        amount: 1,
                        type: 'DEBIT',
                        description: `Criação do evento: ${finalData.title}`,
                        date: new Date().toISOString(),
                        eventId: newTransRef.id
                    });
                }

                const newEventId = "evt_" + Math.random().toString(36).substr(2, 9);
                const docRef = doc(db, 'events', newEventId);
                await setDoc(docRef, finalData);
                navigate(`/invite/${newEventId}`);
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-display">
                <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 font-display relative">
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-brand-blue/5 rounded-full blur-[100px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-3xl mx-auto bg-white rounded-[32px] p-8 md:p-12 shadow-[0_20px_40px_-15px_rgba(0,40,100,0.05)] border border-slate-100 relative z-10"
            >
                <div className="flex items-center mb-10">
                    <Link to="/" className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-brand-blue transition-all mr-6 border border-transparent hover:border-slate-100">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-slate-900 leading-tight">{id ? "Editar Convite" : "Novo Evento"}</h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Preencha os detalhes para criar uma experiência única.</p>
                    </div>
                </div>
                
                <div className="space-y-8">
                    <div className="p-5 rounded-2xl border border-brand-blue/10 bg-brand-blue/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-brand-blue/10">
                                <QrCode size={18} className="text-brand-blue" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm tracking-wide">Plano Atual</h3>
                                <p className="text-xs text-brand-blue/80 font-medium mt-0.5">
                                    {formData.plan === 'Essencial' ? 'Essencial (7.500 Kz)' : 
                                     formData.plan === 'Premium' ? 'Premium (20.000 Kz)' : 
                                     'Business (50.000 Kz)'}
                                </p>
                            </div>
                        </div>
                        <Link to="/plans" className="text-xs font-bold bg-white text-brand-blue px-4 py-2 rounded-xl shadow-sm border border-brand-blue/10 hover:shadow-md transition-all uppercase tracking-wider text-center">
                            Mudar Plano
                        </Link>
                    </div>

                    {formData.plan !== 'Essencial' && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Identidade Visual</label>
                            <div className="grid grid-cols-3 gap-4">
                                {['CLASSIC', 'ESSENTIAL', 'MODERN', 'LUXURY', 'GARDEN', 'RUSTIC', 'INDUSTRIAL'].map(mode => (
                                    <motion.div 
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        key={mode}
                                        onClick={() => {
                                            const actualPlan = userProfile?.plan || formData.plan;
                                            if (actualPlan === 'Essencial' && mode !== 'MODERN') {
                                                toast.custom((t) => (
                                                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl flex flex-col border border-slate-100 overflow-hidden`}>
                                                        <div className="p-4">
                                                            <h3 className="font-bold text-slate-900 mb-1">Acesso Bloqueado</h3>
                                                            <p className="text-sm text-slate-500">O modelo {mode} é exclusivo para planos Premium e Business.</p>
                                                        </div>
                                                        <div className="flex border-t border-slate-100">
                                                            <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
                                                            <div className="w-px bg-slate-100" />
                                                            <button onClick={() => { toast.dismiss(t.id); navigate('/plans'); }} className="flex-1 px-4 py-3 text-sm font-bold text-brand-blue hover:bg-slate-50 transition-colors">Ver Planos</button>
                                                        </div>
                                                    </div>
                                                ), { duration: 5000 });
                                                return;
                                            }
                                            setFormData({...formData, layoutMode: mode});
                                        }}
                                        className={`p-4 rounded-2xl border-2 text-center cursor-pointer transition-all ${formData.layoutMode === mode ? 'border-brand-blue bg-white shadow-[0_10px_20px_-10px_rgba(0,40,100,0.1)]' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                                    >
                                        <span className={`text-sm font-bold ${formData.layoutMode === mode ? 'text-brand-blue' : 'text-slate-500'}`}>
                                            {mode === 'CLASSIC' ? 'Clássico' : 
                                             mode === 'ESSENTIAL' ? 'Essencial' :
                                             mode === 'MODERN' ? 'Moderno' : 
                                             mode === 'LUXURY' ? 'Luxo' : 
                                             mode === 'GARDEN' ? 'Jardim' : 
                                             mode === 'RUSTIC' ? 'Rústico' : 
                                             'Industrial'}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Os Noivos</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Nome do Noivo" value={formData.groomName} onChange={e => setFormData({...formData, groomName: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-slate-400 font-medium" />
                                <input type="text" placeholder="Nome da Noiva" value={formData.brideName} onChange={e => setFormData({...formData, brideName: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-slate-400 font-medium" />
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Quando e Onde</label>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all font-medium" />
                                <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all font-medium" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Nome do Local (ex: Solar dos Hibiscos)" value={formData.locationName} onChange={e => setFormData({...formData, locationName: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-slate-400 font-medium" />
                                <input type="text" placeholder="Endereço Completo" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-slate-400 font-medium" />
                            </div>
                            <div className="flex gap-2">
                                <input type="url" placeholder="Link do Google Maps" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-slate-400 font-medium" />
                                <a 
                                    href="https://www.google.com/maps" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 px-6 flex items-center justify-center bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-200 hover:text-brand-blue transition-all group shadow-sm"
                                    title="Abrir Google Maps"
                                >
                                    <MapPin size={22} className="group-hover:scale-110 transition-transform" />
                                </a>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Programação (Timeline)</label>
                            <div className="space-y-3">
                                {formData.timeline.map((item, index) => (
                                    <div key={index} className="flex flex-col md:flex-row gap-2 bg-slate-50/50 p-3 rounded-2xl border-2 border-slate-100 items-start md:items-center">
                                        <input type="time" value={item.time} onChange={e => {
                                            const newTimeline = [...formData.timeline];
                                            newTimeline[index] = { ...newTimeline[index], time: e.target.value };
                                            setFormData({...formData, timeline: newTimeline});
                                        }} className="w-full md:w-32 p-3 rounded-xl border-2 border-slate-100 bg-white text-slate-900 focus:border-brand-blue/30 focus:bg-white outline-none transition-all font-medium text-sm" />
                                        <input type="text" placeholder="Título (ex: Cerimônia)" value={item.title} onChange={e => {
                                            const newTimeline = [...formData.timeline];
                                            newTimeline[index] = { ...newTimeline[index], title: e.target.value };
                                            setFormData({...formData, timeline: newTimeline});
                                        }} className="w-full md:w-auto flex-1 p-3 rounded-xl border-2 border-slate-100 bg-white text-slate-900 focus:border-brand-blue/30 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium text-sm" />
                                        <input type="text" placeholder="Local/Descrição (ex: Jardim Principal)" value={item.description} onChange={e => {
                                            const newTimeline = [...formData.timeline];
                                            newTimeline[index] = { ...newTimeline[index], description: e.target.value };
                                            setFormData({...formData, timeline: newTimeline});
                                        }} className="w-full md:w-auto flex-1 p-3 rounded-xl border-2 border-slate-100 bg-white text-slate-900 focus:border-brand-blue/30 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium text-sm" />
                                        <button type="button" onClick={() => {
                                            const newTimeline = formData.timeline.filter((_, i) => i !== index);
                                            setFormData({...formData, timeline: newTimeline});
                                        }} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all w-full md:w-auto flex justify-center mt-2 md:mt-0">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={() => {
                                    setFormData({...formData, timeline: [...formData.timeline, { time: '', title: '', description: '' }]});
                                }} className="w-full border-dashed border-2 py-4 text-slate-500 hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5">
                                    <Plus size={18} className="mr-2" /> Adicionar Atividade
                                </Button>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Presentes (Opcional)</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input type="text" placeholder="IBAN" value={formData.iban} onChange={e => setFormData({...formData, iban: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-slate-400 font-medium" />
                                <input type="text" placeholder="Nome da Conta" value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-slate-400 font-medium" />
                                <input type="text" placeholder="Banco" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-slate-400 font-medium" />
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Dress Code (Opcional)</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Ex: Esporte Fino, Black Tie..." value={formData.dressCodeTitle} onChange={e => setFormData({...formData, dressCodeTitle: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-slate-400 font-medium" />
                                <input type="text" placeholder="Instruções adicionais (ex: Evite a cor branca)" value={formData.dressCodeDescription} onChange={e => setFormData({...formData, dressCodeDescription: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-slate-400 font-medium" />
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Contato & Mensagem</label>
                            <input type="text" placeholder="WhatsApp do Organizador (Ex: +2449...)" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-slate-400 font-medium mb-4" />
                            
                            <textarea placeholder="Descrição curta ou mensagem aos convidados" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-slate-400 font-medium resize-none" rows={4}></textarea>
                        </div>

                        {(formData.plan === 'Premium' || formData.plan === 'Business' || formData.plan === 'Corporate') && (
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Galeria de Fotos (Links separados por vírgula)</label>
                                <textarea 
                                    placeholder="Aconselhamos no mínimo 5 fotos...\nEx: https://url1.jpg,\nhttps://url2.jpg" 
                                    value={formData.gallery.join(', ')} 
                                    onChange={e => setFormData({...formData, gallery: e.target.value.split(',').map(s => s.trim()).filter(s => s)})} 
                                    className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-900 focus:border-brand-blue/30 focus:bg-white focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-slate-400 font-medium resize-none" 
                                    rows={4}
                                />
                                <p className="text-[10px] text-slate-400 pl-1 uppercase tracking-wider font-bold">Recurso Exclusivo {formData.plan}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-6">
                        <button 
                            onClick={handleSubmit} 
                            disabled={isSaving}
                            className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-brand-blue hover:shadow-[0_15px_30px_-10px_rgba(0,40,100,0.3)] transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            <Save size={20} />
                            <span className="tracking-wide uppercase text-sm">{isSaving ? "PROCESSANDO..." : id ? "SALVAR ALTERAÇÕES" : "CRIAR EVENTO"}</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
