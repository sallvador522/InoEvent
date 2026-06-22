import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { db } from '../../components/FirebaseProvider';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events' | 'transactions'>('overview');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  // Notifications & Plan Upgrades State
  const [notificationTargetUserId, setNotificationTargetUserId] = useState<string | null>(null);
  const [planCycle, setPlanCycle] = useState<'mensal' | 'anual'>('mensal');
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
        const usersSnapshot = await getDocs(query(collection(db, 'users')));
        const eventsSnapshot = await getDocs(query(collection(db, 'events')));
        const transactionsSnapshot = await getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc')));

        setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setEvents(eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTransactions(transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdateCredits = async (userId: string, currentCredits: number, change: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const newCredits = (currentCredits || 0) + change;
      if (newCredits < 0) {
        toast.error('Créditos não podem ser negativos');
        return;
      }
      await updateDoc(doc(db, 'users', userId), { credits: newCredits });
      setUsers(users.map(u => u.id === userId ? { ...u, credits: newCredits } : u));
      if (selectedUser?.id === userId) {
         setSelectedUser({ ...selectedUser, credits: newCredits });
      }
      toast.success('Créditos atualizados!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar créditos');
    }
  };

  const handlePlanChangeSelect = (userId: string, currentPlan: string, nextPlan: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPendingPlanChange({ userId, currentPlan, nextPlan });
    setNotificationTitle('Plano Atualizado 🎉');
    setNotificationMessage(`Parabéns! O seu plano foi atualizado de ${currentPlan} para ${nextPlan} pela equipa de administração do InoEvents. Aproveite todos os novos recursos exclusivos!`);
    setNotificationType('plan_upgrade');
    setNotificationTargetUserId(userId);
  };

  const handleConfirmAndSendNotification = async () => {
    if (!notificationTargetUserId) return;
    try {
      if (pendingPlanChange) {
        const date = new Date(Date.now());
        if (planCycle === 'mensal') {
          date.setMonth(date.getMonth() + 1);
        } else {
          date.setFullYear(date.getFullYear() + 1);
        }
        await updateDoc(doc(db, 'users', pendingPlanChange.userId), { 
          plan: pendingPlanChange.nextPlan,
          planExpiresAt: pendingPlanChange.nextPlan === 'Essencial' ? null : date.toISOString()
        });
        setUsers(users.map(u => u.id === pendingPlanChange.userId ? { ...u, plan: pendingPlanChange.nextPlan, planExpiresAt: pendingPlanChange.nextPlan === 'Essencial' ? null : date.toISOString() } : u));
        if (selectedUser?.id === pendingPlanChange.userId) {
          setSelectedUser({ ...selectedUser, plan: pendingPlanChange.nextPlan });
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
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Carregando painel de administração...</div>;
  }

  const activePlansCount = users.filter(u => u.plan && u.plan !== 'Free' && u.plan !== 'Essencial').length;

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                              {user.plan || 'Essencial'}
                          </span>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-bold text-slate-500">{user.credits || 0} créditos</p>
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
                            {tx.type === 'CREDIT' ? '+' : ''} R$ {(tx.amount || 0).toFixed(2)}
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
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Voltar para lista
              </button>
              <h2 className="text-2xl font-bold text-slate-900">{selectedUser.email || 'Usuário'}</h2>
              <p className="text-slate-500 text-sm mt-1">UID: <span className="font-mono text-xs bg-slate-200 px-1 rounded">{selectedUser.uid}</span></p>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2">Créditos:</span>
                <button 
                    onClick={(e) => handleUpdateCredits(selectedUser.id, selectedUser.credits, -1, e)}
                    className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <span className="text-xl font-bold text-brand-blue w-8 text-center">{selectedUser.credits || 0}</span>
                <button 
                    onClick={(e) => handleUpdateCredits(selectedUser.id, selectedUser.credits, 1, e)}
                    className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                </button>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Detalhes da Conta</h3>
              <ul className="space-y-3">
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Plano Atual:</span>
                  <select 
                    value={selectedUser.plan || 'Essencial'}
                    onChange={(e) => handlePlanChangeSelect(selectedUser.id, selectedUser.plan || 'Essencial', e.target.value)}
                    className="bg-white border text-right border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-brand-blue focus:border-brand-blue block p-1 font-bold outline-none cursor-pointer"
                  >
                    <option value="Essencial">Essencial</option>
                    <option value="Premium">Premium</option>
                    <option value="Business">Business</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </li>
                {selectedUser.name && (
                  <li className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Nome:</span>
                    <span className="font-medium text-slate-900">{selectedUser.name}</span>
                  </li>
                )}
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Criado em:</span>
                  <span className="font-medium text-slate-900">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</span>
                </li>
                <li className="pt-4 border-t border-slate-100 flex justify-end">
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
                    <span className="material-symbols-outlined text-sm">notifications_active</span>
                    Enviar Notificação
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Eventos do Usuário ({userEvents.length})</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {userEvents.map(event => (
                  <div key={event.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-sm text-slate-800">{event.title || 'Evento sem título'}</p>
                    <div className="flex justify-between mt-1 text-xs text-slate-500">
                      <span>{event.type}</span>
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {userEvents.length === 0 && <p className="text-sm text-slate-500">Nenhum evento criado.</p>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const countAll = users.length;
    const countEssencial = users.filter(u => !u.plan || u.plan === 'Essencial').length;
    const countPremium = users.filter(u => u.plan === 'Premium').length;
    const countBusiness = users.filter(u => u.plan === 'Business' || u.plan === 'Corporate').length;

    const filteredUsers = users.filter(u => {
      const matchesSearch = (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (u.uid || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlan = planFilter === 'all' || 
                          u.plan === planFilter || 
                          (planFilter === 'Essencial' && !u.plan) ||
                          (planFilter === 'Business' && u.plan === 'Corporate');
      return matchesSearch && matchesPlan;
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
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
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
                 <option value="Essencial">Essencial</option>
                 <option value="Premium">Premium</option>
                 <option value="Business">Business</option>
                 <option value="Corporate">Corporate</option>
              </select>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4 text-center">Créditos</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} onClick={() => setSelectedUser(user)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{user.email || 'Sem email'}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{user.uid}</p>
                  </td>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <select 
                        value={user.plan || 'Essencial'}
                        onChange={(e) => handlePlanChangeSelect(user.id, user.plan || 'Essencial', e.target.value, e as any)}
                        className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-brand-blue focus:border-brand-blue block p-1.5 font-bold cursor-pointer outline-none"
                    >
                        <option value="Essencial">Essencial</option>
                        <option value="Premium">Premium</option>
                        <option value="Business">Business</option>
                        <option value="Corporate">Corporate</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-brand-blue text-base">{user.credits || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={(e) => handleUpdateCredits(user.id, user.credits, -1, e)}
                            className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <button 
                            onClick={(e) => handleUpdateCredits(user.id, user.credits, 1, e)}
                            className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                    </div>
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

  const renderEvents = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Evento</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{event.title || 'Sem título'}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{event.id}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-brand-beige/20 text-brand-beige rounded text-xs font-bold">{event.type || 'WEDDING'}</span>
                </td>
                <td className="px-6 py-4">
                  {event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Ativo</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTransactions = () => {
     const totalRevenue = transactions.filter(t => t.type === 'CREDIT').reduce((acc, curr) => acc + (curr.amount || 0), 0);
     return (
       <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Histórico de Transações</h2>
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
               <span className="text-xs uppercase tracking-widest text-slate-500 font-bold mr-2">Faturamento Total (Aproximado):</span>
               <span className="text-lg text-green-500 font-bold">R$ {totalRevenue.toFixed(2)}</span>
            </div>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm text-slate-600">
             <thead className="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
               <tr>
                 <th className="px-6 py-4">Data</th>
                 <th className="px-6 py-4">Descrição</th>
                 <th className="px-6 py-4">Usuário</th>
                 <th className="px-6 py-4 text-right">Valor</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {transactions.map((tx) => (
                 <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                   <td className="px-6 py-4 whitespace-nowrap">
                     {new Date(tx.date).toLocaleString()}
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
                          {tx.type === 'CREDIT' ? '+' : ''} R$ {(tx.amount || 0).toFixed(2)}
                      </span>
                   </td>
                 </tr>
               ))}
               {transactions.length === 0 && (
                   <tr>
                       <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhuma transação encontrada.</td>
                   </tr>
               )}
             </tbody>
           </table>
         </div>
       </div>
     );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Enterprise</h1>
            <p className="text-slate-500 mt-1">Gestão centralizada de usuários e eventos da plataforma.</p>
          </div>
          
          <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-200 w-fit">
            <button 
              onClick={() => { setActiveTab('overview'); setSelectedUser(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'overview' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Visão Geral
            </button>
            <button 
              onClick={() => { setActiveTab('users'); setSelectedUser(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Usuários
            </button>
            <button 
              onClick={() => { setActiveTab('events'); setSelectedUser(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'events' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Eventos
            </button>
            <button 
              onClick={() => { setActiveTab('transactions'); setSelectedUser(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'transactions' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Transações
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
          </motion.div>
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
                    <span className="material-symbols-outlined text-[20px]">
                      {pendingPlanChange ? 'military_tech' : 'notifications_active'}
                    </span>
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

                
                {pendingPlanChange && pendingPlanChange.nextPlan !== 'Essencial' && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ciclo do Plano</label>
                    <select 
                      value={planCycle}
                      onChange={(e) => setPlanCycle(e.target.value as 'mensal' | 'anual')}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-brand-blue focus:border-brand-blue outline-none font-medium text-slate-800 bg-slate-50/50"
                    >
                      <option value="mensal">Mensal (1 Mês)</option>
                      <option value="anual">Anual (1 Ano)</option>
                    </select>
                  </div>
                )}

                {pendingPlanChange && (
                  <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl mb-4 text-xs">
                    <p className="text-slate-600 font-medium">Você está a alterar o plano deste utilizador:</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-bold text-slate-500 line-through">{pendingPlanChange.currentPlan}</span>
                      <span className="material-symbols-outlined text-slate-400 text-sm">arrow_forward</span>
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
                    className="flex items-center gap-1.5 bg-brand-blue text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 hover:scale-[1.01] active:translate-y-0 active:scale-95 transition-all outline-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    Confirmar e Enviar
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
