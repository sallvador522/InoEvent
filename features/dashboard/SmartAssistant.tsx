import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';

interface SmartAssistantProps {
    event: any;
    guests: any[];
}

export const SmartAssistant: React.FC<SmartAssistantProps> = ({ event, guests }) => {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: `Olá! Sou o assistente de IA do seu evento "${event.title}". Como posso ajudar hoje? Você pode me pedir para resumir a lista de convidados, gerar ideias de mensagens para enviar no WhatsApp ou analisar os dados.` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            
            const systemInstruction = `Você é um assessor de eventos expert e profissional para a plataforma InoEvents.
Você está ajudando o anfitrião do evento "${event.title}" (Tipo: ${event.type}).
O evento acontecerá no dia ${event.date} às ${event.time} em ${event.location}.
O evento tem ${guests.length} convidados cadastrados no momento. 
Convidados confirmados: ${guests.filter(g => g.status === 'CONFIRMED').length}.
Convidados recusados: ${guests.filter(g => g.status === 'DECLINED').length}.
Pendentes: ${guests.filter(g => g.status === 'PENDING').length}.
Convidados que já entraram (check-in): ${guests.filter(g => g.checkedIn).length}.

Responda sempre em PT-BR de forma clara, prestativa e amigável.
Seja conciso mas muito direto e útil.
Se o usuário pedir para gerar uma mensagem de convite, crie algo muito bem escrito. Baseado no tipo do evento (Casamento, Aniversário, Corporativo, etc).`;

            const history = messages.map(m => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n');
            const prompt = `${history}\nUser: ${userMsg}\nAI:`;

            const response = await ai.models.generateContent({
                model: 'gemini-3.1-flash-preview',
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.7,
                }
            });

            setMessages(prev => [...prev, { role: 'assistant', content: response.text || "Desculpe, ocorreu um erro." }]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Desculpe, não consegui processar o seu pedido agora. Tente novamente mais tarde." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[600px] overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        InoAI Assistant 
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-brand-blue text-white rounded-full">Beta</span>
                    </h3>
                    <p className="text-sm text-slate-500">Resumo de dados, redação de mensagens e insights.</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx} 
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-purple-100 text-purple-600'}`}>
                            {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                        </div>
                        <div className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-sm' : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-sm'}`}>
                            {msg.content.split('\n').map((line, i) => (
                                <React.Fragment key={i}>
                                    {line}
                                    {i < msg.content.split('\n').length - 1 && <br />}
                                </React.Fragment>
                            ))}
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-100 text-purple-600">
                            <Bot size={18} />
                        </div>
                        <div className="bg-slate-50 text-slate-400 border border-slate-100 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" /> Pensando...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ex: Como posso cobrar de forma gentil quem não confirmou?"
                        disabled={isLoading}
                        className="w-full bg-slate-50 border border-slate-200 rounded-full py-4 pl-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-purple-700 transition-colors shadow-sm"
                    >
                        <Send size={16} className="translate-x-[-1px] translate-y-[1px]" />
                    </button>
                </div>
            </div>
        </div>
    );
};
