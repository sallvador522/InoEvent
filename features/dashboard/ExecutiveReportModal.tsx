import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Download, X, Calendar, Activity, CheckCircle2, TrendingUp, Users, Shield, Copy, Check } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ExecutiveReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any;
    guests: any[];
    agencyName: string;
    agencyLogo: string | null;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
    isOpen,
    onClose,
    event,
    guests,
    agencyName,
    agencyLogo
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen || !event) return null;

    // Calculate core statistics
    const totalGuests = guests.length;
    const confirmedCount = guests.filter(g => g.status === 'CONFIRMED').length;
    const pendingCount = guests.filter(g => g.status === 'PENDING').length;
    const declinedCount = guests.filter(g => g.status === 'DECLINED').length;
    const checkedInCount = guests.filter(g => g.checkedIn).length;

    const confirmedAdults = guests.filter(g => g.status === 'CONFIRMED').reduce((acc, curr) => acc + (curr.adults || 1), 0);
    const confirmedChildren = guests.filter(g => g.status === 'CONFIRMED').reduce((acc, curr) => acc + (curr.children || 0), 0);

    const checkinProgress = confirmedCount > 0 ? Math.round((checkedInCount / confirmedCount) * 100) : 0;
    const rsvpProgress = totalGuests > 0 ? Math.round((confirmedCount / totalGuests) * 100) : 0;

    // Chart Data
    const pieData = [
        { name: 'Confirmado', value: confirmedCount, color: '#10B981' },
         { name: 'Pendente', value: pendingCount, color: '#F59E0B' },
        { name: 'Recusado', value: declinedCount, color: '#EF4444' }
    ].filter(d => d.value > 0);

    // Filter out some recent guests for overview list
    const recentGuests = [...guests]
        .sort((a,b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
        .slice(0, 8);

    const handlePrint = () => {
        setIsGenerating(true);
        setTimeout(() => {
            window.print();
            setIsGenerating(false);
        }, 300);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-4 overflow-y-auto bg-slate-900/40 backdrop-blur-md">
                {/* Modern Print Stylesheet injected right inside the component */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        body {
                            background: white !important;
                            color: black !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .print-area {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            box-shadow: none !important;
                            border: none !important;
                            background: white !important;
                        }
                        .print-page-break {
                            page-break-after: always;
                        }
                        .recharts-legend-wrapper, .recharts-tooltip-wrapper {
                            display: none !important;
                        }
                    }
                `}} />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#FAFAFA] md:rounded-3xl w-full max-w-4xl min-h-screen md:min-h-0 md:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative border border-slate-200/50"
                >
                    {/* Header Controls (Hidden on Print) */}
                    <div className="bg-white border-b border-slate-200/60 p-5 shrink-0 flex items-center justify-between no-print sticky top-0 z-[10500]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                                <Printer size={18} />
                            </div>
                            <div>
                                <h4 className="font-serif font-bold text-slate-800 text-base leading-tight">Relatório Executivo PDF</h4>
                                <p className="text-xs text-slate-500">Imprima ou exporte em PDF de nível executivo.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                disabled={isGenerating}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer"
                            >
                                <Printer size={14} className={isGenerating ? "animate-spin" : ""} />
                                {isGenerating ? "Preparando..." : "Imprimir / PDF"}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Report Content area */}
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 print-area bg-white">
                        <div className="max-w-3xl mx-auto flex flex-col gap-8">
                            
                            {/* WhiteLabel Professional Header Cover */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-slate-900 pb-8">
                                <div className="flex items-center gap-3">
                                    {agencyLogo ? (
                                        <img src={agencyLogo} alt={agencyName} className="h-12 object-contain" />
                                    ) : (
                                        <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center transform rotate-3">
                                            <div className="w-3.5 h-3.5 bg-[#BF9B30] rounded-full"></div>
                                        </div>
                                    )}
                                    <div className="border-l border-slate-200 pl-4">
                                        <span className="font-bold text-xs uppercase tracking-widest text-[#BF9B30] block">Agência Parceira</span>
                                        <span className="font-serif font-bold text-slate-900 text-lg">{agencyName}</span>
                                    </div>
                                </div>
                                <div className="text-right self-start md:self-auto">
                                    <span className="text-xs font-mono font-bold text-slate-400 block uppercase tracking-wider">Relatório Corporativo</span>
                                    <span className="text-sm font-semibold text-slate-800 mt-1 block">Gerado em: {new Date().toLocaleDateString('pt-AO')}</span>
                                </div>
                            </div>

                            {/* Event Metadata Cover banner */}
                            <div>
                                <span className="text-xs font-bold text-[#BF9B30] uppercase tracking-widest block mb-1">Métricas de Planejamento Executivo</span>
                                <h1 className="text-3xl md:text-4xl font-serif text-slate-900 font-extrabold tracking-tight mt-1">{event.title}</h1>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500">
                                    <div>
                                        <p className="font-mono text-[10px] uppercase font-bold text-slate-400">Data do Evento</p>
                                        <p className="font-bold text-slate-800 text-sm mt-0.5">{event.date ? new Date(event.date).toLocaleDateString('pt-AO', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sem data'}</p>
                                    </div>
                                    <div>
                                        <p className="font-mono text-[10px] uppercase font-bold text-slate-400">Plano de Escopo</p>
                                        <p className="font-bold text-slate-800 text-sm mt-0.5">{event.plan || 'Business'}</p>
                                    </div>
                                    <div>
                                        <p className="font-mono text-[10px] uppercase font-bold text-slate-400">Limites de RSVP</p>
                                        <p className="font-bold text-slate-800 text-sm mt-0.5">{event.plan === 'Corporate' ? 'Sem limites' : event.plan === 'Business' ? 'Até 5.000' : 'Até 500'}</p>
                                    </div>
                                    <div>
                                        <p className="font-mono text-[10px] uppercase font-bold text-slate-400">Canal Ativo</p>
                                        <p className="font-bold text-slate-800 text-sm mt-0.5">Automático Web Link</p>
                                    </div>
                                </div>
                            </div>

                            {/* Executive Statistics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div className="border border-slate-200 p-4.5 rounded-2xl bg-slate-50/50">
                                    <span className="text-slate-400 font-bold text-[10px] uppercase font-mono tracking-wider">Universo Total Escrito</span>
                                    <div className="text-2xl font-serif font-blue font-extrabold text-slate-900 mt-1">{totalGuests}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">convidados na grade</div>
                                </div>
                                <div className="border border-slate-200 p-4.5 rounded-2xl bg-emerald-50/20">
                                    <span className="text-[#10B981] font-bold text-[10px] uppercase font-mono tracking-wider">Total Confirmados</span>
                                    <div className="text-2xl font-serif font-extrabold text-[#10B981] mt-1">{confirmedCount}</div>
                                    <div className="text-[10px] text-[#10B981]/85 mt-0.5">{rsvpProgress}% de adesão geral</div>
                                </div>
                                <div className="border border-slate-200 p-4.5 rounded-2xl bg-amber-50/20">
                                    <span className="text-amber-600 font-bold text-[10px] uppercase font-mono tracking-wider">Aguardando RSVP</span>
                                    <div className="text-2xl font-serif font-extrabold text-amber-600 mt-1">{pendingCount}</div>
                                    <div className="text-[10px] text-amber-600/80 mt-0.5">{totalGuests > 0 ? Math.round((pendingCount / totalGuests) * 100) : 0}% pendentes</div>
                                </div>
                                <div className="border border-slate-200 p-4.5 rounded-2xl bg-blue-50/20">
                                    <span className="text-brand-blue font-bold text-[10px] uppercase font-mono tracking-wider">Check-in Concluido</span>
                                    <div className="text-2xl font-serif font-extrabold text-brand-blue mt-1">{checkedInCount}</div>
                                    <div className="text-[10px] text-brand-blue/80 mt-0.5">{checkinProgress}% presentes na recepção</div>
                                </div>
                            </div>

                            {/* Executive companion split & metrics breakdown */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-[#FAF9F5] rounded-2xl p-5 border border-[#BF9B30]/15 flex items-center justify-between">
                                    <div>
                                        <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Composição de Adultos (Confirmados)</h5>
                                        <p className="text-2xl font-serif font-bold text-slate-800">{confirmedAdults} <span className="text-xs text-slate-500 font-sans font-medium">adulto(s)</span></p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100/50">
                                        <Users size={20} />
                                    </div>
                                </div>
                                <div className="bg-[#FAF9F5] rounded-2xl p-5 border border-[#BF9B30]/15 flex items-center justify-between">
                                    <div>
                                        <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Composição de Crianças (Confirmados)</h5>
                                        <p className="text-2xl font-serif font-bold text-slate-800">{confirmedChildren} <span className="text-xs text-slate-500 font-sans font-medium">criança(s)</span></p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center border border-blue-100/50">
                                        <Users size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Visual Chart Integration */}
                            <div className="border border-slate-200 rounded-3xl p-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-6">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">Distribuição RSVP & Retenção do Convite</h4>
                                        <p className="text-xs text-slate-500">Visão proporcional das respostas computadas no banco de dados.</p>
                                    </div>
                                    {pieData.length > 0 && (
                                        <div className="flex gap-4">
                                            {pieData.map((d, i) => (
                                                <div key={i} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                                                    {d.name} ({d.value})
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="h-44 w-full flex items-center justify-center bg-slate-55 rounded-2xl relative overflow-hidden">
                                    {pieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    innerRadius={45}
                                                    outerRadius={65}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <span className="text-xs text-slate-400 font-bold">Sem dados gráficos ativos.</span>
                                    )}
                                </div>
                            </div>

                            {/* Recent Guest Answers Table */}
                            <div className="print-page-break" />
                            
                            <div className="border border-slate-200 rounded-3xl overflow-hidden mt-2">
                                <div className="bg-slate-50 p-4 border-b border-slate-200">
                                    <h4 className="font-bold text-slate-800 text-sm">Amostragem dos Convites Recém-Confirmados</h4>
                                    <p className="text-xs text-slate-400">Verificação de presenças e canais de confirmação.</p>
                                </div>
                                <div className="divide-y divide-slate-100 text-xs">
                                    {recentGuests.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400">Nenhum convidado cadastrado.</div>
                                    ) : (
                                        recentGuests.map((guest, idx) => (
                                            <div key={guest.id} className="p-3.5 px-6 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-slate-700 min-w-[20px]">{idx + 1}.</span>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{guest.name}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{guest.phone || 'Sem contato'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {guest.checkedIn && (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-brand-blue uppercase">Check-in</span>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                        guest.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' :
                                                        guest.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                                    }`}>
                                                        {guest.status === 'CONFIRMED' ? 'Confirmado' :
                                                         guest.status === 'PENDING' ? 'Pendente' : 'Recusado'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Legal Notice Footer */}
                            <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-slate-400 text-[10px] text-center md:text-left gap-4">
                                <div>
                                    <p className="font-bold uppercase tracking-wider text-slate-500">{agencyName} Powered Workspace</p>
                                    <p className="mt-1">Relatório eletrônico emitido a partir da infraestrutura segura de InoEvents.</p>
                                </div>
                                <div className="bg-slate-100 px-3 py-1.5 rounded-full font-mono font-bold text-slate-500">
                                    ID: {event.id.toUpperCase()}
                                </div>
                            </div>

                        </div>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
};
