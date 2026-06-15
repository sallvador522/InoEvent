import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { useFirebase } from '../../components/FirebaseProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Calendar, Plus, Building2, Ticket, Settings, ArrowRight, ExternalLink, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Navbar } from '../../components/Navbar';

import { getEventByLayoutMode } from '../../mockData';

export const UserDashboard: React.FC = () => {
    const { user, userProfile } = useFirebase();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user) return;
            try {
                const eventsRef = collection(db, 'events');
                const q = query(eventsRef, where("ownerId", "==", user.uid));
                const snap = await getDocs(q);
                const eventsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setEvents(eventsList);
            } catch (err) {
                console.error(err);
                handleFirestoreError(err, OperationType.LIST, 'events');
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [user]);

    const handleBuyCredits = async () => {
        if (!user) return;
        setIsSimulating(true);
        try {
            const { updateDoc, doc, setDoc, collection } = await import('firebase/firestore');
            await updateDoc(doc(db, 'users', user.uid), {
                credits: (userProfile?.credits || 0) + 10
            });
            const newTransRef = doc(collection(db, 'transactions'));
            await setDoc(newTransRef, {
                ownerId: user.uid,
                amount: 10,
                type: 'CREDIT',
                description: 'Compra de Pacote de Convites (Simulação)',
                date: new Date().toISOString()
            });

            setIsSimulating(false);
            setIsSimulateModalOpen(false);
            toast.success("Compra simulada com sucesso! Você recebeu 10 créditos.");
        } catch (error) {
            console.error("Erro ao comprar créditos:", error);
            toast.error("Erro ao comprar créditos.");
            setIsSimulating(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!eventToDelete) return;
        setIsDeleting(true);
        try {
            // Delete associated storage files (audio, image urls, etc.) before deleting database document
            try {
                const storage = getStorage();
                const urlsToDelete: string[] = [];

                // Audio URL
                if (eventToDelete.audioUrl && typeof eventToDelete.audioUrl === 'string' && eventToDelete.audioUrl.includes('firebasestorage.googleapis.com')) {
                    urlsToDelete.push(eventToDelete.audioUrl);
                }

                // Cover image URL
                if (eventToDelete.coverUrl && typeof eventToDelete.coverUrl === 'string' && eventToDelete.coverUrl.includes('firebasestorage.googleapis.com')) {
                    urlsToDelete.push(eventToDelete.coverUrl);
                }

                // Background image URL
                if (eventToDelete.backgroundImage && typeof eventToDelete.backgroundImage === 'string' && eventToDelete.backgroundImage.includes('firebasestorage.googleapis.com')) {
                    urlsToDelete.push(eventToDelete.backgroundImage);
                }

                // Gallery images
                if (eventToDelete.gallery && Array.isArray(eventToDelete.gallery)) {
                    eventToDelete.gallery.forEach((pic: any) => {
                        if (typeof pic === 'string' && pic.includes('firebasestorage.googleapis.com')) {
                            urlsToDelete.push(pic);
                        } else if (pic && typeof pic === 'object' && pic.url && typeof pic.url === 'string' && pic.url.includes('firebasestorage.googleapis.com')) {
                            urlsToDelete.push(pic.url);
                        }
                    });
                }

                // Run parallelized deletions
                await Promise.all(
                    urlsToDelete.map(async (url) => {
                        try {
                            const fileRef = ref(storage, url);
                            await deleteObject(fileRef);
                            console.log("Removed storage resource:", url);
                        } catch (e) {
                            console.warn("Failed or skipped deleting storage resource:", url, e);
                        }
                    })
                );
            } catch (storageErr) {
                console.error("Storage files cleanup failure:", storageErr);
            }

            await deleteDoc(doc(db, 'events', eventToDelete.id));
            setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
            toast.success("Convite apagado com sucesso!");
            setEventToDelete(null);
        } catch (error) {
            console.error("Erro ao eliminar convite:", error);
            handleFirestoreError(error, OperationType.DELETE, `events/${eventToDelete.id}`);
            toast.error("Erro ao eliminar o convite.");
        } finally {
            setIsDeleting(false);
        }
    };

    const isPartner = userProfile?.plan === 'Business' || userProfile?.plan === 'Corporate';

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    const handleCreateEvent = () => {
        // Redirecionamos para a criação, a validação de créditos ocorre no momento de salvar.
        navigate('/create-invitation');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
                   <div>
                       <h1 className="text-3xl font-bold text-slate-800 mb-2">
                          Olá, {user?.displayName?.split(' ')[0] || 'Usuário'}!
                       </h1>
                       <p className="text-slate-500">
                          Você possui <strong className="text-brand-blue">{userProfile?.credits || 0} créditos</strong> disponíveis.
                       </p>
                   </div>
                   <div className="flex gap-4">
                       <Button 
                           variant="outline" 
                           onClick={() => window.open('https://wa.me/244952815430', '_blank')} 
                           className="hidden sm:flex border-emerald-500/20 text-emerald-600 hover:bg-emerald-50"
                       >
                           Suporte
                       </Button>
                       <Button variant="outline" onClick={() => navigate('/plans')} className="border-brand-blue/20 text-brand-blue hover:bg-blue-50">
                           <Ticket size={16} className="mr-2 hidden sm:block" /> {userProfile?.credits || 0} Créditos
                       </Button>
                       <Button onClick={handleCreateEvent}>
                           <Plus size={16} className="mr-2" /> Novo Evento
                       </Button>
                   </div>
                </div>

                {(userProfile?.plan === 'Business' || userProfile?.plan === 'Corporate') && (
                    <div className="mb-10 bg-gradient-to-r from-brand-blue to-blue-700 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-lg shadow-brand-blue/20">
                        <div className="text-white mb-6 md:mb-0">
                            <h2 className="text-2xl font-bold mb-2">Acessar Painel B2B</h2>
                            <p className="text-blue-100 max-w-lg">Você possui um plano empresarial. Acesse as ferramentas avançadas para gerenciar seus clientes, créditos e simulações.</p>
                        </div>
                        <Button 
                            className="bg-white text-brand-blue hover:bg-slate-50 whitespace-nowrap"
                            onClick={() => navigate('/b2b')}
                        >
                            Acessar Meu Negócio
                        </Button>
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-xl font-bold text-slate-800">Múltiplos Eventos ({events.length})</h2>
                </div>

                {events.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mb-4">
                           <Calendar size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum evento criado</h3>
                        <p className="text-slate-500 max-w-sm mb-6">Você ainda não criou nenhum convite digital. Que tal começar agora?</p>
                        <Button onClick={handleCreateEvent}>
                           Criar Meu Primeiro Convite
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event: any) => {
                            const templateDefaults = getEventByLayoutMode(event.layoutMode || 'MODERN');
                            const displayImage = event.heroImage || templateDefaults?.heroImage;
                            return (
                            <div key={event.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-brand-blue/30 hover:shadow-xl hover:shadow-brand-blue/5 transition-all group flex flex-col relative">
                                <Link to={`/dashboard/${event.id}`} className="block">
                                  <div className="h-40 bg-slate-100 relative overflow-hidden">
                                       {displayImage ? (
                                           <img src={displayImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                       ) : (
                                           <div className="w-full h-full flex items-center justify-center text-slate-300">
                                              <Calendar size={40} />
                                           </div>
                                       )}
                                       <div className="absolute top-4 left-4">
                                           <span className="bg-white/90 backdrop-blur-sm text-brand-blue text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                                              {event.type}
                                           </span>
                                       </div>
                                       <div className="absolute top-4 right-4 z-10">
                                           <button 
                                               onClick={(e) => { 
                                                   e.preventDefault(); 
                                                   e.stopPropagation(); 
                                                   setEventToDelete(event); 
                                               }}
                                               className="w-8 h-8 rounded-full bg-white/95 hover:bg-slate-100 text-slate-500 hover:text-red-500 flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-red-100"
                                               title="Eliminar Convite"
                                           >
                                               <Trash2 size={14} />
                                           </button>
                                        </div>
                                  </div>
                                </Link>
                                <div className="p-6 flex-1 flex flex-col">
                                     <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">{event.title}</h3>
                                     <p className="text-sm text-slate-500 mb-4">{event.date} • {event.time}</p>
                                     <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                                         <Link to={`/dashboard/${event.id}`} className="font-bold text-brand-blue flex items-center gap-1">
                                            Acessar Painel <ArrowRight size={14} />
                                         </Link>
                                         <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); window.open(`/invite/${event.id}`, '_blank'); }} className="h-8 shadow-sm">
                                            <ExternalLink size={14} className="mr-1.5" /> Ver Convite
                                         </Button>
                                     </div>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                )}
            </main>

            <AnimatePresence>
                {eventToDelete && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center flex flex-col items-center"
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-2xl font-serif text-slate-800 mb-2">Eliminar convite?</h3>
                            <p className="text-slate-500 mb-8">Esta ação não pode ser desfeita. Todos os convidados, fotos e confirmações de presença associados a <strong>{eventToDelete.title}</strong> serão removidos permanentemente.</p>
                            <div className="flex gap-4 w-full">
                                <button 
                                    onClick={() => setEventToDelete(null)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleDeleteEvent}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex justify-center items-center gap-2"
                                >
                                    {isDeleting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Eliminar!'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
