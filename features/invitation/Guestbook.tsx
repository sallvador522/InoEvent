import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, Send } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import { toast } from 'react-hot-toast';

export const Guestbook: React.FC<{ eventId: string; layoutMode?: string }> = ({ eventId, layoutMode }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [loading, setLoading] = useState(false);
    const [moderationEnabled, setModerationEnabled] = useState(false);

    useEffect(() => {
        const eventRef = doc(db, 'events', eventId);
        const unsubscribe = onSnapshot(eventRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setModerationEnabled(data.moderationEnabled || false);
            }
        });
        return () => unsubscribe();
    }, [eventId]);

    useEffect(() => {
        const messagesRef = collection(db, 'events', eventId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Filter messages based on moderation
            const visibleMsgs = msgs.filter(m => {
                // If it is pending or hidden, hide it from the public view
                if (m.status === 'PENDING' || m.status === 'HIDDEN') {
                    return false;
                }
                return true; // Approved or legacy (undefined status) are visible
            });
            setMessages(visibleMsgs);
        });

        return () => unsubscribe();
    }, [eventId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !authorName.trim()) {
            toast.error('Preencha seu nome e a mensagem.');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'events', eventId, 'messages'), {
                author: authorName,
                text: newMessage,
                status: moderationEnabled ? 'PENDING' : 'APPROVED',
                createdAt: serverTimestamp(),
            });
            setNewMessage('');
            toast.success(moderationEnabled 
                ? 'Mensagem enviada com sucesso! Ela aparecerá no livro assim que os anfitriões aprovarem.' 
                : 'Mensagem enviada com sucesso!'
            );
        } catch (error) {
            console.error(error);
            toast.error('Erro ao enviar mensagem.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto py-12 px-4">
            <div className="text-center mb-8">
                <Heart className="mx-auto text-rose-400 mb-3" size={32} />
                <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-800 mb-2">Livro de Assinaturas</h2>
                <p className="text-slate-500 text-sm">Deixe uma mensagem especial para nós apagarmos nunca!</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-10">
                <div className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Seu nome"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-300 focus:bg-white transition-colors"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <textarea
                            placeholder="Escreva sua mensagem com carinho..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-300 focus:bg-white transition-colors min-h-[100px] resize-y"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={loading}
                            maxLength={500}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-300"
                    >
                        {loading ? 'A enviar...' : (
                            <>
                                Enviar Recado <Send size={18} />
                            </>
                        )}
                    </button>
                </div>
            </form>

            <div className="space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <MessageSquare className="mx-auto mb-2 opacity-50" size={24} />
                        <p>Seja o primeiro a deixar um recado!</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative"
                        >
                            <p className="text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap text-sm md:text-base">
                                "{msg.text}"
                            </p>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                                <span>— {msg.author}</span>
                                <span>{msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString('pt-AO') : 'Agora mesmo'}</span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
