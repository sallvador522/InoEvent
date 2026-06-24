import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { useFirebase } from '../../components/FirebaseProvider';
import { Navbar } from '../../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Calendar, Plus, Building2, Ticket, Settings, ArrowRight, ExternalLink, X, Users, Briefcase, Leaf, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Skeleton } from '../../components/ui/Skeleton';

export const BusinessDashboard: React.FC = () => {
    const { user, userProfile } = useFirebase();
    const [events, setEvents] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalGuests: 0, checkedIn: 0, paperSaved: 0 });
    const [loading, setLoading] = useState(true);
    const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!userProfile) return;
        if (userProfile.plan !== 'Business' && userProfile.plan !== 'Corporate') {
            navigate('/dashboard');
        }
    }, [userProfile, navigate]);

    useEffect(() => {
        const fetchEventsAndStats = async () => {
            if (!user) return;
            try {
                const eventsRef = collection(db, 'events');
                const q = query(eventsRef, where("ownerId", "==", user.uid));
                const snap = await getDocs(q);
                const eventsList = snap.docs.map(d => ({ id: d.id, ...d.data() as any })).filter(e => e.plan === 'Business' || e.plan === 'Corporate' || e.plan === 'business' || e.plan === 'corporate');
                setEvents(eventsList);

                let totalGuestsCount = 0;
                let checkedInCount = 0;

                await Promise.all(eventsList.map(async (ev) => {
                    const guestsSnap = await getDocs(collection(db, 'events', ev.id, 'guests'));
                    guestsSnap.forEach(g => {
                        totalGuestsCount++;
                        if (g.data().checkedIn) checkedInCount++;
                    });
                }));

                setStats({
                    totalGuests: totalGuestsCount,
                    checkedIn: checkedInCount,
                    paperSaved: totalGuestsCount * 3.5 // Simulating R$ 3.50 saved per physical invite
                });

                const transRef = collection(db, 'transactions');
                const transQuery = query(transRef, where("ownerId", "==", user.uid));
                const transSnap = await getDocs(transQuery);
                const transList = transSnap.docs.map(t => ({ id: t.id, ...t.data() }));
                // manually sort by date desc
                transList.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setTransactions(transList);

            } catch (err) {
                console.error(err);
                handleFirestoreError(err, OperationType.LIST, 'events or guests or transactions');
            } finally {
                setLoading(false);
            }
        };
        fetchEventsAndStats();
    }, [user]);

    const handleBuyCredits = async () => {
        if (!user) return;
        setIsSimulating(true);
        try {
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

            // Re-fetch transactions
            setTransactions(prev => [{
                ...{
                    ownerId: user.uid,
                    amount: 10,
                    type: 'CREDIT',
                    description: 'Compra de Pacote de Convites (Simulação)',
                    date: new Date().toISOString()
                },
                id: newTransRef.id
            }, ...prev]);

            setIsSimulating(false);
            setIsSimulateModalOpen(false);
            toast.success("Compra simulada com sucesso! Você recebeu 10 créditos.");
        } catch (error) {
            console.error("Erro ao comprar créditos:", error);
            toast.error("Erro ao comprar créditos.");
            setIsSimulating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col p-6 w-full max-w-7xl mx-auto space-y-8">
                {/* Navbar Skeleton */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                         <Skeleton className="w-12 h-12 rounded-xl" />
                         <div className="space-y-2">
                             <Skeleton className="h-4 w-32 rounded" />
                             <Skeleton className="h-6 w-48 rounded" />
                         </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-10">
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-64 rounded-xl" />
                        <Skeleton className="h-4 w-40 rounded" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-12 w-40 rounded-xl" />
                        <Skeleton className="h-12 w-32 rounded-xl" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {[1, 2, 3].map((i) => (
                         <Skeleton key={i} className="h-48 rounded-2xl" />
                     ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">
                            Painel B2B: {userProfile?.whiteLabelName || 'Minha Empresa'}
                        </h1>
                        <p className="text-slate-500">
                            Central de gerenciamento do seu negócio e dos eventos de seus clientes.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => navigate('/create-invitation')}>
                           <Plus size={16} className="mr-2" /> Novo Evento de Cliente
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/business/create')} className="flex items-center gap-2">
                            <Settings size={18} /> Configurar Empresa
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl p-8 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden md:col-span-2">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Ticket className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Convites Disponíveis</span>
                        </div>
                        <h3 className="text-4xl font-black mb-1">{userProfile?.credits || 0}</h3>
                        <p className="text-amber-100 text-sm font-medium">Créditos de Eventos</p>
                        <button onClick={() => navigate('/plans')} className="mt-6 w-full py-3 bg-white text-amber-600 font-bold rounded-xl text-sm hover:bg-amber-50 transition-colors shadow-sm">
                            Comprar Pacotes de Convites
                        </button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative group hover:border-brand-blue/30 transition-colors">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-blue-50 rounded-xl text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">{events.length}</h3>
                        <p className="text-slate-500 text-sm mb-6 line-clamp-2">Clientes Ativos</p>
                    </div>
                    
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative group hover:border-brand-blue/30 transition-colors">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                <Briefcase className="w-6 h-6" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">{events.length}</h3>
                        <p className="text-slate-500 text-sm mb-6 line-clamp-2">Eventos Geridos</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6 pt-4">
                   <h2 className="text-xl font-bold text-slate-800">Relatório de Impacto (Analytics)</h2>
                   <span className="text-xs font-bold text-brand-blue uppercase bg-blue-50 px-3 py-1 rounded-full">Global</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                     <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden flex items-center justify-between group hover:border-brand-blue/30 transition-colors">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Convites Emitidos</p>
                            <h3 className="text-3xl font-black text-slate-800">{stats.totalGuests}</h3>
                            <p className="text-sm text-slate-400 mt-2">Total de convidados gerados</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-xl flex items-center justify-center transition-colors group-hover:bg-brand-blue group-hover:text-white">
                            <Ticket className="w-6 h-6" />
                        </div>
                     </div>

                     <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden flex items-center justify-between group hover:border-green-500/30 transition-colors">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Taxa de Sucesso</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                {stats.totalGuests > 0 ? Math.round((stats.checkedIn / stats.totalGuests) * 100) : 0}%
                            </h3>
                            <p className="text-sm text-slate-400 mt-2">Média de check-in (Engajamento)</p>
                        </div>
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-green-600 group-hover:text-white">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                     </div>

                     <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Economia Gerada</p>
                            <h3 className="text-3xl font-black text-slate-800">R$ {(stats?.paperSaved || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                            <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center gap-1">
                                <Leaf size={14} /> Papel e logística evitados
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                            <Leaf className="w-6 h-6" />
                        </div>
                     </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-xl font-bold text-slate-800">Eventos dos Seus Clientes</h2>
                </div>

                {events.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mb-4">
                           <Calendar size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum evento criado para seus clientes</h3>
                        <p className="text-slate-500 max-w-sm mb-6">Utilize seus créditos para criar os primeiros convites em nome da sua empresa (White-label).</p>
                        <Button onClick={() => navigate('/create-invitation')}>
                           Criar Primeiro Evento de Cliente
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
                                         <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); window.open(`/invite/${event.id}`, '_blank'); }} className="h-8 shadow-sm">
                                            <ExternalLink size={14} className="mr-1.5" /> Ver Convite
                                         </Button>
                                     </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="mt-16 flex items-center justify-between mb-6">
                    <div>
                       <h2 className="text-xl font-bold text-slate-800">Histórico de Transações</h2>
                       <p className="text-sm text-slate-500 mt-1">Acompanhe a compra e o consumo dos seus créditos de convites.</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    {transactions.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
                             <Ticket className="w-12 h-12 mb-4 text-slate-300" />
                             <p>Nenhuma transação encontrada no seu histórico.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500 font-bold">
                                        <th className="p-4 pl-6">Data</th>
                                        <th className="p-4">Descrição</th>
                                        <th className="p-4 text-right">Tipo</th>
                                        <th className="p-4 pr-6 text-right">Créditos</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {transactions.map((trans: any) => (
                                        <tr key={trans.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 pl-6 text-slate-500 whitespace-nowrap">
                                                {new Date(trans.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-4 font-medium text-slate-800">
                                                {trans.description}
                                            </td>
                                            <td className="p-4 text-right">
                                                {trans.type === 'CREDIT' ? (
                                                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">Entrada</span>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">Saída</span>
                                                )}
                                            </td>
                                            <td className="p-4 pr-6 text-right font-bold text-slate-800 flex items-center justify-end gap-1.5">
                                                {trans.type === 'CREDIT' ? '+' : '-'}{trans.amount}
                                                <Ticket size={14} className={trans.type === 'CREDIT' ? 'text-green-600' : 'text-slate-400'} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
      </div>
    );
};
