import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Users, CheckCircle2, QrCode, Share2, Download, Clock, Search, MessageSquare, ArrowLeft, MoreHorizontal, Settings, Copy, Check, Edit2, Trash2, Plus, MessageCircle, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, collection, onSnapshot, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { QRScanner } from '../../components/QRScanner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { SmartAssistant } from './SmartAssistant';
import { playScanSound } from '../../lib/sound';
import toast from 'react-hot-toast';

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
    const [showAddGuestModal, setShowAddGuestModal] = useState(false);
    const [newGuestName, setNewGuestName] = useState("");
    const [newGuestPhone, setNewGuestPhone] = useState("");
    const [showScanner, setShowScanner] = useState(false);
    const [scanState, setScanState] = useState<{status: 'idle' | 'processing' | 'success' | 'error' | 'already_scanned', message: string, guestName?: string}>({status: 'idle', message: ''});
    const [activeFilter, setActiveFilter] = useState<'all' | 'checkedIn' | 'confirmed' | 'pending' | 'declined'>('all');

    const [activeTab, setActiveTab] = useState<'guests' | 'analytics' | 'assistant'>('guests');

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
        toast.success("Link do evento copiado!");
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
            `"${g.createdAt ? new Date(g.createdAt).toLocaleDateString('pt-BR') : ''}"`
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
        toast.success("Lista exportada com sucesso");
    };

    const handleManualAddGuest = async () => {
        if (!newGuestName.trim() || !id) return;
        
        let maxGuests = 100;
        if (event?.plan === 'Premium') maxGuests = 500;
        if (event?.plan === 'Business') maxGuests = 5000;
        if (event?.plan === 'Corporate') maxGuests = Infinity;
        
        const confirmedCount = guests.filter(g => g.status === 'CONFIRMED').length;
        if (confirmedCount >= maxGuests) {
            toast.error(`O plano ${event?.plan || 'Essencial'} permite no máximo ${maxGuests} convidados confirmados.`);
            return;
        }

        try {
            const guestRef = doc(collection(db, 'events', id, 'guests'));
            await setDoc(guestRef, {
                name: newGuestName,
                phone: newGuestPhone,
                status: 'CONFIRMED',
                adults: 1,
                createdAt: new Date().toISOString()
            });
            setNewGuestName("");
            setNewGuestPhone("");
            setShowAddGuestModal(false);
            toast.success("Convidado adicionado!");
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'guests');
            toast.error("Erro ao adicionar convidado");
        }
    };

    const handleWhatsAppShare = (guest: any) => {
        if (!id || !event) return;
        const msg = `Olá ${guest.name}! Segue o link do convite para "${event.title}": ${window.location.origin}/#/invite/${id}`;
        const phone = (guest.phone || "").replace(/\D/g, '');
        if (phone) {
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        } else {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
        }
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
                        playScanSound('already_scanned');
                    } else {
                        const guestRef = doc(db, 'events', id!, 'guests', guestUrlId);
                        await updateDoc(guestRef, {
                            checkedIn: true,
                            checkedInAt: new Date().toISOString()
                        });
                        setScanState({ status: 'success', message: 'Check-in confirmado!', guestName: g.name });
                        playScanSound('success');
                   }
                } else {
                    setScanState({ status: 'error', message: 'Convidado não encontrado nesta lista.' });
                    playScanSound('error');
                }
            } else {
                setScanState({ status: 'error', message: 'Formato de QR Code inválido.' });
                playScanSound('error');
            }
        } catch (e) {
            setScanState({ status: 'error', message: 'QR Code Inválido ou não pertence a este sistema.' });
            playScanSound('error');
        }
        setTimeout(() => setScanState({ status: 'idle', message: '' }), 3500); // clear after delay
    };

    const handleDeleteEvent = async () => {
        setIsDeleting(true);
        try {
            if (!id) return;
            const eventRef = doc(db, 'events', id);
            await deleteDoc(eventRef);
            toast.success("Evento apagado com sucesso");
            navigate('/');
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
            toast.error('Falha ao remover o evento.');
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleDeleteGuest = async (guestId: string) => {
        setIsDeleting(true);
        try {
            const guestRef = doc(db, 'events', id!, 'guests', guestId);
            await deleteDoc(guestRef);
            toast.success("Convidado removido!");
            setShowGuestMenu(false);
            setSelectedGuest(null);
            setIsDeleting(false);
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `events/${id}/guests/${guestId}`);
            toast.error('Falha ao remover o convidado.');
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

    const pieData = [
        { name: 'Confirmados', value: confirmedCount, color: '#10B981' },
        { name: 'Pendentes', value: pendingCount, color: '#F59E0B' },
        { name: 'Recusados', value: declinedCount, color: '#EF4444' }
    ].filter(d => d.value > 0);

    const checkinTimeline: any = {};
    guests.forEach(g => {
        if (g.checkedInAt) {
            const date = new Date(g.checkedInAt);
            const key = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}h`;
            if(!checkinTimeline[key]) checkinTimeline[key] = 0;
            checkinTimeline[key]++;
        }
    });

    const timelineData = Object.keys(checkinTimeline).sort().reduce((acc: any, key: string) => {
        const lastCount = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
        acc.push({
            time: key,
            count: checkinTimeline[key],
            cumulative: lastCount + checkinTimeline[key]
        });
        return acc;
    }, []);

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-[#FDFDFD] pb-20 font-display text-slate-800">
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
                    {(event?.plan === 'Premium' || event?.plan === 'Business' || event?.plan === 'Corporate') && (
                        <a 
                            href="https://wa.me/244900000000?text=Olá,%20preciso%20de%20suporte%20VIP" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hidden md:flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full hover:bg-emerald-100 transition-colors"
                        >
                            <MessageSquare size={16} />
                            Suporte VIP
                        </a>
                    )}
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
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-200 flex-1 md:flex-initial h-14">
                            <div className="px-4 flex items-center text-slate-500 text-sm truncate max-w-[150px]">
                                {`${window.location.origin}/invite/${event.id}`}
                            </div>
                            <button 
                                onClick={handleCopyLink}
                                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                                    copied ? 'bg-green-500 text-white' : 'bg-white text-brand-blue shadow-sm hover:shadow-md'
                                }`}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copiado!' : 'Convite'}
                            </button>
                        </div>
                        {(event?.plan === 'Business' || event?.plan === 'Corporate') && (
                            <button 
                                onClick={async () => {
                                    let token = event.clientToken;
                                    if (!token) {
                                        token = Math.random().toString(36).substring(2, 8).toUpperCase();
                                        await updateDoc(doc(db, 'events', event.id), { clientToken: token });
                                    }
                                    const link = `${window.location.origin}/#/client-dashboard/${event.id}?token=${token}`;
                                    navigator.clipboard.writeText(link);
                                    toast.success("Link do cliente copiado para a área de transferência!");
                                }}
                                className="h-14 px-6 bg-[#BF9B30] text-slate-900 rounded-2xl font-bold text-sm hover:bg-[#BF9B30]/90 shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Share2 size={16} /> Link do Cliente
                            </button>
                        )}
                    </div>
                </div>

                {/* Spatial UI Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-12">
                    <StatCard title="Total" value={totalCount} icon={Users} color="bg-blue-50 text-blue-600" />
                    <StatCard title="Entraram" value={checkedInCount} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
                    <StatCard title="Confirmados" value={confirmedCount} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                    <StatCard title="Pendentes" value={pendingCount} icon={Clock} color="bg-orange-50 text-orange-600" />
                    <StatCard title="Recusados" value={declinedCount} icon={Users} color="bg-red-50 text-red-600" />
                </div>

                {/* Tabs UI */}
                <div className="flex flex-wrap gap-1 bg-slate-100 rounded-2xl lg:rounded-full p-1 mb-8 w-full md:w-fit mx-auto md:mx-0">
                    <button 
                        onClick={() => setActiveTab('guests')}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-xl lg:rounded-full font-bold text-sm transition-all ${activeTab === 'guests' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Gestão de Convidados
                    </button>
                    {(event?.plan === 'Business' || event?.plan === 'Corporate' || event?.plan === 'Premium') && (
                        <button 
                            onClick={() => setActiveTab('analytics')}
                            className={`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 rounded-xl lg:rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Analytics
                        </button>
                    )}
                    {(event?.plan === 'Corporate' || event?.plan === 'Premium') && (
                        <button 
                            onClick={() => setActiveTab('assistant')}
                            className={`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 rounded-xl lg:rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'assistant' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Assistente IA
                        </button>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* Dynamic Column (Guests or Analytics) */}
                    {activeTab === 'guests' && (
                        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h3 className="text-xl font-bold text-slate-800">Lista de Convidados</h3>
                                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                                <button onClick={() => setShowAddGuestModal(true)} className="justify-center text-sm font-bold text-white bg-slate-800 px-4 py-2 rounded-xl hover:bg-black transition-colors flex items-center gap-2 shadow-sm text-center">
                                    <Plus size={16} /> Adicionar
                                </button>
                                <button onClick={() => {
                                    const input = document.createElement("input");
                                    input.type = "file";
                                    input.accept = ".csv";
                                    input.onchange = (e: any) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = async (event: any) => {
                                                const text = event.target.result;
                                                const rows = text.split("\n");
                                                const guestsCollection = collection(db, "events", id!, "guests");
                                                let maxGuests = 100;
                                                if (event?.plan === "Premium") maxGuests = 500;
                                                if (event?.plan === "Business") maxGuests = 5000;
                                                if (event?.plan === "Corporate") maxGuests = Infinity;
                                                let added = 0;
                                                const currentCount = guests.filter(g => g.status === "CONFIRMED").length;
                                                const maxToAdd = maxGuests - currentCount;
                                                for (let i = 1; i < rows.length; i++) {
                                                    if (added >= maxToAdd) {
                                                        toast.error("O limite de convidados do seu plano foi atingido. (" + added + " adicionados)");
                                                        break;
                                                    }
                                                    const row = rows[i].split(",");
                                                    if (row.length >= 1 && row[0].trim()) {
                                                        try {
                                                            await setDoc(doc(guestsCollection), {
                                                                name: row[0].replace(/"/g, "").trim(),
                                                                phone: row[1] ? row[1].replace(/"/g, "").trim() : "",
                                                                status: "CONFIRMED",
                                                                adults: 1,
                                                                createdAt: new Date().toISOString()
                                                            });
                                                            added++;
                                                        } catch (err) {
                                                            console.error("Error importing row", row, err);
                                                        }
                                                    }
                                                }
                                                toast.success("Importação concluída.");
                                            };
                                            reader.readAsText(file);
                                        }
                                    };
                                    input.click();
                                }} className="justify-center text-sm font-bold text-white bg-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm text-center">
                                    <UploadCloud size={16} /> Importar CSV
                                </button>
                                <button onClick={handleExportCSV} className="text-sm font-bold text-brand-blue bg-brand-blue/5 px-4 py-2 rounded-xl hover:bg-brand-blue/10 transition-colors hidden sm:flex items-center gap-2 text-center">
                                    <Download size={16} /> Exportar
                                </button>
                            </div>
                        </div>

                        {/* Glassmorphic Search Bar & Filters */}
                        <div className="flex flex-col xl:flex-row gap-4 w-full min-w-0">
                            <div className="relative group flex-1 min-w-0">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors w-5 h-5" />
                                <input 
                                    type="text" 
                                    placeholder="Busque por nome ou telefone..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                                />
                            </div>
                            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar w-full xl:w-auto">
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
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50 transition-colors min-w-0"
                                            >
                                                <div className="flex gap-4 items-center min-w-0">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                                                        {guest.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800 truncate">{guest.name}</p>
                                                        <p className="text-sm text-slate-500 flex flex-wrap items-center gap-1">
                                                            <span className="truncate">{guest.phone}</span>
                                                            <span className="opacity-50 mx-1 hidden sm:inline">•</span>
                                                            <span className="whitespace-nowrap">{guest.adults || 1} Adulto(s)</span> {guest.children ? <span className="whitespace-nowrap">• {guest.children} Criança(s)</span> : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-4 ml-14 sm:ml-0">
                                                    {guest.checkedIn && (
                                                        <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full inline-flex items-center justify-center text-xs font-bold gap-1 whitespace-nowrap" title="Check-in Realizado">
                                                            <CheckCircle2 size={14} /> Check-in
                                                        </div>
                                                    )}
                                                    <StatusBadge status={guest.status} />
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedGuest(guest);
                                                            setShowGuestMenu(true);
                                                        }}
                                                        className="text-slate-400 hover:text-brand-blue p-2 sm:p-3 rounded-full hover:bg-brand-blue/5 transition-colors z-10"
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
                    )}
                    
                    {activeTab === 'analytics' && (
                        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
                            <h3 className="text-xl font-bold text-slate-800">Visualização de Dados (Analytics)</h3>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <h4 className="font-bold text-slate-700 mb-6">Status dos Convites</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                                        {pieData.map((d, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                                {d.name} ({d.value})
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <h4 className="font-bold text-slate-700 mb-6">Fluxo de Check-in</h4>
                                    <div className="h-64">
                                        {timelineData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={timelineData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Line type="monotone" dataKey="cumulative" stroke="#0EA5E9" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} name="Total Acumulado" />
                                                    <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} dot={false} name="Entradas/Hora" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold bg-slate-50 rounded-2xl">
                                                Dados insuficientes (Nenhum check-in)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'assistant' && (
                        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
                            <SmartAssistant event={event} guests={guests} />
                        </div>
                    )}

                    {/* Sidebar Actions */}
                    <div className="flex flex-col gap-6 min-w-0">
                        {(event?.plan === 'Premium' || event?.plan === 'Business' || event?.plan === 'Corporate') ? (
                         <div className="bg-brand-blue text-white rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-brand-blue/20">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            <h3 className="text-xl font-bold mb-2">Check-in Digital</h3>
                            <p className="text-blue-100 text-sm mb-6">Use a câmera do seu celular para validar a entrada dos convidados com QR Code.</p>
                            <button onClick={() => setShowScanner(true)} className="w-full bg-white text-brand-blue py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-lg mb-3">
                                <QrCode size={18} /> Validar QRCode
                            </button>
                            {(event?.plan === 'Business' || event?.plan === 'Corporate') && (
                                <button 
                                    onClick={async () => {
                                        let token = event.clientToken;
                                        if (!token) {
                                            token = Math.random().toString(36).substring(2, 8).toUpperCase();
                                            await updateDoc(doc(db, 'events', event.id), { clientToken: token });
                                        }
                                        const link = `${window.location.origin}/#/checkin/${event.id}?token=${token}&mode=reception`;
                                        navigator.clipboard.writeText(link);
                                        toast.success("Link de Recepcionista copiado para a área de transferência!");
                                    }}
                                    className="w-full bg-[#BF9B30] text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#BF9B30]/90 transition-colors shadow-lg"
                                >
                                    <Copy size={16} /> Link p/ Staff (Recepção)
                                </button>
                            )}
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
                                {(event?.plan === 'Business' || event?.plan === 'Corporate') && (
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
                            <div className="rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.2)] border-4 border-slate-800 relative bg-black aspect-square">
                                <QRScanner 
                                    onScan={(result) => {
                                        if (result) {
                                            handleScanResult(result);
                                        }
                                    }}
                                    onError={(err) => console.log(err)}
                                />
                                {scanState.status === 'idle' && (
                                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                        <motion.div 
                                            animate={{ top: ["0%", "100%", "0%"] }}
                                            transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                                            className="absolute left-0 w-full h-[2px] bg-brand-blue shadow-[0_0_20px_6px_rgba(37,99,235,0.6)]" 
                                        />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border-2 border-white/20 rounded-2xl" />
                                    </div>
                                )}
                                <AnimatePresence>
                                {scanState.status !== 'idle' && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-md z-10 font-bold text-xl ${
                                        scanState.status === 'success' ? 'bg-green-500/95' :
                                        scanState.status === 'already_scanned' ? 'bg-yellow-500/95' :
                                        scanState.status === 'error' ? 'bg-red-500/95' :
                                        'bg-brand-blue/95'
                                    }`}>
                                        <div className="mb-2">
                                            {scanState.status === 'success' && <CheckCircle2 size={56} className="mx-auto drop-shadow-md" />}
                                            {scanState.status === 'already_scanned' && <Clock size={56} className="mx-auto drop-shadow-md" />}
                                            {scanState.status === 'processing' && <div className="w-14 h-14 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto drop-shadow-md" />}
                                        </div>
                                        <p className="drop-shadow-md">{scanState.message}</p>
                                        {scanState.guestName && <p className="text-sm font-medium mt-2 opacity-90 drop-shadow-sm">{scanState.guestName}</p>}
                                    </motion.div>
                                )}
                                </AnimatePresence>
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
                                    onClick={() => handleWhatsAppShare(selectedGuest)}
                                    className="w-full py-3 rounded-xl font-bold bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-2 mb-2"
                                >
                                    <MessageCircle size={18} /> Disparar Convite no WhatsApp
                                </button>
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

            {/* Add Guest Modal */}
            <AnimatePresence>
                {showAddGuestModal && (
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
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Adicionar Convidado</h3>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">Nome do Convidado</label>
                                    <input 
                                        type="text" 
                                        value={newGuestName} 
                                        onChange={(e) => setNewGuestName(e.target.value)} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-brand-blue" 
                                        placeholder="Ex: Ana Silva"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">WhatsApp (Opcional)</label>
                                    <input 
                                        type="tel" 
                                        value={newGuestPhone} 
                                        onChange={(e) => setNewGuestPhone(e.target.value)} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-brand-blue" 
                                        placeholder="+55 11 99999-9999"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowAddGuestModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleManualAddGuest}
                                    className="flex-1 py-3 rounded-xl font-bold bg-brand-blue text-white hover:bg-blue-600 transition-colors"
                                >
                                    Adicionar
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
            return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 whitespace-nowrap"><CheckCircle2 size={12}/> Confirmado</span>;
        case 'DECLINED':
            return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">Recusado</span>;
        default:
            return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 whitespace-nowrap"><Clock size={12}/> Pendente</span>;
    }
};
