import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, getCountFromServer } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { useFirebase } from '../../components/FirebaseProvider';
import { Navbar } from '../../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Calendar, Plus, Building2, Ticket, Settings, ArrowRight, ExternalLink, X, Users, Briefcase, Leaf, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { normalizePlanId } from '../../lib/entitlements';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';

export const BusinessDashboard: React.FC = () => {
    const { user, userProfile } = useFirebase();
    const [events, setEvents] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalGuests: 0, checkedIn: 0, paperSaved: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!userProfile) return;
        if (normalizePlanId(userProfile.plan) !== 'business') {
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
                const eventsList = snap.docs.map(d => ({ id: d.id, ...d.data() as any })).filter(e => normalizePlanId(e.plan) === 'business');
                setEvents(eventsList);

                let totalGuestsCount = 0;
                let checkedInCount = 0;
                const newChartData: any[] = [];

                // Use Firestore aggregation queries to avoid downloading all guest documents (N+1 query fix)
                // Note: Firestore count() is much faster and cheaper than getting all documents
                await Promise.all(eventsList.map(async (ev) => {
                    const guestsColl = collection(db, 'events', ev.id, 'guests');
                    try {
                        const totalSnap = await getCountFromServer(guestsColl);
                        const checkedInSnap = await getCountFromServer(query(guestsColl, where('checkedIn', '==', true)));
                        
                        let evTotal = totalSnap.data().count;
                        let evChecked = checkedInSnap.data().count;

                        totalGuestsCount += evTotal;
                        checkedInCount += evChecked;

                        const conversionRate = evTotal > 0 ? Math.round((evChecked / evTotal) * 100) : 0;
                        newChartData.push({
                            name: ev.title || 'Evento sem título',
                            convidados: evTotal,
                            checkins: evChecked,
                            taxa: conversionRate
                        });
                    } catch (err) {
                        console.error('Error fetching count for event:', ev.id, err);
                    }
                }));

                setChartData(newChartData);

                setStats({
                    totalGuests: totalGuestsCount,
                    checkedIn: checkedInCount,
                    paperSaved: totalGuestsCount * 150 // Estimativa: 150 Kz poupados por convite físico evitado
                });


            } catch (err) {
                console.error(err);
                handleFirestoreError(err, OperationType.LIST, 'events or guests');
            } finally {
                setLoading(false);
            }
        };
        fetchEventsAndStats();
    }, [user]);

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
                            <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Plano Business</span>
                        </div>
                        <h3 className="text-4xl font-black mb-1">∞</h3>
                        <p className="text-amber-100 text-sm font-medium">Eventos Ilimitados</p>
                        <button onClick={() => navigate('/create-invitation')} className="mt-6 w-full py-3 bg-white text-amber-600 font-bold rounded-xl text-sm hover:bg-amber-50 transition-colors shadow-sm cursor-pointer">
                            Criar Novo Evento
                        </button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative group hover:border-brand-blue/30 transition-colors">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-blue-50 rounded-xl text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">{stats.checkedIn}</h3>
                        <p className="text-slate-500 text-sm mb-6 line-clamp-2">Check-ins Realizados</p>
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
                            <h3 className="text-3xl font-black text-slate-800">{(stats?.paperSaved || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</h3>
                            <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center gap-1">
                                <Leaf size={14} /> Papel e logística evitados
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                            <Leaf className="w-6 h-6" />
                        </div>
                     </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-12">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Desempenho por Evento (Convidados vs Check-ins)</h3>
                    {chartData.length > 0 ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value}%`} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar yAxisId="left" dataKey="convidados" name="Total de Convidados" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar yAxisId="left" dataKey="checkins" name="Check-ins Confirmados" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Line yAxisId="right" type="monotone" dataKey="taxa" name="Taxa de Conversão (%)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                                <Briefcase size={24} />
                            </div>
                            <p className="text-sm">Nenhum evento com dados suficientes para o gráfico.</p>
                        </div>
                    )}
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
                        <p className="text-slate-500 max-w-sm mb-6">Crie convites em nome da sua empresa (White-label).</p>
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
                                         <Button variant="outline" onClick={(e) => { e.preventDefault(); window.open(`/invite/${event.id}`, '_blank'); }} className="h-8 shadow-sm">
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
