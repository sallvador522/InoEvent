import React, { useRef, useState } from 'react';
import { Music, X, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
// We just use getStorage() which uses the default app initialized in FirebaseProvider

export const AudioUploader: React.FC<{
  audioUrl: string;
  onChange: (url: string) => void;
}> = ({ audioUrl, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    setIsProcessing(true);
    setProgress(0);

    try {
      // Usar a instância global do firebase app via import dinâmico ou assumir que está inicializado
      const storage = getStorage();
      const storageRef = ref(storage, `events/audio_${Date.now()}_${file.name}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progressValue = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progressValue);
        },
        (error) => {
          console.error(error);
          setIsProcessing(false);
          toast.error("Erro ao fazer upload. Verifique as regras (Rules) do seu Firebase Storage.");
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(downloadURL);
          setIsProcessing(false);
          toast.success("Música adicionada com sucesso!");
        }
      );

    } catch (error) {
      console.error(error);
      toast.error("Erro ao configurar upload de áudio.");
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {audioUrl ? (
        <div className="relative rounded-xl overflow-hidden bg-slate-100 group p-4 flex items-center gap-4 border border-slate-200">
          <div className="bg-brand-blue/10 p-3 rounded-full text-brand-blue">
             <Music size={24} />
          </div>
           <div className="flex-1 overflow-hidden">
             <p className="text-sm font-bold text-slate-800 truncate">Música do Convite</p>
             <audio src={audioUrl} controls className="w-full h-8 mt-2" />
           </div>
          <button
            onClick={(e) => { e.preventDefault(); onChange(""); }}
            className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-50 hover:border-brand-blue/30 transition-all ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {isProcessing ? (
             <div className="flex flex-col items-center">
                <UploadCloud size={24} className="mb-2 text-brand-blue animate-bounce" />
                <span className="text-sm font-medium">Fazendo upload... {Math.round(progress)}%</span>
             </div>
          ) : (
             <div className="flex flex-col items-center">
                <Music size={24} className="mb-2 text-slate-400" />
                <span className="text-sm font-medium">Fazer Upload de Música (MP3)</span>
                <span className="text-xs text-slate-400 mt-1">Sua música tocará no convite</span>
             </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            className="hidden" 
          />
        </div>
      )}
    </div>
  );
};
