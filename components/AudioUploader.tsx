import React, { useRef, useState } from 'react';
import { Music, X, UploadCloud, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export const AudioUploader: React.FC<{
  audioUrl: string;
  onChange: (url: string) => void;
}> = ({ audioUrl, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bytesTransferred, setBytesTransferred] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  // States for confirmation modal (during upload)
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningType, setWarningType] = useState<'warn' | 'block'>('warn');

  const startUpload = (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setBytesTransferred(0);
    setTotalBytes(file.size);

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `events/audio_${Date.now()}_${file.name}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progressValue = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progressValue);
          setBytesTransferred(snapshot.bytesTransferred);
          setTotalBytes(snapshot.totalBytes);
        },
        (error) => {
          console.error("Firebase Storage upload error:", error);
          setIsProcessing(false);
          toast.error("Erro ao fazer upload da música. Por favor, tente um arquivo menor ou verifique as permissões de acesso do Storage.");
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(downloadURL);
          setIsProcessing(false);
          toast.success("Música de fundo enviada com sucesso!");
        }
      );

    } catch (error: any) {
      console.error(error);
      setIsProcessing(false);
      toast.error("Erro ao iniciar o envio do áudio. Verifique se o serviço do Firebase Storage está ativo.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const sizeInMB = file.size / (1024 * 1024);

    // Block files larger than 12MB (keeps guests' bandwidth safe)
    if (sizeInMB > 12) {
      setPendingFile(file);
      setWarningType('block');
      setShowWarningModal(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Warn for files between 4MB and 12MB
    if (sizeInMB > 4) {
      setPendingFile(file);
      setWarningType('warn');
      setShowWarningModal(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Direct upload for reasonable sizes (< 4MB)
    startUpload(file);
  };

  const confirmUpload = () => {
    if (pendingFile) {
      startUpload(pendingFile);
    }
    setShowWarningModal(false);
    setPendingFile(null);
  };

  const cancelUpload = () => {
    setShowWarningModal(false);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatMB = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  const sizeInMB = pendingFile ? (pendingFile.size / (1024 * 1024)).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {audioUrl ? (
        <div className="relative rounded-2xl overflow-hidden bg-white p-5 flex flex-col sm:flex-row items-center gap-4 border border-slate-100 shadow-sm">
          <div className="bg-brand-blue/10 p-3.5 rounded-full text-brand-blue shrink-0">
             <Music size={26} />
          </div>
          <div className="flex-1 w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800 truncate">Música de Fundo Selecionada</p>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Ativa</span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">{audioUrl}</p>
            <audio src={audioUrl} controls className="w-full h-10 mt-3 rounded-lg border border-slate-100" />
          </div>
          <button
            onClick={(e) => { e.preventDefault(); onChange(""); }}
            className="absolute top-3 right-3 bg-slate-100 hover:bg-red-50 hover:text-red-600 p-2 rounded-full text-slate-400 transition-colors cursor-pointer"
            title="Remover Música"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center text-slate-500 cursor-pointer hover:bg-slate-50 hover:border-brand-blue/30 transition-all ${isProcessing ? 'opacity-90 pointer-events-none' : ''}`}
        >
          {isProcessing ? (
            <div className="w-full max-w-xs flex flex-col items-center">
              <UploadCloud size={32} className="mb-3 text-brand-blue animate-bounce" />
              <span className="text-sm font-bold text-slate-800">Enviando música...</span>
              <span className="text-xs text-slate-400 mt-1">Carregando arquivo de áudio</span>
              
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4 border border-slate-200">
                <motion.div 
                  className="bg-brand-blue h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>

              {/* Progress stats */}
              <div className="flex justify-between w-full mt-2 text-[11px] font-semibold text-slate-500 font-mono">
                <span>{formatMB(bytesTransferred)} MB / {formatMB(totalBytes)} MB</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center max-w-sm">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue mb-3">
                <Music size={22} />
              </div>
              <span className="text-sm font-extrabold text-slate-800">Fazer Upload de Música (MP3)</span>
              <span className="text-xs text-slate-400 mt-1 max-w-[280px]">
                Selecione uma faixa sonora para tocar de fundo quando os convidados abrirem o convite.
              </span>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-bold font-mono">
                <Info size={12} className="text-blue-500" /> Max recomendado: 4MB
              </div>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/mp3,audio/mpeg,audio/*"
            className="hidden" 
          />
        </div>
      )}

      {/* Warning & Blocking Modal (Anti-overweight, Guest First experience) */}
      <AnimatePresence>
        {showWarningModal && (
          <div 
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={cancelUpload}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 p-6 sm:p-8 flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {warningType === 'block' ? (
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto">
                    <AlertTriangle size={28} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-serif text-xl font-bold text-slate-800">Arquivo Muito Grande ({sizeInMB}MB)</h3>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                      Para garantir uma excelente experiência, nós limitamos arquivos de música a um máximo de <strong>12MB</strong>.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2">
                    <p className="font-bold text-slate-800">Por que há esse limite?</p>
                    <p>
                      Músicas pesadas consomem os dados móveis de quem abre o convite no celular (4G/5G) e geram lentidão severa de carregamento.
                    </p>
                    <p className="font-semibold text-slate-800">Como resolver?</p>
                    <p>
                      Recomendamos enviar uma música de <strong>até 4MB</strong>. Você pode encurtar o áudio ou utilizar compressores de MP3 gratuitos na internet para reduzir o tamanho mantendo excelente qualidade.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={cancelUpload}
                    className="w-full py-3 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-sm cursor-pointer"
                  >
                    Entendido, vou reduzir
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mx-auto animate-pulse">
                    <AlertTriangle size={28} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-serif text-xl font-bold text-slate-800">Aviso: Arquivo Grande ({sizeInMB}MB)</h3>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                      Sua música de fundo está um pouco pesada. Isso causará impactos:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-600">
                      <p className="font-bold text-slate-800 flex items-center gap-1 mb-1">
                        ⏱️ Demora no Upload
                      </p>
                      O arquivo levará consideravelmente mais tempo para carregar no painel dependendo da sua velocidade de internet.
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-600">
                      <p className="font-bold text-slate-800 flex items-center gap-1 mb-1">
                        📶 Consumo de internet
                      </p>
                      Seus convidados no celular gastarão mais dados de internet e podem desistir de ouvir a música se a página demorar a abrir.
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100/50 text-xs text-slate-700 flex items-start gap-2.5">
                    <HelpCircle size={18} className="text-brand-blue shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Nossa Recomendação</p>
                      A durabilidade ideal de uma música de convite é de 1 a 2 minutos com compressão MP3 padrão, mantendo o arquivo entre 1.5MB e 4MB.
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={cancelUpload}
                      className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-sm cursor-pointer order-2 sm:order-1"
                    >
                      Escolher outra música
                    </button>
                    <button
                      type="button"
                      onClick={confirmUpload}
                      className="flex-1 py-3 px-4 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer order-1 sm:order-2 shadow-lg shadow-amber-500/10"
                    >
                      Continuar assim mesmo
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
