import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Gift, Edit2, CheckCircle2 } from 'lucide-react';
import { doc, updateDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import { toast } from 'react-hot-toast';

interface GiftItem {
  id: string;
  title: string;
  price: number;
  emoji: string;
}

export const VirtualGiftsManager: React.FC<{ event: any }> = ({ event }) => {
   const [gifts, setGifts] = useState<GiftItem[]>(event.gifts || []);
   const [isEditing, setIsEditing] = useState(false);
   const [newGift, setNewGift] = useState({ title: '', price: '', emoji: '🎁' });
   const [contributions, setContributions] = useState<any[]>([]);

   useEffect(() => {
       if (event.gifts) {
           setGifts(event.gifts);
       }
   }, [event.gifts]);

   useEffect(() => {
       const fetchContributions = async () => {
           try {
               const contRef = collection(db, 'events', event.id, 'contributions');
               const q = query(contRef, orderBy('date', 'desc'));
               const snapshot = await getDocs(q);
               setContributions(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
           } catch(e) {
               console.warn("Could not fetch contributions", e);
           }
       };
       fetchContributions();
   }, [event.id]);

   const handleAddGift = async () => {
       if (!newGift.title || !newGift.price) {
           toast.error('Preencha os campos de nome e valor.');
           return;
       }

       const updatedGifts = [...gifts, { 
           id: Math.random().toString(36).substr(2, 9), 
           title: newGift.title, 
           price: Number(newGift.price), 
           emoji: newGift.emoji 
       }];
       
       try {
           await updateDoc(doc(db, 'events', event.id), { gifts: updatedGifts });
           setGifts(updatedGifts);
           setNewGift({ title: '', price: '', emoji: '🎁' });
           toast.success('Lista de Presentes atualizada!');
           setIsEditing(false);
       } catch(e) {
           toast.error('Erro ao salvar presente.');
       }
   };

   const handleDeleteGift = async (id: string) => {
       const updatedGifts = gifts.filter(g => g.id !== id);
       try {
           await updateDoc(doc(db, 'events', event.id), { gifts: updatedGifts });
           setGifts(updatedGifts);
           toast.success('Item removido com sucesso!');
       } catch(e) {
           toast.error('Erro ao remover presente.');
       }
   };

   return (
       <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <h3 className="text-xl font-bold flex items-center gap-2">
                     <Gift size={24} className="text-brand-blue" />
                     Lista de Presentes (Contribuições Virtuais)
                 </h3>
                 <p className="text-slate-500 text-sm mt-1">
                     Permita que os convidados contribuam financeiramente para experiências e presentes via Multicaixa Express (PlinqPay).
                 </p>
              </div>
              <button 
                 onClick={() => setIsEditing(!isEditing)}
                 className="bg-brand-blue text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-brand-blue/90 flex items-center justify-center gap-2"
              >
                 <Plus size={16} /> Adicionar Item
              </button>
           </div>

           <AnimatePresence>
               {isEditing && (
                   <motion.div 
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       exit={{ opacity: 0, height: 0 }}
                       className="overflow-hidden"
                   >
                       <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 grid gap-4 grid-cols-1 sm:grid-cols-12 mt-4">
                           <div className="sm:col-span-2">
                               <label className="text-xs font-bold text-slate-500 mb-1 block">Emoji (Ícone)</label>
                               <input 
                                   className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-blue/50 focus:ring-2 focus:ring-brand-blue/20 text-2xl text-center" 
                                   value={newGift.emoji} onChange={e => setNewGift({...newGift, emoji: e.target.value})} maxLength={2}
                               />
                           </div>
                           <div className="sm:col-span-6">
                               <label className="text-xs font-bold text-slate-500 mb-1 block">Nome da Contribuição (ex: Lua de Mel)</label>
                               <input 
                                   className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-blue/50 focus:ring-2 focus:ring-brand-blue/20" 
                                   placeholder="Nome do presente..."
                                   value={newGift.title} onChange={e => setNewGift({...newGift, title: e.target.value})} 
                               />
                           </div>
                           <div className="sm:col-span-4">
                               <label className="text-xs font-bold text-slate-500 mb-1 block">Valor (Kwanzas)</label>
                               <input 
                                   type="number"
                                   className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-blue/50 focus:ring-2 focus:ring-brand-blue/20" 
                                   placeholder="Ex: 50000"
                                   value={newGift.price} onChange={e => setNewGift({...newGift, price: e.target.value})} 
                               />
                           </div>
                           <div className="sm:col-span-12 flex justify-end gap-2 mt-2">
                               <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-xl font-bold bg-slate-200 text-slate-600 hover:bg-slate-300">Cancelar</button>
                               <button onClick={handleAddGift} className="px-5 py-2.5 rounded-xl font-bold bg-brand-blue text-white hover:bg-blue-700">Salvar Item</button>
                           </div>
                       </div>
                   </motion.div>
               )}
           </AnimatePresence>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
               {gifts.length === 0 && !isEditing && (
                   <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 border border-slate-100 rounded-3xl border-dashed">
                      <Gift size={32} className="mx-auto mb-3 opacity-20" />
                      <p>Nenhuma contribuição adicionada ainda.</p>
                      <button onClick={() => setIsEditing(true)} className="text-brand-blue font-bold mt-2 hover:underline">Criar a primeira</button>
                   </div>
               )}
               {gifts.map(gift => (
                   <div key={gift.id} className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-white shadow-sm hover:shadow-md transition-shadow relative group">
                       <button onClick={() => handleDeleteGift(gift.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Trash2 size={16} />
                       </button>
                       <div className="text-4xl mb-4 text-center mt-2">{gift.emoji}</div>
                       <div className="text-center">
                           <h4 className="font-bold text-slate-800 line-clamp-2">{gift.title}</h4>
                           <div className="text-brand-blue font-black mt-2 bg-blue-50 py-1.5 px-3 rounded-lg inline-block">{Number(gift.price || 0).toLocaleString('pt-AO')} Kz</div>
                       </div>
                   </div>
               ))}
           </div>

           {contributions.length > 0 && (
               <div className="mt-8 border-t border-slate-100 pt-8">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                       <CheckCircle2 size={18} className="text-emerald-500" />
                       Contribuições Recebidas ({contributions.length})
                   </h3>
                   <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                       <table className="w-full text-left text-sm">
                           <thead className="bg-slate-100/50 text-slate-500">
                               <tr>
                                   <th className="p-4 font-medium">Nome (Convidado)</th>
                                   <th className="p-4 font-medium">Telefone</th>
                                   <th className="p-4 font-medium">Presente Mimo</th>
                                   <th className="p-4 font-medium text-right">Valor</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                               {contributions.map(cont => (
                                   <tr key={cont.id} className="hover:bg-white transition-colors">
                                       <td className="p-4 font-bold text-slate-800">{cont.guestName}</td>
                                       <td className="p-4 text-slate-500 font-mono text-xs">{cont.guestPhone}</td>
                                       <td className="p-4 text-slate-600 truncate max-w-[200px]">{cont.giftTitle}</td>
                                       <td className="p-4 text-right font-bold text-brand-blue">{Number(cont.amount || 0).toLocaleString('pt-AO')} Kz</td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               </div>
           )}
       </div>
   );
};
