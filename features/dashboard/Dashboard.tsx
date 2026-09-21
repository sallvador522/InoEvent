import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, CheckCircle2, QrCode, Share2, Download, Clock, Search, MessageSquare, ArrowLeft, MoreHorizontal, Settings, Copy, Check, Edit2, Trash2, Plus, MessageCircle, UploadCloud, Gem, Camera, Bell, BellOff, Volume2, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, collection, onSnapshot, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { db, handleFirestoreError, OperationType, useFirebase } from '../../components/FirebaseProvider';
import { QRScanner } from '../../components/QRScanner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, Legend } from 'recharts';
import { playScanSound } from '../../lib/sound';
import toast from 'react-hot-toast';
import { SupportModal } from '../../components/SupportModal';
import { Skeleton } from '../../components/ui/Skeleton';

import { VirtualGiftsManager } from './VirtualGiftsManager';
import { GuestbookManager } from './GuestbookManager';
import { TableManager } from './TableManager';
import { GuestsProgressBar } from './GuestsProgressBar';
import { TeamManager } from './TeamManager';
import { ExecutiveReportModal } from './ExecutiveReportModal';
import { GuestDetailsModal } from './GuestDetailsModal';

import { copyToClipboard } from '../../lib/clipboard';
import { getGuestLimit, normalizePlanId, canUseFeature, getPlanConfig } from '../../lib/entitlements';

