import React, { useState, useEffect } from 'react';
import { EventDetails, Guest } from '../../types';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import { toast } from 'react-hot-toast';

interface Table {
    id: string;
    name: string;
    capacity: number;
}

export const TableManager: React.FC<{ event: EventDetails; guests: Guest[] }> = ({ event, guests }) => {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(false);
    const [newTableName, setNewTableName] = useState('');
    const [newTableCapacity, setNewTableCapacity] = useState<number | string>(8);

    useEffect(() => {
        if (!event?.id) return;
        const q = query(collection(db, `events/${event.id}/tables`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedTables: Table[] = [];
            snapshot.forEach((doc) => {
                loadedTables.push({ id: doc.id, ...doc.data() } as Table);
            });
            loadedTables.sort((a, b) => a.name.localeCompare(b.name));
            setTables(loadedTables);
        });
        return () => unsubscribe();
    }, [event?.id]);

    const handleCreateTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTableName.trim()) return;
        
        setLoading(true);
        try {
            const tableRef = doc(collection(db, `events/${event.id}/tables`));
            await setDoc(tableRef, {
                name: newTableName,
                capacity: Number(newTableCapacity) || 8,
                createdAt: new Date().toISOString()
            });
            setNewTableName('');
            toast.success('Mesa criada com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar mesa.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTable = async (tableId: string) => {
        if (!window.confirm('Tem certeza que deseja apagar esta mesa? Os convidados não serão apagados.')) return;
        
        try {
            const guestsInTable = guests.filter(g => (g as any).tableId === tableId);
            for (const g of guestsInTable) {
                const guestRef = doc(db, `events/${event.id}/guests`, g.id);
                await updateDoc(guestRef, { tableId: null });
            }
            const tableRef = doc(db, `events/${event.id}/tables`, tableId);
            await deleteDoc(tableRef);
            toast.success('Mesa apagada.');
        } catch(error) {
            console.error(error);
            toast.error('Erro ao apagar mesa.');
        }
    };

    const handleDrop = async (e: React.DragEvent, tableId: string | null) => {
        e.preventDefault();
        const guestId = e.dataTransfer.getData('guestId');
        if (!guestId) return;

        // Optionally check table capacity
        if (tableId) {
            const table = tables.find(t => t.id === tableId);
            const currentCount = guests.filter(g => (g as any).tableId === tableId).length;
            if (table && currentCount >= table.capacity) {
                toast.error(`A mesa ${table.name} já está cheia!`);
                return;
            }
        }

        try {
            const guestRef = doc(db, `events/${event.id}/guests`, guestId);
            await updateDoc(guestRef, { tableId: tableId });
            toast.success('Convidado movido com sucesso.');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao mover convidado.');
        }
    };

    const handleDragStart = (e: React.DragEvent, guestId: string) => {
        e.dataTransfer.setData('guestId', guestId);
    };

    // Filter only confirmed or pending guests who will actually attend
    const attendingGuests = guests.filter(g => g.status === 'CONFIRMED' || g.status === 'PENDING');
    const unassignedGuests = attendingGuests.filter(g => !(g as any).tableId);

    return (
        <div className="w-full min-w-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-2xl font-serif text-slate-800 mb-1">Mapa das Mesas</h3>
                    <p className="text-slate-500 text-sm">Organize seus convidados arrastando-os para as mesas.</p>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6 w-full min-w-0">
                {/* Left Column: Unassigned Guests */}
                <div className="w-full xl:w-1/3 flex flex-col gap-4 shrink-0 min-w-0">
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col min-h-[400px] max-h-[600px] overflow-hidden">
                        <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center justify-between">
                            Convidados sem Mesa
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{unassignedGuests.length}</span>
                        </h4>
                        <div 
                            className="flex-1 overflow-y-auto space-y-2 pr-2"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, null)}
                        >
                            {unassignedGuests.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm text-center">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">done_all</span>
                                    Todos os convidados têm mesa!
                                </div>
                            ) : (
                                unassignedGuests.map(guest => (
                                    <div 
                                        key={guest.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, guest.id)}
                                        className="bg-slate-50 border border-slate-200 p-3 rounded-xl cursor-grab active:cursor-grabbing hover:border-brand-blue/30 hover:bg-blue-50/50 transition-colors flex items-center gap-3"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold uppercase shrink-0">
                                            {guest.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate w-full">{guest.name}</p>
                                            <p className="text-xs text-slate-400">{guest.phone || 'Sem contato'}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-300 text-sm">drag_indicator</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Tables */}
                <div className="w-full xl:w-2/3 flex flex-col gap-6 min-w-0">
                    {/* Create new table form */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                        <form onSubmit={handleCreateTable} className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
                            <div className="flex-1 w-full">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nome da Mesa</label>
                                <input 
                                    type="text" 
                                    value={newTableName}
                                    onChange={(e) => setNewTableName(e.target.value)}
                                    placeholder="Ex: Mesa dos Noivos, Mesa 1" 
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:border-brand-blue font-medium" 
                                    required
                                />
                            </div>
                            <div className="w-full sm:w-32">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Lugares</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={newTableCapacity}
                                    onChange={(e) => setNewTableCapacity(e.target.value ? parseInt(e.target.value) : '')}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:border-brand-blue font-medium" 
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-md w-full sm:w-auto h-[46px] flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span> Adicionar
                            </button>
                        </form>
                    </div>

                    {/* Tables grid */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        {tables.map(table => {
                            const tableGuests = attendingGuests.filter(g => (g as any).tableId === table.id);
                            const isFull = tableGuests.length >= table.capacity;
                            
                            return (
                                <div 
                                    key={table.id}
                                    className={`bg-white border ${isFull ? 'border-amber-200 shadow-amber-100/50' : 'border-slate-100'} rounded-3xl p-5 shadow-sm transition-all`}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, table.id)}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h5 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                            <span className="material-symbols-outlined text-slate-400">table_restaurant</span>
                                            {table.name}
                                        </h5>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${isFull ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {tableGuests.length} / {table.capacity}
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteTable(table.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 min-h-[100px] bg-slate-50/50 rounded-xl p-2 border border-slate-100 border-dashed">
                                        {tableGuests.length === 0 ? (
                                            <div className="h-full min-h-[100px] flex items-center justify-center text-slate-400 text-xs">
                                                Arraste convidados para aqui
                                            </div>
                                        ) : (
                                            tableGuests.map(guest => (
                                                <div 
                                                    key={guest.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, guest.id)}
                                                    className="bg-white border border-slate-100 p-2 rounded-lg cursor-grab active:cursor-grabbing hover:border-brand-blue/30 transition-colors flex items-center gap-2 shadow-sm"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue text-[10px] font-bold uppercase shrink-0">
                                                        {guest.name.charAt(0)}
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-700 truncate flex-1">{guest.name}</p>
                                                    <button 
                                                        onClick={() => {
                                                            const guestRef = doc(db, `events/${event.id}/guests`, guest.id);
                                                            updateDoc(guestRef, { tableId: null }).catch(console.error);
                                                        }}
                                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {tables.length === 0 && (
                            <div className="col-span-full py-12 px-6 text-center border-2 border-dashed border-slate-200 rounded-3xl min-w-0 overflow-hidden">
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">table_restaurant</span>
                                <p className="text-slate-500 font-medium">Nenhuma mesa criada ainda.</p>
                                <p className="text-slate-400 text-sm mt-1">Crie mesas para começar a organizar seus convidados.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
