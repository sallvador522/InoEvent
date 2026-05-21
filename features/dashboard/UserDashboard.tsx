import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { useFirebase } from '../../components/FirebaseProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Calendar, Plus, Building2, Ticket, Settings, ArrowRight, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Navbar } from '../../components/Navbar';

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
                       <Button variant="outline" onClick={() => navigate('/plans')} className="border-brand-blue/20 text-brand-blue hover:bg-blue-50">
                           <Ticket size={16} className="mr-2" /> Comprar Créditos
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
        </div>
    );
};