export const Dashboard = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userProfile } = useFirebase();

    const getPublicOrigin = () => {
        let origin = window.location.origin;
        return origin;
    };

    const [event, setEvent] = useState<any>(null);
    const [guests, setGuests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [copied, setCopied] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [supportOpen, setSupportOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<any>(null);
    const [showGuestMenu, setShowGuestMenu] = useState(false);
    const [showGuestDetails, setShowGuestDetails] = useState(false);
    const [showAddGuestModal, setShowAddGuestModal] = useState(false);
    const [newGuestName, setNewGuestName] = useState("");
    const [newGuestPhone, setNewGuestPhone] = useState("");
    const [showScanner, setShowScanner] = useState(false);
    const [scanState, setScanState] = useState<{status: 'idle' | 'processing' | 'success' | 'error' | 'already_scanned', message: string, guestName?: string, companions?: number}>({status: 'idle', message: ''});
    const [activeFilter, setActiveFilter] = useState<'all' | 'checkedIn' | 'confirmed' | 'pending' | 'declined'>('all');
    const [statsPeriodFilter, setStatsPeriodFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
    const [statsSubgroupFilter, setStatsSubgroupFilter] = useState<'all' | 'adults' | 'children'>('all');
    const [showReportModal, setShowReportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFilter, setExportFilter] = useState<'all' | 'confirmed' | 'pending' | 'declined'>('confirmed');
    const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('excel');

    const [activeTab, setActiveTab] = useState<'guests' | 'analytics' | 'gifts' | 'messages' | 'team' | 'premium' | 'tables'>('guests');

    const [pushEnabled, setPushEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('inoevents_push_enabled') !== 'false';
        }
        return true;
    });
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const [inAppAlerts, setInAppAlerts] = useState<any[]>([]);
    const prevGuestsRef = useRef<any[]>([]);

    // Pedido acabado de fazer (?orderPending=1 vindo dos Planos) — mostra estado real do pedido
    const [searchParams] = useSearchParams();
    const orderJustPlaced = searchParams.get('orderPending') === '1';
    const [eventOrder, setEventOrder] = useState<any>(null);
    useEffect(() => {
        if (!orderJustPlaced || !id) return;
        let cancelled = false;
        const loadOrder = async () => {
            try {
                const res = await fetch(`/api/events/${id}/order`);
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) setEventOrder(data.order || null);
            } catch {
                /* sem pedido visível — mantém banner genérico */
            }
        };
        loadOrder();
        const timer = setInterval(loadOrder, 30000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [orderJustPlaced, id]);
    const hasPendingOrder = !!eventOrder && eventOrder.billingStatus !== 'paid' && eventOrder.billingStatus !== 'failed';

    const playNotificationSound = () => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            
            const playTone = (freq: number, start: number, duration: number) => {
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, start);
                
                gainNode.gain.setValueAtTime(0, start);
                gainNode.gain.linearRampToValueAtTime(0.12, start + 0.04);
                gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
                
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                osc.start(start);
                osc.stop(start + duration);
            };
            
            const now = ctx.currentTime;
            playTone(1046.50, now, 0.4); // C6
            playTone(1318.51, now + 0.09, 0.6); // E6
        } catch (err) {
            console.warn("AudioContext block or failed:", err);
        }
    };

    const requestNotificationPermission = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                toast.success("Notificações de presença ativadas!");
                playNotificationSound();
            } else if (permission === 'denied') {
                toast.error("Configuração bloqueada no navegador.");
            }
        } else {
            toast.error("Notificações não suportadas neste dispositivo.");
        }
    };

    const triggerNewConfirmationNotification = (guest: any) => {
        const title = "Nova Confirmação! 🥂";
        const body = `${guest.name} confirmou presença no seu evento.`;
        
        playNotificationSound();

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
                const n = new Notification(title, {
                    body: body,
                    icon: '/favicon.ico',
                    tag: `rsvp-${guest.id}`,
                });
                n.onclick = () => {
                    window.focus();
                };
            } catch (e) {
                console.error("Erro ao mostrar notificação push:", e);
            }
        }

        // Elegant in-app notification card creation
        const alertId = Math.random().toString();
        setInAppAlerts(prev => [
            ...prev,
            {
                id: alertId,
                name: guest.name,
                phone: guest.phone,
                companions: guest.companions || 0,
                time: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
            }
        ]);

        setTimeout(() => {
            setInAppAlerts(prev => prev.filter(a => a.id !== alertId));
        }, 7000);
    };

    useEffect(() => {
        if (prevGuestsRef.current && prevGuestsRef.current.length > 0) {
            guests.forEach((guest) => {
                const prevGuest = prevGuestsRef.current.find(g => g.id === guest.id);
                const isConfirmedNow = guest.status === 'CONFIRMED';
                if (isConfirmedNow) {
                    const wasConfirmedBefore = prevGuest ? prevGuest.status === 'CONFIRMED' : false;
                    if (!wasConfirmedBefore) {
                        if (pushEnabled) {
                            triggerNewConfirmationNotification(guest);
                        }
                    }
                }
            });
        }
        prevGuestsRef.current = guests;
    }, [guests, pushEnabled]);

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
        if (!requirePaidForShare()) return;
        const link = `${getPublicOrigin()}/invite/${event?.id}`;
        copyToClipboard(link);
        setCopied(true);
        toast.success("Link do evento copiado!");
        setTimeout(() => setCopied(false), 2000);
    };

    // Porteira de partilha: eventos novos só partilham pagos; contas Free nunca.
    // Eventos antigos (isPublished diferente de false) passam — regra de grandfather,
    // exceto contas Free, que provam mas não partilham.
    const isFreeAccount =
        normalizePlanId(userProfile?.plan) === 'free' ||
        normalizePlanId((event as any)?.plan || (event as any)?.planId) === 'free';

    // Plano do evento normalizado (Firestore grava minúsculas) — usar SEMPRE isto em vez de comparar strings literais
    const eventPlanId = normalizePlanId((event as any)?.plan ?? (event as any)?.planId);
    const isPaidPlan = eventPlanId === 'premium' || eventPlanId === 'vip' || eventPlanId === 'business';
    const isBusinessPlan = eventPlanId === 'business';

    const isShareLocked =
        !!event &&
        (isFreeAccount ||
            (event.isPublished === false &&
                event.billingStatus !== 'paid' &&
                normalizePlanId(userProfile?.plan) !== 'business'));

    const requirePaidForShare = () => {
        if (isShareLocked) {
            toast.error(
                isFreeAccount
                    ? 'Na conta Free crias e provas à vontade. Para partilhar, ativa um plano.'
                    : 'Este convite ativa com um plano. Escolhe abaixo para partilhar.'
            );
            navigate(`/plans?eventId=${id}&from=share`);
            return false;
        }
        return true;
    };

    const requireGuestsAllowed = () => {
        if (isFreeAccount) {
            toast.error('A lista de convidados abre após ativares um plano.');
            navigate(`/plans?eventId=${id}&from=share`);
            return false;
        }
        return true;
    };

    const confirmDelete = () => setShowDeleteConfirm(true);

    const handleExport = (filter: 'all' | 'confirmed' | 'pending' | 'declined', format: 'csv' | 'excel') => {
        let filtered = guests;
        if (filter === 'confirmed') {
            filtered = guests.filter(g => g.status === 'CONFIRMED');
        } else if (filter === 'pending') {
            filtered = guests.filter(g => g.status === 'PENDING' || !g.status);
        } else if (filter === 'declined') {
            filtered = guests.filter(g => g.status === 'DECLINED');
        }

        const titleSlug = (event?.title || 'convidados').replace(/\s+/g, '_').toLowerCase();

        if (format === 'csv') {
            const headers = ['Nome', 'Telefone', 'Status', 'Adultos', 'Crianças', 'Restrição Alimentar', 'Mensagem', 'Check-in', 'Data de Confirmação'];
            const rows = filtered.map(g => [
                `"${(g.name || '').replace(/"/g, '""')}"`,
                `"${(g.phone || '').replace(/"/g, '""')}"`,
                `"${g.status === 'CONFIRMED' ? 'Confirmado' : g.status === 'DECLINED' ? 'Recusado' : 'Pendente'}"`,
                g.adults || 1,
                g.children || 0,
                `"${(g.message || '').replace(/"/g, '""')}"`,
                `"${g.checkedIn ? 'Sim' : 'Não'}"`,
                `"${g.createdAt ? new Date(g.createdAt).toLocaleDateString('pt-BR') : ''}"`
            ]);
            
            const csvContent = "sep=,\n" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `convidados_${titleSlug}_${filter}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Arquivo CSV exportado com sucesso!");
        } else {
            let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Convidados</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  table { border-collapse: collapse; font-family: Calibri, sans-serif; }
  th { background-color: #f2f2f2; font-weight: bold; border: 1px solid #cccccc; padding: 8px; text-align: left; }
  td { border: 1px solid #e0e0e0; padding: 6px 8px; }
  .confirmed { background-color: #e6f4ea; color: #137333; }
  .declined { background-color: #fce8e6; color: #c5221f; }
  .pending { background-color: #fef7e0; color: #b06000; }
</style>
</head>
<body>
<h2>Lista de Convidados - ${event?.title || 'Evento'}</h2>
<p>Exportado em: ${new Date().toLocaleString('pt-BR')}</p>
<table>
<thead>
<tr>
  <th>Nome</th>
  <th>Telefone</th>
  <th>Status</th>
  <th>Adultos</th>
  <th>Crianças</th>
  <th>Total de Pessoas</th>
  <th>Check-in</th>
  <th>Restrição Alimentar</th>
                  <th>Mensagem</th>
  <th>Data</th>
</tr>
</thead>
<tbody>`;

            filtered.forEach(g => {
                const statusStr = g.status === 'CONFIRMED' ? 'Confirmado' : g.status === 'DECLINED' ? 'Recusado' : 'Pendente';
                const statusClass = g.status === 'CONFIRMED' ? 'confirmed' : g.status === 'DECLINED' ? 'declined' : 'pending';
                const total = (g.adults || 1) + (g.children || 0);
                
                html += `
<tr>
  <td>${g.name || ''}</td>
  <td>${g.phone || ''}</td>
  <td class="${statusClass}">${statusStr}</td>
  <td>${g.adults || 1}</td>
  <td>${g.children || 0}</td>
  <td>${total}</td>
  <td>${g.checkedIn ? 'Sim' : 'Não'}</td>
  <td>${g.message || ''}</td>
  <td>${g.createdAt ? new Date(g.createdAt).toLocaleDateString('pt-BR') : ''}</td>
</tr>`;
            });

            html += `
</tbody>
</table>
</body>
</html>`;

            const blob = new Blob(["\uFEFF" + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `convidados_${titleSlug}_${filter}.xls`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Planilha Excel exportada com sucesso!");
        }
    };

    const handleManualAddGuest = async () => {
        if (!newGuestName.trim() || !id) return;
        if (!requireGuestsAllowed()) return;
        
        const maxGuests = getGuestLimit(event?.planId || event?.plan);
        
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
        if (!requirePaidForShare()) return;
        const msg = `Olá ${guest.name}! Segue o link do convite para "${event.title}": ${getPublicOrigin()}/invite/${id}`;
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
                        setScanState({ status: 'already_scanned', message: 'Já realizou o check-in!', guestName: g.name, companions: g.companions || 0 });
                        playScanSound('already_scanned');
                    } else {
                        const guestRef = doc(db, 'events', id!, 'guests', guestUrlId);
                        await updateDoc(guestRef, {
                            checkedIn: true,
                            checkedInAt: new Date().toISOString()
                        });
                        setScanState({ status: 'success', message: 'Check-in confirmado!', guestName: g.name, companions: g.companions || 0 });
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

            // Delete associated storage files (audio, image urls, etc.) before deleting the database record
            if (event) {
                try {
                    const storage = getStorage();
                    const urlsToDelete: string[] = [];

                    // Audio URL
                    if (event.audioUrl && typeof event.audioUrl === 'string' && event.audioUrl.includes('firebasestorage.googleapis.com')) {
                        urlsToDelete.push(event.audioUrl);
                    }

                    // Cover image URL
                    if (event.coverUrl && typeof event.coverUrl === 'string' && event.coverUrl.includes('firebasestorage.googleapis.com')) {
                        urlsToDelete.push(event.coverUrl);
                    }

                    // Background image URL
                    if (event.backgroundImage && typeof event.backgroundImage === 'string' && event.backgroundImage.includes('firebasestorage.googleapis.com')) {
                        urlsToDelete.push(event.backgroundImage);
                    }

                    // Gallery images
                    if (event.gallery && Array.isArray(event.gallery)) {
                        event.gallery.forEach((pic: any) => {
                            if (typeof pic === 'string' && pic.includes('firebasestorage.googleapis.com')) {
                                urlsToDelete.push(pic);
                            } else if (pic && typeof pic === 'object' && pic.url && typeof pic.url === 'string' && pic.url.includes('firebasestorage.googleapis.com')) {
                                urlsToDelete.push(pic.url);
                            }
                        });
                    }

                    // Run parallelized deletions
                    await Promise.all(
                        urlsToDelete.map(async (url) => {
                            try {
                                const fileRef = ref(storage, url);
                                await deleteObject(fileRef);
                                console.log("Removed storage resource:", url);
                            } catch (e) {
                                console.warn("Failed or skipped deleting storage resource:", url, e);
                            }
                        })
                    );
                } catch (storageErr) {
                    console.error("Storage files cleanup failure:", storageErr);
                }
            }

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

    const handleUpdateGuestStatus = async (guestId: string, newStatus: string) => {
        try {
            const guestRef = doc(db, 'events', id!, 'guests', guestId);
            await updateDoc(guestRef, { status: newStatus });
            toast.success("Status atualizado com sucesso!");
            setSelectedGuest((prev: any) => prev ? { ...prev, status: newStatus } : null);
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `events/${id}/guests/${guestId}`);
            toast.error("Erro ao atualizar status.");
        }
    };

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

    const timelineData = React.useMemo(() => {
        const checkinTimeline: any = {};
        guests.forEach(g => {
            if (g.checkedInAt) {
                const date = new Date(g.checkedInAt);
                const key = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}h`;
                if(!checkinTimeline[key]) checkinTimeline[key] = 0;
                checkinTimeline[key]++;
            }
        });

        return Object.keys(checkinTimeline).sort().reduce((acc: any, key: string) => {
            const lastCount = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
            acc.push({
                time: key,
                count: checkinTimeline[key],
                cumulative: lastCount + checkinTimeline[key]
            });
            return acc;
        }, []);
    }, [guests]);

    // Reactive stats computations
    const statsGuests = React.useMemo(() => guests.filter(g => {
        if (statsPeriodFilter !== 'all') {
            if (!g.createdAt) return false;
            const date = new Date(g.createdAt);
            const now = new Date();
            const msDiff = now.getTime() - date.getTime();
            const daysDiff = msDiff / (1000 * 60 * 60 * 24);
            if (statsPeriodFilter === '24h' && daysDiff > 1) return false;
            if (statsPeriodFilter === '7d' && daysDiff > 7) return false;
            if (statsPeriodFilter === '30d' && daysDiff > 30) return false;
        }
        if (statsSubgroupFilter === 'adults') {
            const adCount = g.adults !== undefined ? g.adults : 1;
            if (adCount <= 0) return false;
        }
        if (statsSubgroupFilter === 'children') {
            const chCount = g.children !== undefined ? g.children : 0;
            if (chCount <= 0) return false;
        }
        return true;
    }), [guests, statsPeriodFilter, statsSubgroupFilter]);

    const { statsConfirmedCount, statsPendingCount, statsDeclinedCount, statsCheckedInCount, statsTotalCount } = React.useMemo(() => ({
        statsConfirmedCount: statsGuests.filter(g => g.status === 'CONFIRMED').length,
        statsPendingCount: statsGuests.filter(g => g.status === 'PENDING').length,
        statsDeclinedCount: statsGuests.filter(g => g.status === 'DECLINED').length,
        statsCheckedInCount: statsGuests.filter(g => g.checkedIn).length,
        statsTotalCount: statsGuests.length
    }), [statsGuests]);

    const statsPieData = React.useMemo(() => [
        { name: 'Confirmados', value: statsConfirmedCount, color: '#10B981' },
        { name: 'Pendentes', value: statsPendingCount, color: '#F59E0B' },
        { name: 'Recusados', value: statsDeclinedCount, color: '#EF4444' }
    ].filter(d => d.value > 0), [statsConfirmedCount, statsPendingCount, statsDeclinedCount]);

    const statsTimelineData = React.useMemo(() => {
        const timeline: any = {};
        statsGuests.forEach(g => {
            if (g.checkedInAt) {
                const date = new Date(g.checkedInAt);
                const key = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}h`;
                if(!timeline[key]) timeline[key] = 0;
                timeline[key]++;
            }
        });
        return Object.keys(timeline).sort().reduce((acc: any, key: string) => {
            const lastCount = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
            acc.push({
                time: key,
                count: timeline[key],
                cumulative: lastCount + timeline[key]
            });
            return acc;
        }, []);
    }, [statsGuests]);

    // 1. Companions Distribution Chart Data setup
    const statsCompanionsData = React.useMemo(() => {
        const companionCategories = {
            alone: 0,
            plusOne: 0,
            plusTwo: 0
        };
        statsGuests.forEach(g => {
            if (g.status === 'CONFIRMED') {
                const extra = g.adults ? (g.adults - 1) : 0;
                if (extra === 0) companionCategories.alone++;
                else if (extra === 1) companionCategories.plusOne++;
                else if (extra >= 2) companionCategories.plusTwo++;
            }
        });
        return [
            { name: 'Apenas Próprio', quantidade: companionCategories.alone, fill: '#6366F1' },
            { name: 'Com +1 Extra', quantidade: companionCategories.plusOne, fill: '#3B82F6' },
            { name: 'Com +2 Extras', quantidade: companionCategories.plusTwo, fill: '#06B6D4' }
        ];
    }, [statsGuests]);

    // 2. RSVP Cumulative Registration Day-by-day Chart Data
    const statsRsvpGrowthData = React.useMemo(() => {
        const rsvpDailyTimeline: { [key: string]: number } = {};
        statsGuests.forEach(g => {
            const rawDate = g.createdAt || g.updatedAt;
            if (rawDate) {
                try {
                    const date = new Date(rawDate);
                    const dayMonthKey = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                    if (!rsvpDailyTimeline[dayMonthKey]) {
                        rsvpDailyTimeline[dayMonthKey] = 0;
                    }
                    // Count how many confirmed/declined on this day
                    rsvpDailyTimeline[dayMonthKey]++;
                } catch (err) {
                    // Ignore invalid date strings
                }
            }
        });

        const sortedRsvpDates = Object.keys(rsvpDailyTimeline).sort((a, b) => {
            const [dayA, monthA] = a.split('/').map(Number);
            const [dayB, monthB] = b.split('/').map(Number);
            return monthA === monthB ? dayA - dayB : monthA - monthB;
        });

        return sortedRsvpDates.reduce((acc: any[], dateKey) => {
            const dailyCount = rsvpDailyTimeline[dateKey];
            const lastCumulative = acc.length > 0 ? acc[acc.length - 1].acumulado : 0;
            acc.push({
                data: dateKey,
                contagem: dailyCount,
                acumulado: lastCumulative + dailyCount
            });
            return acc;
        }, []);
    }, [statsGuests]);

    if(loading) {
        return (
            <div className="min-h-screen w-full bg-[#FDFDFD] p-6 space-y-8">
                {/* Navbar Skeleton */}
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-24 rounded" />
                            <Skeleton className="h-6 w-48 rounded" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-24 rounded-full" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-32 rounded-full" />
                    </div>
                </div>

                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header Details */}
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-64 rounded" />
                            <Skeleton className="h-4 w-96 rounded" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-14 w-64 rounded-xl" />
                            <Skeleton className="h-14 w-40 rounded-xl" />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-32 rounded-3xl" />
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        <Skeleton className="h-12 w-32 rounded-full" />
                        <Skeleton className="h-12 w-32 rounded-full" />
                        <Skeleton className="h-12 w-32 rounded-full" />
                    </div>

                    {/* Main Content Area */}
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-[2] space-y-4">
                            <Skeleton className="h-96 rounded-3xl" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <Skeleton className="h-64 rounded-3xl" />
                            <Skeleton className="h-32 rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    if(!event) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-serif text-slate-800 mb-4">Evento não encontrado ou já foi apagado.</h1>
                <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 bg-brand-blue text-white rounded-xl font-bold cursor-pointer outline-none">Voltar à Página Anterior</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-[#FDFDFD] pb-20 font-display text-slate-800">
            {/* Minimalist Top Navbar */}
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <button type="button" onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors outline-none cursor-pointer">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Painel do Evento</span>
                        <div className="flex items-center gap-2 min-w-0">
                            <h1 className="text-base sm:text-lg font-serif font-bold text-brand-blue leading-tight truncate">{event.title}</h1>
                            {event.isPublished === false ? (
                                <span className="shrink-0 bg-amber-100 text-amber-700 text-[9px] sm:text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-amber-200">Rascunho</span>
                            ) : (
                                <span className="shrink-0 bg-emerald-100 text-emerald-700 text-[9px] sm:text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-emerald-200">Publicado</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {isPaidPlan && (
                        <button 
                            onClick={() => setSupportOpen(true)}
                            className="hidden md:flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer border-none"
                        >
                            <MessageSquare size={16} />
                            Suporte VIP
                        </button>
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
                                    <Link to={`/invite/${event.id}?edit=true`} className="px-4 py-3 flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors border-b border-slate-100">
                                        <Edit2 size={16} /> Editar Modelo
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
                    <button
                        onClick={() => {
                            window.open(`/invite/${event.id}`, '_blank', 'noopener,noreferrer');
                        }}
                        className="px-4 py-2 bg-brand-blue text-white rounded-full font-bold text-sm hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20 transition-all cursor-pointer"
                    >
                        {isShareLocked ? 'Pré-visualizar' : 'Ver Convite'}
                    </button>
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

            <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
                {/* Intro & Copy Link */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-4xl font-serif text-brand-blue mb-2">Visão Geral</h2>
                        <p className="text-slate-500">Acompanhe as confirmações de presença do seu evento em tempo real.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-200 flex-1 md:flex-initial h-14">
                            <div className="px-4 flex items-center text-slate-500 text-sm truncate max-w-[150px]">
                                {`${getPublicOrigin()}/invite/${event.id}`}
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
                        <button 
                            onClick={async () => {
                                if (!requirePaidForShare()) return;
                                let token = event.clientToken;
                                if (!token) {
                                    token = Math.random().toString(36).substring(2, 8).toUpperCase();
                                    await updateDoc(doc(db, 'events', event.id), { clientToken: token });
                                }
                                const link = `${getPublicOrigin()}/client-dashboard/${event.id}?token=${token}`;
                                copyToClipboard(link);
                                toast.success("Link do cliente copiado para a área de transferência!");
                            }}
                            className="h-14 px-6 bg-[#BF9B30] text-slate-900 rounded-2xl font-bold text-sm hover:bg-[#BF9B30]/90 shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            <Share2 size={16} /> Link do Cliente
                        </button>
                    </div>
                </div>

                {isShareLocked && (
                    <div className="mb-8 bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                            <p className="font-bold text-slate-800">
                                {isFreeAccount ? 'Conta Free — prova à vontade' : hasPendingOrder ? 'Pedido recebido!' : 'Aguarda pagamento'}
                            </p>
                            <p className="text-sm text-slate-600">
                                {isFreeAccount
                                    ? 'Cria e prova o teu convite. Para partilhar e gerir convidados, ativa um plano.'
                                    : hasPendingOrder
                                        ? `Pedido ${eventOrder?.id || ''} em confirmação — avisamos aqui assim que o pagamento for validado.`
                                        : 'O teu convite está pronto, mas o link público só vive após a ativação. Conclui no WhatsApp e avisamos aqui.'}
                            </p>
                        </div>
                        {!hasPendingOrder && (
                            <button
                                onClick={() => navigate(`/plans?eventId=${id}&from=share`)}
                                className="shrink-0 px-6 h-12 rounded-full bg-[#1B365D] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#224373] cursor-pointer whitespace-nowrap"
                                style={{ transition: 'background-color 200ms ease' }}
                            >
                                Escolher plano
                            </button>
                        )}
                    </div>
                )}

                {/* Real-time Web Push notification indicator */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50/10 border border-slate-200/50 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${pushEnabled && notificationPermission === 'granted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-slate-100 text-slate-500 border border-slate-200/50'}`}>
                            {pushEnabled && notificationPermission === 'granted' ? (
                                <Bell className="animate-bounce" size={22} />
                            ) : (
                                <BellOff size={22} />
                            )}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm flex flex-wrap items-center gap-2">
                                Notificações de Presença
                                {pushEnabled && notificationPermission === 'granted' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ativo em Tempo Real
                                    </span>
                                )}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">Receba alertas sonoros no computador/celular assim que um convidado confirmar RSVP.</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
                        {notificationPermission === 'default' ? (
                            <button
                                onClick={requestNotificationPermission}
                                className="px-4 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-brand-blue/90 shadow-md shadow-brand-blue/10 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Bell size={14} /> Ativar no Navegador
                            </button>
                        ) : notificationPermission === 'denied' ? (
                            <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-100/80 px-3 py-2 rounded-xl flex items-center gap-1.5">
                                <BellOff size={14} /> Permissão Bloqueada (Habilite no navegador)
                            </span>
                        ) : (
                            <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-xl border border-slate-200">
                                <span className="text-xs font-bold text-slate-500 px-2">Notificar:</span>
                                <button
                                    onClick={() => {
                                        const next = !pushEnabled;
                                        setPushEnabled(next);
                                        localStorage.setItem('inoevents_push_enabled', String(next));
                                        toast.success(next ? "Notificações ativadas!" : "Notificações desativadas.");
                                        if (next) playNotificationSound();
                                    }}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        pushEnabled 
                                            ? 'bg-emerald-500 text-white shadow-sm' 
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                >
                                    {pushEnabled ? "Ligado" : "Desligado"}
                                </button>
                                <button
                                    onClick={playNotificationSound}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                                    title="Testar som de notificação"
                                >
                                    <Volume2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Spatial UI Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-12">
                    <StatCard title="Total" value={totalCount} icon={Users} color="bg-blue-50 text-blue-600" />
                    {event?.type !== 'BRIDAL_SHOWER' && (
                        <StatCard title="Entraram" value={checkedInCount} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
                    )}
                    <StatCard title="Confirmados" value={confirmedCount} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                    <StatCard title="Pendentes" value={pendingCount} icon={Clock} color="bg-orange-50 text-orange-600" />
                    <StatCard title="Recusados" value={declinedCount} icon={Users} color="bg-red-50 text-red-600" />
                </div>

                <GuestsProgressBar guests={guests} className="mb-6" />

                {/* Faixa do plano — quota, validade e badge sempre visíveis */}
                {(() => {
                    const quotaLimit = getGuestLimit(eventPlanId);
                    const quotaLabel = quotaLimit === Infinity ? '∞' : String(quotaLimit);
                    const planName = getPlanConfig(eventPlanId)?.name || 'Essencial';
                    const daysLeft = event?.expiresAt
                        ? Math.max(0, Math.ceil((new Date(event.expiresAt).getTime() - Date.now()) / 86400000))
                        : null;
                    return (
                        <div className="mb-12 bg-white border border-slate-200/60 rounded-2xl px-5 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
                            <span className="inline-flex items-center gap-2 font-bold text-slate-800">
                                <Gem size={15} className="text-[#C5A028]" />
                                Plano {planName}
                            </span>
                            <span className="text-slate-500">
                                Convidados: <strong className="text-slate-800">{guests.length}/{quotaLabel}</strong>
                            </span>
                            {daysLeft !== null && (
                                <span className="text-slate-500">
                                    Validade: <strong className={daysLeft <= 15 ? 'text-red-600' : 'text-slate-800'}>{daysLeft} dias</strong>
                                </span>
                            )}
                            {event?.billingStatus !== 'paid' && (
                                <button
                                    onClick={() => navigate(`/plans?eventId=${id}&from=share`)}
                                    className="ml-auto text-xs font-bold uppercase tracking-wider text-[#1B365D] hover:underline cursor-pointer"
                                >
                                    Gerir plano
                                </button>
                            )}
                        </div>
                    );
                })()}

                {/* Tabs UI */}
                <div className="flex flex-wrap gap-1 bg-slate-100 rounded-2xl lg:rounded-full p-1 mb-8 w-full md:w-fit mx-auto md:mx-0">
                    <button 
                        onClick={() => setActiveTab('guests')}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-xl lg:rounded-full font-bold text-sm transition-all ${activeTab === 'guests' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Gestão de Convidados
                    </button>
                    <button 
                        onClick={() => setActiveTab('analytics')}
                        className={`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 rounded-xl lg:rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Analytics
                    </button>

                    {isPaidPlan && (
                        <button 
                            onClick={() => setActiveTab('tables')}
                            className={`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 rounded-xl lg:rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'tables' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">table_restaurant</span> Mapa das Mesas
                        </button>
                    )}

                        <button 
                            onClick={() => setActiveTab('gifts')}
                            className={`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 rounded-xl lg:rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'gifts' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Gem size={16} className={activeTab === 'gifts' ? 'text-brand-blue' : 'text-slate-400'} /> Presentes
                        </button>
                    {isPaidPlan && (
                        <button 
                            onClick={() => setActiveTab('messages')}
                            className={`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 rounded-xl lg:rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'messages' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <MessageSquare size={16} className={activeTab === 'messages' ? 'text-brand-blue' : 'text-slate-400'} /> Livro de Assinaturas
                        </button>
                    )}
                    {isPaidPlan && (
                        <button 
                            onClick={() => setActiveTab('team')}
                            className={`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 rounded-xl lg:rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'team' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Users size={16} className={activeTab === 'team' ? 'text-brand-blue' : 'text-slate-400'} /> Equipe
                        </button>
                    )}
                    {isPaidPlan && (
                        <button 
                            onClick={() => setActiveTab('premium')}
                            className={`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 rounded-xl lg:rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'premium' ? 'bg-amber-100 shadow-sm text-amber-700' : 'text-amber-500 hover:text-amber-600'}`}
                        >
                            <Gem size={16} className={activeTab === 'premium' ? 'text-amber-700' : 'text-amber-500'} /> VIP & Domínio
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
                                <button onClick={() => { if (requireGuestsAllowed()) setShowAddGuestModal(true); }} className="justify-center text-sm font-bold text-white bg-slate-800 px-4 py-2 rounded-xl hover:bg-black transition-colors flex items-center gap-2 shadow-sm text-center">
                                    <Plus size={16} /> Adicionar
                                </button>
                                <button onClick={() => {
                                    if (!requireGuestsAllowed()) return;
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
                                                const maxGuests = getGuestLimit(event?.planId || event?.plan);
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
                                                            console.error("Error importing row");
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
                                <button onClick={() => setShowExportModal(true)} className="justify-center text-sm font-bold text-brand-blue bg-brand-blue/5 px-4 py-2 rounded-xl hover:bg-brand-blue/10 transition-colors flex items-center gap-2 text-center">
                                    <Download size={16} /> Exportar
                                </button>
                                {isPaidPlan && (
                                    <button onClick={() => setShowReportModal(true)} className="justify-center text-sm font-bold text-slate-800 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 text-center cursor-pointer">
                                        <Printer size={16} className="text-slate-600" /> Relatório PDF
                                    </button>
                                )}
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
                                {event?.type !== 'BRIDAL_SHOWER' && (
                                    <FilterButton label="Entraram" active={activeFilter === 'checkedIn'} onClick={() => setActiveFilter('checkedIn')} />
                                )}
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
                                        {event?.type === 'BRIDAL_SHOWER' 
                                            ? 'Adicione pessoas à lista ou envie o link do evento diretamente aos convidados.'
                                            : 'Compartilhe o link do seu convite para que as pessoas possam confirmar presença.'
                                        }
                                    </p>
                                </div>
                            ) : filteredGuests.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">Nenhum resultado encontrado para "{searchQuery}"</div>
                            ) : (
                                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                                    {filteredGuests.map((guest) => (
                                        <div 
                                            key={guest.id}
                                            onClick={() => {
                                                setSelectedGuest(guest);
                                                setShowGuestDetails(true);
                                            }}
                                            className="flex items-center justify-between gap-4 p-5 hover:bg-slate-50 transition-colors min-w-0 cursor-pointer h-[88px] box-border border-b border-slate-100"
                                        >
                                            <div className="flex gap-4 items-center min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                                                    {guest.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 truncate">{guest.name}</p>
                                                    <p className="text-sm text-slate-500 flex items-center gap-1 truncate">
                                                        <span className="truncate">{guest.phone}</span>
                                                        {event?.type !== 'BRIDAL_SHOWER' && (
                                                            <>
                                                                <span className="opacity-50 mx-1">•</span>
                                                                <span className="whitespace-nowrap">{guest.adults || 1} Adulto(s)</span> {guest.children ? <span className="whitespace-nowrap">• {guest.children} Criança(s)</span> : ''}
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-2 shrink-0">
                                                {guest.checkedIn && event?.type !== 'BRIDAL_SHOWER' && (
                                                    <div className="hidden sm:inline-flex bg-green-100 text-green-700 px-3 py-1.5 rounded-full items-center justify-center text-xs font-bold gap-1 whitespace-nowrap" title="Check-in Realizado">
                                                        <CheckCircle2 size={14} /> Check-in
                                                    </div>
                                                )}
                                                <div className="hidden sm:block">
                                                    <StatusBadge status={guest.status} />
                                                </div>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedGuest(guest);
                                                        setShowGuestMenu(true);
                                                    }}
                                                    className="text-slate-400 hover:text-brand-blue p-2 rounded-full hover:bg-brand-blue/5 transition-colors z-10"
                                                >
                                                    <MoreHorizontal size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    )}
                    
                    {activeTab === 'analytics' && (
                        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
                            {/* Analytics Header & Description */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-serif text-slate-800 mb-1">Estatísticas & Analytics</h3>
                                    <p className="text-slate-500 text-sm">Monitore gráficos de presença, check-ins e respostas com filtros interativos em tempo real.</p>
                                </div>
                                <button 
                                    onClick={() => setShowReportModal(true)}
                                    className="px-4 py-2.5 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer self-start sm:self-auto"
                                >
                                    <Printer size={14} /> Relatório Executivo PDF
                                </button>
                            </div>

                            {/* Reactive Filters Block */}
                            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="w-full md:w-auto">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Filtrar por Período de RSVP</span>
                                    <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl w-fit">
                                        <button 
                                            onClick={() => setStatsPeriodFilter('all')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statsPeriodFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Sempre
                                        </button>
                                        <button 
                                            onClick={() => setStatsPeriodFilter('24h')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statsPeriodFilter === '24h' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            24 Horas
                                        </button>
                                        <button 
                                            onClick={() => setStatsPeriodFilter('7d')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statsPeriodFilter === '7d' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            7 Dias
                                        </button>
                                        <button 
                                            onClick={() => setStatsPeriodFilter('30d')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statsPeriodFilter === '30d' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            30 Dias
                                        </button>
                                    </div>
                                </div>
                                <div className="w-full md:w-auto">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Filtrar Categoria</span>
                                    <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl w-fit">
                                        <button 
                                            onClick={() => setStatsSubgroupFilter('all')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statsSubgroupFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Todos
                                        </button>
                                        <button 
                                            onClick={() => setStatsSubgroupFilter('adults')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statsSubgroupFilter === 'adults' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Só Adultos
                                        </button>
                                        <button 
                                            onClick={() => setStatsSubgroupFilter('children')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statsSubgroupFilter === 'children' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Só Crianças
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Reactive Stat Summary Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-center">
                                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Grupo Filtrado</p>
                                    <p className="text-2xl font-serif font-bold text-slate-700">{statsTotalCount}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">convidados correspondentes</p>
                                </div>
                                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-center">
                                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Confirmados</p>
                                    <p className="text-2xl font-serif font-bold text-emerald-500">{statsConfirmedCount}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{statsTotalCount > 0 ? Math.round((statsConfirmedCount / statsTotalCount) * 100) : 0}% de adesão</p>
                                </div>
                                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-center">
                                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Pendentes</p>
                                    <p className="text-2xl font-serif font-bold text-amber-500">{statsPendingCount}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{statsTotalCount > 0 ? Math.round((statsPendingCount / statsTotalCount) * 100) : 0}% aguardando</p>
                                </div>
                                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-center">
                                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Check-in Efetuado</p>
                                    <p className="text-2xl font-serif font-bold text-brand-blue">{statsCheckedInCount}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{statsConfirmedCount > 0 ? Math.round((statsCheckedInCount / statsConfirmedCount) * 100) : 0}% dos confirmados</p>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Pie Chart */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-2">Proporção RSVP</h4>
                                        <p className="text-xs text-slate-400 mb-6">Divisão dos status dos convites do subgrupo selecionado.</p>
                                    </div>
                                    <div className="h-64 relative">
                                        {statsPieData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={statsPieData}
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {statsPieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl p-4 text-center">
                                                <span>Sem dados de RSVP para este filtro.</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                                        {statsPieData.map((d, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                                {d.name} ({d.value})
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Timeline Line Chart */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-2">Fluxo de Check-in Reativo</h4>
                                        <p className="text-xs text-slate-400 mb-6">Histograma e curva acumulada do check-in automatizado.</p>
                                    </div>
                                    <div className="h-64">
                                        {statsTimelineData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={statsTimelineData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Line type="monotone" dataKey="cumulative" stroke="#0EA5E9" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} name="Total Acumulado" />
                                                    <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} dot={false} name="Presenças" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl p-4 text-center">
                                                <span>Aguardando entradas (nenhum check-in correspondente).</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* RSVP Growth Area Chart */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-2">Adesão & Ritmo de RSVP</h4>
                                        <p className="text-xs text-slate-400 mb-6 font-medium">Curva acumulada de respostas recebidas (sim ou não) por data.</p>
                                    </div>
                                    <div className="h-64 relative">
                                        {statsRsvpGrowthData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={statsRsvpGrowthData}>
                                                    <defs>
                                                        <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Area type="monotone" dataKey="acumulado" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAcumulado)" name="Total de Respostas" />
                                                    <Area type="monotone" dataKey="contagem" stroke="#818CF8" strokeWidth={1} fill="none" name="No Dia" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl p-4 text-center">
                                                <span>Aguardando respostas para gerar histórico de RSVP.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Companions Distribution Bar Chart */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-2">Estrutura de Acompanhantes</h4>
                                        <p className="text-xs text-slate-400 mb-6 font-medium">Proporção de convidados que trazem parceiros extras (+1 ou +2).</p>
                                    </div>
                                    <div className="h-64 relative">
                                        {statsGuests.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={statsCompanionsData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                        cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                                                    />
                                                    <Bar dataKey="quantidade" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Convidados" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl p-4 text-center">
                                                <span>Aguardando dados de convidados confirmados.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Access Tracking Area Chart */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-2">Visitas & Acessos</h4>
                                        <p className="text-xs text-slate-400 mb-6 font-medium">Quantidade de acessos à página do convite por dia.</p>
                                    </div>
                                    <div className="h-64 relative">
                                        {event?.dailyAccesses && Object.keys(event.dailyAccesses).length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={Object.entries(event.dailyAccesses || {})
                                                    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                                                    .map(([date, count]) => ({
                                                        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                                                        visitas: count
                                                    }))
                                                }>
                                                    <defs>
                                                        <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Area type="monotone" dataKey="visitas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVisitas)" strokeWidth={3} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl p-4 text-center">
                                                <span>Ainda não há dados de acessos para exibir.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {activeTab === 'tables' && (
                        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
                            <TableManager event={event} guests={guests} />
                        </div>
                    )}

                    {activeTab === 'gifts' && (
                        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
                            <VirtualGiftsManager event={event} />
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
                            <GuestbookManager event={event} />
                        </div>
                    )}


                    {activeTab === 'premium' && (
                        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
                            <div>
                                <h3 className="text-2xl font-serif text-slate-800 mb-1">Central VIP & Exclusividades</h3>
                                <p className="text-slate-500 text-sm">Gerencie o seu domínio personalizado para ter um link exclusivo.</p>
                            </div>
                            
                            {/* Custom Domain Feature */}
                            <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-2xl">language</span>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800">Domínio Personalizado (.com / .co.ao)</h4>
                                        <p className="text-slate-500 text-sm mt-1">Gere um link exclusivo e requintado (ex: o-nosso-casamento.com) para o seu convite.</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-4 items-end mb-4">
                                    <div className="flex-1 w-full">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Seu domínio ideal</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">www.</span>
                                            <input type="text" placeholder="mariana-e-joao.com" className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 pl-14 rounded-xl focus:outline-none focus:border-amber-400 font-medium" />
                                        </div>
                                    </div>
                                    <button onClick={() => toast.success('Pedido de domínio enviado! Nossa equipa vai verificar a disponibilidade e configurá-lo em até 24h.')} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-md w-full sm:w-auto h-[46px] whitespace-nowrap">
                                        Solicitar Domínio
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    A configuração do domínio pode levar até 24h úteis. O domínio será válido por 1 ano. Está incluído no seu plano Premium, sem custos adicionais.
                                </p>
                            </div>
                            
                            
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
                            <TeamManager event={event} />
                        </div>
                    )}

                    {/* Sidebar Actions */}
                    <div className="flex flex-col gap-6 min-w-0">
                        {event?.type !== 'BRIDAL_SHOWER' && isPaidPlan ? (
                         <div className="bg-brand-blue text-white rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-brand-blue/20">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            <h3 className="text-xl font-bold mb-2">Check-in Digital</h3>
                            <p className="text-blue-100 text-sm mb-6">Use a câmera do seu celular para validar a entrada dos convidados com QR Code.</p>
                            <button onClick={() => setShowScanner(true)} className="w-full bg-white text-brand-blue py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-lg mb-3">
                                <QrCode size={18} /> Validar QRCode
                            </button>
                            {isBusinessPlan && (
                                <button 
                                    onClick={async () => {
                                        let token = event.clientToken;
                                        if (!token) {
                                            token = Math.random().toString(36).substring(2, 8).toUpperCase();
                                            await updateDoc(doc(db, 'events', event.id), { clientToken: token });
                                        }
                                        const link = `${getPublicOrigin()}/checkin/${event.id}?token=${token}&mode=reception`;
                                        copyToClipboard(link);
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
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800">Acesso & Partilha</h3>
                                {event?.isBlocked && (
                                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Bloqueado</span>
                                )}
                            </div>
                            <div className="flex flex-col gap-4 text-sm">
                                <button 
                                    onClick={() => {
                                        if (!requirePaidForShare()) return;
                                        const link = `${getPublicOrigin()}/invite/${event.id}`;
                                        copyToClipboard(link);
                                        toast.success("Link do convite copiado!");
                                    }}
                                    disabled={event?.isBlocked}
                                    className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${event?.isBlocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-brand-blue/90 shadow-md'}`}
                                >
                                    <Copy size={16} /> Copiar Link
                                </button>
                                
                                <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-slate-700">Bloquear Convite</span>
                                        <button 
                                            onClick={async () => {
                                                const newStatus = !event?.isBlocked;
                                                try {
                                                    await updateDoc(doc(db, 'events', event.id), { isBlocked: newStatus });
                                                    toast.success(newStatus ? "Convite bloqueado com sucesso." : "Convite desbloqueado.");
                                                } catch(err) {
                                                    toast.error("Erro ao alterar bloqueio.");
                                                }
                                            }}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${event?.isBlocked ? 'bg-red-500' : 'bg-slate-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${event?.isBlocked ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-slate-500 font-medium">Agendar Bloqueio Automático</label>
                                        <input 
                                            type="datetime-local" 
                                            value={event?.scheduledBlockDate || ''}
                                            onChange={async (e) => {
                                                const val = e.target.value;
                                                try {
                                                    await updateDoc(doc(db, 'events', event.id), { scheduledBlockDate: val });
                                                    toast.success("Data de bloqueio agendada!");
                                                } catch(err) {
                                                    toast.error("Erro ao agendar bloqueio.");
                                                }
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-blue"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5 mt-2">
                                        <label className="text-xs text-slate-500 font-medium">Título da Mensagem de Bloqueio (Opcional)</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ex: Convite Indisponível"
                                            value={event?.blockedTitle || ''}
                                            onChange={(e) => setEvent({...event, blockedTitle: e.target.value})}
                                            onBlur={async (e) => {
                                                try {
                                                    await updateDoc(doc(db, 'events', event.id), { blockedTitle: e.target.value });
                                                } catch(err) {
                                                    toast.error("Erro ao salvar o título.");
                                                }
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-blue"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5 mt-2">
                                        <label className="text-xs text-slate-500 font-medium">Mensagem de Bloqueio (Opcional)</label>
                                        <textarea 
                                            placeholder="Ex: Este convite expirou..."
                                            value={event?.blockedMessage || ''}
                                            rows={2}
                                            onChange={(e) => setEvent({...event, blockedMessage: e.target.value})}
                                            onBlur={async (e) => {
                                                try {
                                                    await updateDoc(doc(db, 'events', event.id), { blockedMessage: e.target.value });
                                                } catch(err) {
                                                    toast.error("Erro ao salvar a mensagem.");
                                                }
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-blue resize-none"
                                        />
                                    </div>

                                </div>
                            </div>
                         </div>

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
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800">Suporte</h3><button onClick={() => setSupportOpen(true)} className="text-[11px] text-emerald-600 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-full flex items-center gap-1 cursor-pointer border-none shadow-sm">Contacto (2 Canais)</button></div>
                            <div className="flex flex-col gap-4 text-sm font-medium">
                                {(eventPlanId === 'essential') && (
                                   <div className="flex items-center gap-3 text-slate-600">
                                      <MessageSquare size={18} /> Via E-mail
                                   </div>
                                )}
                                {(eventPlanId === 'premium' || eventPlanId === 'vip') && (
                                   <div className="flex items-center gap-3 text-[#BF9B30]">
                                      <MessageSquare size={18} /> WhatsApp Prioritário
                                   </div>
                                )}
                                {isBusinessPlan && (
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
                            <div className="bg-slate-50 p-4 rounded-xl mb-4 text-sm text-slate-600">
                                <p className="font-bold text-xs uppercase text-slate-400 mb-1">Mensagem enviada:</p>
                                {selectedGuest.message || 'Nenhuma mensagem enviada.'}
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="font-bold text-xs uppercase text-slate-400 mb-1">Restrição Alimentar:</p>
                                {(selectedGuest as any).dietaryRestrictions || 'Nenhuma'}
                            </div>
                            <div className="mb-6">
                                <p className="font-bold text-xs uppercase text-slate-400 mb-2">Alterar Status:</p>
                                <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                    {['CONFIRMED', 'PENDING', 'DECLINED'].map((st) => {
                                        const label = st === 'CONFIRMED' ? 'Confirmado' : st === 'PENDING' ? 'Pendente' : 'Recusado';
                                        const color = st === 'CONFIRMED' ? 'text-green-600 bg-white shadow-sm' : st === 'PENDING' ? 'text-orange-600 bg-white shadow-sm' : 'text-red-500 bg-white shadow-sm';
                                        const active = selectedGuest.status === st;
                                        return (
                                            <button
                                                key={st}
                                                onClick={() => handleUpdateGuestStatus(selectedGuest.id, st)}
                                                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                                                    active
                                                        ? `${color} shadow-sm border border-slate-200/50`
                                                        : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
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

            <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} userPlan={event?.plan} />

            {/* Export Modal */}
            <AnimatePresence>
                {showExportModal && (
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
                            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100"
                        >
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Exportar Lista de Convidados</h3>
                            <p className="text-xs text-slate-500 mb-6">Selecione os filtros e formato desejados para exportar seus dados de convidados.</p>
                            
                            <div className="space-y-5 mb-6">
                                {/* Filter Section */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Quais convidados exportar?</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setExportFilter('confirmed')}
                                            className={`p-3 rounded-xl border text-left transition-all ${exportFilter === 'confirmed' ? 'border-emerald-500 bg-emerald-50/30 text-emerald-800 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
                                        >
                                            <div className="text-xs font-bold flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Apenas Confirmados
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-1">
                                                {guests.filter(g => g.status === 'CONFIRMED').length} convidados
                                            </div>
                                        </button>
                                        
                                        <button 
                                            type="button"
                                            onClick={() => setExportFilter('all')}
                                            className={`p-3 rounded-xl border text-left transition-all ${exportFilter === 'all' ? 'border-brand-blue bg-blue-50/30 text-blue-800 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
                                        >
                                            <div className="text-xs font-bold flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-slate-400" /> Todos os RSVPs
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-1">
                                                {guests.length} convidados
                                            </div>
                                        </button>
                                        
                                        <button 
                                            type="button"
                                            onClick={() => setExportFilter('pending')}
                                            className={`p-3 rounded-xl border text-left transition-all ${exportFilter === 'pending' ? 'border-amber-500 bg-amber-50/30 text-amber-800 ring-2 ring-amber-500/10' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
                                        >
                                            <div className="text-xs font-bold flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-amber-500" /> Apenas Pendentes
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-1">
                                                {guests.filter(g => g.status === 'PENDING' || !g.status).length} convidados
                                            </div>
                                        </button>
                                        
                                        <button 
                                            type="button"
                                            onClick={() => setExportFilter('declined')}
                                            className={`p-3 rounded-xl border text-left transition-all ${exportFilter === 'declined' ? 'border-red-500 bg-red-50/30 text-red-800 ring-2 ring-red-500/10' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
                                        >
                                            <div className="text-xs font-bold flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-red-500" /> Apenas Recusados
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-1">
                                                {guests.filter(g => g.status === 'DECLINED').length} convidados
                                            </div>
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Format Section */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Formato do arquivo</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setExportFormat('excel')}
                                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${exportFormat === 'excel' ? 'border-emerald-600 bg-emerald-50/30 text-emerald-800 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
                                        >
                                            <span className="text-xs font-bold">Planilha Excel (.xls)</span>
                                            <span className="text-[10px] text-slate-500 mt-1">Formatada, com cores, ideal para Excel.</span>
                                        </button>
                                        
                                        <button 
                                            type="button"
                                            onClick={() => setExportFormat('csv')}
                                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${exportFormat === 'csv' ? 'border-slate-700 bg-slate-50 text-slate-800 ring-2 ring-slate-500/10' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
                                        >
                                            <span className="text-xs font-bold">Arquivo CSV (.csv)</span>
                                            <span className="text-[10px] text-slate-500 mt-1">Universal, ideal para Google Sheets.</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowExportModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={() => {
                                        handleExport(exportFilter, exportFormat);
                                        setShowExportModal(false);
                                    }}
                                    className="flex-1 py-3 rounded-xl font-bold bg-brand-blue text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download size={16} /> Exportar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ExecutiveReportModal 
                isOpen={showReportModal} 
                onClose={() => setShowReportModal(false)} 
                event={event} 
                guests={guests} 
                agencyName="InoEvents Enterprise" 
                agencyLogo={null} 
            />

            <GuestDetailsModal
                isOpen={showGuestDetails}
                onClose={() => setShowGuestDetails(false)}
                guest={selectedGuest}
            />

            {/* Floating Live RSVP Notifications Overlay */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                <AnimatePresence>
                    {inAppAlerts.map((alert) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                            className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-slate-200/65 p-5 rounded-3xl shadow-2xl flex flex-col gap-3 relative overflow-hidden"
                            style={{
                                boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)'
                            }}
                        >
                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl animate-pulse" />
                            
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                                    <CheckCircle2 size={24} className="animate-bounce" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-mono font-bold tracking-wider text-emerald-600 uppercase">RSVP Confirmado</span>
                                        <span className="text-xs font-mono text-slate-400">{alert.time}</span>
                                    </div>
                                    <h4 className="text-base font-bold text-slate-800 tracking-tight truncate mt-0.5">{alert.name}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">{alert.phone || 'Sem celular'}</p>
                                </div>
                            </div>

                            {alert.companions > 0 && (
                                <div className="bg-slate-50/80 px-3 py-2 rounded-xl text-xs text-slate-600 flex items-center justify-between border border-slate-100">
                                    <span className="font-medium text-slate-500">Acompanhantes extra:</span>
                                    <span className="font-bold text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded-full">{alert.companions}</span>
                                </div>
                            )}

                            <motion.div 
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: 7, ease: "linear" }}
                                className="absolute bottom-0 left-0 h-1 bg-emerald-500 animate-pulse" 
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
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
