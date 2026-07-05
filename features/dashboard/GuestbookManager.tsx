import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Heart, ShieldCheck, ShieldAlert, Check, EyeOff, Eye } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import { toast } from 'react-hot-toast';

export const GuestbookManager: React.FC<{ event: any }> = ({ event }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [moderationEnabled, setModerationEnabled] = useState(event.moderationEnabled || false);

    useEffect(() => {
        setModerationEnabled(event.moderationEnabled || false);
    }, [event.moderationEnabled]);
    
    useEffect(() => {
        const messagesRef = collection(db, 'events', event.id, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [event.id]);

    const handleToggleModeration = async () => {
        try {
            const nextState = !moderationEnabled;
            setModerationEnabled(nextState);
            await updateDoc(doc(db, 'events', event.id), {
                moderationEnabled: nextState
            });
            toast.success(nextState ? 'Moderação ativa! Novos recados precisarão de aprovação.' : 'Moderação desativada! Recados aparecem imediatamente.');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao salvar configuração de moderação.');
            setModerationEnabled(event.moderationEnabled || false);
        }
    };

    const handleUpdateStatus = async (messageId: string, status: 'APPROVED' | 'HIDDEN') => {
        try {
            await updateDoc(doc(db, 'events', event.id, 'messages', messageId), {
                status
            });
            toast.success(status === 'APPROVED' ? 'Recado aprovado com sucesso!' : 'Recado ocultado do público.');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao atualizar status do recado.');
        }
    };

    const handleDelete = async (messageId: string) => {
        if (!window.confirm('Tem certeza que deseja apagar esta mensagem permanentemente?')) return;

        try {
            await deleteDoc(doc(db, 'events', event.id, 'messages', messageId));
            toast.success('Mensagem apagada.');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao apagar a mensagem.');
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 min-h-[400px]">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <MessageSquare size={24} className="text-brand-blue" />
                        Livro de Assinaturas Digital ({messages.length})
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                        Leia, aprove, oculte ou guarde as mensagens especiais deixadas pelos seus convidados.
                    </p>
                </div>

                {/* Moderation Control Slider */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150 shrink-0">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            {moderationEnabled ? (
                                <ShieldCheck size={16} className="text-emerald-500" />
                            ) : (
                                <ShieldAlert size={16} className="text-amber-500" />
                            )}
                            Moderação Ativa
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5 max-w-[200px]">
                            {moderationEnabled 
                                ? 'Novos recados precisam de aprovação.' 
                                : 'Novos recados aparecem direto.'
                            }
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleToggleModeration}
                        className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 outline-none ${
                            moderationEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        aria-label="Ativar moderação de recados"
                    >
                        <motion.div
                            layout
                            className="bg-white w-5 h-5 rounded-full shadow-sm"
                            animate={{ x: moderationEnabled ? 24 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    </button>
                </div>
            </div>

            {messages.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-slate-50 border border-slate-100 rounded-3xl border-dashed">
                    <Heart size={40} className="mx-auto mb-4 opacity-20 text-slate-600" />
                    <p className="text-lg font-medium text-slate-600">Nenhum recado ainda.</p>
                    <p className="text-sm mt-1">As mensagens enviadas pelos convidados aparecerão aqui.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {messages.map((msg, idx) => {
                        const isPending = msg.status === 'PENDING';
                        const isHidden = msg.status === 'HIDDEN';
                        const isApproved = msg.status === 'APPROVED' || !msg.status;

                        return (
                            <motion.div 
                                key={msg.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`bg-slate-50 p-6 rounded-2xl border relative group flex flex-col justify-between transition-all ${
                                    isPending 
                                        ? 'border-amber-200 bg-amber-50/10' 
                                        : isHidden 
                                            ? 'border-slate-200 opacity-60' 
                                            : 'border-slate-200'
                                }`}
                            >
                                <button 
                                    onClick={() => handleDelete(msg.id)}
                                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-neutral-100"
                                    title="Apagar permanentemente"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div>
                                    {/* Status Badges */}
                                    <div className="flex items-center gap-1.5 mb-3">
                                        {isPending && (
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                                                Aguardando aprovação
                                            </span>
                                        )}
                                        {isHidden && (
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                                                Oculto do convite
                                            </span>
                                        )}
                                        {msg.status === 'APPROVED' && (
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                                                Aprovado e Público
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-slate-700 leading-relaxed mb-4 text-sm whitespace-pre-wrap italic">
                                        "{msg.text}"
                                    </p>
                                </div>

                                <div className="mt-4 border-t border-slate-200/60 pt-3">
                                    <div className="flex flex-col mb-3">
                                        <span className="font-bold text-slate-900 text-sm">{msg.author}</span>
                                        <span className="text-xs text-slate-400 mt-0.5">
                                            {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString('pt-AO') + ' às ' + msg.createdAt.toDate().toLocaleTimeString('pt-AO', {hour: '2-digit', minute:'2-digit'}) : 'Agora'}
                                        </span>
                                    </div>

                                    {/* Moderation Controls Line */}
                                    <div className="flex items-center gap-2">
                                        {!isApproved && (
                                            <button
                                                onClick={() => handleUpdateStatus(msg.id, 'APPROVED')}
                                                className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                                title="Aprovar Mensagem"
                                            >
                                                <Check size={14} /> Aprovar
                                            </button>
                                        )}
                                        {!isHidden && (
                                            <button
                                                onClick={() => handleUpdateStatus(msg.id, 'HIDDEN')}
                                                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                                title="Ocultar Mensagem"
                                            >
                                                <EyeOff size={14} /> Ocultar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

