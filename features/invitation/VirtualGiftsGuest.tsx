import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '../../lib/clipboard';
import { canonicalIban, formatIbanGroups } from '../../lib/iban';

interface GiftItem {
  id: string;
  title: string;
  price: number;
  emoji: string;
  description?: string;
  value?: string;
  bankName?: string;
  accountName?: string;
}

export const VirtualGiftsGuest: React.FC<{ event: any; guestId?: string | null }> = ({ event }) => {
   const gifts: GiftItem[] = event.gifts || [];
   const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
            
   if (!gifts || gifts.length === 0) return null;

   const handleCopy = (text: string) => {
       copyToClipboard(text);
       toast.success('Copiado!');
   };

   const handleBuyGift = () => {
       toast.success('Por favor, contacte os organizadores do evento para oferecer este presente.');
       setSelectedGift(null);
   };

   return (
        <div className="w-full">
            <div className="text-center mb-8">
                <span className="text-brand-blue font-bold tracking-widest text-xs uppercase mb-3 block">Contribuições e Presentes</span>
                <h2 className="text-2xl md:text-3xl font-display text-slate-900 mb-4">Lista de Casamento Virtual</h2>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                    Contribua para o nosso evento de forma rápida e segura. Escolha um presente simbólico na nossa lista.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gifts.map((gift, idx) => (
                    <div 
                        key={`${gift.id || 'gift'}-${idx}`} 
                        onClick={() => setSelectedGift(gift)}
                        className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 hover:border-brand-blue/30 group text-center flex flex-col items-center"
                    >
                        <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">{gift.emoji || "🎁"}</div>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight mb-2 line-clamp-2">{gift.title}</h3>
                        {gift.description ? (
                          <p className="text-xs text-slate-500 italic leading-snug mb-2 line-clamp-2">“{gift.description}”</p>
                        ) : null}
                        <div className="text-brand-blue font-black text-sm bg-blue-50 py-1.5 px-3 rounded-lg mt-auto">{Number(gift.price || 0).toLocaleString('pt-AO')} Kz</div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {selectedGift && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedGift(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                               <div>
                                  <span className="text-brand-blue font-bold tracking-widest text-[10px] uppercase mb-1 block">Presente Selecionado</span>
                                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">{selectedGift.emoji || "🎁"} {selectedGift.title}</h3>
                               </div>
                               <button onClick={() => setSelectedGift(null)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full">
                                 <X size={20} />
                               </button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-center font-bold text-lg border border-blue-100">
                                    {Number(selectedGift.price || 0).toLocaleString('pt-AO')} Kz
                                </div>
                                {selectedGift.description ? (
                                  <p className="text-sm text-slate-600 italic leading-relaxed text-center">
                                    “{selectedGift.description}”
                                  </p>
                                ) : null}
                                {selectedGift.value ? (
                                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 text-center">
                                      {(selectedGift as any).bankName || 'Transferência'} {(selectedGift as any).accountName ? `· ${(selectedGift as any).accountName}` : ''}
                                    </p>
                                    <p className="font-mono text-sm font-bold text-slate-800 text-center break-all select-all">
                                      {formatIbanGroups(selectedGift.value)}
                                    </p>
                                    <button
                                      onClick={() => handleCopy(canonicalIban(selectedGift.value) || selectedGift.value || '')}
                                      className="mx-auto mt-2 flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-blue-700 cursor-pointer"
                                    >
                                      <Copy size={14} /> Copiar IBAN
                                    </button>
                                  </div>
                                ) : null}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-2">
                                  <p className="text-sm text-slate-600 font-medium leading-relaxed text-center">
                                    ℹ️ Para oferecer este presente, por favor, entre em contacto direto com os organizadores do evento.
                                  </p>
                                </div>
                                <button
                                    onClick={handleBuyGift}
                                    className="w-full bg-brand-blue text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-md mt-2 flex justify-center items-center"
                                >
                                   Confirmar Presente
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
   );
};
