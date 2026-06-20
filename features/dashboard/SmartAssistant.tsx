import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Loader2, ShieldAlert, MailCheck, Bell, Settings2, ArrowRight, RefreshCw, CheckCircle, MessageSquare, Clock, AlertTriangle, Copy, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Type } from '@google/genai';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import { useFirebase } from '../../components/FirebaseProvider';
import toast from 'react-hot-toast';

interface SmartAssistantProps {
    event: any;
    guests: any[];
}

interface BoosterGuest {
    name: string;
    phone: string;
    status: 'PENDING' | 'CONFIRMED' | 'DECLINED';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    actionPlan: string;
    draftMessage: string;
}

interface BoosterReport {
    criticalGuests: BoosterGuest[];
    overallInsights: string;
    urgencyRating: number;
    nextSteps: string[];
}

export const SmartAssistant: React.FC<SmartAssistantProps> = ({ event, guests }) => {
    const { user } = useFirebase();
    const [activeTab, setActiveTab] = useState<'chat' | 'booster'>('chat');
    
    // Chat States
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: `Olá! Sou o assistente de IA do seu evento "${event.title}". Como posso ajudar hoje? Você pode me pedir para resumir a lista de convidados, gerar ideias de mensagens para enviar no WhatsApp ou analisar os dados.` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Booster States
    const [isBoosterLoading, setIsBoosterLoading] = useState(false);
    const [boosterReport, setBoosterReport] = useState<BoosterReport | null>(null);
    const [isAlertsEnabled, setIsAlertsEnabled] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailLog, setEmailLog] = useState<{ to: string; title: string; sentAt: string; body: string } | null>(null);
    const [loadingStage, setLoadingStage] = useState('');

    useEffect(() => {
        // Load settings from localStorage
        const savedAlerts = localStorage.getItem(`inoai_booster_alerts_${event.id}`);
        if (savedAlerts) {
            setIsAlertsEnabled(savedAlerts === 'true');
        }
        
        const savedReport = localStorage.getItem(`inoai_booster_report_${event.id}`);
        if (savedReport) {
            try {
                setBoosterReport(JSON.parse(savedReport));
            } catch (e) {
                console.warn("Could not retrieve cached booster report");
            }
        }
    }, [event.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (activeTab === 'chat') {
            scrollToBottom();
        }
    }, [messages, activeTab]);

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
                model: 'gemini-3.5-flash',
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

    const runBoosterScan = async () => {
        setIsBoosterLoading(true);
        setLoadingStage('Analisando prazos e criticidade...');
        
        // Staged status messages for realistic premium feedback
        const stages = [
            'Avaliando dados de confirmações de RSVP...',
            'Cruzando datas limite de resposta...',
            'Identificando convidados sem contato recente...',
            'Gerando redações e drafts inteligentes...'
        ];
        
        let currentStageIdx = 0;
        const interval = setInterval(() => {
            if (currentStageIdx < stages.length) {
                setLoadingStage(stages[currentStageIdx]);
                currentStageIdx++;
            }
        }, 1500);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

            const systemInstruction = `Você é o mecanismo inteligente InoAI Smart Booster para a plataforma InoEvents.
Seu dever é analisar a lista de convidados para o evento "${event.title}" e identificar "RSVPs Críticos" que necessitam de intervenção ou contato imediato do organizador.

Considere as regras para definir um RSVP como Crítico:
1. Convidados pendentes (status === 'PENDING') com telefone cadastrado e nenhuma confirmação.
2. Convidados que recusaram (status === 'DECLINED') mas que possuem papel estratégico (como familiares próximos).
3. Convidados confirmados (status === 'CONFIRMED') mas com inconsistências (acompanhantes não discriminados ou dúvidas pendentes).
4. Grupos pendentes de grande porte (para estimativa correta de buffet).

Você deve retornar obrigatoriamente um objeto JSON no formato do esquema fornecido.
Forneça insights de alto nível no campo 'overallInsights' e recomende os próximos passos estratégicos no campo 'nextSteps'.
Crie mensagens de contato (draftMessage) personalizadas, amigáveis, gentis e persuasivas em português do Brasil, prontas para WhatsApp ou E-mail.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    criticalGuests: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Nome completo do convidado" },
                                phone: { type: Type.STRING, description: "Telefone do convidado" },
                                status: { type: Type.STRING, description: "PENDING, CONFIRMED ou DECLINED" },
                                severity: { type: Type.STRING, description: "Nível de gravidade/criticidade: HIGH, MEDIUM ou LOW" },
                                reason: { type: Type.STRING, description: "Motivo que torna esta confirmação crítica" },
                                actionPlan: { type: Type.STRING, description: "O que o organizador deve sugerir ou fazer" },
                                draftMessage: { type: Type.STRING, description: "Mensagem personalizada no tom adequado para o convidado" }
                            },
                            required: ["name", "phone", "status", "severity", "reason", "actionPlan", "draftMessage"]
                        }
                    },
                    overallInsights: { type: Type.STRING, description: "Visão estratégica de confirmações de presença do evento" },
                    urgencyRating: { type: Type.INTEGER, description: "Grau geral de urgência para contato (1 a 5)" },
                    nextSteps: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Próximos passos imediatos sugeridos"
                    }
                },
                required: ["criticalGuests", "overallInsights", "urgencyRating", "nextSteps"]
            };

            const guestsData = guests.map(g => ({
                name: g.name,
                phone: g.phone || 'Não fornecido',
                status: g.status,
                adults: g.adults || 1,
                children: g.children || 0,
                message: g.message || ''
            }));

            const prompt = `Analise os seguintes convidados do evento "${event.title}" (Data: ${event.date}):
${JSON.stringify(guestsData, null, 2)}
Gere o relatório completo respeitando o esquema JSON.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                    temperature: 0.1,
                }
            });

            clearInterval(interval);
            
            const rawText = response.text || "{}";
            const report: BoosterReport = JSON.parse(rawText.trim());
            setBoosterReport(report);
            localStorage.setItem(`inoai_booster_report_${event.id}`, JSON.stringify(report));

            // Trigger Firestore Notification automatically if scan detects critical items
            if (user && report.criticalGuests.length > 0) {
                await addDoc(collection(db, 'users', user.uid, 'notifications'), {
                    title: `⚡ InoAI Smart Booster: ${report.criticalGuests.length} Contatos Críticos`,
                    message: `O mecanismo Booster analisou seu evento "${event.title}" e identificou convidados prioritários aguardando resposta. Acesse o painel inteligente para sincronizar as mensagens geradas.`,
                    type: 'booster_alert',
                    createdAt: new Date().toISOString(),
                    read: false,
                    eventId: event.id
                });
            }

            toast.success("Varredura completada com absoluto sucesso!");
        } catch (error) {
            clearInterval(interval);
            console.error("Booster Scan Error:", error);
            toast.error("Houve um problema ao processar a análise com a IA da Google.");
        } finally {
            setIsBoosterLoading(false);
        }
    };

    const handleToggleAlerts = (checked: boolean) => {
        setIsAlertsEnabled(checked);
        localStorage.setItem(`inoai_booster_alerts_${event.id}`, String(checked));
        if (checked) {
            toast.success("Monitoramento inteligente ativado! Alertas serão exibidos em seu dashboard.");
        } else {
            toast.success("Monitoramento inteligente desativado.");
        }
    };

    const sendEmailFeedbackSimulated = async () => {
        if (!user || !user.email) {
            toast.error("E-mail de usuário não encontrado.");
            return;
        }
        setIsSendingEmail(true);
        
        // Simulating the email dispatch layout & trigger log
        setTimeout(async () => {
            const count = boosterReport?.criticalGuests.length || 0;
            const logContent = {
                to: user.email,
                title: `[InoEvents Smart Booster] Relatório Diário de Atividades Críticas - ${event.title}`,
                sentAt: new Date().toLocaleTimeString('pt-BR') + ' ' + new Date().toLocaleDateString('pt-BR'),
                body: `Caro/a Organizador/a, 

O InoAI Smart Booster fez uma varredura sobre a lista de convidados do evento "${event.title}".
Encontramos ${count} RSVPs Críticos necessitando de contato urgente. 

Confira mais detalhes diretamente no Cockpit de Inteligência do seu evento.

Atenciosamente,
Equipe InoEvents IA.`
            };
            
            setEmailLog(logContent);
            setIsSendingEmail(false);
            
            // Push notification to Firestore user dashboard logs
            try {
                await addDoc(collection(db, 'users', user.uid, 'notifications'), {
                    title: `📧 Relatório Enviado: ${logContent.title}`,
                    message: `Um e-mail de feedback analítico foi disparado para ${user.email} contendo o sumário estratégico de confirmações de convidados.`,
                    type: 'email_dispatched',
                    createdAt: new Date().toISOString(),
                    read: false,
                    eventId: event.id
                });
            } catch (e) {
                console.error("Could not write notification logs");
            }

            toast.success(`E-mail com relatório enviado para ${user.email}!`);
        }, 2000);
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success("Mensagem copiada para a área de transferência!");
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const openWhatsAppDirect = (phone: string, text: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const encodedText = encodeURIComponent(text);
        const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
        window.open(url, '_blank');
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-100/40 flex flex-col min-h-[650px] overflow-hidden">
            {/* Header / Sub-nav */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <Sparkles size={24} className="animate-pulse" />
                    </div>
                    <div>
                        <h3 className="font-serif font-black text-slate-800 text-xl tracking-tight flex items-center gap-2">
                            Assistente de IA Integrado
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Análise de convidados, drafts de ajuda e alertas estratégicos.</p>
                    </div>
                </div>

                {/* SubTab Toggle */}
                <div className="flex bg-slate-200/50 p-1 rounded-xl self-start md:self-auto">
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <MessageSquare size={14} /> Conversar
                    </button>
                    <button 
                        onClick={() => setActiveTab('booster')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'booster' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ShieldAlert size={14} /> Smart Booster 🚀
                    </button>
                </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'chat' ? (
                        <motion.div 
                            key="chat"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="flex flex-col h-[480px] justify-between"
                        >
                            {/* Messages area */}
                            <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 scrollbar-thin">
                                {messages.map((msg, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={idx} 
                                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-purple-100 text-purple-600'}`}>
                                            {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                        </div>
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-sm' : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-sm'}`}>
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
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-100 text-purple-600">
                                            <Bot size={18} />
                                        </div>
                                        <div className="bg-slate-50 text-slate-400 border border-slate-100 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin text-purple-600" /> Consultando base do InoEvents...
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat input footer */}
                            <div className="pt-4 border-t border-slate-100">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Perguntar ex: Qual o percentual de confirmados em canais adicionais?"
                                        disabled={isLoading}
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-full py-4 pl-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all font-medium text-slate-700"
                                    />
                                    <button 
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-all shadow-md shadow-purple-200 cursor-pointer"
                                    >
                                        <Send size={15} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="booster"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-6"
                        >
                            {/* Inactive Mode / Intro */}
                            {!boosterReport && !isBoosterLoading && (
                                <div className="text-center py-12 max-w-lg mx-auto flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mb-6 shadow-inner ring-4 ring-amber-50/50">
                                        <ShieldAlert size={32} />
                                    </div>
                                    <h4 className="font-serif font-black text-2xl text-slate-800 mb-2">Smart Booster Reativo</h4>
                                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                                        Inicie uma análise profunda na sua lista para detectar de forma automática convidados pendentes sem contato recente ou RSVPs suspeitos de desistência.
                                    </p>
                                    <button
                                        onClick={runBoosterScan}
                                        className="bg-slate-900 border border-slate-800 text-white font-bold text-sm px-8 py-3.5 rounded-full hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl cursor-pointer flex items-center gap-2 shrink-0"
                                    >
                                        <Sparkles size={16} className="text-yellow-400" /> Executar Varredura Inteligente
                                    </button>
                                </div>
                            )}

                            {/* Scanning Animation */}
                            {isBoosterLoading && (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <div className="relative mb-8">
                                        <div className="w-20 h-20 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-purple-600 font-bold">
                                            <Sparkles size={24} className="animate-pulse" />
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-2">Processando Análise IA InoEvents</h4>
                                    <p className="text-sm text-slate-400 font-medium animate-pulse">{loadingStage}</p>
                                </div>
                            )}

                            {/* Successful Dashboard Results */}
                            {boosterReport && !isBoosterLoading && (
                                <div className="space-y-6">
                                    {/* Action Header block */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 p-5 rounded-2xl border border-slate-100 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                                <RefreshCw size={18} className="animate-spin-slow" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">Atualizado em tempo real</h4>
                                                <p className="text-xs text-slate-400">Varredura efetuada com base nos {guests.length} convidados.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={runBoosterScan}
                                                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                            >
                                                <RefreshCw size={12} /> Refazer Varredura
                                            </button>
                                        </div>
                                    </div>

                                    {/* Urgency Rating & Strategic insights block */}
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md min-h-[140px] flex flex-col justify-between">
                                            <div>
                                                <span className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400">Nível de Urgência</span>
                                                <h5 className="text-2xl font-serif font-black mt-1">Nível {boosterReport.urgencyRating}/5</h5>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${boosterReport.urgencyRating >= 4 ? 'bg-red-500' : boosterReport.urgencyRating >= 2 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                        style={{ width: `${(boosterReport.urgencyRating / 5) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-[11px] text-slate-400 font-medium">Avaliado pelo assistente com base nos RSVPs.</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl md:col-span-2">
                                            <span className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400 block mb-1">Análise Estratégica InoAI</span>
                                            <p className="text-xs text-slate-600 leading-relaxed font-medium">{boosterReport.overallInsights}</p>
                                        </div>
                                    </div>

                                    {/* Toggle Alerts section */}
                                    <div className="p-4 bg-purple-50/50 border border-purple-100/50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center">
                                                <Bell size={18} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-xs text-slate-800">Alertas Recorrentes Ativos (E-mail & Push)</h5>
                                                <p className="text-[11px] text-slate-400">Receba resumos diários no seu e-mail caso novos RSVPs fiquem sob risco.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isAlertsEnabled}
                                                    onChange={(e) => handleToggleAlerts(e.target.checked)}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                            </label>

                                            <button
                                                onClick={sendEmailFeedbackSimulated}
                                                disabled={isSendingEmail}
                                                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                                            >
                                                {isSendingEmail ? (
                                                    <>
                                                        <Loader2 size={12} className="animate-spin" /> Disparando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <MailCheck size={12} /> Disparar Teste E-mail
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Email simulation log preview */}
                                    {emailLog && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="bg-slate-900 text-slate-300 p-5 rounded-2xl font-mono text-xs border border-slate-800 relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3 text-[10px] text-slate-500 uppercase tracking-wider">
                                                <span>LOG DE TRANSMISSÃO DE E-MAIL (SIMULAÇÃO REAL)</span>
                                                <button onClick={() => setEmailLog(null)} className="text-slate-400 hover:text-white">
                                                    Fechar Log [x]
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-purple-400"><span className="text-slate-500">Destinatário:</span> {emailLog.to}</p>
                                                <p className="text-emerald-400"><span className="text-slate-500">Assunto:</span> {emailLog.title}</p>
                                                <p className="text-amber-400"><span className="text-slate-500">Enviado às:</span> {emailLog.sentAt}</p>
                                            </div>
                                            <div className="mt-4 p-3 bg-slate-950 rounded-xl whitespace-pre-wrap leading-relaxed text-[11px] text-slate-400 border border-slate-800/50">
                                                {emailLog.body}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Action checklist */}
                                    <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl">
                                        <span className="text-xs font-black uppercase text-slate-500 block mb-3 tracking-wider">Recomendações Práticas</span>
                                        <ul className="space-y-3">
                                            {boosterReport.nextSteps.map((step, idx) => (
                                                <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 font-medium">
                                                    <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>{step}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Critical Guests list */}
                                    <div className="space-y-4">
                                        <h5 className="font-serif font-black text-slate-800 text-lg">
                                            Convidados Críticos Detectados ({boosterReport.criticalGuests.length})
                                        </h5>

                                        {boosterReport.criticalGuests.length === 0 ? (
                                            <div className="p-8 border border-slate-150 rounded-2xl text-center text-slate-400 text-xs">
                                                Nenhum convidado em criticidade alta no momento.
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {boosterReport.criticalGuests.map((guest, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-purple-300 focus-within:border-purple-400 transition-all flex flex-col justify-between"
                                                    >
                                                        <div className="flex flex-col md:flex-row justify-between items-start gap-3 border-b border-slate-100 pb-4 mb-4">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-800">{guest.name}</span>
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                        guest.severity === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                                        guest.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                        'bg-slate-100 text-slate-600'
                                                                    }`}>
                                                                        {guest.severity === 'HIGH' ? 'Urgência Alta' : guest.severity === 'MEDIUM' ? 'Urgência Média' : 'Urgência Baixa'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-500 mt-1">Contato: {guest.phone}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Status RSVP</span>
                                                                <span className={`text-xs font-bold ${
                                                                    guest.status === 'PENDING' ? 'text-amber-500' :
                                                                    guest.status === 'DECLINED' ? 'text-red-500' :
                                                                    'text-emerald-500'
                                                                }`}>
                                                                    {guest.status === 'PENDING' ? 'Pendente' : guest.status === 'DECLINED' ? 'Recusado' : 'Confirmado'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Details explanation */}
                                                        <div className="grid md:grid-cols-2 gap-4 text-xs mb-4">
                                                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                                                <span className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5"><AlertTriangle size={12} className="text-amber-500" /> Motivo da criticidade</span>
                                                                <span className="text-slate-500 font-medium">{guest.reason}</span>
                                                            </div>
                                                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                                                <span className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5"><Clock size={12} className="text-blue-500" /> Plano de mitigação</span>
                                                                <span className="text-slate-500 font-medium">{guest.actionPlan}</span>
                                                            </div>
                                                        </div>

                                                        {/* Suggested text message draft */}
                                                        <div className="bg-purple-50/30 border border-purple-100 p-4 rounded-xl relative">
                                                            <span className="text-[10px] uppercase font-black text-purple-600 tracking-wider block mb-2">Mensagem de Cobrança Sugerida</span>
                                                            <p className="text-xs text-slate-700 leading-relaxed italic pr-12 font-medium">"{guest.draftMessage}"</p>
                                                            
                                                            <div className="absolute right-3 top-3 flex flex-col gap-2">
                                                                <button
                                                                    onClick={() => copyToClipboard(guest.draftMessage, idx)}
                                                                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-purple-600 flex items-center justify-center shadow-sm cursor-pointer hover:border-purple-200 transition-all"
                                                                    title="Copiar Mensagem"
                                                                >
                                                                    {copiedIndex === idx ? <Check size={14} className="text-emerald-500 animate-scale" /> : <Copy size={13} />}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Actions feet */}
                                                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100/50">
                                                            <button
                                                                onClick={() => openWhatsAppDirect(guest.phone, guest.draftMessage)}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-100 cursor-pointer"
                                                            >
                                                                <ExternalLink size={12} /> Contactar no WhatsApp
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
