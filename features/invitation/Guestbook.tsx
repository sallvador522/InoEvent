import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, Send } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import { toast } from 'react-hot-toast';

export const Guestbook: React.FC<{ eventId: string; layoutMode?: string }> = ({ eventId, layoutMode }) => {
    const dark = layoutMode === 'LUXURY' || layoutMode === 'LIMINTSO_GOLD' || layoutMode === 'MODERN' || layoutMode === 'INDUSTRIAL';
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
                if ((m as any).status === 'PENDING' || (m as any).status === 'HIDDEN') {
                    return false;
                }
                return true; // Approved or legacy (undefined status) are visible
            });
            setMessages(visibleMsgs);
        });

        return () => unsubscribe();
    }, [eventId]);

    const sanitizeInput = (val: string): string => {
        if (!val) return '';
        // Remove HTML tags, javascript: protocols, and escape dangerous characters
        let clean = val.replace(/<[^>]*>/g, '').trim();
        // Strip javascript: pseudo-protocol to prevent protocol-based XSS
        clean = clean.replace(/javascript:/gi, "");
        // Strip onxxx event handlers (e.g., onload, onerror, onclick)
        clean = clean.replace(/\bon[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "");
        return clean;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanMessage = sanitizeInput(newMessage);
        const cleanName = sanitizeInput(authorName);

        if (!cleanMessage || !cleanName) {
            toast.error('Preencha seu nome e a mensagem.');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'events', eventId, 'messages'), {
                author: cleanName,
                text: cleanMessage,
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
                <Heart className={`mx-auto mb-3 ${dark ? 'text-[#BF9B30]' : 'text-rose-400'}`} size={32} />
                <h2 className={`text-2xl md:text-3xl font-serif font-bold mb-2 ${dark ? 'text-white' : 'font-display text-slate-800'}`}>Livro de Assinaturas</h2>
                <p className={`text-sm ${dark ? 'text-[#BF9B30]/80' : 'text-slate-500'}`}>Deixe uma mensagem especial para nós apagarmos nunca!</p>
            </div>

            <form onSubmit={handleSubmit} className={`rounded-3xl p-6 shadow-sm border mb-10 ${dark ? 'bg-[#0F1419] border-[#BF9B30]/20' : 'bg-white border-slate-100'}`}>
                <div className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Seu nome"
                            aria-label="Seu nome"
                            className={`w-full px-4 py-3 border rounded-xl outline-none transition-colors ${dark ? 'bg-black/60 border-[#BF9B30]/30 text-white placeholder:text-gray-500 focus:border-[#BF9B30]' : 'bg-slate-50 border-slate-200 focus:border-rose-300 focus:bg-white'}`}
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <textarea
                            placeholder="Escreva sua mensagem com carinho..."
                            aria-label="Sua mensagem"
                            className={`w-full px-4 py-3 border rounded-xl outline-none transition-colors min-h-[100px] resize-y ${dark ? 'bg-black/60 border-[#BF9B30]/30 text-white placeholder:text-gray-500 focus:border-[#BF9B30]' : 'bg-slate-50 border-slate-200 focus:border-rose-300 focus:bg-white'}`}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={loading}
                            maxLength={500}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${dark ? 'bg-[#BF9B30] text-[#0F1419] hover:brightness-110' : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300'}`}
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
                    <div className={`text-center py-10 rounded-3xl border border-dashed ${dark ? 'text-gray-400 bg-[#0F1419] border-[#BF9B30]/20' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>
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
                            className={`p-5 rounded-2xl shadow-sm border relative ${dark ? 'bg-[#0F1419] border-[#BF9B30]/20' : 'bg-white border-slate-100'}`}
                        >
                            <p className={`leading-relaxed mb-3 whitespace-pre-wrap text-sm md:text-base ${dark ? 'text-gray-200' : 'text-slate-700'}`}>
                                "{msg.text}"
                            </p>
                            <div className={`flex items-center justify-between text-xs font-bold ${dark ? 'text-[#BF9B30]/70' : 'text-slate-400'}`}>
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
