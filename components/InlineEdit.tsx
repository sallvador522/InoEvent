import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface InlineTextProps {
  value: string;
  isEditing: boolean;
  onChange?: (value: string) => void;
  type?: 'text' | 'textarea' | 'time' | 'date';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

export const InlineText: React.FC<InlineTextProps> = ({
  value,
  isEditing,
  onChange,
  type = 'text',
  className = '',
  style = {},
  placeholder = 'Clique para editar'
}) => {
  const [isActive, setIsActive] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleCommit = () => {
    if (onChange && tempValue !== value) {
      onChange(tempValue);
    }
    setIsActive(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleCommit();
    }
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsActive(false);
    }
  };

  if (!isEditing) {
    return <span className={className} style={style}>{value}</span>;
  }

  if (isActive) {
    const commonClasses = `bg-white/90 border-2 border-brand-blue rounded px-2 py-1 text-slate-800 outline-none w-full max-w-full ${className.replace(/text-([a-z]+)-(\d+)/g, '')}`;
    
    if (type === 'textarea') {
      return (
        <textarea
          ref={inputRef}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          className={`${commonClasses} min-h-[100px] resize-y`}
          style={{ ...style, lineHeight: 'normal' }}
          placeholder={placeholder}
        />
      );
    }

    return (
      <input
        ref={inputRef}
        type={type === 'date' || type === 'time' ? 'text' : type}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        className={commonClasses}
        style={{ ...style, lineHeight: 'normal' }}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsActive(true);
      }}
      className={`relative cursor-text border border-dashed border-blue-400/50 hover:border-blue-600 hover:bg-blue-50/30 rounded transition-all pointer-events-auto ${className}`}
      style={{ ...style, display: style.display || 'inline-block', minWidth: '20px', minHeight: '20px' }}
      title="Clique para editar"
    >
      {value || <span className="opacity-50">{placeholder}</span>}
      <span className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow z-10 scale-75 opacity-80 hover:opacity-100 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
          <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.158 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
        </svg>
      </span>
    </span>
  );
};

interface InlineImageProps {
  src: string;
  isEditing: boolean;
  onChange?: (base64Url: string) => void;
  className?: string;
  style?: React.CSSProperties;
  aspectRatio?: string;
}

export const InlineImage: React.FC<InlineImageProps> = ({
  src,
  isEditing,
  onChange,
  className = '',
  style = {},
  aspectRatio
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

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
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsProcessing(true);
    try {
      const compressed = await compressImage(e.target.files[0]);
      if (onChange) onChange(compressed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isEditing) {
    if (!src) return null;
    return <img src={src} className={className} style={{...style, aspectRatio}} alt="" />;
  }

  return (
    <div className={`relative group z-0 ${className} border-2 border-dashed border-blue-400/50 hover:border-blue-500 rounded p-1 transition-all`} style={{...style, aspectRatio}}>
      <img src={src || 'https://via.placeholder.com/800'} className="w-full h-full object-cover rounded" alt="" />
      
      <span className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full p-2 shadow-lg z-30 pointer-events-none group-hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.158 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
        </svg>
      </span>

      <div 
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm z-20 rounded"
      >
        <span className="text-white font-bold bg-brand-blue px-4 py-2 rounded-full text-sm shadow-lg mb-2">
          {isProcessing ? 'Processando...' : 'Trocar Imagem'}
        </span>
        <span className="text-white/80 text-xs text-center px-4">Clique para fazer upload</span>
      </div>
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden" 
      />
    </div>
  );
};
