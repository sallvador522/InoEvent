import React, { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { IMAGE_ACCEPT, validateImageFile } from '../lib/imageValidation';

export const ImageUploader: React.FC<{
  images: Array<string | { id: string; url: string; likes: number }>;
  onChange: (images: Array<{ id: string; url: string; likes: number }>) => void;
  maxPhotos?: number;
}> = ({ images, onChange, maxPhotos = 5 }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Normalize existing images
  const normalizedImages = images.map(img => {
    if (typeof img === 'string') {
      return { id: Math.random().toString(36).substr(2, 9), url: img, likes: 0 };
    }
    return img;
  });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const files = Array.from<File>(e.target.files);
    
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.ok) {
        toast.error(validation.error);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }

    if (normalizedImages.length + files.length > maxPhotos) {
      toast.error(`Você pode adicionar no máximo ${maxPhotos} fotos.`);
      return;
    }

    setIsProcessing(true);
    try {
      const processedInfos = await Promise.all(
        files.map(async (file) => {
          const compressed = await compressImage(file);
          return {
            id: Math.random().toString(36).substr(2, 9),
            url: compressed,
            likes: 0
          };
        })
      );
      
      onChange([...normalizedImages, ...processedInfos]);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar imagem.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (id: string) => {
    onChange(normalizedImages.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-4">
      {normalizedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {normalizedImages.map((img) => (
            <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group">
              <img src={img.url} alt="Gallery item" className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.preventDefault(); removePhoto(img.id); }}
                className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {normalizedImages.length < maxPhotos && (
        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-50 hover:border-brand-blue/30 transition-all ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Camera size={24} className="mb-2 text-slate-400" />
          <span className="text-sm font-medium">{isProcessing ? 'Processando fotos...' : 'Adicionar Fotos'}</span>
          <span className="text-xs text-slate-400 mt-1">{normalizedImages.length} de {maxPhotos} fotos enviadas</span>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={IMAGE_ACCEPT}
            multiple
            className="hidden" 
          />
        </div>
      )}
    </div>
  );
};
