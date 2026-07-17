import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Users, CheckCircle2, Clock, Search, ExternalLink, ShieldCheck, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, collection, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import { GuestsProgressBar } from './GuestsProgressBar';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { ExecutiveReportModal } from './ExecutiveReportModal';
import { Skeleton } from '../../components/ui/Skeleton';
import { GuestDetailsModal } from './GuestDetailsModal';

export const ClientDashboard = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const tokenParam = searchParams.get('token');
    
    const [event, setEvent] = useState<any>(null);
    const [guests, setGuests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<'all' | 'checkedIn' | 'confirmed' | 'pending' | 'declined'>('all');
    const [authError, setAuthError] = useState<string | null>(null);
    const [agencyName, setAgencyName] = useState<string>("InoEvents Partner");
    const [agencyLogo, setAgencyLogo] = useState<string | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<any>(null);

    useEffect(() => {
        if (!id) return;
        
        const verifyAndFetch = async () => {
            try {
                // Fetch event details
                const eventRef = doc(db, 'events', id);
                const eventSnap = await getDoc(eventRef);
                
                if (!eventSnap.exists()) {
                    setAuthError("Evento não encontrado.");
                    setLoading(false);
                    return;
                }
                
                const eventData = { id: eventSnap.id, ...eventSnap.data() } as any;
                
                if (eventData.clientToken !== tokenParam) {
                    setAuthError("Acesso negado. Token inválido ou ausente.");
                    setLoading(false);
                    return;
                }
                
                setEvent(eventData);

                // Try fetching agency name
                if (eventData.whiteLabelName) {
                    setAgencyName(eventData.whiteLabelName);
                }
                if (eventData.whiteLabelLogo) {
                    setAgencyLogo(eventData.whiteLabelLogo);
                }

                // Fallback to fetch from owner document
                if (eventData.ownerId && (!eventData.whiteLabelName || !eventData.whiteLabelLogo)) {
                    try {
                        const ownerSnap = await getDoc(doc(db, 'users', eventData.ownerId));
                        if (ownerSnap.exists()) {
                            const ownerData = ownerSnap.data();
                            if (!eventData.whiteLabelName && ownerData.whiteLabelName) {
                                setAgencyName(ownerData.whiteLabelName);
                            }
                            if (!eventData.whiteLabelLogo && ownerData.whiteLabelLogo) {
                                setAgencyLogo(ownerData.whiteLabelLogo);
                            }
                        }
                    } catch (err) {
                        console.warn("Could not fetch owner data for white label fallback:", err);
                    }
                }

                // Fetch guests securely via API
                const fetchGuests = async () => {
                    try {
                        const res = await fetch(`/api/events/${id}/guests?token=${tokenParam}`);
                        if (res.ok) {
                            const data = await res.json();
                            setGuests(data.guests || []);
                        }
                    } catch (err) {
                        console.error("Guest fetch error", err);
                    } finally {
                        setLoading(false);
                    }
                };
                
                fetchGuests();
                const interval = setInterval(fetchGuests, 15000); // Polling every 15s
                
                return () => {
                    clearInterval(interval);
                };
            } catch (err) {
                console.error("Error fetching event for client", err);
                setAuthError("Erro de comunicação com o servidor.");
                setLoading(false);
            }
        };
        
        verifyAndFetch();
    }, [id, tokenParam]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col p-6 w-full max-w-6xl mx-auto space-y-8">
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

                <div className="space-y-4">
                    <Skeleton className="h-10 w-64 rounded" />
                    <Skeleton className="h-4 w-96 rounded" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-3xl" />
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-8 mt-12">
                     <div className="flex-[2] space-y-4">
                         <Skeleton className="h-[400px] rounded-3xl" />
                     </div>
                     <div className="flex-1 space-y-4">
                         <Skeleton className="h-64 rounded-3xl" />
                     </div>
                </div>
            </div>
        );
    }
    
    if (authError || !event) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500">
                    <ShieldCheck size={32} />
                </div>
                <h1 className="text-2xl font-serif text-slate-800 mb-2">Acesso Restrito</h1>
                <p className="text-slate-500 mb-8 max-w-sm">{authError}</p>
                <div className="text-sm text-slate-400">Entre em contato com sua agência de eventos.</div>
            </div>
        );
    }

    const confirmedCount = guests.filter(g => g.status === 'CONFIRMED').length;
    const pendingCount = guests.filter(g => g.status === 'PENDING').length;
    const declinedCount = guests.filter(g => g.status === 'DECLINED').length;
    const checkedInCount = guests.filter(g => g.checkedIn).length;
    const totalCount = guests.length;

    const filteredGuests = guests.filter(g => {
        const matchesSearch = g.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              g.phone?.toLowerCase().includes(searchQuery.toLowerCase());
                              
        if (!matchesSearch) return false;
        
        switch (activeFilter) {
            case 'checkedIn': return g.checkedIn === true;
            case 'confirmed': return g.status === 'CONFIRMED';
            case 'pending': return g.status === 'PENDING';
            case 'declined': return g.status === 'DECLINED';
            default: return true;
        }
    });

    return (
        <div className="min-h-screen bg-slate-50 font-display pb-20 text-slate-800">
            {/* White-Label Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {agencyLogo ? (
                            <img src={agencyLogo} alt={agencyName} className="h-10 object-contain rounded" />
                        ) : (
                            <div className="w-8 h-8 bg-brand-blue rounded-xl flex items-center justify-center transform rotate-3">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                        )}
                        <span className="font-serif font-bold text-xl tracking-wide text-brand-blue">
                           {agencyName}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowReportModal(true)}
                            className="text-xs font-bold bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                            <Printer size={13} /> Relatório Executivo
                        </button>
                        <div className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full flex items-center gap-2">
                            <ShieldCheck size={14} className="text-brand-blue" />
                            Visão do Cliente
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <span className="text-sm font-bold text-[#BF9B30] uppercase tracking-widest mb-2 block">Painel de Acompanhamento</span>
                        <h1 className="text-3xl md:text-4xl font-serif text-slate-800 mb-2 leading-tight">
                            {event.title}
                        </h1>
                        <p className="text-slate-500">
                            Acompanhe em tempo real as respostas dos seus convidados.
                        </p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                        {event?.isBlocked || (event?.scheduledBlockDate && new Date(event.scheduledBlockDate) <= new Date()) ? (
                            <div className="flex bg-red-50 border border-red-200 px-6 py-3 rounded-full font-bold text-sm text-red-600 shadow-sm gap-2 items-center w-full md:w-auto justify-center cursor-not-allowed">
                                <span className="material-symbols-outlined text-[16px]">lock</span> Convite Bloqueado
                            </div>
                        ) : (
                            <Link to={`/invite/${event.id}`} target="_blank" className="flex bg-white border border-slate-200 px-6 py-3 rounded-full font-bold text-sm text-brand-blue shadow-sm hover:shadow-md transition-all gap-2 items-center w-full md:w-auto justify-center">
                                <ExternalLink size={16} /> Ver Meu Convite
                            </Link>
                        )}
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <StatCard title="Total" value={totalCount} icon={Users} color="bg-slate-100 text-slate-600" />
                    <StatCard title="Entraram" value={checkedInCount} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
                    <StatCard title="Confirmados" value={confirmedCount} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                    <StatCard title="Pendentes" value={pendingCount} icon={Clock} color="bg-amber-50 text-amber-600" />
                    <StatCard title="Recusados" value={declinedCount} icon={Users} color="bg-red-50 text-red-600" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Progress Bar Widget */}
                    <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-bold text-[#BF9B30] uppercase tracking-wider block mb-1">Ritmo de Respostas</span>
                            <h4 className="font-bold text-slate-800 text-base">Controle de Adesão RSVP</h4>
                            <p className="text-slate-500 text-xs mt-0.5 mb-6">Abaixo você acompanha qual a porcentagem de convidados confirmados versus o total planejado.</p>
                        </div>
                        <GuestsProgressBar guests={guests} className="mb-2" />
                    </div>

                    {/* Chart Widget */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Status Proporcional</span>
                            <h4 className="font-bold text-slate-800 text-sm">Distribuição das Respostas</h4>
                        </div>
                        <div className="h-28 relative flex items-center justify-center my-2">
                            {confirmedCount + pendingCount + declinedCount > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Confirmado', value: confirmedCount, color: '#10B981' },
                                                { name: 'Pendente', value: pendingCount, color: '#F59E0B' },
                                                { name: 'Recusado', value: declinedCount, color: '#EF4444' }
                                            ].filter(d => d.value > 0)}
                                            innerRadius={30}
                                            outerRadius={45}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {[
                                                { name: 'Confirmado', value: confirmedCount, color: '#10B981' },
                                                { name: 'Pendente', value: pendingCount, color: '#F59E0B' },
                                                { name: 'Recusado', value: declinedCount, color: '#EF4444' }
                                            ].filter(d => d.value > 0).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <span className="text-xs text-slate-400 font-bold">Sem respostas gravadas</span>
                            )}
                        </div>
                        <div className="flex justify-center gap-3 text-[10px] font-bold text-slate-500">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Conf. ({confirmedCount})</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Pend. ({pendingCount})</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Recus. ({declinedCount})</span>
                        </div>
                    </div>
                    {/* Access Chart Widget */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Acessos & Visitas</span>
                            <h4 className="font-bold text-slate-800 text-sm">Visualizações ao longo dos dias</h4>
                        </div>
                        <div className="h-28 relative flex items-center justify-center my-2 w-full">
                            {event?.dailyAccesses && Object.keys(event.dailyAccesses).length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={Object.entries(event.dailyAccesses || {})
                                            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                                            .map(([date, count]) => ({
                                            date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                                            acessos: count
                                        }))}
                                    >
                                        <XAxis dataKey="date" hide />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                                            itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}
                                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                                        />
                                        <Line type="monotone" dataKey="acessos" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <span className="text-xs text-slate-400 font-bold">Ainda sem visitas</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 w-full px-2">
                            <span>Total de Acessos:</span>
                            <span className="text-blue-600 text-sm">{event?.accessCount || 0}</span>
                        </div>
                    </div>

                </div>

                {/* Filters & Search */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6 flex flex-col xl:flex-row gap-4 items-center">
                    <div className="relative group flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Buscar nome..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                        />
                    </div>
                    <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
                        <FilterButton label="Todos" active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
                        <FilterButton label="Entraram" active={activeFilter === 'checkedIn'} onClick={() => setActiveFilter('checkedIn')} />
                        <FilterButton label="Confirmados" active={activeFilter === 'confirmed'} onClick={() => setActiveFilter('confirmed')} />
                        <FilterButton label="Pendentes" active={activeFilter === 'pending'} onClick={() => setActiveFilter('pending')} />
                    </div>
                </div>

                {/* Guest List */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-bold text-slate-700">Lista Geral</h3>
                        <span className="text-xs font-bold bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-500">{filteredGuests.length} resultados</span>
                    </div>
                    
                    {guests.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
                            <span className="material-symbols-outlined text-4xl mb-4 opacity-50">group</span>
                            <p>Sua lista de convidados ainda está vazia.</p>
                        </div>
                    ) : filteredGuests.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">Nenhum convidado corresponde aos filtros atuais.</div>
                    ) : (
                        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                            <AnimatePresence>
                                {filteredGuests.map((guest, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={guest.id} 
                                        onClick={() => setSelectedGuest(guest)}
                                        className="flex flex-col md:flex-row md:items-center justify-between p-4 px-6 hover:bg-slate-50 transition-colors gap-4 cursor-pointer"
                                    >
                                        <div className="flex gap-4 items-center">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 font-bold border border-slate-200">
                                                {guest.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{guest.name}</p>
                                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                                    {guest.adults || 1} Adulto(s) {guest.children ? `• ${guest.children} Criança(s)` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            {guest.checkedIn && (
                                                <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full flex items-center text-xs font-bold gap-1 border border-emerald-100">
                                                    <CheckCircle2 size={14} /> Presença (Check-in)
                                                </div>
                                            )}
                                            <StatusBadge status={guest.status} />
                                        </div>
                                        {guest.message && (
                                            <div className="w-full md:w-auto mt-2 md:mt-0 text-sm italic text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 md:max-w-xs truncate">
                                                "{guest.message}"
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </main>

            <ExecutiveReportModal 
                isOpen={showReportModal} 
                onClose={() => setShowReportModal(false)} 
                event={event} 
                guests={guests} 
                agencyName={agencyName} 
                agencyLogo={agencyLogo} 
            />

            <GuestDetailsModal
                isOpen={!!selectedGuest}
                onClose={() => setSelectedGuest(null)}
                guest={selectedGuest}
            />
        </div>
    );
};

const FilterButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            active 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200'
        }`}
    >
        {label}
    </button>
);

const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className={`p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between transition-all duration-300 bg-white`}>
        <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={16} />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        </div>
        <span className="text-3xl font-serif font-bold text-slate-800">{value}</span>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    switch(status) {
        case 'CONFIRMED':
            return <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-green-200"><CheckCircle2 size={12}/> Confirmado</span>;
        case 'DECLINED':
            return <span className="bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-red-200">Recusado</span>;
        default:
            return <span className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-orange-200"><Clock size={12}/> Pendente</span>;
    }
};
