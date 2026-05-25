import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, CheckCircle2, Copy } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import { toast } from 'react-hot-toast';

interface GiftItem {
  id: string;
  title: string;
  price: number;
  emoji: string;
}

export const VirtualGiftsGuest: React.FC<{ event: any, guestId?: string | null }> = ({ event, guestId }) => {
   const gifts: GiftItem[] = event.gifts || [];
   const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
   const [clientData, setClientData] = useState({ name: '', phone: '' });
   const [loading, setLoading] = useState(false);
   const [paymentData, setPaymentData] = useState<any>(null);
   const [polling, setPolling] = useState(false);

   if (!gifts || gifts.length === 0) return null;

   const handleCopy = (text: string) => {
       navigator.clipboard.writeText(text);
       toast.success('Copiado!');
   };

   // Webhook Poller
   const startPolling = (externalId: string, onDone: (data: any) => void) => {
      let attempts = 0;
      setPolling(true);
      const interval = setInterval(async () => {
         attempts++;
         try {
            const res = await fetch(`/api/payments/status?externalId=${externalId}`);
            if (res.ok) {
               const data = await res.json();
               if (data.status === 'SUCCESS') {
                  clearInterval(interval);
                  onDone(data.data);
               } else if (data.status === 'FAILED' || attempts > 60) {
                  clearInterval(interval);
                  toast.error("Pagamento não concluído ou falhou.");
                  setPolling(false);
               }
            }
         } catch(e) { /* ignore network errors */ }
      }, 5000);
   };

   const handleBuyGift = async () => {
       if (!clientData.name || !clientData.phone) {
           toast.error("Por favor, preencha o seu nome e telefone (WhatsApp).");
           return;
       }

       setLoading(true);
       try {
           const externalId = `gift_${event.id}_${Math.random().toString(36).substr(2, 9)}`;
           
           const payload = {
               amount: selectedGift!.price,
               externalId: externalId,
               client: {
                   name: clientData.name,
                   email: 'convidado@inoevents.com',
                   phone: clientData.phone
               },
               items: [{
                   title: `Presente: ${selectedGift!.title}`,
                   price: selectedGift!.price,
                   quantity: 1
               }]
           };

           const response = await fetch('/api/payments/create', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(payload)
           });
           
           const data = await response.json();
           if (!response.ok) {
               throw new Error(data.error || 'Erro ao gerar pagamento');
           }

           if (data.data && data.data.entity && data.data.reference) {
               // Armazenar a referência a exibir para o usuário pagar
               setPaymentData({
                   entity: data.data.entity,
                   reference: data.data.reference,
                   amount: selectedGift!.price,
                   externalId
               });
               
               // Começa a verificação do webhook em tempo real
               startPolling(externalId, async (webhookData) => {
                   setPolling(false);
                   setPaymentData(prev => prev ? { ...prev, paid: true } : null);
                   
                   // Guardar a contribuição no DB sob o evento
                   try {
                       await setDoc(doc(db, 'events', event.id, 'contributions', externalId), {
                           giftId: selectedGift!.id,
                           giftTitle: selectedGift!.title,
                           amount: selectedGift!.price,
                           guestName: clientData.name,
                           guestPhone: clientData.phone,
                           date: new Date().toISOString()
                       });
                   } catch(e) {
                       console.warn("Could not save contribution to DB", e);
                   }
               });
           }
       } catch (err: any) {
           toast.error(err.message || 'Erro ao gerar referência.');
       } finally {
           setLoading(false);
       }
   };

   return (
       <div className="w-full">
           <div className="text-center mb-8">
               <span className="text-brand-blue font-bold tracking-widest text-xs uppercase mb-3 block">Contribuições e Presentes</span>
               <h2 className="text-2xl md:text-3xl font-display text-slate-900 mb-4">Lista de Casamento Virtual</h2>
               <p className="text-slate-500 text-sm max-w-sm mx-auto">
                   Contribua para o nosso evento de forma rápida e segura através do Multicaixa Express.
               </p>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {gifts.map((gift, idx) => (
                   <div 
                       key={`${gift.id || 'gift'}-${idx}`} 
                       onClick={() => setSelectedGift(gift)}
                       className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 hover:border-brand-blue/30 group text-center flex flex-col items-center"
                   >
                       <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">{gift.emoji}</div>
                       <h3 className="font-bold text-slate-800 text-sm leading-tight mb-2 line-clamp-2">{gift.title}</h3>
                       <div className="text-brand-blue font-black text-sm bg-blue-50 py-1.5 px-3 rounded-lg mt-auto">{Number(gift.price || 0).toLocaleString('pt-AO')} Kz</div>
                   </div>
               ))}
           </div>

           <AnimatePresence>
               {selectedGift && (
                   <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                       <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl flex flex-col">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <span className="text-brand-blue font-bold tracking-widest text-[10px] uppercase mb-1 block">Presente Selecionado</span>
                                 <h3 className="text-xl font-bold text-slate-800 tracking-tight">{selectedGift.emoji} {selectedGift.title}</h3>
                              </div>
                              <button onClick={() => { setSelectedGift(null); setPaymentData(null); setPolling(false); }} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full">
                                <X size={20} />
                              </button>
                           </div>

                           {!paymentData ? (
                               <div className="space-y-4">
                                   <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-center font-bold text-lg border border-blue-100">
                                       {Number(selectedGift.price || 0).toLocaleString('pt-AO')} Kz
                                   </div>
                                   <div>
                                       <label className="text-xs font-bold text-slate-500 mb-1 block">O seu Nome Completo</label>
                                       <input 
                                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-blue/50"
                                           placeholder="Ex: João Silva"
                                           value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})}
                                       />
                                   </div>
                                   <div>
                                       <label className="text-xs font-bold text-slate-500 mb-1 block">Telefone (WhatsApp)</label>
                                       <input 
                                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-blue/50"
                                           placeholder="Ex: +244 923 000 000"
                                           value={clientData.phone} onChange={e => setClientData({...clientData, phone: e.target.value})}
                                       />
                                   </div>
                                   <button 
                                      onClick={handleBuyGift} 
                                      disabled={loading}
                                      className="w-full bg-brand-blue text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-md mt-2 flex justify-center items-center"
                                   >
                                      {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Gerar Referência Multicaixa'}
                                   </button>
                               </div>
                           ) : (
                               <div className="space-y-4">
                                   <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-2">
                                     <p className="text-sm text-blue-800 font-medium leading-relaxed">
                                       ℹ️ Este pagamento pode ser feito através do <strong>Multicaixa Express</strong> ou num <strong>Caixa Automático (ATM)</strong>.
                                     </p>
                                   </div>

                                   <div className="space-y-3">
                                     <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center group">
                                        <div>
                                           <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Entidade</p>
                                           <p className="text-xl font-mono font-bold text-slate-900">{paymentData.entity}</p>
                                        </div>
                                        <button onClick={() => handleCopy(paymentData.entity)} className="p-3 bg-white text-slate-400 border border-slate-200 rounded-xl"><Copy size={18} /></button>
                                     </div>
                                     <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center group">
                                        <div>
                                           <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Referência</p>
                                           <p className="text-xl font-mono font-bold text-slate-900">{paymentData.reference.match(/.{1,3}/g)?.join(' ') || paymentData.reference}</p>
                                        </div>
                                        <button onClick={() => handleCopy(paymentData.reference)} className="p-3 bg-white text-slate-400 border border-slate-200 rounded-xl"><Copy size={18} /></button>
                                     </div>
                                   </div>

                                   {!paymentData.paid ? (
                                       <div className="mt-6 flex flex-col items-center animate-pulse">
                                           <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mb-3"></div>
                                           <p className="text-sm font-bold text-brand-blue">A aguardar pagamento...</p>
                                       </div>
                                   ) : (
                                       <div className="mt-6 flex flex-col items-center">
                                           <CheckCircle2 size={48} className="text-emerald-500 mb-2" />
                                           <p className="text-lg font-bold text-emerald-600">Contribuição Recebida!</p>
                                           <p className="text-xs text-slate-500 mt-1">Muito obrigado pela contribuição.</p>
                                       </div>
                                   )}
                               </div>
                           )}
                       </motion.div>
                   </div>
               )}
           </AnimatePresence>
       </div>
   );
};
