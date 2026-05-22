import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Heart } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import { toast } from 'react-hot-toast';

export const GuestbookManager: React.FC<{ event: any }> = ({ event }) => {
    const [messages, setMessages] = useState<any[]>([]);
    
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

    const handleDelete = async (messageId: string) => {
        if (!window.confirm('Tem certeza que deseja apagar esta mensagem?')) return;

        try {
            await deleteDoc(doc(db, 'events', event.id, 'messages', messageId));
            toast.success('Mensagem apagada com sucesso.');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao apagar a mensagem. Verifique suas permissões.');
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 min-h-[400px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <MessageSquare size={24} className="text-brand-blue" />
                        Mural de Recados ({messages.length})
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                        Leia e guarde as mensagens enviadas pelos seus convidados.
                    </p>
                </div>
            </div>

            {messages.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-slate-50 border border-slate-100 rounded-3xl border-dashed">
                    <Heart size={40} className="mx-auto mb-4 opacity-20 text-slate-600" />
                    <p className="text-lg font-medium text-slate-600">Nenhuma mensagem ainda.</p>
                    <p className="text-sm mt-1">As mensagens enviadas pelos convidados aparecerão aqui.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {messages.map((msg, idx) => (
                        <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative group flex flex-col justify-between"
                        >
                            <button 
                                onClick={() => handleDelete(msg.id)}
                                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-red-50"
                                title="Apagar mensagem"
                            >
                                <Trash2 size={16} />
                            </button>
                            <div>
                                <MessageSquare size={20} className="text-rose-300 mb-3 opacity-50" />
                                <p className="text-slate-700 leading-relaxed mb-4 text-sm whitespace-pre-wrap italic">
                                    "{msg.text}"
                                </p>
                            </div>
                            <div className="flex flex-col border-t border-slate-200 pt-3 mt-auto">
                                <span className="font-bold text-slate-900 text-sm">{msg.author}</span>
                                <span className="text-xs text-slate-400 mt-0.5">
                                    {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString('pt-AO') + ' às ' + msg.createdAt.toDate().toLocaleTimeString('pt-AO', {hour: '2-digit', minute:'2-digit'}) : 'Agora'}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
