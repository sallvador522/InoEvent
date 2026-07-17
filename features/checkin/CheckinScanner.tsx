import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, useFirebase, OperationType, handleFirestoreError } from '../../components/FirebaseProvider';
import { CheckCircle, XCircle, ArrowLeft, ScanLine, Clock, CheckCircle2, Users, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { QRScanner } from '../../components/QRScanner';
import { playScanSound } from '../../lib/sound';

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
    const [searchQuery, setSearchQuery] = useState('');

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
            const unsubscribe = onSnapshot(collection(db, `events/${id}/guests`), (snapshot) => {
                const guestsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setGuests(guestsList);
            });
            return () => unsubscribe();
        }
    }, [status, id]);

    const handleScanResult = async (qrData: string) => {
        if (scanState.status === 'processing') return;
        
        try {
            setScanState({ status: 'processing', message: 'Validando QR Code...' });
            
            
            const url = new URL(qrData);
            const scannedGuestId = url.searchParams.get('guest');
            
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
        setTimeout(() => setScanState({ status: 'idle', message: '' }), 3500); // clear after delay
    };

    const handleManualCheckIn = async (guest: any) => {
        if (!id) return;
        try {
            const guestRef = doc(db, 'events', id, 'guests', guest.id);
            await updateDoc(guestRef, {
                checkedIn: !guest.checkedIn,
                status: !guest.checkedIn ? 'CHECKED_IN' : 'CONFIRMED',
                name: guest.name,
                checkedInAt: !guest.checkedIn ? new Date().toISOString() : null
            });
        } catch (e) {
            console.error("Error manually checking in guest", e);
        }
    };

    const filteredGuests = guests.filter(g => 
        g.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        g.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className={`absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-md z-10 font-bold text-xl ${
                                                scanState.status === 'success' ? 'bg-green-500/95' :
                                                scanState.status === 'already_scanned' ? 'bg-yellow-500/95' :
                                                scanState.status === 'error' ? 'bg-red-500/95' :
                                                'bg-brand-blue/95'
                                            }`}
                                        >
                                            <div className="mb-2">
                                                {scanState.status === 'success' && <CheckCircle2 size={56} className="mx-auto drop-shadow-md" />}
                                                {scanState.status === 'already_scanned' && <Clock size={56} className="mx-auto drop-shadow-md" />}
                                                {scanState.status === 'processing' && <div className="w-14 h-14 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />}
                                                {scanState.status === 'error' && <XCircle size={56} className="mx-auto drop-shadow-md" />}
                                            </div>
                                            <p className="drop-shadow-md">{scanState.message}</p>
                                            {scanState.guestName && (
                                                <div className="mt-4">
                                                    <p className="text-xl font-bold opacity-100 drop-shadow-md">{scanState.guestName}</p>
                                                    {scanState.companions !== undefined && (
                                                        <p className="text-sm font-medium opacity-90 drop-shadow-sm bg-black/20 rounded-full px-4 py-1 mt-2 inline-block">
                                                            Pessoas: {1 + scanState.companions}
                                                        </p>
                                                    )}
                                                </div>
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
                        
                        <div className="flex flex-col gap-3 pb-20">
                            {filteredGuests.map((guest) => (
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
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${guest.checkedIn ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                    >
                                        {guest.checkedIn ? <CheckCircle2 size={28} /> : <div className="w-7 h-7 rounded-full border-2 border-current opacity-50" />}
                                    </button>
                                </div>
                            ))}
                            
                            {filteredGuests.length === 0 && (
                                <div className="text-center py-12">
                                    <Users size={48} className="mx-auto text-slate-700 mb-4" />
                                    <p className="text-slate-400 font-medium text-lg">Nenhum convidado encontrado.</p>
                                </div>
                            )}
                        </div>
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
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Acesso Liberado</h2>
                        <p className="text-emerald-600 font-bold text-lg mb-2">{guestName}</p>
                        <p className="text-slate-500 text-sm mb-8">{message}</p>
                        <Button fullWidth onClick={() => navigate(`/dashboard/${id}`)}>Ir para Dashboard</Button>
                    </div>
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
