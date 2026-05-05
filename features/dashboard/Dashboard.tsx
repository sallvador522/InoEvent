import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, CheckCircle2, QrCode, Share2, FileDown, Clock, Search, MessageSquare } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';

export const Dashboard = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        
        const eventRef = doc(db, 'events', id);
        
        const unsubscribe = onSnapshot(eventRef, 
            (doc) => {
                if (doc.exists()) {
                    setEvent(doc.data());
                }
                setLoading(false);
            },
            (error) => {
                handleFirestoreError(error, OperationType.GET, `events/${id}`);
                setLoading(false);
            }
        );
        
        return unsubscribe;
    }, [id]);

    if(loading) return <div className="p-6">Carregando...</div>;
    if(!event) return <div className="p-6">Evento não encontrado</div>;

    // Mock stats based on event doc (would ideally be separate subcollections)
    const stats = {
        totalInvited: 120, //Placeholder
        confirmed: 85,    //Placeholder
        pending: 35       //Placeholder
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-serif text-gray-900">{event.title}</h1>
                <Button variant="outline" size="sm">Fechar RSVP</Button>
            </header>
            
            {/* 1. Resumo Visual */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <StatCard title="Total Convidados" value={stats.totalInvited} icon={Users} />
                <StatCard title="Confirmados" value={stats.confirmed} icon={CheckCircle2} />
                <StatCard title="Pendentes" value={stats.pending} icon={Clock} />
            </div>

            {/* 2. Ações Rápidas */}
            <div className="flex gap-4 mb-8">
                <Button onClick={() => alert('Scanner...')} className="flex-1 bg-[#C2B280] hover:bg-[#b0a070]">
                    <QrCode className="w-4 h-4 mr-2" /> Validar Entrada
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline"><Share2 className="w-4 h-4" /></Button>
                    <Button variant="outline"><FileDown className="w-4 h-4" /></Button>
                </div>
            </div>
            
            {/* 3. Lista Convidados */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-serif">Convidados</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Pesquisar..." className="pl-9 pr-4 py-2 border rounded-lg text-sm" />
                    </div>
                </div>
                <div className="space-y-4">
                    {/* Mock data for guests */}
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between items-center py-3 border-b last:border-b-0">
                            <div>
                                <p className="font-medium">Convidado {i}</p>
                                <p className="text-xs text-gray-400">{i === 1 ? 'Confirmação via Link' : 'Pendente'}</p>
                            </div>
                            <div className="flex gap-3 items-center">
                                <span className={`text-xs px-2 py-1 rounded-full ${i === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {i === 1 ? 'Confirmado' : 'Pendente'}
                                </span>
                                <button onClick={() => alert('Abrir WhatsApp para Convidado')} className="text-gray-400 hover:text-green-600 transition-colors">
                                    <MessageSquare className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon }: any) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <Icon className="w-6 h-6 text-[#C2B280] mb-2" />
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-xl font-mono mt-1">{value}</p>
    </div>
);
