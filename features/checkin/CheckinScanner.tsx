import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, useFirebase, OperationType, handleFirestoreError } from '../../components/FirebaseProvider';
import { CheckCircle, XCircle, ArrowLeft, ScanLine, Clock, CheckCircle2 } from 'lucide-react';
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
                    checkedInAt: new Date().toISOString()
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

    const handleScanResult = async (result: string) => {
        if(scanState.status !== 'idle' || !id) return;
        setScanState({ status: 'processing', message: 'Processando QR Code...' });
        try {
            // Extracts guest parameter whether it's in search params or hash
            let guestUrlId: string | null = null;
            if (result.includes('guest=')) {
                guestUrlId = result.split('guest=')[1].split('&')[0];
            } else {
                const url = new URL(result);
                guestUrlId = url.searchParams.get('guest');
            }
            
            if(guestUrlId) {
                const guestRef = doc(db, 'events', id, 'guests', guestUrlId);
                const guestSnap = await getDoc(guestRef);
                
                if (guestSnap.exists()) {
                    const g = guestSnap.data();
                    if (g.checkedIn || g.status === 'CHECKED_IN') {
                        setScanState({ status: 'already_scanned', message: 'Já realizou o check-in!', guestName: g.name, companions: g.companions || 0 });
                        playScanSound('already_scanned');
                    } else if (g.status === 'DECLINED') {
                        setScanState({ status: 'error', message: 'Convidado RECUSOU o convite.', guestName: g.name, companions: g.companions || 0 });
                        playScanSound('error');
                    } else {
                        await updateDoc(guestRef, {
                            checkedIn: true,
                            status: 'CHECKED_IN',
                            name: g.name,
                            checkedInAt: new Date().toISOString()
                        });
                        setScanState({ status: 'success', message: 'Check-in confirmado!', guestName: g.name, companions: g.companions || 0 });
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

    if (status === 'reception_mode') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-display">
                <div className="w-full max-w-sm flex flex-col gap-6">
                    <div className="text-center text-white mb-2">
                        <ScanLine size={48} className="mx-auto mb-4 text-brand-blue" />
                        <h2 className="text-2xl font-bold">Modo Recepção</h2>
                        <p className="opacity-70 text-sm mt-1">Aponte a câmera para os QR Codes dos convidados</p>
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
                                                    Total de pessoas: {1 + scanState.companions}
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
