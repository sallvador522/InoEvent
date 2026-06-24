import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Clock, Users, MessageSquare, Phone, Calendar } from 'lucide-react';

export const GuestDetailsModal = ({ isOpen, onClose, guest }: { isOpen: boolean, onClose: () => void, guest: any }) => {
    if (!guest) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="font-serif text-xl font-bold text-slate-800">Detalhes do Convidado</h3>
                            <button 
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 font-bold border border-slate-200 text-xl">
                                    {guest.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800">{guest.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <StatusBadge status={guest.status} />
                                        {guest.checkedIn && (
                                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
                                                <CheckCircle2 size={10} /> Presente
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Users size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Acompanhantes</span>
                                    </div>
                                    <div className="font-bold text-slate-800">
                                        {guest.adults || 1} Adulto(s)
                                        {guest.children > 0 && <span className="text-sm text-slate-500 block">{guest.children} Criança(s)</span>}
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Phone size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Telefone</span>
                                    </div>
                                    <div className="font-bold text-slate-800 break-all">{guest.phone || 'Não informado'}</div>
                                </div>
                            </div>

                            {guest.message && (
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                                        <MessageSquare size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Mensagem Deixada</span>
                                    </div>
                                    <p className="text-slate-700 italic text-sm">"{guest.message}"</p>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-slate-400 text-xs">
                                <Calendar size={12} />
                                Confirmado em: {guest.createdAt ? new Date(guest.createdAt).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Data desconhecida'}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <a 
                                href={`https://wa.me/${guest.phone?.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 bg-[#25D366] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-all shadow-sm"
                            >
                                <MessageSquare size={16} /> WhatsApp
                            </a>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    switch(status) {
        case 'CONFIRMED':
            return <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-green-200"><CheckCircle2 size={12}/> Confirmado</span>;
        case 'DECLINED':
            return <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-200">Recusado</span>;
        default:
            return <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-orange-200"><Clock size={12}/> Pendente</span>;
    }
};
