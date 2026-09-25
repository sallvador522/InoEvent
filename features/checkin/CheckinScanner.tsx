import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';
import { collection, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, useFirebase, OperationType, handleFirestoreError } from '../../components/FirebaseProvider';
import { CheckCircle, XCircle, ArrowLeft, ScanLine, Clock, CheckCircle2, Users, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { QRScanner } from '../../components/QRScanner';
import { playScanSound } from '../../lib/sound';
import { normalizePlanId, canUseFeature } from '../../lib/entitlements';
import toast from 'react-hot-toast';


const ConfettiBurst: React.FC<{ count?: number }> = ({ count = 30 }) => {
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#34D399'];
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-50">
            {Array.from({ length: count }).map((_, i) => {
                const angle = (i / count) * 360 + Math.random() * 20;
                const distance = 80 + Math.random() * 140;
                const radian = (angle * Math.PI) / 180;
                const x = Math.cos(radian) * distance;
                const y = Math.sin(radian) * distance;
                const rotation = Math.random() * 360;
                const size = 6 + Math.random() * 10;
                const delay = Math.random() * 0.12;
                const color = colors[Math.floor(Math.random() * colors.length)];

                return (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
                        animate={{
                            scale: [0, 1.2, 0.8, 0],
                            x: x,
                            y: y,
                            rotate: rotation + 180,
                            opacity: [1, 1, 0.8, 0]
                        }}
                        transition={{
                            duration: 1.3,
                            ease: "easeOut",
                            delay: delay
                        }}
                        className="absolute rounded-sm"
                        style={{
                            width: size,
                            height: size,
                            backgroundColor: color,
                        }}
                    />
                );
            })}
        </div>
    );
};

const AnimatedCheckmark: React.FC<{ className?: string }> = ({ className = "w-10 h-10 text-emerald-500" }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
                type: "spring",
                stiffness: 130,
                damping: 14,
                delay: 0.15
            }}
            d="M20 6L9 17l-5-5"
        />
    </svg>
);

