import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { useFirebase } from '../../components/FirebaseProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Calendar, Plus, Building2, Ticket, Settings, ArrowRight, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const UserDashboard: React.FC = () => {
    const { user, userProfile } = useFirebase();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
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

    const isPartner = userProfile?.plan === 'Business' || userProfile?.plan === 'Corporate';

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    const handleCreateEvent = () => {
        if (userProfile?.plan === 'Essencial') {
            const now = new Date();
            const currentMonthEvents = events.filter(event => {
                const eventDate = event.createdAt ? new Date(event.createdAt) : new Date(0);
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
        }
        navigate('/create-invitation');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-blue rounded-xl flex items-center justify-center transform rotate-3">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                        <span className="font-serif font-bold text-xl tracking-wide text-brand-blue">
                           InoEvents
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {(userProfile?.plan === 'Premium' || userProfile?.plan === 'Business' || userProfile?.plan === 'Corporate') && (
                            <a 
                                href="https://wa.me/244900000000?text=Olá,%20preciso%20de%20suporte%20VIP" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hidden md:flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full hover:bg-emerald-100 transition-colors"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                                Suporte VIP
                            </a>
                        )}
                        <Button variant="outline" onClick={handleCreateEvent}>
                           <Plus size={16} className="mr-2" /> Novo Evento
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-10">
                   <h1 className="text-3xl font-bold text-slate-800 mb-2">
                      Olá, {user?.displayName?.split(' ')[0] || 'Usuário'}!
                   </h1>
                    <p className="text-slate-500">
                      Aqui estão os seus eventos e convites.
                   </p>
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
                        {events.map((event: any) => (
                            <div key={event.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-brand-blue/30 hover:shadow-xl hover:shadow-brand-blue/5 transition-all group flex flex-col">
                                <Link to={`/dashboard/${event.id}`} className="block">
                                  <div className="h-40 bg-slate-100 relative overflow-hidden">
                                       {event.heroImage ? (
                                           <img src={event.heroImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                                  </div>
                                </Link>
                                <div className="p-6 flex-1 flex flex-col">
                                     <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">{event.title}</h3>
                                     <p className="text-sm text-slate-500 mb-4">{event.date} • {event.time}</p>
                                     <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                                         <Link to={`/dashboard/${event.id}`} className="font-bold text-brand-blue flex items-center gap-1">
                                            Acessar Painel <ArrowRight size={14} />
                                         </Link>
                                         <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); window.open(`/#/invite/${event.id}`, '_blank'); }} className="h-8 shadow-sm">
                                            <ExternalLink size={14} className="mr-1.5" /> Ver Convite
                                         </Button>
                                     </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <AnimatePresence>
                {isSimulateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSimulateModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl">
                            <button onClick={() => setIsSimulateModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-6">
                                <Ticket size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Simular Compra</h3>
                            <p className="text-slate-500 text-sm mb-6">Esta é uma integração simulada. Ao continuar, você receberá 10 créditos na sua conta de forma gratuita (para fins de demonstração).</p>
                            
                            <Button fullWidth onClick={handleBuyCredits} disabled={isSimulating}>
                                {isSimulating ? "Processando..." : "Confirmar Recebimento (+10)"}
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
