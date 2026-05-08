import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import { useFirebase } from '../../components/FirebaseProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Calendar, Plus, Building2, Ticket, Settings, ArrowRight, ExternalLink, X } from 'lucide-react';

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
            await updateDoc(doc(db, 'users', user.uid), {
                credits: (userProfile?.credits || 0) + 10
            });
            setIsSimulating(false);
            setIsSimulateModalOpen(false);
            alert("Compra simulada com sucesso! Você recebeu 10 créditos.");
        } catch (error) {
            console.error("Erro ao comprar créditos:", error);
            alert("Erro ao comprar créditos.");
            setIsSimulating(false);
        }
    };

    const isPartner = userProfile?.plan === 'Corporate' || userProfile?.plan === 'Premium';

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-blue rounded-xl flex items-center justify-center transform rotate-3">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                        <span className="font-serif font-bold text-xl tracking-wide text-brand-blue">
                           {isPartner ? 'InoEvents Partner' : 'InoEvents'}
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => navigate('/create-invitation')}>
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
                      {isPartner ? 'Bem-vindo ao seu painel de parceiro B2B.' : 'Aqui estão os seus eventos e convites.'}
                   </p>
                </div>

                {isPartner && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl p-8 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            <div className="flex justify-between items-start mb-6">
                               <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                  <Ticket className="w-6 h-6 text-white" />
                               </div>
                               <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Seus Créditos</span>
                            </div>
                            <h3 className="text-4xl font-black mb-1">{userProfile?.credits || 0}</h3>
                            <p className="text-amber-100 text-sm font-medium">Convites disponíveis</p>
                            <button onClick={() => setIsSimulateModalOpen(true)} className="mt-6 w-full py-3 bg-white text-amber-600 font-bold rounded-xl text-sm hover:bg-amber-50 transition-colors shadow-sm">
                               Comprar Pacote (B2B)
                            </button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative group hover:border-brand-blue/30 transition-colors">
                            <div className="flex justify-between items-start mb-6">
                               <div className="p-3 bg-blue-50 rounded-xl text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                  <Building2 className="w-6 h-6" />
                               </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-1">White-Label</h3>
                            <p className="text-slate-500 text-sm mb-6 line-clamp-2">Configure o nome da sua marca para aparecer no rodapé dos convites gerados.</p>
                            <button onClick={() => navigate('/business/create')} className="text-brand-blue font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                               Configurar Marca <ArrowRight size={16} />
                            </button>
                        </div>
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
                        <Button onClick={() => navigate('/create-invitation')}>
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