export const CheckinScanner: React.FC = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const guestId = searchParams.get('guest');
    const token = searchParams.get('token');
    const mode = searchParams.get('mode');
    
    const { user } = useFirebase();
    const navigate = useNavigate();
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthorized' | 'reception_mode'>('loading');
    const [message, setMessage] = useState('Verificando credenciais...');
    const [guestName, setGuestName] = useState<string>('');

    // Reception Mode State
    const [scanState, setScanState] = useState<{status: 'idle' | 'processing' | 'success' | 'error' | 'already_scanned', message: string, guestName?: string, companions?: number}>({status: 'idle', message: ''});
    
    const [activeTab, setActiveTab] = useState<'scanner' | 'list'>('scanner');
    const [guests, setGuests] = useState<any[]>([]);
    // Servidor pode recusar a lista (plano sem check-in) mesmo com token válido.
    const [listBlocked, setListBlocked] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isGuestsLoading, setIsGuestsLoading] = useState(true);
    const [pendingCheckInId, setPendingCheckInId] = useState<string | null>(null);

    useEffect(() => {
        const processCheckin = async () => {
            if (!id) return;

            try {
                // Verify event and check mode
                const eventRef = doc(db, 'events', id);
                const eventSnap = await getDoc(eventRef);
                
                if (!eventSnap.exists()) {
                    setStatus('error');
                    setMessage('Evento não encontrado.');
                    return;
                }

                // If mode is reception and token is valid
                if (mode === 'reception' && token) {
                    if (eventSnap.data().clientToken === token) {
                        // Check-in é VIP/Business: token válido mas plano sem a
                        // funcionalidade mostra aviso em vez da lista.
                        const evPlan = normalizePlanId((eventSnap.data() as any)?.plan ?? (eventSnap.data() as any)?.planId);
                        if (!canUseFeature(evPlan, 'checkin')) {
                            setStatus('error');
                            setMessage('Este evento não inclui check-in. Faça upgrade para VIP.');
                            return;
                        }
                        setStatus('reception_mode');
                        return; // stay in reception mode
                    } else {
                        setStatus('unauthorized');
                        setMessage('Token de acesso inválido.');
                        return;
                    }
                }

                // Otherwise, normal checkin
                if (!user) {
                    // Public scan is NOT allowed unless it's done by auth user
                    setStatus('unauthorized');
                    setMessage('Faça login para utilizar o scanner.');
                    return;
                }

                if (!guestId) {
                    setStatus('error');
                    setMessage('Código QR inválido. Identificador de convidado ausente.');
                    return;
                }
                
                if (eventSnap.data().ownerId !== user.uid) {
                    setStatus('unauthorized');
                    setMessage('Você não tem permissão para realizar check-in neste evento.');
                    return;
                }

                // Verify and update guest
                const guestRef = doc(db, 'events', id, 'guests', guestId);
                const guestSnap = await getDoc(guestRef);

                if (!guestSnap.exists()) {
                    setStatus('error');
                    setMessage('Convidado não encontrado na lista.');
                    return;
                }

                const guestData = guestSnap.data();
                setGuestName(guestData.name);

                if (guestData.status === 'CHECKED_IN' || guestData.checkedIn) {
                    setStatus('error');
                    setMessage(`${guestData.name} já realizou check-in anteriormente!`);
                    return;
                }

                if (guestData.status === 'DECLINED') {
                    setStatus('error');
                    setMessage(`${guestData.name} recusou o convite, mas está tentando entrar.`);
                    return;
                }

                // Fire the checkin update
                await updateDoc(guestRef, {
                    checkedIn: true,
                    status: 'CHECKED_IN',
                    name: guestData.name, // required by schema rule
                    checkedInAt: new Date().toISOString(), clientToken: token || null
                });

                setStatus('success');
                setMessage('Check-in realizado com sucesso!');
            } catch (err: any) {
                console.error(err);
                if(!err.message?.includes("Missing or insufficient permissions")) {
                   handleFirestoreError(err, OperationType.GET, `events/${id}`);
                }
                setStatus('error');
                setMessage('Falha ao processar o check-in.');
            }
        };

        processCheckin();
    }, [id, guestId, user, mode, token]);

    useEffect(() => {
        if (status === 'reception_mode' && id) {
            // Lista via API com o código do evento (a leitura direta da lista
            // exige dono/equipa; a receção usa o token do link). Polling curto
            // mantém a lista fresca sem escuta permanente.
            let cancelled = false;
            const loadGuests = async () => {
                try {
                    const res = await fetch(`/api/events/${id}/guests?token=${encodeURIComponent(token || '')}`);
                    if (res.status === 403) {
                        const data = await res.json().catch(() => ({}));
                        if (data?.code === 'CHECKIN_NOT_INCLUDED' && !cancelled) {
                            setListBlocked(true);
                            setIsGuestsLoading(false);
                            return;
                        }
                        throw new Error('forbidden');
                    }
                    if (!res.ok) throw new Error('forbidden');
                    const data = await res.json();
                    if (!cancelled && Array.isArray(data.guests)) {
                        setGuests(data.guests);
                    }
                } catch (e) {
                    console.warn('Falha ao atualizar lista da receção:', e);
                } finally {
                    if (!cancelled) setIsGuestsLoading(false);
                }
            };
            setIsGuestsLoading(true);
            loadGuests();
            const timer = setInterval(loadGuests, 5000);
            return () => { cancelled = true; clearInterval(timer); };
        }
    }, [status, id, token]);

    const handleScanResult = async (qrData: string) => {
        // Block all scans while showing any result (success, error, already_scanned, processing)
        if (scanState.status !== 'idle') return;
        
        try {
            setScanState({ status: 'processing', message: 'Validando QR Code...' });
            
            // Extract guest ID from QR data — supports both plain "guest=ID" and full URL formats
            let scannedGuestId: string | null = null;
            const plainMatch = qrData.match(/^guest=(.+)$/);
            if (plainMatch) {
                scannedGuestId = plainMatch[1];
            } else {
                try {
                    const url = new URL(qrData);
                    scannedGuestId = url.searchParams.get('guest');
                } catch {
                    // Not a URL either — will fall through to the "invalid format" branch below
                }
            }
            
            if (scannedGuestId && id) {
                const guestRef = doc(db, 'events', id, 'guests', scannedGuestId);
                const guestSnap = await getDoc(guestRef);
                
                if (guestSnap.exists()) {
                    const data = guestSnap.data();
                    
                    if (data.checkedIn || data.status === 'CHECKED_IN') {
                        setScanState({ 
                            status: 'already_scanned', 
                            message: 'Aviso: Check-in já foi realizado',
                            guestName: data.name,
                            companions: data.adults ? (data.adults - 1) + (data.children || 0) : 0
                        });
                        playScanSound('error');
                    } else {
                        await updateDoc(guestRef, { 
                            checkedIn: true, 
                            status: 'CHECKED_IN',
                            name: data.name,
                            checkedInAt: new Date().toISOString(), clientToken: token || null 
                        });
                        setScanState({ 
                            status: 'success', 
                            message: 'Check-in Realizado com Sucesso!',
                            guestName: data.name,
                            companions: data.adults ? (data.adults - 1) + (data.children || 0) : 0
                        });
                        playScanSound('success');
                    }
                } else {
                    setScanState({ status: 'error', message: 'Convidado não encontrado.' });
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
        // Overlay stays visible until operator taps "Próximo Convidado" — no auto-reset
    };

    const handleManualCheckIn = async (guest: any) => {
        if (!id || pendingCheckInId) return;
        setPendingCheckInId(guest.id);
        try {
            const guestRef = doc(db, 'events', id, 'guests', guest.id);
            // clientToken: é o que autoriza a receção (não-dona) nas regras.
            // Antes faltava aqui e o botão falhava em modo receção puro.
            await updateDoc(guestRef, {
                checkedIn: !guest.checkedIn,
                status: !guest.checkedIn ? 'CHECKED_IN' : 'CONFIRMED',
                name: guest.name,
                checkedInAt: !guest.checkedIn ? new Date().toISOString() : null,
                clientToken: token || null
            });
        } catch (e) {
            console.error("Error manually checking in guest", e);
            toast.error("Falha ao registar. Tenta de novo.");
        } finally {
            setPendingCheckInId(null);
        }
    };

    // Busca memoizada: antes o filter O(n) corria a cada render (cada tecla, cada
    // snapshot de check-in). A query normalizada é calculada uma vez por mudança.
    const filteredGuests = React.useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return guests;
        return guests.filter(g =>
            g.name?.toLowerCase().includes(q) ||
            g.phone?.toLowerCase().includes(q)
        );
    }, [guests, searchQuery]);

    if (status === 'reception_mode') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col font-display">
                {/* Tabs */}
                <div className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 pb-0">
                    <div className="flex gap-2 mb-4">
                        <button 
                            onClick={() => setActiveTab('scanner')}
                            className={`flex-1 py-3 px-4 rounded-t-xl font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'scanner' ? 'bg-slate-800 text-brand-blue border-b-2 border-brand-blue' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <ScanLine size={18} /> Scanner
                        </button>
                        <button 
                            onClick={() => setActiveTab('list')}
                            className={`flex-1 py-3 px-4 rounded-t-xl font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'list' ? 'bg-slate-800 text-brand-blue border-b-2 border-brand-blue' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Users size={18} /> Lista
                        </button>
                    </div>
                </div>

                {activeTab === 'scanner' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-4">
                        <div className="w-full max-w-sm flex flex-col gap-6">
                            <div className="text-center text-white mb-2">
                                <ScanLine size={48} className="mx-auto mb-4 text-brand-blue" />
                                <h2 className="text-2xl font-bold">Modo Recepção</h2>
                                <p className="opacity-70 text-sm mt-1">Aponte a câmera para os QR Codes</p>
                            </div>
                            
                            <div className="rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.2)] relative bg-black aspect-square border-4 border-slate-800">
                                <QRScanner 
                                    onScan={(result) => {
                                        if (result) handleScanResult(result);
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
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-lg z-10 font-bold text-xl ${
                                                scanState.status === 'success' ? 'bg-emerald-500/95' :
                                                scanState.status === 'already_scanned' ? 'bg-amber-500/95' :
                                                scanState.status === 'error' ? 'bg-rose-500/95' :
                                                'bg-brand-blue/95'
                                            }`}
                                        >
                                            {scanState.status === 'success' && <ConfettiBurst count={25} />}
                                            
                                            <motion.div 
                                                initial={{ scale: 0, rotate: -20 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
                                                className="mb-4"
                                            >
                                                {scanState.status === 'success' && (
                                                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                                        <AnimatedCheckmark className="w-12 h-12 text-white" />
                                                    </div>
                                                )}
                                                {scanState.status === 'already_scanned' && (
                                                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                                        <Clock size={40} className="text-white drop-shadow-md" />
                                                    </div>
                                                )}
                                                {scanState.status === 'processing' && (
                                                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                                )}
                                                {scanState.status === 'error' && (
                                                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                                        <XCircle size={40} className="text-white drop-shadow-md" />
                                                    </div>
                                                )}
                                            </motion.div>
                                            <motion.p 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="drop-shadow-md text-2xl font-black tracking-tight"
                                            >
                                                {scanState.message}
                                            </motion.p>
                                            {scanState.guestName && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="mt-4"
                                                >
                                                    <p className="text-xl font-bold opacity-100 drop-shadow-md">{scanState.guestName}</p>
                                                    {scanState.companions !== undefined && (
                                                        <p className="text-sm font-semibold opacity-90 drop-shadow-sm bg-black/30 rounded-full px-5 py-1.5 mt-2.5 inline-block border border-white/10">
                                                            Pessoas: {1 + scanState.companions}
                                                        </p>
                                                    )}
                                                </motion.div>
                                            )}
                                            {/* Manual reset button — operator controls when to scan next */}
                                            {(scanState.status === 'success' || scanState.status === 'already_scanned' || scanState.status === 'error') && (
                                                <motion.button
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.5 }}
                                                    onClick={() => setScanState({ status: 'idle', message: '' })}
                                                    className="mt-6 px-8 py-3.5 bg-white/20 hover:bg-white/30 active:scale-[0.96] text-white font-bold text-base rounded-2xl border border-white/30 backdrop-blur-sm transition-all shadow-lg"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <ScanLine size={18} />
                                                        Próximo Convidado
                                                    </span>
                                                </motion.button>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'list' && (
                    <div className="flex-1 flex flex-col p-4 max-w-xl mx-auto w-full">
                        {listBlocked ? (
                            <div className="text-center py-12 px-6 bg-slate-800/80 border border-slate-700 rounded-2xl">
                                <ScanLine size={48} className="mx-auto text-slate-600 mb-4" />
                                <p className="text-white font-bold text-lg mb-1">Check-in não incluído</p>
                                <p className="text-slate-400 text-sm">Este evento não tem check-in no plano. Faça upgrade para VIP.</p>
                            </div>
                        ) : (
                        <>
                        <div className="bg-slate-800 p-4 rounded-2xl flex items-center gap-3 mb-4">
                            <Search size={20} className="text-slate-400" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar convidados..." 
                                className="bg-transparent text-white w-full focus:outline-none placeholder-slate-500 font-medium"
                            />
                        </div>
                        
                        {/* Lista virtualizada: só ~10 cartões no DOM mesmo com 1000+
                            convidados — crítico em telemóveis fracos na recepção. */}
                        <Virtuoso
                            style={{ height: 'calc(100dvh - 240px)', minHeight: 320 }}
                            totalCount={filteredGuests.length}
                            overscan={300}
                            components={{ Footer: () => <div style={{ height: 80 }} /> }}
                            itemContent={(index) => {
                                const guest = filteredGuests[index];
                                if (!guest) return null;
                                return (
                                <div className="pb-3">
                                <div key={guest.id} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className="font-bold text-white truncate text-lg">{guest.name}</p>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            <span className="text-sm text-slate-400 bg-slate-900/50 px-2 py-0.5 rounded-md">
                                                {(guest.adults || 1)} Adulto(s) {guest.children ? `• ${guest.children} Criança(s)` : ''}
                                            </span>
                                            {guest.tableId && (
                                                <span className="text-sm text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-md">
                                                    Mesa Assinalada
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleManualCheckIn(guest)}
                                        disabled={pendingCheckInId !== null}
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors disabled:opacity-60 ${guest.checkedIn ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                    >
                                        {pendingCheckInId === guest.id ? (
                                          <span className="w-7 h-7 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
                                        ) : guest.checkedIn ? <CheckCircle2 size={28} /> : <div className="w-7 h-7 rounded-full border-2 border-current opacity-50" />}
                                    </button>
                                </div>
                                </div>
                                );
                            }}
                        />
                            
                            {isGuestsLoading ? (
                                <div className="flex flex-col gap-3 pb-20" aria-hidden="true">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex items-center justify-between animate-pulse">
                                            <div className="flex-1 min-w-0 pr-4 space-y-2">
                                                <div className="h-5 w-2/3 bg-slate-700 rounded-lg" />
                                                <div className="h-4 w-1/3 bg-slate-700/70 rounded-md" />
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl bg-slate-700" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredGuests.length === 0 && (
                                <div className="text-center py-12">
                                    <Users size={48} className="mx-auto text-slate-700 mb-4" />
                                    <p className="text-slate-400 font-medium text-lg">{searchQuery ? 'Nada encontrado para esta busca.' : 'Nenhum convidado encontrado.'}</p>
                                </div>
                            )}
                        </>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-display">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 text-center"
            >
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-slate-800">Processando...</h2>
                        <p className="text-slate-500 mt-2 text-sm">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.15,
                                    delayChildren: 0.1
                                }
                            }
                        }}
                        className="flex flex-col items-center relative overflow-hidden"
                    >
                        <ConfettiBurst count={30} />
                        
                        <motion.div 
                            variants={{
                                hidden: { scale: 0, rotate: -30 },
                                visible: { 
                                    scale: 1, 
                                    rotate: 0,
                                    transition: { type: "spring", stiffness: 220, damping: 14 } 
                                }
                            }}
                            className="w-24 h-24 bg-emerald-50 border-2 border-emerald-500 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-md shadow-emerald-500/10"
                        >
                            <AnimatedCheckmark className="w-12 h-12 text-emerald-500" />
                        </motion.div>
                        
                        <motion.h2 
                            variants={{
                                hidden: { opacity: 0, y: 15 },
                                visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 15 } }
                            }}
                            className="text-3xl font-black text-slate-800 tracking-tight mb-2"
                        >
                            Acesso Liberado
                        </motion.h2>
                        
                        <motion.p 
                            variants={{
                                hidden: { opacity: 0, y: 15 },
                                visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 15 } }
                            }}
                            className="text-emerald-600 font-extrabold text-xl mb-2 drop-shadow-sm"
                        >
                            {guestName}
                        </motion.p>
                        
                        <motion.p 
                            variants={{
                                hidden: { opacity: 0, y: 15 },
                                visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 15 } }
                            }}
                            className="text-slate-500 text-sm mb-8 font-medium leading-relaxed max-w-xs"
                        >
                            {message}
                        </motion.p>
                        
                        <motion.div 
                            variants={{
                                hidden: { opacity: 0, y: 15 },
                                visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 15 } }
                            }}
                            className="w-full"
                        >
                            <Button fullWidth onClick={() => navigate(`/dashboard/${id}`)}>
                                Ir para Dashboard
                            </Button>
                        </motion.div>
                    </motion.div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                            <XCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Acesso Negado</h2>
                        {guestName && <p className="text-slate-700 font-bold mb-2">{guestName}</p>}
                        <p className="text-red-500 text-sm mb-8 font-medium">{message}</p>
                        <Button fullWidth onClick={() => navigate(`/dashboard/${id}`)}>Ir para Dashboard</Button>
                    </div>
                )}

                {status === 'unauthorized' && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
                            <ScanLine size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Scanner Inteligente</h2>
                        <p className="text-slate-500 text-sm mb-8">{message}</p>
                        <Button fullWidth onClick={() => navigate('/auth')}>Entrar na Conta</Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
