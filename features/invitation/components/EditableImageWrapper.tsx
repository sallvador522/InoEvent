import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

export const compressImage = (file: File, maxDim = 1200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = maxDim;
        const MAX_HEIGHT = maxDim;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const EditableImageWrapper: React.FC<{
  src: string;
  onChange: (newUrl: string) => void;
  isEditing?: boolean;
  className?: string;
  isHidden?: boolean;
  children: React.ReactNode;
}> = ({ src, onChange, isEditing, className = "", children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(src);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempUrl(src);
  }, [src]);

  if (!isEditing) {
    return <>{children}</>;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    try {
      const base64 = await compressImage(e.target.files[0]);
      onChange(base64);
      setTempUrl(base64);
      toast.success("Imagem alterada com sucesso!");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`relative group/image-wrap cursor-pointer ${className}`}>
      {children}

      <div className="absolute top-4 right-4 z-[95] pointer-events-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(true);
          }}
          className="bg-slate-900/95 hover:bg-[#BF9B30] text-white hover:text-slate-950 px-3.5 py-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
        >
          <span className="material-symbols-outlined text-[16px] text-[#BF9B30]">
            photo_camera
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest font-sans pr-0.5">
            Alterar Foto
          </span>
        </button>
      </div>

      <div
        className="absolute inset-0 bg-black/40 opacity-0 group-hover/image-wrap:opacity-100 transition-opacity flex items-center justify-center z-25 pointer-events-auto cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        <button
          type="button"
          className="bg-[#1A2026] hover:bg-[#BF9B30] text-[#BF9B30] hover:text-[#0F1419] text-[10px] md:text-xs font-bold py-2.5 px-5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 border border-[#BF9B30]/30 uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[16px]">
            photo_camera
          </span>
          <span>Alterar Foto</span>
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 bg-[#0F1419]/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
            <div
              className="bg-[#0F1419] border border-[#BF9B30]/30 rounded-3xl w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#BF9B30]/20 flex items-center justify-between bg-[#0F1419]/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#BF9B30] text-[18px]">
                    image
                  </span>
                  <span className="font-bold text-white text-xs uppercase tracking-widest">
                    Alterar Imagem
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#BF9B30]/20 text-gray-400 hover:text-[#BF9B30] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-3.5 bg-[#BF9B30] hover:bg-white disabled:opacity-50 text-[#0F1419] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_5px_15px_rgba(191,155,48,0.2)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isUploading ? "hourglass_empty" : "upload"}
                  </span>
                  <span>
                    {isUploading ? "Compactando..." : "Upload do Dispositivo"}
                  </span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="relative flex items-center justify-center mt-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#BF9B30]/20"></div>
                  </div>
                  <div className="relative bg-[#0F1419] px-4 text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                    Ou Cole o Link
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    className="flex-1 bg-[#1A2026] border border-[#BF9B30]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#BF9B30] font-mono transition-colors"
                    placeholder="https://..."
                  />
                  <button
                    onClick={() => {
                      onChange(tempUrl);
                      toast.success("Link da imagem atualizado!");
                      setIsOpen(false);
                    }}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#BF9B30]/20 text-[#BF9B30] flex items-center justify-center transition-all cursor-pointer border border-[#BF9B30]/30 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      check
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
