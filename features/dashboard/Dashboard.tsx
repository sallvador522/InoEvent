import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Users, CheckCircle2, QrCode, Share2, Download, Clock, Search, MessageSquare, ArrowLeft, MoreHorizontal, Settings, Copy, Check, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, collection, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { QRScanner } from '../../components/QRScanner';

export const Dashboard = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<any>(null);
    const [guests, setGuests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [copied, setCopied] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<any>(null);
    const [showGuestMenu, setShowGuestMenu] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanState, setScanState] = useState<{status: 'idle' | 'processing' | 'success' | 'error' | 'already_scanned', message: string, guestName?: string}>({status: 'idle', message: ''});
    const [activeFilter, setActiveFilter] = useState<'all' | 'checkedIn' | 'confirmed' | 'pending' | 'declined'>('all');

    useEffect(() => {

        if (!id) return;
        
        // 1. Fetch Event
        const eventRef = doc(db, 'events', id);
        const unsubscribeEvent = onSnapshot(eventRef, 
            (docSnap) => {
                if (docSnap.exists()) {
                    setEvent({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setEvent(null);
                }
            },
            (error) => {
                handleFirestoreError(error, OperationType.GET, `events/${id}`);
            }
        );

        // 2. Fetch Guests
        const guestsRef = collection(db, 'events', id, 'guests');
        // If sorting isn't indexed, it will fallback without orderBy if it fails, but let's just get them as is.
        const unsubscribeGuests = onSnapshot(guestsRef,
            (snapshot) => {
                const guestsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setGuests(guestsList);
                setLoading(false);
            },
            (error) => {
                if(error.message.includes('Missing or insufficient permissions')) {
                    console.warn("Guest subcollection read access denied or pending rules.");
                } else {
                    handleFirestoreError(error, OperationType.LIST, `events/${id}/guests`);
                }
                setLoading(false);
            }
        );
        
        return () => {
            unsubscribeEvent();
            unsubscribeGuests();
        };
    }, [id]);

    const handleCopyLink = () => {
        const link = `${window.location.origin}/invite/${event?.id}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const confirmDelete = () => setShowDeleteConfirm(true);

    const handleExportCSV = () => {
        const headers = ['Nome', 'Telefone', 'Status', 'Confirmados', 'Mensagem', 'Data'];
        const rows = guests.map(g => [
            `"${g.name || ''}"`,
            `"${g.phone || ''}"`,
            `"${g.status === 'CONFIRMED' ? 'Confirmado' : 'Recusado'}"`,
            g.adults || 0,
            `"${(g.message || '').replace(/"/g, '""')}"`,
            `"${new Date(g.createdAt).toLocaleDateString('pt-BR')}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `convidados_${event.title.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleScanResult = async (result: string) => {
        if(scanState.status !== 'idle') return;
        setScanState({ status: 'processing', message: 'Processando QR Code...' });
        try {
            // Extracts guest parameter whether it's in search params or hash (e.g. /#/checkin/.../?guest=123)
            let guestUrlId: string | null = null;
            if (result.includes('guest=')) {
                guestUrlId = result.split('guest=')[1].split('&')[0];
            } else {
                const url = new URL(result);
                guestUrlId = url.searchParams.get('guest');
            }
            
            if(guestUrlId) {
                const g = guests.find(guest => guest.id === guestUrlId);
                if (g) {
                    if (g.checkedIn) {
                        setScanState({ status: 'already_scanned', message: 'Já realizou o check-in!', guestName: g.name });
                    } else {
                        const guestRef = doc(db, 'events', id!, 'guests', guestUrlId);
                        await updateDoc(guestRef, {
                            checkedIn: true,
                            checkedInAt: new Date().toISOString()
                        });
                        setScanState({ status: 'success', message: 'Check-in confirmado!', guestName: g.name });
                   }
                } else {
                    setScanState({ status: 'error', message: 'Convidado não encontrado nesta lista.' });
                }
            } else {
                setScanState({ status: 'error', message: 'Formato de QR Code inválido.' });
            }
        } catch (e) {
            setScanState({ status: 'error', message: 'QR Code Inválido ou não pertence a este sistema.' });
        }
        setTimeout(() => setScanState({ status: 'idle', message: '' }), 3500); // clear after delay
    };

    const handleDeleteEvent = async () => {
        setIsDeleting(true);
        try {
            if (!id) return;
            const eventRef = doc(db, 'events', id);
            await deleteDoc(eventRef);
            navigate('/');
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
            alert('Falha ao remover o evento.');
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleDeleteGuest = async (guestId: string) => {
        setIsDeleting(true);
        try {
            const guestRef = doc(db, 'events', id!, 'guests', guestId);
            await deleteDoc(guestRef);
            setShowGuestMenu(false);
            setSelectedGuest(null);
            setIsDeleting(false);
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `events/${id}/guests/${guestId}`);
            alert('Falha ao remover o convidado.');
            setIsDeleting(false);
        }
    };

    if(loading) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if(!event) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-serif text-slate-800 mb-4">Evento não encontrado ou já foi apagado.</h1>
                <Link to="/" className="px-6 py-3 bg-brand-blue text-white rounded-xl font-bold">Voltar ao Início</Link>
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
        <div className="min-h-screen bg-[#FDFDFD] pb-20 font-display text-slate-800">
            {/* Minimalist Top Navbar */}
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Painel do Evento</span>
                        <h1 className="text-lg font-serif font-bold text-brand-blue leading-tight truncate max-w-[200px] md:max-w-md">{event.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button 
                            onClick={() => setSettingsOpen(!settingsOpen)}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <Settings size={20} />
                        </button>
                        <AnimatePresence>
                            {settingsOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute top-12 right-0 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 flex flex-col"
                                >
                                    <Link to={`/edit-invitation/${event.id}`} className="px-4 py-3 flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors border-b border-slate-100">
                                        <Edit2 size={16} /> Editar Evento
                                    </Link>
                                    <button 
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                        className="px-4 py-3 flex items-center gap-2 text-red-600 hover:bg-red-50 font-bold text-sm transition-colors text-left"
                                    >
                                        <Trash2 size={16} /> Apagar Evento
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <Link to={`/invite/${event.id}`} target="_blank" className="px-4 py-2 bg-brand-blue text-white rounded-full font-bold text-sm hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20 transition-all">
                        Ver Convite
                    </Link>
                </div>
            </nav>

            <AnimatePresence>
                {showDeleteConfirm && (
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
                            <h3 className="text-2xl font-serif text-slate-800 mb-2">Apagar evento?</h3>
                            <p className="text-slate-500 mb-8">Esta ação não pode ser desfeita. Todos os convidados e confirmações de presença associadas serão removidos permanentemente.</p>
                            <div className="flex gap-4 w-full">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleDeleteEvent}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex justify-center items-center gap-2"
                                >
                                    {isDeleting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Apagar!'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="max-w-6xl mx-auto px-6 mt-8">
                {/* Intro & Copy Link */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-4xl font-serif text-brand-blue mb-2">Visão Geral</h2>
                        <p className="text-slate-500">Acompanhe as confirmações de presença do seu evento em tempo real.</p>
                    </div>
                    <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-200 w-full md:w-auto h-14">
                        <div className="px-4 flex items-center text-slate-500 text-sm truncate max-w-[200px]">
                            {`${window.location.origin}/invite/${event.id}`}
                        </div>
                        <button 
                            onClick={handleCopyLink}
                            className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                                copied ? 'bg-green-500 text-white' : 'bg-white text-brand-blue shadow-sm hover:shadow-md'
                            }`}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copiado!' : 'Copiar Link'}
                        </button>
                    </div>
                </div>

                {/* Spatial UI Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
                    <StatCard title="Total" value={totalCount} icon={Users} color="bg-blue-50 text-blue-600" />
                    <StatCard title="Entraram" value={checkedInCount} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
                    <StatCard title="Confirmados" value={confirmedCount} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                    <StatCard title="Pendentes" value={pendingCount} icon={Clock} color="bg-orange-50 text-orange-600" />
                    <StatCard title="Recusados" value={declinedCount} icon={Users} color="bg-red-50 text-red-600" />
                </div>

                {/* Main Content Area */}
                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* Guest List Column */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">Lista de Convidados</h3>
                            <button onClick={handleExportCSV} className="text-sm font-bold text-brand-blue bg-brand-blue/5 px-4 py-2 rounded-full hover:bg-brand-blue/10 transition-colors flex items-center gap-2">
                                <Download size={16} /> Exportar CSV
                            </button>
                        </div>

                        {/* Glassmorphic Search Bar & Filters */}
                        <div className="flex flex-col xl:flex-row gap-4">
                            <div className="relative group flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors w-5 h-5" />
                                <input 
                                    type="text" 
                                    placeholder="Busque por nome ou telefone..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                                />
                            </div>
                            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
                                <FilterButton label="Todos" active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
                                <FilterButton label="Entraram" active={activeFilter === 'checkedIn'} onClick={() => setActiveFilter('checkedIn')} />
                                <FilterButton label="Confirmados" active={activeFilter === 'confirmed'} onClick={() => setActiveFilter('confirmed')} />
                                <FilterButton label="Pendentes" active={activeFilter === 'pending'} onClick={() => setActiveFilter('pending')} />
                            </div>
                        </div>

                        {/* List container */}
                        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            {guests.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <Users className="text-slate-300 w-8 h-8" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-700 mb-1">Nenhum convidado ainda</h4>
                                    <p className="text-slate-500 text-sm max-w-sm">
                                        Compartilhe o link do seu convite para que as pessoas possam confirmar presença.
                                    </p>
                                </div>
                            ) : filteredGuests.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">Nenhum resultado encontrado para "{searchQuery}"</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    <AnimatePresence>
                                        {filteredGuests.map((guest, idx) => (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={guest.id} 
                                                className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                        {guest.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{guest.name}</p>
                                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                                            <span>{guest.phone}</span>
                                                            <span className="opacity-50 mx-1">•</span>
                                                            {guest.adults || 1} Adulto(s) {guest.children ? `• ${guest.children} Criança(s)` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {guest.checkedIn && (
                                                        <div className="bg-green-100 text-green-700 p-2 rounded-full flex items-center justify-center text-xs font-bold gap-1" title="Check-in Realizado">
                                                            <CheckCircle2 size={16} /> Check-in
                                                        </div>
                                                    )}
                                                    <StatusBadge status={guest.status} />
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedGuest(guest);
                                                            setShowGuestMenu(true);
                                                        }}
                                                        className="text-slate-400 hover:text-brand-blue p-3 rounded-full hover:bg-brand-blue/5 transition-colors z-10"
                                                    >
                                                        <MoreHorizontal size={24} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="flex flex-col gap-6">
                        {(event?.plan === 'Premium' || event?.plan === 'Corporate') ? (
                         <div className="bg-brand-blue text-white rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-brand-blue/20">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            <h3 className="text-xl font-bold mb-2">Check-in Digital</h3>
                            <p className="text-blue-100 text-sm mb-6">Use a câmera do seu celular para validar a entrada dos convidados com QR Code.</p>
                            <button onClick={() => setShowScanner(true)} className="w-full bg-white text-brand-blue py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-lg">
                                <QrCode size={18} /> Validar QRCode
                            </button>
                         </div>
                        ) : (
                         <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-slate-900/20 text-center">
                            <h3 className="text-xl font-bold mb-2 text-[#BF9B30]">Upgrade para Premium</h3>
                            <p className="text-slate-300 text-sm mb-6">Desbloqueie o Check-in Digital na portaria e a validação rápida de QR Codes.</p>
                            <Link to="/plans" className="w-full bg-[#BF9B30] text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-colors shadow-lg">
                                Mudar Plano
                            </Link>
                         </div>
                        )}

                         <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">Informações</h3>
                            <div className="flex flex-col gap-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Data</span>
                                    <span className="font-medium text-slate-800">{new Date(event.isoDate || event.date).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Horário</span>
                                    <span className="font-medium text-slate-800">{event.time || 'A definir'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Tipo de Evento</span>
                                    <span className="font-medium text-slate-800 capitalize">{event.type?.toLowerCase()}</span>
                                </div>
                            </div>
                         </div>

                         <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">Suporte</h3>
                            <div className="flex flex-col gap-4 text-sm font-medium">
                                {(!event?.plan || event?.plan === 'Essencial') && (
                                   <div className="flex items-center gap-3 text-slate-600">
                                      <MessageSquare size={18} /> Via E-mail
                                   </div>
                                )}
                                {event?.plan === 'Premium' && (
                                   <div className="flex items-center gap-3 text-[#BF9B30]">
                                      <MessageSquare size={18} /> WhatsApp Prioritário
                                   </div>
                                )}
                                {event?.plan === 'Corporate' && (
                                   <div className="flex items-center gap-3 text-brand-blue">
                                      <Users size={18} /> Gestor de Conta Dedicado
                                   </div>
                                )}
                            </div>
                         </div>
                    </div>
                </div>
            </main>

            {/* Scanner Modal */}
            <AnimatePresence>
                {showScanner && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
                    >
                        <div className="w-full max-w-sm flex flex-col gap-4">
                            <div className="flex items-center justify-between text-white mb-2">
                                <h3 className="font-bold text-lg flex items-center gap-2"><QrCode size={20}/> Check-in</h3>
                                <button onClick={() => {setShowScanner(false); setScanState({ status: 'idle', message: '' });}} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    X
                                </button>
                            </div>
                            <div className="rounded-3xl overflow-hidden shadow-2xl relative bg-black aspect-square">
                                <QRScanner 
                                    onScan={(result) => {
                                        if (result) {
                                            handleScanResult(result);
                                        }
                                    }}
                                    onError={(err) => console.log(err)}
                                />
                                {scanState.status !== 'idle' && (
                                    <div className={`absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-sm z-10 font-bold text-xl ${
                                        scanState.status === 'success' ? 'bg-green-500/90' :
                                        scanState.status === 'already_scanned' ? 'bg-yellow-500/90' :
                                        scanState.status === 'error' ? 'bg-red-500/90' :
                                        'bg-brand-blue/90'
                                    }`}>
                                        <div className="mb-2">
                                            {scanState.status === 'success' && <CheckCircle2 size={48} className="mx-auto" />}
                                            {scanState.status === 'already_scanned' && <Clock size={48} className="mx-auto" />}
                                            {scanState.status === 'processing' && <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />}
                                        </div>
                                        <p>{scanState.message}</p>
                                        {scanState.guestName && <p className="text-sm font-normal mt-2 opacity-90">{scanState.guestName}</p>}
                                    </div>
                                )}
                            </div>
                            <p className="text-white/60 text-center text-sm mt-4">Aponte a câmera para o QR Code no convite</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Guest Actions Modal */}
            <AnimatePresence>
                {showGuestMenu && selectedGuest && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100"
                        >
                            <h3 className="text-lg font-bold text-slate-800">{selectedGuest.name}</h3>
                            <p className="text-sm font-bold text-slate-500 mb-4">{selectedGuest.phone || 'Sem contato'}</p>
                            <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm text-slate-600">
                                <p className="font-bold text-xs uppercase text-slate-400 mb-1">Mensagem enviada:</p>
                                {selectedGuest.message || 'Nenhuma mensagem enviada.'}
                            </div>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => handleDeleteGuest(selectedGuest.id)}
                                    className="w-full py-3 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                >
                                    Apagar Convidado
                                </button>
                                <button 
                                    onClick={() => setShowGuestMenu(false)}
                                    className="w-full py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

const FilterButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            active 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
        }`}
    >
        {label}
    </button>
);

const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                <Icon size={24} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-end gap-2 text-slate-800">
            <span className="text-4xl font-serif font-medium">{value}</span>
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    switch(status) {
        case 'CONFIRMED':
            return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={12}/> Confirmado</span>;
        case 'DECLINED':
            return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Recusado</span>;
        default:
            return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={12}/> Pendente</span>;
    }
};
