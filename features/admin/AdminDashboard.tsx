import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../../components/Navbar';
import { db, auth } from '../../components/FirebaseProvider';
import { collection, getDocs, query, orderBy, addDoc, limit } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../../components/ui/Skeleton';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getValidityDays, normalizePlanId, getPlanConfig } from '../../config/plans';
import { normalizeAccountType } from '../../types';
import { downloadCSV } from '../../lib/csv';
import { UserMirror } from '../../components/admin/UserMirror';
import { ArrowLeft, ArrowRight, Award, BellRing, Eye, Languages, Layers, MonitorSmartphone, Search, Send, Share2, Smartphone, SprayCan, TrendingUp } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [togglingEventId, setTogglingEventId] = useState<string | null>(null);
  // Drill-down 360°: evento inspecionado + convidados + filtros das listas.
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [eventGuests, setEventGuests] = useState<any[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const [guestFilter, setGuestFilter] = useState<'all' | 'CONFIRMED' | 'PENDING' | 'DECLINED' | 'CHECKED_IN'>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState<'all' | 'active' | 'pending' | 'blocked'>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [txPeriod, setTxPeriod] = useState<'all' | '7d' | '30d'>('all');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  // Limpeza única de comprovantes órfãos (Storage receipts/ de eventos apagados).
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{
    dryRun: boolean; orphanEvents: number; orphanFiles: number;
    orphanBytes: number; deletedFiles: number; truncated: boolean;
  } | null>(null);
  // Equipa (RBAC): lista de admins + gestão (só super-admin gere).
  const [team, setTeam] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [teamBusyId, setTeamBusyId] = useState<string | null>(null);
  const isSuperAdminUI = (auth.currentUser?.email || '').toLowerCase() === 'antoniosalvador522@gmail.com';
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events' | 'transactions' | 'orders' | 'subscriptions' | 'analytics' | 'audit' | 'team' | 'support'>('overview');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subActionId, setSubActionId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState<'all' | 'client' | 'professional'>('all');

  // Notifications & Plan Upgrades State
  const [notificationTargetUserId, setNotificationTargetUserId] = useState<string | null>(null);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'plan_upgrade' | 'admin_alert' | 'system'>('admin_alert');
  const [pendingPlanChange, setPendingPlanChange] = useState<{
    userId: string,
    currentPlan: string,
    nextPlan: string
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(query(collection(db, 'users'), limit(500)));
        const eventsSnapshot = await getDocs(query(collection(db, 'events'), limit(500)));
        const transactionsSnapshot = await getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(100)));
        let ordersData: any[] = [];
        try {
          const ordersSnapshot = await getDocs(query(collection(db, 'orders'), limit(100)));
          ordersData = ordersSnapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => {
              const rank = (o: any) => (o.billingStatus === 'pending' ? 0 : 1);
              if (rank(a) !== rank(b)) return rank(a) - rank(b);
              return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
            });
        } catch (ordErr) {
          console.warn('Falha ao buscar pedidos:', ordErr);
        }
        
        let visitsData: any[] = [];
        try {
          // Teto 500 por data (era coleção inteira sem limite — cresce sem teto).
          const visitsSnapshot = await getDocs(query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(500)));
          visitsData = visitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (visErr) {
          console.warn('Falha ao buscar visitas (talvez a coleção esteja vazia):', visErr);
        }

        setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setEvents(eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTransactions(transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setOrders(ordersData);
        setVisits(visitsData);
        try {
          const subsSnapshot = await getDocs(query(collection(db, 'subscriptions'), limit(100)));
          setSubscriptions(
            subsSnapshot.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
          );
        } catch (subErr) {
          console.warn('Falha ao buscar subscrições:', subErr);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Alerta de pedidos: reconta pendentes a cada 30s sem recarregar a página,
  // para o badge da aba "Pedidos" avisar de dinheiro a aguardar confirmação.
  useEffect(() => {
    const refreshOrders = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'orders'), limit(100)));
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => {
            const rank = (o: any) => (o.billingStatus === 'pending' ? 0 : 1);
            if (rank(a) !== rank(b)) return rank(a) - rank(b);
            return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
          });
        setOrders(data);
      } catch {
        /* mantém lista atual — badge apenas não atualiza */
      }
    };
    const timer = setInterval(refreshOrders, 30000);
    return () => clearInterval(timer);
  }, []);

  // Toca o sino quando CHEGA pedido novo (não no carregamento inicial).
  const prevPendingRef = useRef<number | null>(null);
  useEffect(() => {
    const n = orders.filter((o: any) => o.billingStatus === 'pending').length;
    if (prevPendingRef.current !== null && n > prevPendingRef.current) {
      toast.success(`Novo pedido de ativação! (${n} pendente${n > 1 ? 's' : ''}) — abre a aba Pedidos.`);
    }
    prevPendingRef.current = n;
  }, [orders]);

  // Auditoria e suporte carregam ao abrir a aba (não no arranque).
  useEffect(() => {
    if (activeTab === 'audit' && auditLogs.length === 0 && !auditLoading) {
      fetchAuditLogs();
    }
    if (activeTab === 'support' && supportTickets.length === 0 && !supportLoading) {
      fetchSupportTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handlePlanChangeSelect = (userId: string, currentPlan: string, nextPlan: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Gravar sempre o id canónico (essential/free/premium/vip/business): o select
    // antigo gravava 'Corporate'/Title Case e criava Business vitalício por acidente.
    const canonNext = normalizePlanId(nextPlan);
    setPendingPlanChange({ userId, currentPlan, nextPlan: canonNext });
    setNotificationTitle('Plano Atualizado 🎉');
    setNotificationMessage(`Parabéns! O seu plano foi atualizado de ${getPlanConfig(currentPlan).name} para ${getPlanConfig(canonNext).name} pela equipa de administração do InoEvents. Aproveite todos os novos recursos exclusivos!`);
    setNotificationType('plan_upgrade');
    setNotificationTargetUserId(userId);
  };

  const handleConfirmAndSendNotification = async () => {
    if (!notificationTargetUserId || isSendingNotif) return;
    setIsSendingNotif(true);
    try {
      if (pendingPlanChange) {
        // Troca de plano via servidor (trava de downgrade + validade + backfill
        // + auditoria). O cliente nunca grava plan diretamente.
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/admin/users/${pendingPlanChange.userId}/plan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ plan: pendingPlanChange.nextPlan }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data?.error || 'Não foi possível trocar o plano.');
          setIsSendingNotif(false);
          return;
        }
        const expiresAt = data.planExpiresAt || null;
        setUsers(users.map(u => u.id === pendingPlanChange.userId ? { ...u, plan: pendingPlanChange.nextPlan, planId: pendingPlanChange.nextPlan, planExpiresAt: expiresAt } : u));
        if (selectedUser?.id === pendingPlanChange.userId) {
          setSelectedUser({ ...selectedUser, plan: pendingPlanChange.nextPlan, planId: pendingPlanChange.nextPlan, planExpiresAt: expiresAt });
        }
      }

      await addDoc(collection(db, 'users', notificationTargetUserId, 'notifications'), {
        title: notificationTitle || 'Notificação do Administrador',
        message: notificationMessage || '',
        createdAt: new Date().toISOString(),
        read: false,
        type: notificationType
      });

      toast.success(pendingPlanChange ? 'Plano atualizado e notificação enviada!' : 'Notificação enviada com sucesso!');

      // Reset state
      setNotificationTargetUserId(null);
      setPendingPlanChange(null);
      setNotificationTitle('');
      setNotificationMessage('');
    } catch (error) {
      console.error('Error upgrading plan/sending notification:', error);
      toast.error('Erro ao processar alteração ou enviar notificação.');
    } finally {
      setIsSendingNotif(false);
    }
  };

  // Renovar validade via servidor (com auditoria): repõe planExpiresAt.
  const handleRenewPlan = async (user: any) => {
    if (!user?.id || isRenewing) return;
    const days = getValidityDays(user.plan);
    if (days === null) {
      toast.error('Este plano não tem expiração — nada a renovar.');
      return;
    }
    setIsRenewing(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/users/${user.id}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'renew failed');
      const expiresAt = data.planExpiresAt;
      setUsers((prev: any[]) => prev.map((u) => (u.id === user.id ? { ...u, planExpiresAt: expiresAt } : u)));
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, planExpiresAt: expiresAt });
      }
      toast.success(`Validade renovada até ${new Date(expiresAt).toLocaleDateString('pt-AO')}!`);
    } catch (error) {
      console.error('Erro ao renovar validade:', error);
      toast.error('Não foi possível renovar. Tente de novo.');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleConfirmOrder = async (order: any) => {
    if (!order || order.billingStatus !== 'pending') return;
    // Trava anti-duplo-pedido (dinheiro): sem isto, 2 cliques ativam/cobram 2x.
    if (confirmingOrderId) return;
    setConfirmingOrderId(order.id);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/orders/${order.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('confirm failed');
      setOrders((list) =>
        list.map((o) =>
          o.id === order.id ? { ...o, billingStatus: 'paid', paidAt: new Date().toISOString() } : o
        )
      );
      try {
        await addDoc(collection(db, 'users', order.userId, 'notifications'), {
          title: 'Pagamento confirmado 🎉',
          message: `O plano ${order.plan} do teu evento foi ativado. Já podes partilhar o convite!`,
          createdAt: new Date().toISOString(),
          read: false,
          type: 'plan_upgrade',
        });
      } catch {
        /* notificação best-effort */
      }
      toast.success(`Pedido ${order.id} confirmado — evento ativado!`);
    } catch (error) {
      console.error('Error confirming order:', error);
      toast.error('Não foi possível confirmar. Tente de novo.');
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleToggleEventActive = async (event: any, activate: boolean) => {
    if (!event?.id || togglingEventId) return;
    const label = activate ? 'ATIVAR e PUBLICAR' : 'DESATIVAR';
    if (!window.confirm(`${label} o evento "${event.title || event.id}"?${activate ? '' : ' O convite público fica indisponível.'}`)) return;
    setTogglingEventId(event.id);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/events/${event.id}/${activate ? 'activate' : 'block'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('toggle failed');
      const data = await res.json();
      setEvents((list) =>
        list.map((e) =>
          e.id === event.id
            ? {
                ...e,
                isBlocked: activate ? false : true,
                status: activate ? 'active' : 'blocked',
                scheduledBlockDate: activate ? null : e.scheduledBlockDate,
                isPublished: activate ? true : e.isPublished,
                publishedAt: activate && !e.publishedAt ? new Date().toISOString() : e.publishedAt,
              }
            : e
        )
      );
      toast.success(activate ? `Evento "${event.title || event.id}" ativado e publicado!` : `Evento "${event.title || event.id}" desativado.`);
      void data;
    } catch (error) {
      console.error('Error toggling event:', error);
      toast.error('Não foi possível alterar o evento. Tente de novo.');
    } finally {
      setTogglingEventId(null);
    }
  };

  // Drill-down 360°: abre o evento e carrega convidados (rules permitem isAdmin).
  const openEventInspector = async (event: any) => {
    if (!event?.id) return;
    setSelectedEvent(event);
    setGuestSearch('');
    setGuestFilter('all');
    setGuestsLoading(true);
    try {
      const gsnap = await getDocs(query(collection(db, 'events', event.id, 'guests'), limit(500)));
      setEventGuests(gsnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      setEventGuests([]);
    } finally {
      setGuestsLoading(false);
    }
  };

  const handleDeleteEvent = async (event: any) => {
    if (!event?.id || deletingEventId) return;
    if (!window.confirm(`APAGAR o evento "${event.title || event.id}" e TODOS os convidados/mensagens? Esta ação não tem volta.`)) return;
    setDeletingEventId(event.id);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/events/${event.id}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) throw new Error('delete failed');
      const data = await res.json().catch(() => ({}));
      setEvents((list) => list.filter((e) => e.id !== event.id));
      setSelectedEvent(null);
      toast.success(`Evento apagado (+${data.deletedDocs || 0} registos).`);
    } catch {
      toast.error('Não foi possível apagar. Tente de novo.');
    } finally {
      setDeletingEventId(null);
    }
  };

  const handleSuspendUser = async (user: any, suspend: boolean) => {
    if (!user?.id || suspendingId) return;
    const reason = suspend ? window.prompt(`Motivo da suspensão de ${user.email || user.id}:`, '') : '';
    if (suspend && reason === null) return; // cancelou
    if (!window.confirm(`${suspend ? 'SUSPENDER' : 'REATIVAR'} o login de ${user.email || user.id}?${suspend ? ' Eventos ficam intactos (visibilidade por isBlocked).' : ''}`)) return;
    setSuspendingId(user.id);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/users/${user.id}/${suspend ? 'disable' : 'enable'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: reason || '' }),
      });
      if (!res.ok) throw new Error('suspend failed');
      setUsers((list) => list.map((u) => u.id === user.id ? { ...u, suspendedAt: suspend ? new Date().toISOString() : null, suspendReason: suspend ? reason : null } : u));
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, suspendedAt: suspend ? new Date().toISOString() : null, suspendReason: suspend ? reason : null });
      }
      toast.success(suspend ? 'Conta suspensa.' : 'Conta reativada.');
    } catch {
      toast.error('Não foi possível processar. Tente de novo.');
    } finally {
      setSuspendingId(null);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'audit'), orderBy('at', 'desc'), limit(100)));
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  // Equipa: carrega ao abrir a aba.
  useEffect(() => {
    if (activeTab === 'team') fetchTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Suporte com SLA: fila de tickets (vencidos primeiro no servidor).
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportFilter, setSupportFilter] = useState<'all' | 'aberto' | 'em_atendimento' | 'resolvido'>('all');
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [replyDraft, setReplyDraft] = useState('');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const openTicketsCount = supportTickets.filter((t: any) => t.status !== 'resolvido').length;
  const overdueTicketsCount = supportTickets.filter((t: any) => t.overdue).length;

  const fetchSupportTickets = async () => {
    setSupportLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/tickets', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setSupportTickets(data.tickets || []);
      else toast.error('Sem permissão para ver tickets.');
    } catch {
      toast.error('Falha ao carregar tickets.');
    } finally {
      setSupportLoading(false);
    }
  };

  // Poll leve da fila (badge de vencidos) a cada 60s.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') fetchSupportTickets();
    }, 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openTicketThread = async (t: any) => {
    if (openTicketId === t.id) {
      setOpenTicketId(null);
      return;
    }
    setOpenTicketId(t.id);
    setReplyDraft('');
    try {
      const snap = await getDocs(query(collection(db, 'tickets', t.id, 'messages'), orderBy('at', 'asc'), limit(100)));
      setTicketMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      setTicketMessages([]);
    }
  };

  const handleTicketReply = async (t: any) => {
    if (!replyDraft.trim() || replyingId) return;
    setReplyingId(t.id);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/tickets/${t.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: replyDraft.trim() }),
      });
      if (!res.ok) throw new Error('reply failed');
      setReplyDraft('');
      toast.success('Resposta enviada — dono notificado.');
      openTicketThread({ ...t, id: t.id });
      fetchSupportTickets();
    } catch {
      toast.error('Falha ao responder.');
    } finally {
      setReplyingId(null);
    }
  };

  const handleTicketStatus = async (t: any, status: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/tickets/${t.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('status failed');
      setSupportTickets((list) => list.map((x) => x.id === t.id ? { ...x, status } : x));
      toast.success(`Ticket ${status}.`);
    } catch {
      toast.error('Falha ao mudar status.');
    }
  };

  const renderSupport = () => {
    const filtered = supportTickets.filter((t: any) => supportFilter === 'all' || t.status === supportFilter);
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Suporte — fila com SLA</h2>
            <p className="text-sm text-slate-500">Pagamento 4h · Técnico 8h · Dúvida 24h. Vencidos primeiro.</p>
          </div>
          <select
            value={supportFilter}
            onChange={(e) => setSupportFilter(e.target.value as any)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none cursor-pointer"
          >
            <option value="all">Todos</option>
            <option value="aberto">Abertos</option>
            <option value="em_atendimento">Em atendimento</option>
            <option value="resolvido">Resolvidos</option>
          </select>
          <button
            onClick={fetchSupportTickets}
            disabled={supportLoading}
            className="px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg hover:bg-white bg-white cursor-pointer disabled:opacity-60"
          >
            {supportLoading ? 'A carregar…' : 'Atualizar'}
          </button>
        </div>
        {supportLoading && supportTickets.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">A carregar tickets…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Fila limpa. Nada aqui.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((t: any) => (
              <li key={t.id} className={`p-4 sm:p-5 ${t.overdue ? 'bg-red-50/50' : ''}`}>
                <button onClick={() => openTicketThread(t)} className="w-full text-left cursor-pointer">
                  <p className="font-bold text-sm text-slate-900 flex flex-wrap items-center gap-2">
                    {t.overdue && <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">Vencido</span>}
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${t.status === 'resolvido' ? 'bg-emerald-100 text-emerald-700' : t.status === 'em_atendimento' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {t.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">{t.category} · SLA {t.slaDue ? new Date(t.slaDue).toLocaleString('pt-AO') : '—'}</span>
                    <span className="truncate">{t.subject}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{t.id}{t.eventId ? ` · evento ${t.eventId}` : ''}</p>
                </button>
                {openTicketId === t.id && (
                  <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto bg-slate-50/50 rounded-xl p-3">
                      {ticketMessages.map((m: any) => (
                        <div key={m.id} className={`text-xs rounded-xl px-3 py-2 ${m.from === 'admin' ? 'bg-brand-blue/10 text-slate-700' : 'bg-white border border-slate-100 text-slate-600'}`}>
                          <span className="font-bold">{m.from === 'admin' ? `Equipa${m.by ? ` (${m.by})` : ''}: ` : 'Cliente: '}</span>{m.text}
                        </div>
                      ))}
                      {ticketMessages.length === 0 && <p className="text-xs text-slate-400">Sem mensagens carregadas.</p>}
                    </div>
                    {t.status !== 'resolvido' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Responder ao cliente…"
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          maxLength={2000}
                          className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-brand-blue focus:border-brand-blue"
                        />
                        <button
                          onClick={() => handleTicketReply(t)}
                          disabled={replyingId === t.id || !replyDraft.trim()}
                          className="px-5 h-11 rounded-xl bg-brand-blue text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-blue/90 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                        >
                          {replyingId === t.id ? 'A enviar…' : 'Responder'}
                        </button>
                        <button
                          onClick={() => handleTicketStatus(t, 'resolvido')}
                          className="px-4 h-11 rounded-xl border border-emerald-200 text-emerald-700 font-bold text-xs uppercase tracking-wider hover:bg-emerald-50 cursor-pointer whitespace-nowrap"
                        >
                          Resolver
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // Espelho readonly ("ver como usuário"): sem writes, com auditoria de acesso.
  const [mirrorUser, setMirrorUser] = useState<any | null>(null);
  // Limpeza única de comprovantes órfãos: 1º clique = dry-run (conta),
  // 2º clique (com confirm) = apaga. Sempre via servidor (só admin).
  const handleReceiptCleanup = async (confirm: boolean) => {
    if (cleanupLoading) return;
    if (confirm && !window.confirm('Apagar TODOS os comprovantes de eventos já apagados? Não há como desfazer.')) return;
    setCleanupLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/receipts/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(confirm ? { confirm: true } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Falha na limpeza.');
      setCleanupResult(data);
      if (data.dryRun) {
        toast.success(data.orphanFiles > 0 ? `${data.orphanFiles} comprovantes órfãos encontrados.` : 'Nenhum comprovante órfão.');
      } else {
        toast.success(`${data.deletedFiles} comprovantes apagados!`);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Falha na limpeza.');
    } finally {
      setCleanupLoading(false);
    }
  };

  const openMirror = async (user: any) => {
    if (!user?.id) return;
    setMirrorUser(user);
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/admin/mirror-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch { /* best-effort — o espelho abre na mesma */ }
  };

  // Promo 1º evento grátis: assistente ativa após o WhatsApp (com travas no servidor).
  const [promoBusyId, setPromoBusyId] = useState<string | null>(null);

  const handlePromoFirstEvent = async (event: any) => {
    if (!event?.id || promoBusyId) return;
    const owner = users.find((u: any) => (u.id || u.uid) === event.ownerId);
    if ((owner as any)?.firstEventFreeUsed === true) {
      toast.error('Esta conta já usou o primeiro evento grátis.');
      return;
    }
    if (!window.confirm(`Ativar GRÁTIS (Premium) o evento "${event.title || event.id}"? Uso único por conta.`)) return;
    setPromoBusyId(event.id);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/promo/first-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ eventId: event.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'promo failed');
      setEvents((list) => list.map((e) => e.id === event.id ? { ...e, plan: 'premium', planId: 'premium', billingStatus: 'paid', status: 'active', isPublished: true, isBlocked: false } : e));
      setUsers((list) => list.map((u) => ((u.id || u.uid) === event.ownerId ? { ...u, plan: 'premium', planId: 'premium', firstEventFreeUsed: true, firstEventFreeEventId: event.id } : u)));
      setSelectedEvent((prev: any) => prev ? { ...prev, plan: 'premium', planId: 'premium', billingStatus: 'paid', isPublished: true, isBlocked: false } : prev);
      toast.success('Promo ativada — evento em Premium!');
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível ativar a promo.');
    } finally {
      setPromoBusyId(null);
    }
  };

  const fetchTeam = async () => {
    setTeamLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/admins', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setTeam(data.admins || []);
      else toast.error('Sem permissão para ver a equipa.');
    } catch {
      toast.error('Falha ao carregar equipa.');
    } finally {
      setTeamLoading(false);
    }
  };

  const handleGrantAdmin = async () => {
    const email = grantEmail.trim();
    if (!email || teamBusyId) return;
    if (!window.confirm(`Conceder acesso ADMIN a ${email}? Terá todos os poderes operacionais.`)) return;
    setTeamBusyId('grant');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/admins/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'grant failed');
      setGrantEmail('');
      toast.success(`Admin concedido a ${data.email || email}!`);
      fetchTeam();
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível conceder.');
    } finally {
      setTeamBusyId(null);
    }
  };

  const handleRevokeAdmin = async (member: any) => {
    if (!member?.uid || teamBusyId) return;
    const reason = window.prompt(`Motivo da remoção de ${member.email || member.uid}:`, '');
    if (reason === null) return;
    if (!window.confirm(`REMOVER acesso admin de ${member.email || member.uid}? Perde o /admin de imediato.`)) return;
    setTeamBusyId(member.uid);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/admins/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ uid: member.uid, reason: reason || '' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'revoke failed');
      toast.success('Acesso removido.');
      fetchTeam();
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível remover.');
    } finally {
      setTeamBusyId(null);
    }
  };

  const handleResyncAdmin = async (member: any) => {
    if (!member?.uid || teamBusyId) return;
    setTeamBusyId(`resync:${member.uid}`);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/admins/resync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ uid: member.uid }),
      });
      if (!res.ok) throw new Error('resync failed');
      toast.success('Ressincronizado.');
      fetchTeam();
    } catch {
      toast.error('Falha ao ressincronizar.');
    } finally {
      setTeamBusyId(null);
    }
  };

  const renderTeam = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-900">Equipa administrativa</h2>
        <p className="text-sm text-slate-500">Quem tem acesso ao /admin. {isSuperAdminUI ? 'Como super-admin, podes promover e remover.' : 'Só o super-admin gere a equipa.'}</p>
        {isSuperAdminUI && (
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="e-mail do novo admin…"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-brand-blue focus:border-brand-blue"
            />
            <button
              onClick={handleGrantAdmin}
              disabled={teamBusyId === 'grant' || !grantEmail.trim()}
              className="px-5 h-11 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-700 disabled:opacity-60 cursor-pointer whitespace-nowrap"
            >
              {teamBusyId === 'grant' ? 'A conceder…' : 'Promover a admin'}
            </button>
          </div>
        )}
      </div>
      {teamLoading ? (
        <p className="p-6 text-sm text-slate-500">A carregar equipa…</p>
      ) : team.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">Nenhum admin com espelho — usa "Promover" para ativar o teu acesso.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {team.map((m: any) => (
            <li key={m.uid} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">{m.email || m.uid}</p>
                <p className="text-xs text-slate-500">
                  desde {m.roleGrantedAt ? new Date(m.roleGrantedAt).toLocaleDateString('pt-AO') : '—'}
                  {m.roleGrantedBy ? ` · por ${m.roleGrantedBy}` : ''}
                  {!m.inSync && <span className="ml-2 text-amber-600 font-bold">⚠ claim divergente</span>}
                </p>
              </div>
              {isSuperAdminUI && (
                <div className="flex gap-2 shrink-0">
                  {!m.inSync && (
                    <button
                      onClick={() => handleResyncAdmin(m)}
                      disabled={teamBusyId === `resync:${m.uid}`}
                      className="px-4 h-10 rounded-full border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 cursor-pointer disabled:opacity-60"
                    >
                      Ressincronizar
                    </button>
                  )}
                  <button
                    onClick={() => handleRevokeAdmin(m)}
                    disabled={teamBusyId === m.uid}
                    className="px-4 h-10 rounded-full border border-red-200 text-red-600 font-bold text-xs uppercase tracking-wider hover:bg-red-50 cursor-pointer disabled:opacity-60"
                  >
                    {teamBusyId === m.uid ? 'A remover…' : 'Remover'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const callSubscriptionAction = async (sub: any, action: 'renew' | 'cancel') => {
    if (!sub?.id || subActionId) return;
    const label = action === 'renew' ? 'renovar +30 dias' : 'cancelar (corta em 7 dias)';
    if (!window.confirm(`Confirmar: ${label} a subscrição de ${subEmail(sub)}?`)) return;
    setSubActionId(`${action}:${sub.id}`);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/subscriptions/${sub.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('request failed');
      const data = await res.json().catch(() => ({}));
      if (action === 'renew' && data?.subscription) {
        setSubscriptions((prev) => prev.map((s) => (s.id === sub.id ? { ...s, ...data.subscription } : s)));
      } else {
        // Cancelar: recarrega a linha (estado + graça vêm do servidor).
        const snap = await getDocs(query(collection(db, 'subscriptions'), limit(100)));
        setSubscriptions(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
        );
      }
      toast.success(action === 'renew' ? 'Mensalidade renovada e conta reativada!' : 'Subscrição cancelada. Corte suave em 7 dias.');
    } catch (error) {
      console.error('Erro na ação de subscrição:', error);
      toast.error('Não foi possível concluir. Tente de novo.');
    } finally {
      setSubActionId(null);
    }
  };

  const subEmail = (s: any) => {
    const owner = users.find((u: any) => (u.id || u.uid) === s.userId);
    return owner?.email || s.userId;
  };

  const renderSubscriptions = () => {
    const daysLeft = (iso: any) => {
      if (!iso) return null;
      return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
    };
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Subscrições Business</h3>
          <p className="text-sm text-slate-500">Renovar reativa conta e eventos (+30 dias). Cancelar corta em 7 dias de graça.</p>
        </div>
        {subscriptions.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nenhuma subscrição ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {subscriptions.map((s) => {
              const left = daysLeft(s.currentPeriodEnd);
              const busy = subActionId === `renew:${s.id}` || subActionId === `cancel:${s.id}`;
              return (
                <li key={s.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {subEmail(s)}
                      <span className={`ml-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {s.status}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {s.id} · {s.currentPeriodEnd ? `até ${new Date(s.currentPeriodEnd).toLocaleDateString('pt-AO')} (${left ?? '?'}d)` : 'sem validade'}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => callSubscriptionAction(s, 'renew')}
                      disabled={!!subActionId}
                      className="px-4 h-10 rounded-full bg-brand-blue text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-blue/90 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                    >
                      {busy ? 'Aguarde…' : 'Renovar +30d'}
                    </button>
                    {s.status === 'active' && (
                      <button
                        onClick={() => callSubscriptionAction(s, 'cancel')}
                        disabled={!!subActionId}
                        className="px-4 h-10 rounded-full border border-red-200 text-red-600 font-bold text-xs uppercase tracking-wider hover:bg-red-50 disabled:opacity-60 cursor-pointer whitespace-nowrap inline-flex items-center gap-2"
                      >
                        {subActionId === `cancel:${s.id}` ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" aria-hidden="true" />
                            A cancelar…
                          </>
                        ) : (
                          'Cancelar'
                        )}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  const renderOrders = () => {
    const fmtKz = (v: any) => `${Number(v || 0).toLocaleString('pt-AO')} Kz`;
    const orderOwnerEmail = (o: any) => {
      const owner = users.find((u: any) => (u.id || u.uid) === o.userId);
      return owner?.email || '';
    };
    const orderTitle = (o: any) => o.eventTitle || events.find((e: any) => e.id === o.eventId)?.title || '';
    const q = orderSearch.trim().toLowerCase();
    const filteredOrders = orders.filter((o: any) =>
      !q ||
      (o.id || '').toLowerCase().includes(q) ||
      (o.eventId || '').toLowerCase().includes(q) ||
      orderTitle(o).toLowerCase().includes(q) ||
      orderOwnerEmail(o).toLowerCase().includes(q)
    );
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h3 className="font-bold text-slate-900">Pedidos de ativação</h3>
            <p className="text-sm text-slate-500">Pendentes primeiro. Confirmar ativa o evento e notifica o dono.</p>
          </div>
          <input
            type="text"
            placeholder="Buscar pedido, evento ou e-mail…"
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="px-3 py-2 w-full sm:w-72 text-sm border border-slate-200 rounded-lg outline-none focus:ring-brand-blue focus:border-brand-blue"
          />
        </div>
        {filteredOrders.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">{orders.length === 0 ? 'Nenhum pedido ainda.' : 'Nenhum pedido com esta busca.'}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredOrders.map((o) => (
              <li key={o.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">
                    {(orderTitle(o) || 'Evento sem título')} · {o.plan} · {fmtKz(o.amount)}
                    <span className={`ml-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${o.billingStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : o.billingStatus === 'failed' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                      {o.billingStatus}
                    </span>
                    {(o.addons as any)?.concierge && (
                      <span className="ml-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        Concierge
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    Pedido {o.id} · Evento {o.eventId}
                    {orderOwnerEmail(o) ? ` · ${orderOwnerEmail(o)}` : ''}
                    {o.createdAt ? ` · ${new Date(o.createdAt).toLocaleDateString('pt-AO')}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const ev = events.find((e: any) => e.id === o.eventId);
                    if (ev) openEventInspector(ev);
                    else toast.error('Evento não encontrado na lista.');
                  }}
                  className="shrink-0 px-4 h-11 rounded-full border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Inspecionar
                </button>
                {o.billingStatus === 'pending' && (
                  <button
                    onClick={() => handleConfirmOrder(o)}
                    disabled={confirmingOrderId === o.id}
                    className="shrink-0 px-5 h-11 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                    style={{ transition: 'background-color 200ms ease' }}
                  >
                    {confirmingOrderId === o.id ? 'A confirmar…' : 'Confirmar pagamento'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20">
         <div className="h-16 bg-white border-b border-slate-200" />
         <main className="max-w-7xl mx-auto px-6 py-12 w-full space-y-8">
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-3">
                   <Skeleton className="h-10 w-64 rounded" />
                   <Skeleton className="h-4 w-96 rounded" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
               {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
               ))}
            </div>

            <div className="space-y-6">
                <Skeleton className="h-[400px] rounded-3xl" />
            </div>
         </main>
      </div>
    );
  }

  const activePlansCount = users.filter(u => !['free', 'essential'].includes(normalizePlanId(u.plan ?? u.planId))).length;
  // Promo 1º evento grátis: quantas contas já usaram (mede o CAC da campanha).
  const promoUsedCount = users.filter((u: any) => u?.firstEventFreeUsed === true).length;

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
            <span className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-2">Total Usuários</span>
            <span className="text-4xl text-brand-blue font-bold">{users.length}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
            <span className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-2">Planos Pagos</span>
            <span className="text-4xl text-green-500 font-bold">{activePlansCount}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
            <span className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-2">Total Eventos</span>
            <span className="text-4xl text-brand-blue font-bold">{events.length}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
            <span className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-2">Transações</span>
            <span className="text-4xl text-brand-beige font-bold">{transactions.length}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center" title="Contas que ativaram a promo do 1º evento grátis">
            <span className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-2">🎉 Promos 1º evento</span>
            <span className="text-4xl text-[#8a6d1c] font-bold">{promoUsedCount}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Usuários Recentes</h3>
                <button onClick={() => setActiveTab('users')} className="text-brand-blue text-sm font-bold hover:underline">Ver todos</button>
              </div>
              <div className="space-y-4">
                  {users.slice(0, 5).map((user, idx) => (
                    <div key={idx} onClick={() => { setSelectedUser(user); setActiveTab('users'); }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-50 pb-4 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                        <div>
                          <p className="font-bold text-sm text-slate-700">{user.email || 'Sem e-mail'}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-brand-blue/10 text-brand-blue text-xs rounded-full font-bold">
                              {getPlanConfig(user.plan).name}
                          </span>
                        </div>
                    </div>
                  ))}
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Transações Recentes</h3>
                <button onClick={() => setActiveTab('transactions')} className="text-brand-blue text-sm font-bold hover:underline">Ver todas</button>
              </div>
              <div className="space-y-4">
                  {transactions.slice(0, 5).map((tx, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <div>
                          <p className="font-bold text-sm text-slate-700">{tx.description || 'Pagamento'}</p>
                          <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`font-bold ${tx.type === 'CREDIT' ? 'text-green-500' : 'text-slate-800'}`}>
                            {tx.type === 'CREDIT' ? '+' : ''} {(tx.amount || 0).toLocaleString('pt-AO')} Kz
                        </span>
                    </div>
                  ))}
                  {transactions.length === 0 && <p className="text-sm text-slate-500">Nenhuma transação.</p>}
              </div>
          </div>
      </div>
    </>
  );

  const renderUsers = () => {
    if (selectedUser) {
      const userEvents = events.filter(e => e.ownerId === selectedUser.uid);
      
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
            <div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-brand-blue transition-colors mb-4 text-sm font-bold"
              >
                <ArrowLeft size={14} className="icon-glyph text-sm" />
                Voltar para lista
              </button>
              <h2 className="text-2xl font-bold text-slate-900">{selectedUser.email || 'Usuário'}</h2>
              <p className="text-slate-500 text-sm mt-1">UID: <span className="font-mono text-xs bg-slate-200 px-1 rounded">{selectedUser.uid}</span></p>
            </div>
            
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Detalhes da Conta</h3>
              <ul className="space-y-3">
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Plano Atual:</span>
                  <select 
                    value={normalizePlanId(selectedUser.plan)}
                    onChange={(e) => handlePlanChangeSelect(selectedUser.id, selectedUser.plan || 'free', e.target.value)}
                    className="bg-white border text-right border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-brand-blue focus:border-brand-blue block p-1 font-bold outline-none cursor-pointer"
                  >
                        <option value="essential" disabled>Essencial (legado)</option>
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="vip">VIP</option>
                    <option value="business">Business</option>
                  </select>
                </li>
                <li className="pt-1 text-xs text-slate-400">
                  Essencial fora de venda — fichas antigas mantêm as regras originais.
                </li>
                <li className="flex justify-between items-center text-sm gap-3">
                  <span className="text-slate-500 shrink-0">Validade:</span>
                  {(() => {
                    const exp = selectedUser.planExpiresAt;
                    const isPaid = ['essential', 'premium', 'vip', 'business'].includes(normalizePlanId(selectedUser.plan));
                    if (!exp) {
                      return <span className="font-medium text-slate-400">sem validade</span>;
                    }
                    const d = new Date(exp);
                    if (isNaN(d.getTime())) {
                      return <span className="font-medium text-slate-400">data inválida</span>;
                    }
                    const expired = d < new Date();
                    const daysLeft = Math.ceil((d.getTime() - Date.now()) / 86400000);
                    return (
                      <span className="flex items-center justify-end gap-2 flex-wrap">
                        <span className={`font-bold ${expired ? 'text-red-600' : daysLeft <= 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {expired
                            ? `expirado em ${d.toLocaleDateString('pt-AO')}`
                            : `válido até ${d.toLocaleDateString('pt-AO')} (${daysLeft}d)`}
                        </span>
                        {isPaid && (
                          <button
                            onClick={() => handleRenewPlan(selectedUser)}
                            disabled={isRenewing}
                            className="bg-brand-blue text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-brand-blue/90 active:scale-95 transition-all outline-none cursor-pointer disabled:opacity-60"
                          >
                            {isRenewing ? 'A renovar…' : 'Renovar'}
                          </button>
                        )}
                      </span>
                    );
                  })()}
                </li>
                {selectedUser.name && (
                  <li className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Nome:</span>
                    <span className="font-medium text-slate-900">{selectedUser.name}</span>
                  </li>
                )}
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Perfil (KYC):</span>
                  <span className="font-bold text-slate-900">
                    {normalizeAccountType((selectedUser as any)?.accountType) === 'professional'
                      ? `💼 Cerimonialista${(selectedUser as any)?.agencyName ? ` — ${(selectedUser as any).agencyName}` : ''}`
                      : '🤵 Noivo(a) / Família'}
                  </span>
                </li>
                {((selectedUser as any)?.phone || (selectedUser as any)?.city) && (
                  <li className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Contacto:</span>
                    <span className="font-medium text-slate-900">{[(selectedUser as any)?.phone, (selectedUser as any)?.city].filter(Boolean).join(' · ')}</span>
                  </li>
                )}
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Criado em:</span>
                  <span className="font-medium text-slate-900">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Acesso:</span>
                  {(selectedUser as any)?.suspendedAt ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Suspenso{(selectedUser as any)?.suspendReason ? ` — ${(selectedUser as any).suspendReason}` : ''}</span>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Ativo</span>
                  )}
                </li>
                <li className="pt-4 border-t border-slate-100 flex justify-end gap-2 flex-wrap">
                  <button
                    onClick={() => openMirror(selectedUser)}
                    className="flex items-center gap-1.5 bg-white text-brand-blue text-xs font-bold px-4 py-2 rounded-xl border border-brand-blue/30 shadow-sm hover:bg-brand-blue/5 transition-all outline-none cursor-pointer"
                    title="Ver o painel exatamente como este usuário vê (somente leitura)"
                  >
                    <Eye size={14} className="icon-glyph text-sm" />
                    Ver como usuário
                  </button>
                  {(selectedUser as any)?.suspendedAt ? (
                    <button
                      onClick={() => handleSuspendUser(selectedUser, false)}
                      disabled={suspendingId === selectedUser.id}
                      className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md hover:bg-emerald-700 transition-all outline-none cursor-pointer disabled:opacity-60"
                    >
                      {suspendingId === selectedUser.id ? 'A processar…' : 'Reativar conta'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSuspendUser(selectedUser, true)}
                      disabled={suspendingId === selectedUser.id}
                      className="flex items-center gap-1.5 bg-white text-red-600 text-xs font-bold px-4 py-2 rounded-xl border border-red-200 shadow-sm hover:bg-red-50 transition-all outline-none cursor-pointer disabled:opacity-60"
                    >
                      {suspendingId === selectedUser.id ? 'A processar…' : 'Suspender conta'}
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setNotificationTargetUserId(selectedUser.id);
                      setNotificationTitle('Notificação InoEvents 🔔');
                      setNotificationMessage('');
                      setNotificationType('admin_alert');
                      setPendingPlanChange(null);
                    }}
                    className="flex items-center gap-1.5 bg-brand-blue text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-brand-blue/10 hover:bg-brand-blue/90 hover:scale-[1.02] active:scale-95 transition-all outline-none cursor-pointer"
                  >
                    <BellRing size={14} className="icon-glyph text-sm" />
                    Enviar Notificação
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Eventos do Usuário ({userEvents.length})</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {userEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => openEventInspector(event)}
                    className="w-full text-left p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-brand-blue/40 hover:bg-brand-blue/5 transition-all cursor-pointer"
                    title="Abrir visão 360° do evento"
                  >
                    <p className="font-bold text-sm text-slate-800">{event.title || 'Evento sem título'}</p>
                    <div className="flex justify-between mt-1 text-xs text-slate-500">
                      <span>{event.type}</span>
                      <span>{event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </button>
                ))}
                {userEvents.length === 0 && <p className="text-sm text-slate-500">Nenhum evento criado.</p>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const countAll = users.length;
    const planOf = (u: any) => normalizePlanId(u.plan ?? u.planId);
    const countEssencial = users.filter(u => planOf(u) === 'essential').length;
    const countPremium = users.filter(u => planOf(u) === 'premium' || planOf(u) === 'vip').length;
    const countBusiness = users.filter(u => planOf(u) === 'business').length;

    const filteredUsers = users.filter(u => {
      const matchesSearch = (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (u.uid || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlan = planFilter === 'all' || 
                          planOf(u) === normalizePlanId(planFilter);
      const matchesAccount = accountFilter === 'all' ||
                          normalizeAccountType((u as any)?.accountType) === accountFilter;
      return matchesSearch && matchesPlan && matchesAccount;
    });

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Tactile Plan Filter Pills */}
        <div className="p-4 bg-slate-50/30 border-b border-slate-100 flex flex-wrap gap-2.5">
          <button 
            type="button"
            onClick={() => setPlanFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer outline-none ${
              planFilter === 'all' 
                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/15 scale-[1.02]' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm'
            }`}
          >
            Todos os Planos ({countAll})
          </button>
          <button 
            type="button"
            onClick={() => setPlanFilter('Essencial')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer outline-none ${
              planFilter === 'Essencial' 
                ? 'bg-slate-700 text-white shadow-md shadow-slate-700/15 scale-[1.02]' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm'
            }`}
          >
            ⚡ Essencial ({countEssencial})
          </button>
          <button 
            type="button"
            onClick={() => setPlanFilter('Premium')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer outline-none ${
              planFilter === 'Premium' 
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/15 scale-[1.02]' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm'
            }`}
          >
            ✨ Premium ({countPremium})
          </button>
          <button 
            type="button"
            onClick={() => setPlanFilter('Business')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer outline-none ${
              planFilter === 'Business' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15 scale-[1.02]' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm'
            }`}
          >
            💼 Business / Corp ({countBusiness})
          </button>
        </div>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
           <div className="flex w-full sm:w-auto relative">
              <Search size={14} className="icon-glyph absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input 
                 type="text" 
                 placeholder="Buscar por e-mail, nome ou UID..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-9 pr-4 py-2 w-full sm:w-80 text-sm border border-slate-200 rounded-lg focus:ring-brand-blue focus:border-brand-blue outline-none transition-shadow"
              />
           </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
               <span className="text-sm font-bold text-slate-500">Filtrar:</span>
               <select 
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-brand-blue focus:border-brand-blue block p-2 outline-none cursor-pointer"
               >
                  <option value="all">Todos os Planos</option>
                   <option value="essential">Essencial</option>                                               
                   <option value="free">Free</option>
                   <option value="premium">Premium</option>
                   <option value="vip">VIP</option>
                  <option value="business">Business</option>
               </select>
               <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value as any)}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-brand-blue focus:border-brand-blue block p-2 outline-none cursor-pointer"
                  title="Filtrar por tipo de conta (KYC)"
               >
                  <option value="all">Todos os perfis</option>
                  <option value="client">Noivos/Família</option>
                  <option value="professional">Cerimonialistas</option>
               </select>
               <button
                  onClick={() => {
                    downloadCSV(`inoevents-usuarios-${new Date().toISOString().split('T')[0]}`, filteredUsers.map((u: any) => ({
                      email: u.email || '', nome: u.name || '', uid: u.uid || u.id || '',
                      plano: normalizePlanId(u.plan ?? u.planId), perfil: normalizeAccountType(u.accountType),
                      agencia: u.agencyName || '', validade: u.planExpiresAt || '',
                    })), ['email', 'nome', 'uid', 'plano', 'perfil', 'agencia', 'validade']);
                    toast.success('CSV de usuários exportado!');
                  }}
                  className="bg-white border border-slate-200 text-slate-700 text-sm font-bold px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                  title="Exportar lista filtrada em CSV"
               >
                  Exportar CSV
               </button>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Plano</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} onClick={() => setSelectedUser(user)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{user.email || 'Sem email'}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{user.uid}</p>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {normalizeAccountType((user as any)?.accountType) === 'professional' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-100">
                          💼 {(user as any)?.agencyName || 'Cerimonialista'}
                        </span>
                      )}
                      {(user as any)?.suspendedAt && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-[11px] font-bold rounded-full">
                          Suspenso
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <select 
                        value={normalizePlanId(user.plan)}
                        onChange={(e) => handlePlanChangeSelect(user.id, user.plan || 'free', e.target.value, e as any)}
                        className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-brand-blue focus:border-brand-blue block p-1.5 font-bold cursor-pointer outline-none"
                    >
                        <option value="essential" disabled>Essencial (legado)</option>                                            
                    <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="vip">VIP</option>
                        <option value="business">Business</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhum usuário encontrado com os filtros atuais.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderEvents = () => {
    const eventStatusOf = (e: any): 'active' | 'pending' | 'blocked' =>
      e?.isBlocked ? 'blocked' : e?.isPublished === false ? 'pending' : 'active';
    const ownerEmailOf = (e: any) => {
      const owner = users.find((u: any) => (u.id || u.uid) === e.ownerId);
      return owner?.email || '';
    };
    const filteredEvents = events.filter((e: any) => {
      const q = eventSearch.trim().toLowerCase();
      const matchesSearch = !q ||
        (e.title || '').toLowerCase().includes(q) ||
        (e.id || '').toLowerCase().includes(q) ||
        ownerEmailOf(e).toLowerCase().includes(q);
      const matchesStatus = eventStatusFilter === 'all' || eventStatusOf(e) === eventStatusFilter;
      const matchesType = eventTypeFilter === 'all' || (e.type || 'WEDDING') === eventTypeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
    return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Manutenção Storage: comprovantes órfãos (eventos apagados antes da limpeza automática) */}
      <div className="px-4 py-3 border-b border-slate-100 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 text-sm">
          <SprayCan size={20} className="icon-glyph text-amber-600 text-lg" />
          <span className="font-bold text-slate-700">Comprovantes órfãos</span>
          {cleanupResult && (
            <span className="text-xs text-slate-500">
              {cleanupResult.orphanFiles > 0
                ? `${cleanupResult.orphanFiles} ficheiros (${(cleanupResult.orphanBytes / 1024).toFixed(0)} KB) em ${cleanupResult.orphanEvents} eventos apagados`
                : 'nada a limpar'}
              {cleanupResult.truncated ? ' · lista parcial, repete após apagar' : ''}
              {!cleanupResult.dryRun && ` · ${cleanupResult.deletedFiles} apagados`}
            </span>
          )}
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <button
            onClick={() => handleReceiptCleanup(false)}
            disabled={cleanupLoading}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
          >
            {cleanupLoading ? 'A verificar…' : 'Verificar'}
          </button>
          <button
            onClick={() => handleReceiptCleanup(true)}
            disabled={cleanupLoading || !cleanupResult?.dryRun || (cleanupResult?.orphanFiles || 0) === 0}
            title={!cleanupResult?.dryRun ? 'Corre “Verificar” primeiro' : undefined}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 cursor-pointer"
          >
            Apagar órfãos
          </button>
        </div>
      </div>
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3 lg:items-center bg-slate-50/50">
        <div className="flex w-full lg:w-auto relative">
          <Search size={14} className="icon-glyph absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Buscar título, ID ou e-mail do dono…"
            value={eventSearch}
            onChange={(e) => setEventSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full lg:w-80 text-sm border border-slate-200 rounded-lg focus:ring-brand-blue focus:border-brand-blue outline-none transition-shadow"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={eventStatusFilter}
            onChange={(e) => setEventStatusFilter(e.target.value as any)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg block p-2 outline-none cursor-pointer"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="pending">Pendentes</option>
            <option value="blocked">Desativados</option>
          </select>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg block p-2 outline-none cursor-pointer"
          >
            <option value="all">Todos os tipos</option>
            <option value="WEDDING">Casamento</option>
            <option value="BRIDAL_SHOWER">Chá de Panela</option>
            <option value="BABY_SHOWER">Chá de Bebé</option>
            <option value="BIRTHDAY">Aniversário</option>
            <option value="CORPORATE">Corporativo</option>
          </select>
          <span className="text-xs text-slate-400 font-bold">{filteredEvents.length} evento(s) — clica para inspecionar</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Evento</th>
              <th className="px-6 py-4">Dono</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEvents.map((event) => (
              <tr key={event.id} onClick={() => openEventInspector(event)} className="hover:bg-brand-blue/5 transition-colors cursor-pointer" title="Abrir visão 360°">
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEventInspector(event)} className="text-left cursor-pointer">
                    <p className="font-bold text-slate-900 hover:text-brand-blue">{event.title || 'Sem título'}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{event.id}</p>
                  </button>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{ownerEmailOf(event) || '—'}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-brand-beige/20 text-brand-beige rounded text-xs font-bold">{event.type || 'WEDDING'}</span>
                </td>
                <td className="px-6 py-4">
                  {event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  {event.isBlocked ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Desativado</span>
                  ) : event.isPublished === false ? (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">Pendente</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Ativo</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {event.isBlocked ? (
                    <button
                      onClick={() => handleToggleEventActive(event, true)}
                      disabled={togglingEventId === event.id}
                      className="px-4 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
                    >
                      {togglingEventId === event.id ? 'A ativar…' : 'Ativar'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleEventActive(event, false)}
                      disabled={togglingEventId === event.id}
                      className="px-4 h-9 rounded-full border border-red-200 text-red-600 font-bold text-xs uppercase tracking-wider hover:bg-red-50 disabled:opacity-60 cursor-pointer"
                    >
                      {togglingEventId === event.id ? 'A desativar…' : 'Desativar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Nenhum evento com estes filtros.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    );
  };

  // Visão 360° do evento: dono, plano, KPIs, convidados, visitas e ações.
  const renderEventInspector = () => {
    const ev = selectedEvent;
    if (!ev) return null;
    const owner = users.find((u: any) => (u.id || u.uid) === ev.ownerId);
    const evOrder = orders.find((o: any) => o.eventId === ev.id);
    // Elegível à promo: não-chá, não-pago e dono nunca usou.
    const promoEligible = !['BRIDAL_SHOWER', 'BABY_SHOWER'].includes(ev?.type) &&
      ev?.billingStatus !== 'paid' &&
      (owner as any)?.firstEventFreeUsed !== true;
    const evVisits = visits.filter((v: any) => v.eventId === ev.id).length;
    const confirmed = eventGuests.filter((g: any) => g.status === 'CONFIRMED' && !g.checkedIn).length;
    const checkedIn = eventGuests.filter((g: any) => g.checkedIn || g.status === 'CHECKED_IN').length;
    const pending = eventGuests.filter((g: any) => g.status === 'PENDING' || (!g.status && !g.checkedIn)).length;
    const declined = eventGuests.filter((g: any) => g.status === 'DECLINED').length;
    const q = guestSearch.trim().toLowerCase();
    const filteredGuests = eventGuests.filter((g: any) => {
      const matchesQ = !q ||
        (g.name || '').toLowerCase().includes(q) ||
        (g.phone || '').toLowerCase().includes(q);
      const st = g.checkedIn || g.status === 'CHECKED_IN' ? 'CHECKED_IN' : (g.status || 'PENDING');
      return matchesQ && (guestFilter === 'all' || st === guestFilter);
    });
    const guestLabel = (g: any) => {
      if (g.checkedIn || g.status === 'CHECKED_IN') return 'Entrou';
      if (g.status === 'CONFIRMED') return 'Confirmado';
      if (g.status === 'DECLINED') return 'Recusado';
      return 'Pendente';
    };
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
        onClick={() => setSelectedEvent(null)}
      >
        <motion.div
          initial={{ scale: 0.97, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.97, y: 20, opacity: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 bg-white/95 backdrop-blur z-10">
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Visão 360° do evento</p>
                <h2 className="text-xl font-bold text-slate-900 truncate">{ev.title || 'Sem título'}</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{ev.id} · {ev.type || 'WEDDING'} · {ev.date ? new Date(ev.date).toLocaleDateString() : 'N/A'}</p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-full cursor-pointer shrink-0" aria-label="Fechar">✕</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-slate-100 rounded font-bold">👤 {owner?.email || ev.ownerId || '—'}</span>
              <span className="px-2 py-1 bg-slate-100 rounded font-bold">📦 {getPlanConfig(ev.plan ?? ev.planId).name}</span>
              <span className="px-2 py-1 bg-slate-100 rounded font-bold">💳 {ev.billingStatus || '—'}</span>
              {ev.isBlocked
                ? <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-bold">Desativado</span>
                : ev.isPublished === false
                  ? <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-bold">Pendente</span>
                  : <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold">Ativo</span>}
              <a href={`/invite/${ev.id}`} target="_blank" rel="noreferrer" className="px-2 py-1 bg-brand-blue text-white rounded font-bold hover:bg-brand-blue/90">Abrir convite ↗</a>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Convidados', value: eventGuests.length },
              { label: 'Confirmados', value: confirmed },
              { label: 'Entraram', value: checkedIn },
              { label: 'Pendentes', value: pending },
              { label: 'Visitas', value: evVisits },
            ].map((k) => (
              <div key={k.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{k.value}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{k.label}</p>
              </div>
            ))}
          </div>
          {declined > 0 && <p className="px-6 -mt-2 text-xs text-slate-400">Recusados: {declined} (libertam quota)</p>}

          <div className="px-6 pb-2 flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              type="text"
              placeholder="Buscar convidado…"
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-brand-blue focus:border-brand-blue"
            />
            <select
              value={guestFilter}
              onChange={(e) => setGuestFilter(e.target.value as any)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="CONFIRMED">Confirmados</option>
              <option value="CHECKED_IN">Entraram</option>
              <option value="PENDING">Pendentes</option>
              <option value="DECLINED">Recusados</option>
            </select>
            <button
              onClick={() => {
                downloadCSV(`inoevents-convidados-${ev.id}`, filteredGuests.map((g: any) => ({
                  nome: g.name || '', telefone: g.phone || '', status: guestLabel(g),
                  acompanhantes: g.adults ?? '', mesa: g.tableName || '',
                })), ['nome', 'telefone', 'status', 'acompanhantes', 'mesa']);
                toast.success('CSV de convidados exportado!');
              }}
              className="px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              Exportar CSV
            </button>
          </div>

          <div className="px-6 pb-6">
            {guestsLoading ? (
              <p className="text-sm text-slate-500 py-6 text-center">A carregar convidados…</p>
            ) : filteredGuests.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">Nenhum convidado.</p>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto border border-slate-100 rounded-xl">
                {filteredGuests.slice(0, 200).map((g: any) => (
                  <li key={g.id} className="px-4 py-2.5 flex justify-between items-center text-sm">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{g.name || 'Sem nome'}</p>
                      <p className="text-xs text-slate-400">{g.phone || ''}{g.tableName ? ` · 🪑 ${g.tableName}` : ''}</p>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0 ml-2">{guestLabel(g)}</span>
                  </li>
                ))}
              </ul>
            )}
            {filteredGuests.length > 200 && <p className="text-xs text-slate-400 mt-1">A mostrar 200 de {filteredGuests.length} — usa a busca.</p>}
          </div>

          <div className="px-6 pb-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {evOrder && evOrder.billingStatus === 'pending' && (
              <button
                onClick={() => { setSelectedEvent(null); handleConfirmOrder(evOrder); }}
                className="px-4 h-10 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 cursor-pointer"
              >
                Confirmar pagamento
              </button>
            )}
            {promoEligible && (
              <button
                onClick={() => handlePromoFirstEvent(ev)}
                disabled={promoBusyId === ev.id}
                className="px-4 h-10 rounded-full bg-[#C5A028] text-[#1B365D] font-bold text-xs uppercase tracking-wider hover:bg-[#d4af37] cursor-pointer disabled:opacity-60"
                title="Ativar GRÁTIS em Premium (uso único por conta)"
              >
                {promoBusyId === ev.id ? 'A ativar…' : '🎉 Ativar promo 1º evento'}
              </button>
            )}
            {ev.isBlocked ? (
              <button
                onClick={async () => { await handleToggleEventActive(ev, true); setSelectedEvent((prev: any) => prev ? { ...prev, isBlocked: false, status: 'active', isPublished: true } : prev); }}
                className="px-4 h-10 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 cursor-pointer"
              >
                Ativar
              </button>
            ) : (
              <button
                onClick={async () => { await handleToggleEventActive(ev, false); setSelectedEvent((prev: any) => prev ? { ...prev, isBlocked: true, status: 'blocked' } : prev); }}
                className="px-4 h-10 rounded-full border border-red-200 text-red-600 font-bold text-xs uppercase tracking-wider hover:bg-red-50 cursor-pointer"
              >
                Desativar
              </button>
            )}
            <button
              onClick={() => handleDeleteEvent(ev)}
              disabled={deletingEventId === ev.id}
              className="px-4 h-10 rounded-full border border-red-200 text-red-600 font-bold text-xs uppercase tracking-wider hover:bg-red-50 cursor-pointer disabled:opacity-60"
            >
              {deletingEventId === ev.id ? 'A apagar…' : 'Apagar evento'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const renderTransactions = () => {
     const totalRevenue = transactions.filter(t => t.type === 'CREDIT').reduce((acc, curr) => acc + (curr.amount || 0), 0);
     const periodMs = txPeriod === '7d' ? 7 * 86400000 : txPeriod === '30d' ? 30 * 86400000 : Infinity;
     const q = txSearch.trim().toLowerCase();
     const filteredTx = transactions.filter((tx: any) => {
       const inPeriod = periodMs === Infinity || (tx.date && (Date.now() - new Date(tx.date).getTime()) <= periodMs);
       const matchesQ = !q ||
         (tx.description || '').toLowerCase().includes(q) ||
         (tx.userEmail || tx.userId || '').toLowerCase().includes(q) ||
         (tx.id || '').toLowerCase().includes(q);
       return inPeriod && matchesQ;
     });
     return (
       <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">Histórico de Transações</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Buscar descrição, usuário…"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-brand-blue focus:border-brand-blue"
              />
              <select
                value={txPeriod}
                onChange={(e) => setTxPeriod(e.target.value as any)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none cursor-pointer"
              >
                <option value="all">Todo o período</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
              </select>
              <button
                onClick={() => {
                  downloadCSV(`inoevents-transacoes-${new Date().toISOString().split('T')[0]}`, filteredTx.map((tx: any) => ({
                    data: tx.date || '', descricao: tx.description || '', usuario: tx.userEmail || tx.userId || '',
                    tipo: tx.type || '', valor: tx.amount || 0,
                  })), ['data', 'descricao', 'usuario', 'tipo', 'valor']);
                  toast.success('CSV de transações exportado!');
                }}
                className="px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg hover:bg-white cursor-pointer bg-white"
              >
                Exportar CSV
              </button>
            </div>
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
               <span className="text-xs uppercase tracking-widest text-slate-500 font-bold mr-2">Faturamento Total (Aproximado):</span>
               <span className="text-lg text-green-500 font-bold">{totalRevenue.toLocaleString('pt-AO')} Kz</span>
            </div>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full min-w-[720px] text-left text-sm text-slate-600">
             <thead className="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
               <tr>
                 <th className="px-6 py-4">Data</th>
                 <th className="px-6 py-4">Descrição</th>
                 <th className="px-6 py-4">Usuário</th>
                 <th className="px-6 py-4 text-right">Valor</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {filteredTx.map((tx) => (
                 <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                   <td className="px-6 py-4 whitespace-nowrap">
                     {tx.date ? new Date(tx.date).toLocaleString() : 'N/A'}
                   </td>
                   <td className="px-6 py-4">
                     <p className="font-bold text-slate-900">{tx.description || 'Pagamento'}</p>
                     <p className="text-xs text-slate-400 font-mono mt-0.5">{tx.id}</p>
                   </td>
                   <td className="px-6 py-4">
                      {tx.userEmail || tx.userId || 'N/A'}
                   </td>
                   <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${tx.type === 'CREDIT' ? 'text-green-500' : 'text-slate-800'}`}>
                          {tx.type === 'CREDIT' ? '+' : ''} {(tx.amount || 0).toLocaleString('pt-AO')} Kz
                      </span>
                   </td>
                 </tr>
               ))}
               {filteredTx.length === 0 && (
                   <tr>
                       <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhuma transação com estes filtros.</td>
                   </tr>
               )}
             </tbody>
           </table>
         </div>
       </div>
     );
  };

  // Trilha de auditoria: quem fez o quê, quando (só admin lê — rules).
  const renderAudit = () => {
    const q = auditSearch.trim().toLowerCase();
    const filtered = auditLogs.filter((a: any) =>
      (auditFilter === 'all' || a.action === auditFilter) &&
      (!q || (a.targetId || '').toLowerCase().includes(q) ||
        (a.actorEmail || '').toLowerCase().includes(q) ||
        (a.detail || '').toLowerCase().includes(q))
    );
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Auditoria</h2>
            <p className="text-sm text-slate-500">Ações administrativas registadas pelo servidor.</p>
          </div>
          <input
            type="text"
            placeholder="Buscar ator, alvo…"
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-brand-blue focus:border-brand-blue"
          />
          <select
            value={auditFilter}
            onChange={(e) => setAuditFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none cursor-pointer"
          >
            <option value="all">Todas as ações</option>
            <option value="order.confirm">Pagamentos confirmados</option>
            <option value="event.block">Eventos desativados</option>
            <option value="event.activate">Eventos ativados</option>
            <option value="event.delete">Eventos apagados</option>
            <option value="user.disable">Contas suspensas</option>
            <option value="user.enable">Contas reativadas</option>
            <option value="user.plan_change">Trocas de plano</option>
            <option value="subscription.renew">Subscrições renovadas</option>
            <option value="subscription.cancel">Subscrições canceladas</option>
            <option value="admin.grant">Admins promovidos</option>
            <option value="admin.revoke">Admins removidos</option>
            <option value="promo.first_event">Promos 1º evento</option>
          </select>
          <button
            onClick={fetchAuditLogs}
            disabled={auditLoading}
            className="px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg hover:bg-white bg-white cursor-pointer disabled:opacity-60"
          >
            {auditLoading ? 'A carregar…' : 'Atualizar'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Quando</th>
                <th className="px-6 py-4">Ação</th>
                <th className="px-6 py-4">Alvo</th>
                <th className="px-6 py-4">Ator</th>
                <th className="px-6 py-4">Detalhe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs">{a.at ? new Date(a.at).toLocaleString('pt-AO') : '—'}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold font-mono">{a.action}</span></td>
                  <td className="px-6 py-4 text-xs font-mono truncate max-w-[220px]">{a.targetType}:{a.targetId}</td>
                  <td className="px-6 py-4 text-xs truncate max-w-[200px]">{a.actorEmail}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{a.detail || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">{auditLogs.length === 0 ? 'Sem registos ainda — carrega para ver.' : 'Nada com estes filtros.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Badges das abas: pedidos pendentes (dinheiro a confirmar) + movimento de hoje.
  const pendingOrdersCount = orders.filter((o: any) => o.billingStatus === 'pending').length;
  const todayTransactionsCount = transactions.filter((t: any) => {
    try {
      return new Date(t.date).toDateString() === new Date().toDateString();
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Enterprise</h1>
            <p className="text-slate-500 mt-1">Gestão centralizada de usuários e eventos da plataforma.</p>
          </div>
          
          <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-200 w-fit max-w-full overflow-x-auto">
            <button 
              onClick={() => { setActiveTab('overview'); setSelectedUser(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Visão Geral
            </button>
            <button 
              onClick={() => { setActiveTab('users'); setSelectedUser(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Usuários
            </button>
            <button 
              onClick={() => { setActiveTab('events'); setSelectedUser(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'events' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Eventos
            </button>
            <button 
              onClick={() => { setActiveTab('transactions'); setSelectedUser(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap inline-flex items-center ${activeTab === 'transactions' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Transações
              {todayTransactionsCount > 0 && (
                <span
                  title={`${todayTransactionsCount} transação(ões) hoje`}
                  className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-black"
                >
                  {todayTransactionsCount}
                </span>
              )}
            </button>
              <button
                onClick={() => { setActiveTab('orders'); setSelectedUser(null); }}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap inline-flex items-center ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                Pedidos
                {pendingOrdersCount > 0 && (
                  <span
                    title={`${pendingOrdersCount} pedido(s) a aguardar confirmação`}
                    className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-black animate-pulse"
                  >
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('subscriptions'); setSelectedUser(null); }}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'subscriptions' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                Subscrições
              </button>
            <button 
              onClick={() => { setActiveTab('analytics'); setSelectedUser(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Tráfego & Visitas
            </button>
            <button
              onClick={() => { setActiveTab('audit'); setSelectedUser(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'audit' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Auditoria
            </button>
            <button
              onClick={() => { setActiveTab('team'); setSelectedUser(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'team' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Equipa
            </button>
            <button
              onClick={() => { setActiveTab('support'); setSelectedUser(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap inline-flex items-center ${activeTab === 'support' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Suporte
              {openTicketsCount > 0 && (
                <span
                  title={`${openTicketsCount} ticket(s) em aberto${overdueTicketsCount > 0 ? `, ${overdueTicketsCount} vencido(s)` : ''}`}
                  className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-white text-[11px] font-black ${overdueTicketsCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-blue-500'}`}
                >
                  {openTicketsCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedUser ? '-detail' : '')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'events' && renderEvents()}
            {activeTab === 'transactions' && renderTransactions()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'subscriptions' && renderSubscriptions()}
            {activeTab === 'analytics' && <AnalyticsView visits={visits} events={events} users={users} />}
            {activeTab === 'audit' && renderAudit()}
            {activeTab === 'team' && renderTeam()}
            {activeTab === 'support' && renderSupport()}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {selectedEvent && renderEventInspector()}
        </AnimatePresence>

        <AnimatePresence>
          {mirrorUser && (
            <UserMirror
              targetUser={mirrorUser}
              targetEvents={events.filter((e: any) => e.ownerId === (mirrorUser.uid || mirrorUser.id))}
              targetOrders={orders.filter((o: any) => o.userId === (mirrorUser.uid || mirrorUser.id))}
              onClose={() => setMirrorUser(null)}
              onInspectEvent={(ev) => {
                setMirrorUser(null);
                openEventInspector(ev);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {notificationTargetUserId && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
              onClick={() => { setNotificationTargetUserId(null); setPendingPlanChange(null); }}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 w-full max-w-lg overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                    {pendingPlanChange
                      ? <Award size={20} className="icon-glyph" />
                      : <BellRing size={20} className="icon-glyph" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-slate-900">
                      {pendingPlanChange ? 'Atualizar Plano & Notificar' : 'Enviar Notificação Direta'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Para: {users.find(u => u.id === notificationTargetUserId)?.email || 'Usuário'}
                    </p>
                  </div>
                </div>

                
                {pendingPlanChange && normalizePlanId(pendingPlanChange.nextPlan) !== 'essential' && normalizePlanId(pendingPlanChange.nextPlan) !== 'free' && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500">
                      Validade oficial do plano: <strong className="text-slate-800">{(() => { const d = getValidityDays(pendingPlanChange.nextPlan); return d === null ? 'sem expiração' : `${d} dias`; })()}</strong>
                    </p>
                  </div>
                )}

                {pendingPlanChange && (
                  <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl mb-4 text-xs">
                    <p className="text-slate-600 font-medium">Você está a alterar o plano deste utilizador:</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-bold text-slate-500 line-through">{pendingPlanChange.currentPlan}</span>
                      <ArrowRight size={14} className="icon-glyph text-slate-400 text-sm" />
                      <span className="font-bold text-brand-blue bg-blue-100/50 px-2.5 py-0.5 rounded-full">{pendingPlanChange.nextPlan}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título da Notificação</label>
                    <input 
                      type="text" 
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      placeholder="Ex: Atualização de Plano"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-brand-blue focus:border-brand-blue outline-none font-medium text-slate-800 transition-shadow bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mensagem</label>
                    <textarea 
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      placeholder="Escreva a mensagem personalizada..."
                      rows={4}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-brand-blue focus:border-brand-blue outline-none font-medium text-slate-800 transition-shadow bg-slate-50/50 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Notificação</label>
                    <select
                      value={notificationType}
                      onChange={(e: any) => setNotificationType(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-brand-blue focus:border-brand-blue outline-none font-bold text-slate-700 transition-shadow bg-slate-50/50 cursor-pointer"
                    >
                      <option value="plan_upgrade">Premium / Upgrade de Plano</option>
                      <option value="admin_alert">Alerta Geral de Administrador</option>
                      <option value="system">Mensagem do Sistema</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100 justify-end">
                  <button 
                    onClick={() => { setNotificationTargetUserId(null); setPendingPlanChange(null); }}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleConfirmAndSendNotification}
                    disabled={isSendingNotif}
                    className="flex items-center gap-1.5 bg-brand-blue text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 hover:scale-[1.01] active:translate-y-0 active:scale-95 transition-all outline-none cursor-pointer disabled:opacity-60"
                  >
                    {isSendingNotif ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    ) : (
                      <Send size={16} className="icon-glyph text-[16px]" />
                    )}
                    {isSendingNotif ? 'A enviar…' : 'Confirmar e Enviar'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

interface AnalyticsViewProps {
  visits: any[];
  events: any[];
  users: any[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ visits, events, users }) => {
  const totalVisits = visits.length;
  
  const pageCounts: { [key: string]: number } = {};
  visits.forEach(v => { pageCounts[v.path || '/'] = (pageCounts[v.path || '/'] || 0) + 1; });
  const totalUniquePages = Object.keys(pageCounts).length;
  
  const mobileVisits = visits.filter(v => v.device === 'Celular' || v.device === 'Tablet').length;
  const mobilePercentage = totalVisits > 0 ? Math.round((mobileVisits / totalVisits) * 100) : 0;
  
  const refCounts: { [key: string]: number } = {};
  visits.forEach(v => { const ref = v.referrer || 'Direto'; refCounts[ref] = (refCounts[ref] || 0) + 1; });
  const topReferrer = Object.keys(refCounts).reduce((a, b) => (refCounts[a] || 0) > (refCounts[b] || 0) ? a : b, 'Direto');
  const topReferrerCount = refCounts[topReferrer] || 0;
  const topReferrerPercentage = totalVisits > 0 ? Math.round((topReferrerCount / totalVisits) * 100) : 0;

  const getVisitsTimelineData = () => {
    const dailyCounts: { [key: string]: number } = {};
    
    // Initialize last 14 days with 0 to ensure continuous line
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyCounts[dateStr] = 0;
    }

    visits.forEach((v: any) => {
      if (v.timestamp) {
        const dateStr = v.timestamp.split('T')[0];
        if (dailyCounts[dateStr] !== undefined) {
          dailyCounts[dateStr]++;
        }
      }
    });

    return Object.keys(dailyCounts).sort().map(date => {
      const [year, month, day] = date.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const formattedDate = `${day}/${monthNames[parseInt(month) - 1]}`;
      return {
        date: formattedDate,
        'Visitas': dailyCounts[date]
      };
    });
  };

  const getDeviceStats = () => {
    const counts: { [key: string]: number } = { 'Celular': 0, 'Computador': 0, 'Tablet': 0 };
    let total = 0;
    
    visits.forEach((v: any) => {
      const dev = v.device || 'Computador';
      if (counts[dev] !== undefined) {
        counts[dev]++;
        total++;
      }
    });

    return Object.keys(counts).map(name => ({
      name,
      count: counts[name],
      percentage: total > 0 ? Math.round((counts[name] / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  };

  const getTopPages = () => {
    const pathCounts: { [key: string]: { count: number; eventId?: string } } = {};
    
    visits.forEach((v: any) => {
      const path = v.path || '/';
      if (!pathCounts[path]) {
        pathCounts[path] = { count: 0, eventId: v.eventId };
      }
      pathCounts[path].count++;
    });

    return Object.keys(pathCounts).map(path => {
      const data = pathCounts[path];
      let title = 'Página Principal (Home)';
      let ownerEmail = 'N/A';
      
      if (data.eventId) {
        const event = events.find(e => e.id === data.eventId);
        if (event) {
          title = event.title || `Convite #${data.eventId}`;
          const owner = users.find(u => u.uid === event.ownerId);
          ownerEmail = owner ? owner.email : 'N/A';
        } else {
          title = `Convite #${data.eventId}`;
        }
      } else if (path.startsWith('/templates')) {
        title = 'Galeria de Modelos';
      } else if (path.startsWith('/plans')) {
        title = 'Página de Planos';
      } else if (path.startsWith('/about')) {
        title = 'Sobre Nós';
      }

      return {
        path,
        title,
        ownerEmail,
        count: data.count
      };
    }).sort((a, b) => b.count - a.count).slice(0, 8);
  };

  const timelineData = getVisitsTimelineData();
  const deviceStats = getDeviceStats();
  const topPages = getTopPages();

  const browserCounts: { [key: string]: number } = {};
  visits.forEach(v => { const b = v.browser || 'Outros'; browserCounts[b] = (browserCounts[b] || 0) + 1; });
  const browserStats = Object.keys(browserCounts).map(name => ({
    name,
    count: browserCounts[name],
    percentage: totalVisits > 0 ? Math.round((browserCounts[name] / totalVisits) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total de Visitas</p>
            <h3 className="text-3xl font-serif font-bold text-slate-900">{totalVisits}</h3>
            <p className="text-xs text-green-500 font-medium flex items-center gap-0.5">
              <TrendingUp size={14} className="icon-glyph text-[14px]" />
              <span>Sessões registradas</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
            <Eye size={24} className="icon-glyph text-[24px]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Páginas Distintas</p>
            <h3 className="text-3xl font-serif font-bold text-slate-900">{totalUniquePages}</h3>
            <p className="text-xs text-slate-400">Total de URLs rastreadas</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Layers size={24} className="icon-glyph text-[24px]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tráfego Mobile</p>
            <h3 className="text-3xl font-serif font-bold text-slate-900">{mobilePercentage}%</h3>
            <p className="text-xs text-slate-400">{mobileVisits} de {totalVisits} visitas</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Smartphone size={24} className="icon-glyph text-[24px]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Canal Principal</p>
            <h3 className="text-3xl font-serif font-bold text-slate-900 truncate max-w-[180px]">{topReferrer}</h3>
            <p className="text-xs text-slate-400">{topReferrerPercentage}% ({topReferrerCount} visitas)</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <Languages size={24} className="icon-glyph text-[24px]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-slate-900">Evolução de Tráfego</h3>
              <p className="text-xs text-slate-400 mt-0.5">Visitas totais nos últimos 14 dias</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
              <span>Acessos Únicos</span>
            </div>
          </div>
          
          <div className="h-72 w-full mt-auto">
            {totalVisits > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#a78bfa' }}
                  />
                  <Area type="monotone" dataKey="Visitas" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm font-medium border border-dashed border-slate-200 rounded-xl">
                Nenhum dado de visita disponível ainda.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 flex flex-col justify-between">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MonitorSmartphone size={18} className="icon-glyph text-violet-500 text-[18px]" />
              <span>Dispositivos</span>
            </h4>
            <div className="space-y-4">
              {deviceStats.map((stat, i) => (
                <div key={stat.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">{stat.name}</span>
                    <span className="text-slate-400 font-semibold">{stat.percentage}% ({stat.count})</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        i === 0 ? 'bg-violet-500' : i === 1 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 mt-4 lg:mt-0">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Languages size={18} className="icon-glyph text-emerald-500 text-[18px]" />
              <span>Navegadores</span>
            </h4>
            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {browserStats.map((stat, i) => (
                <div key={stat.name} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-slate-700">{stat.name}</span>
                  </div>
                  <span className="font-mono text-slate-400">{stat.percentage}% ({stat.count})</span>
                </div>
              ))}
              {browserStats.length === 0 && <p className="text-xs text-slate-400">Nenhum dado.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30">
            <h3 className="text-lg font-serif font-bold text-slate-900">Páginas & Convites Mais Acessados</h3>
            <p className="text-xs text-slate-400 mt-0.5">URLs com maior tráfego acumulado na plataforma</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Página / Evento</th>
                  <th className="px-6 py-4">URL</th>
                  <th className="px-6 py-4">Criador</th>
                  <th className="px-6 py-4 text-right">Acessos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topPages.map((page, i) => (
                  <tr key={page.path} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="font-bold text-slate-800">{page.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400 text-[10px]">
                      {page.path}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {page.ownerEmail}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {page.count}
                    </td>
                  </tr>
                ))}
                {topPages.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Nenhum tráfego registrado ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Share2 size={18} className="icon-glyph text-rose-500 text-[18px]" />
            <span>Fontes de Referência</span>
          </h4>
          <div className="space-y-4 flex-1">
            {Object.keys(refCounts).map((ref) => {
              const count = refCounts[ref];
              const percentage = totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0;
              return (
                <div key={ref} className="space-y-1 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">{ref}</span>
                    <span className="font-bold text-slate-500">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full">
                    <div 
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(refCounts).length === 0 && (
              <p className="text-xs text-slate-400">Nenhuma fonte de tráfego detectada ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
