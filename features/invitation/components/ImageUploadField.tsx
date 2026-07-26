import React, { useState, useRef } from "react";
import toast from "react-hot-toast";

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
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

export const ImageUploadField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (base64: string) => void;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    try {
      const base64 = await compressImage(e.target.files[0]);
      onChange(base64);
      toast.success("Imagem processada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2 bg-slate-800 p-4 rounded-xl border border-slate-700/60 shadow-inner">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            className="w-14 h-14 object-cover rounded-lg border border-slate-700"
            alt=""
          />
        ) : (
          <div className="w-14 h-14 bg-slate-900 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-[10px] text-center px-1 font-mono">
            Sem Foto
          </div>
        )}
        <div className="flex-1 space-y-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {isUploading ? "Compactando..." : "Fazer Upload"}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
