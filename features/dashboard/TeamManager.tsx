import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { Users2, Shield, UserPlus, Trash2, Link2, Check, Copy, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TeamManagerProps {
    event: any;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'scanner' | 'viewer';
    phone?: string;
    status: 'active' | 'pending';
    createdAt: string;
}

import { copyToClipboard } from '../../lib/clipboard';

export const TeamManager: React.FC<TeamManagerProps> = ({ event }) => {
    const eventId = event.id;
    const eventPlan = event.plan;
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Add member state
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'editor' | 'scanner' | 'viewer'>('editor');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Limit check by Plan
    const maxMembers = eventPlan === 'Corporate' ? Infinity : eventPlan === 'Business' ? 10 : 3;

    useEffect(() => {
        if (!eventId) return;

        const teamRef = collection(db, 'events', eventId, 'team');
        const unsubscribe = onSnapshot(teamRef, 
            (snapshot) => {
                const membersList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as TeamMember[];
                setTeam(membersList);
                setLoading(false);
            },
            (error) => {
                console.error("Error reading team collection:", error);
                handleFirestoreError(error, OperationType.LIST, `events/${eventId}/team`);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [eventId]);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newEmail.trim()) {
            toast.error("Nome e E-mail são obrigatórios.");
            return;
        }

        if (team.length >= maxMembers) {
            toast.error(`Seu plano permite no máximo ${maxMembers} colaboradores ativos.`);
            return;
        }

        setIsSubmitting(true);
        try {
            // Document reference using email as sanitized key to avoid duplicates
            const memberId = newEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const memberRef = doc(db, 'events', eventId, 'team', memberId);

            await setDoc(memberRef, {
                name: newName,
                email: newEmail.toLowerCase().trim(),
                phone: newPhone.trim(),
                role: newRole,
                status: 'active',
                createdAt: new Date().toISOString()
            });

            toast.success(`${newName} foi adicionado à equipe!`);
            
            // Clear fields
            setNewName('');
            setNewEmail('');
            setNewPhone('');
            setNewRole('editor');
        } catch (error) {
            console.error(error);
            toast.error("Ocorreu um erro ao adicionar colaborador.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveMember = async (memberId: string, name: string) => {
        if (!window.confirm(`Tem certeza que deseja remover ${name} da equipe?`)) return;

        try {
            const memberRef = doc(db, 'events', eventId, 'team', memberId);
            await deleteDoc(memberRef);
            toast.success(`${name} removido com sucesso.`);
        } catch (error) {
            console.error(error);
            toast.error("Ocorreu um erro ao remover o colaborador.");
        }
    };

    const handleUpdateRole = async (memberId: string, role: 'admin' | 'editor' | 'scanner' | 'viewer') => {
        try {
            const memberRef = doc(db, 'events', eventId, 'team', memberId);
            await updateDoc(memberRef, { role });
            toast.success("Permissão atualizada!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar permissão.");
        }
    };

    const getPublicOrigin = () => {
        let origin = window.location.origin;
        return origin;
    };

    const handleCopyLink = async (member: TeamMember) => {
        let token = event?.clientToken || '';
        if (!token && (member.role === 'scanner' || member.role === 'viewer')) {
            token = Math.random().toString(36).substring(2, 8).toUpperCase();
            try {
                await updateDoc(doc(db, 'events', event.id), { clientToken: token });
            } catch (error) {
                console.error("Error generating token", error);
            }
        }
        
        const path = member.role === 'viewer'
            ? `${getPublicOrigin()}/client-dashboard/${eventId}?token=${token}`
            : member.role === 'scanner'
                ? `${getPublicOrigin()}/checkin/${eventId}?token=${token}&mode=reception`
                : `${getPublicOrigin()}/dashboard/${eventId}`;
                
        copyToClipboard(path);
        setCopiedId(member.id);
        toast.success("Link de acesso copiado!");
        setTimeout(() => setCopiedId(null), 3000);
    };

    const getRoleDetails = (role: string) => {
        switch (role) {
            case 'admin':
                return { label: 'Administrador', desc: 'Acesso total a métricas, convidados e configurações.', color: 'bg-red-50 text-red-600 border-red-100' };
            case 'editor':
                return { label: 'Cerimonial / Editor', desc: 'Pode gerenciar, adicionar ou excluir convidados da lista.', color: 'bg-[#BF9B30]/10 text-[#BF9B30] border-[#BF9B30]/20' };
            case 'scanner':
                return { label: 'Staff Portaria', desc: 'Acesso restrito para ler QR Code e marcar entradas na portaria.', color: 'bg-blue-50 text-blue-600 border-blue-100' };
            case 'viewer':
            default:
                return { label: 'Visualizador (Cliente)', desc: 'Acesso somente-leitura ao painel do cliente final.', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-serif text-slate-800 mb-1 flex items-center gap-2">
                        <Users2 className="text-brand-blue" size={24} /> Equipe & Colaboradores
                    </h3>
                    <p className="text-slate-500 text-sm">
                        Compartilhe o controle do evento com operadores de scanner, assessores e clientes finais.
                    </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200/60 shadow-sm text-xs font-bold text-slate-500 flex items-center gap-1.5 self-start md:self-auto">
                    <Sparkles size={14} className="text-[#BF9B30]" /> Plano {eventPlan || 'Business'} : 
                    <span className="text-slate-800 font-extrabold">{team.length} de {maxMembers === Infinity ? 'Ilimitado' : maxMembers} cadastrados</span>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Add Member Column */}
                <div className="md:col-span-1">
                    <form onSubmit={handleAddMember} className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-6 rounded-3xl shadow-xl shadow-slate-100/40 flex flex-col gap-4 sticky top-24">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
                                <UserPlus size={16} />
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm">Adicionar Membro</h4>
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Nome Completo</label>
                            <input 
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="ex. Mariana Silva"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/15 focus:border-brand-blue transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Email Corporativo</label>
                            <input 
                                type="email"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                placeholder="maria@organizador.com"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/15 focus:border-brand-blue transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">WhatsApp / Telefone</label>
                            <input 
                                type="tel"
                                value={newPhone}
                                onChange={e => setNewPhone(e.target.value)}
                                placeholder="+31 999 999 999"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/15 focus:border-brand-blue transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Cargo / Permissão (RBAC)</label>
                            <select
                                value={newRole}
                                onChange={e => setNewRole(e.target.value as any)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/15 focus:border-brand-blue transition-all"
                            >
                                <option value="viewer">Visualizador (Cliente Final)</option>
                                <option value="scanner">Staff de Portaria (Leitor QR Code)</option>
                                <option value="editor">Cerimonial / Editor</option>
                                <option value="admin">Administrador (Controle Total)</option>
                            </select>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start gap-2 text-xs text-slate-500">
                            <Shield size={14} className="text-brand-blue shrink-0 mt-0.5" />
                            <span>{getRoleDetails(newRole).desc}</span>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-lg shadow-brand-blue/15 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? "Cadastrando..." : "Adicionar à Equipe"}
                        </button>
                    </form>
                </div>

                {/* Team Grid Column */}
                <div className="md:col-span-2 flex flex-col gap-4">
                    {loading ? (
                        <div className="p-12 text-center bg-white/70 border border-slate-100 rounded-3xl">
                            <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-slate-500 text-sm font-medium">Buscando listagem da equipe...</p>
                        </div>
                    ) : team.length === 0 ? (
                        <div className="p-12 text-center bg-white/70 border border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-3">
                            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center border border-slate-100">
                                <Users2 size={24} />
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-700 text-sm">Sua equipe está vazia</h5>
                                <p className="text-xs text-slate-500 max-w-xs mt-1">Insira emails de colaboradores no formulário lateral para dar acessos personalizados.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <AnimatePresence>
                                {team.map((member) => {
                                    const details = getRoleDetails(member.role);
                                    return (
                                        <motion.div
                                            key={member.id}
                                            layout
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                                        >
                                            <div className="flex items-start gap-3.5">
                                                <div className="w-10 h-10 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center font-bold text-slate-600 border border-slate-2 font-mono shrink-0">
                                                    {member.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="font-bold text-slate-800 text-sm tracking-tight leading-none">{member.name}</h4>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${details.color}`}>
                                                            {details.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1 max-w-sm truncate">{member.email}</p>
                                                    {member.phone && (
                                                        <p className="text-xs text-slate-400 font-mono mt-0.5">{member.phone}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                                <select
                                                    value={member.role}
                                                    onChange={e => handleUpdateRole(member.id, e.target.value as any)}
                                                    className="bg-white text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
                                                >
                                                    <option value="viewer">Visualizador</option>
                                                    <option value="scanner">Portaria Scanner</option>
                                                    <option value="editor">Editor</option>
                                                    <option value="admin">Administrador</option>
                                                </select>

                                                <button
                                                    onClick={() => handleCopyLink(member)}
                                                    type="button"
                                                    className="p-1.5 text-slate-400 hover:text-brand-blue rounded-lg transition-colors cursor-pointer"
                                                    title="Copiar Link de Acesso Customizado"
                                                >
                                                    {copiedId === member.id ? <Check size={14} className="text-emerald-500 animate-pulse" /> : <Link2 size={14} />}
                                                </button>

                                                <button
                                                    onClick={() => handleRemoveMember(member.id, member.name)}
                                                    type="button"
                                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                                    title="Remover da Equipe"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
