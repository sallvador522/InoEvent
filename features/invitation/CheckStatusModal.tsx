import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventDetails } from '../../types';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

interface CheckStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventDetails;
}

export const CheckStatusModal: React.FC<CheckStatusModalProps> = ({ isOpen, onClose, event }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [tableName, setTableName] = useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setResult(null);
    setTableName(null);

    try {
      const normalizedPhone = phone.trim().replace(/[\s\-()]/g, "");
      const res = await fetch(`/api/events/${event.id}/rsvp-status?phone=${encodeURIComponent(normalizedPhone)}`);
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Nenhuma confirmação encontrada para este número.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const guestData = data.guest;
      setResult(guestData);

      if (guestData.tableName) {
        setTableName(guestData.tableName);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao verificar status.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg-status");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR_Code_${result?.name || "Convite"}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {!result ? (
              <form onSubmit={handleCheck} className="space-y-6">
                <div className="text-center">
                  <span className="material-symbols-outlined text-4xl text-[#BF9B30] mb-2">qr_code_scanner</span>
                  <h3 className="text-2xl font-serif text-slate-800 font-bold mb-2">Meu Convite</h3>
                  <p className="text-sm text-slate-500">
                    Insira o número de telemóvel usado na confirmação (RSVP) para ver o seu QR Code e Mesa assinalada.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Nº de Telemóvel
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 923000000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF9B30]/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#BF9B30] hover:bg-[#a68629] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    "Consultar Status"
                  )}
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center space-y-6 py-4">
                <div className="text-center">
                  <h3 className="text-2xl font-serif text-slate-800 font-bold mb-1">Olá, {result.name}</h3>
                  <p className="text-sm text-slate-500">
                    A sua presença está {result.status === 'confirmed' ? 'Confirmada' : 'Pendente'}.
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <QRCodeSVG
                    id="qr-code-svg-status"
                    value={`guest=${result.id}`}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-1">
                  <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">A sua Mesa</span>
                  {tableName ? (
                    <span className="text-xl font-serif text-[#BF9B30] font-bold">{tableName}</span>
                  ) : (
                    <span className="text-sm text-slate-500 font-medium">A definir pela organização</span>
                  )}
                </div>

                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setResult(null)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-colors border border-slate-200"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleDownloadQR}
                    className="flex-1 py-3 bg-[#BF9B30] hover:bg-[#a68629] text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">download</span> Salvar QR
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
