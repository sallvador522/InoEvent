import React, { useState, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { EventDetails } from '../../types';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import { toast } from 'react-hot-toast';

interface Table {
    id: string;
    name: string;
    capacity: number;
}

export const TableManager: React.FC<{ event: EventDetails; guests: any[] }> = ({ event, guests }) => {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [deletingTableId, setDeletingTableId] = useState<string | null>(null);
    const [movingGuestId, setMovingGuestId] = useState<string | null>(null);
    const [newTableName, setNewTableName] = useState('');
    const [newTableCapacity, setNewTableCapacity] = useState<number | string>(8);
    const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

    useEffect(() => {
        if (!event?.id) return;
        setIsFetching(true);
        const q = query(collection(db, `events/${event.id}/tables`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedTables: Table[] = [];
            snapshot.forEach((doc) => {
                loadedTables.push({ id: doc.id, ...doc.data() } as Table);
            });
            loadedTables.sort((a, b) => a.name.localeCompare(b.name));
            setTables(loadedTables);
            setIsFetching(false);
        }, () => setIsFetching(false));
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
        setTableToDelete(null);
        if (deletingTableId) return;
        setDeletingTableId(tableId);
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
        } finally {
            setDeletingTableId(null);
        }
    };

    
    const moveGuestToTable = async (guestId: string, tableId: string | null) => {
        if (movingGuestId) return;
        if (tableId) {
            const table = tables.find(t => t.id === tableId);
            const currentCount = guests.filter(g => (g as any).tableId === tableId).length;
            if (table && currentCount >= table.capacity) {
                toast.error(`A mesa ${table.name} já está cheia!`);
                return;
            }
        }
        setMovingGuestId(guestId);
        try {
            const guestRef = doc(db, `events/${event.id}/guests`, guestId);
            await updateDoc(guestRef, { tableId: tableId });
            toast.success('Convidado movido com sucesso.');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao mover convidado.');
        } finally {
            setMovingGuestId(null);
        }
    };

    const handleDrop = async (e: React.DragEvent, tableId: string | null) => {
        e.preventDefault();
        const guestId = e.dataTransfer.getData('guestId');
        if (!guestId) return;
        // Trava anti-corrida: drops rápidos valiam last-write-wins sem feedback.
        if (movingGuestId) {
            toast.error('Aguarde, a mover convidado…');
            return;
        }

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
            setMovingGuestId(`drop:${guestId}`);
            const guestRef = doc(db, `events/${event.id}/guests`, guestId);
            await updateDoc(guestRef, { tableId: tableId });
            toast.success('Convidado movido com sucesso.');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao mover convidado.');
        } finally {
            setMovingGuestId(null);
        }
    };

    const handleDragStart = (e: React.DragEvent, guestId: string) => {
        e.dataTransfer.setData('guestId', guestId);
    };

    // Listas derivadas memoizadas: antes cada render corria O(T×G) filters
    // (um filter por mesa sobre todos os convidados). O mapa mesa→convidados
    // é construído uma vez por mudança em `guests` — lookup O(1) por mesa.
    const attendingGuests = React.useMemo(
        () => guests.filter(g => g.status === 'CONFIRMED' || g.status === 'PENDING'),
        [guests]
    );
    const unassignedGuests = React.useMemo(
        () => attendingGuests.filter(g => !(g as any).tableId),
        [attendingGuests]
    );
    const guestsByTable = React.useMemo(() => {
        const m = new Map<string, any[]>();
        for (const g of attendingGuests) {
            const t = (g as any).tableId;
            if (!t) continue;
            const arr = m.get(t);
            if (arr) arr.push(g);
            else m.set(t, [g]);
        }
        return m;
    }, [attendingGuests]);

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
                                // Lista virtualizada (altura adaptativa: compacta com poucos
                                // convidados, com scroll próprio quando cresce). Os handlers de
                                // drop ficam no wrapper — os eventos borbulham do Virtuoso.
                                <Virtuoso
                                    style={{ height: Math.max(200, Math.min(480, unassignedGuests.length * 72)) }}
                                    totalCount={unassignedGuests.length}
                                    overscan={200}
                                    itemContent={(index) => {
                                        const guest = unassignedGuests[index];
                                        if (!guest) return null;
                                        return (
                                        <div className="pb-2 pr-1">
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
                                        <div className="relative flex items-center">
                                            <select 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                                                value=""
                                                disabled={movingGuestId !== null}
                                                onChange={(e) => moveGuestToTable(guest.id, e.target.value)}
                                            >
                                                <option value="" disabled>Atribuir mesa...</option>
                                                {tables.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                            <button className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm hover:bg-slate-50 transition-colors">
                                                <span className="material-symbols-outlined text-[14px]">swap_horiz</span> <span className="hidden sm:inline">Mover</span>
                                            </button>
                                        </div>
                                    </div>
                                        </div>
                                        );
                                    }}
                                />
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
                                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-md w-full sm:w-auto h-[46px] flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {loading ? (
                                  <>
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                                    A criar…
                                  </>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-[18px]">add</span> Adicionar
                                  </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Tables grid */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        {isFetching && (
                            [1, 2].map((i) => (
                                <div key={i} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm animate-pulse space-y-3" aria-hidden="true">
                                    <div className="h-5 w-1/2 bg-slate-200 rounded-lg" />
                                    <div className="h-24 bg-slate-100 rounded-xl" />
                                </div>
                            ))
                        )}
                        {!isFetching &&
                        tables.map(table => {
                            // Lookup O(1) no mapa memoizado (antes: filter O(G) por mesa).
                            // Os chips por mesa são poucos — ficam como estão (virtualizar
                            // listas minúsculas só adicionaria custo, sem benefício).
                            const tableGuests = guestsByTable.get(table.id) ?? [];
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
                                                onClick={() => setTableToDelete(table)}
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
                                                    <div className="relative flex items-center ml-auto mr-2">
                                                        <select 
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                                                            value={table.id}
                                                            disabled={movingGuestId !== null}
                                                            onChange={(e) => moveGuestToTable(guest.id, e.target.value || null)}
                                                        >
                                                            <option value="">Remover da mesa</option>
                                                            {tables.map(t => (
                                                                <option key={t.id} value={t.id}>{t.name}</option>
                                                            ))}
                                                        </select>
                                                        <button className="text-slate-400 hover:text-brand-blue transition-colors p-1 flex items-center justify-center rounded-md hover:bg-slate-50">
                                                            <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => moveGuestToTable(guest.id, null)}
                                                        disabled={movingGuestId !== null}
                                                        className="text-slate-300 hover:text-red-500 transition-colors p-1 flex items-center justify-center rounded-md hover:bg-red-50 disabled:opacity-40"
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
                        {tables.length === 0 && !isFetching && (
                            <div className="col-span-full py-12 px-6 text-center border-2 border-dashed border-slate-200 rounded-3xl min-w-0 overflow-hidden">
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">table_restaurant</span>
                                <p className="text-slate-500 font-medium">Nenhuma mesa criada ainda.</p>
                                <p className="text-slate-400 text-sm mt-1">Crie mesas para começar a organizar seus convidados.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Delete Confirmation Modal */}
            {tableToDelete && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 mx-auto">
                            <span className="material-symbols-outlined text-2xl">warning</span>
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Apagar Mesa?</h3>
                        <p className="text-center text-slate-500 mb-6 text-sm">
                            Tem certeza que deseja apagar a mesa "{tableToDelete.name}"? Os convidados não serão apagados, apenas removidos desta mesa.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setTableToDelete(null)}
                                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={() => handleDeleteTable(tableToDelete.id)}
                                disabled={deletingTableId !== null}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors text-sm shadow-md shadow-red-200 inline-flex items-center justify-center gap-2"
                            >
                                {deletingTableId !== null && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
                                {deletingTableId !== null ? 'A apagar…' : 'Apagar Mesa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
