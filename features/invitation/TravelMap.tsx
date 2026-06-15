import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Map, ExternalLink, Copy, Check, Search } from 'lucide-react';
import { InlineText } from '../../components/InlineEdit';

const getValidMapUrl = (link?: string, fallbackQuery?: string) => {
  if (!link || typeof link !== 'string') {
     return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery || 'Local do Evento')}`;
  }
  const cleanLink = link.trim();
  if (cleanLink === '#' || cleanLink === '' || cleanLink.startsWith('/')) {
     return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery || 'Local do Evento')}`;
  }
  if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
     return cleanLink;
  }
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(cleanLink)) {
     return `https://${cleanLink}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery || cleanLink)}`;
};

export const TravelMap: React.FC<{ 
    event: any;
    isEditing?: boolean;
    onFieldChange?: (field: string, value: any) => void;
}> = ({ event, isEditing = false, onFieldChange }) => {
    const address = event.address || event.locationName || 'Luanda, Angola';
    const [copied, setCopied] = useState(false);
    const mapLink = getValidMapUrl(event.mapLink, address);

    const handleCopy = () => {
        navigator.clipboard.writeText(mapLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full my-8 bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] shadow-xl text-center flex flex-col items-center justify-center relative overflow-hidden">
             
             {/* Decorative Background Map Pattern */}
             <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cartographer.png")' }}></div>

             <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mb-4 relative z-10 shadow-sm border border-blue-100 animate-pulse">
                 <Map size={32} />
             </div>
             
             <h3 className="font-bold text-slate-800 text-xl mb-2 relative z-10">
                 {isEditing ? (
                     <InlineText value={event.locationName} isEditing={isEditing} onChange={(val) => onFieldChange?.('locationName', val)} placeholder="Nome do Local" />
                 ) : (
                     event.locationName || 'Localização'
                 )}
             </h3>
             
             <div className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 max-w-md relative z-10">
                 {isEditing ? (
                     <InlineText type="textarea" value={event.address} isEditing={isEditing} onChange={(val) => onFieldChange?.('address', val)} placeholder="Endereço Completo" />
                 ) : (
                     event.address && <p>{event.address}</p>
                 )}
             </div>

             {isEditing && (
                 <div className="w-full max-w-sm text-left mb-6 relative z-10 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-bold text-slate-500 block">Link de Localização (Google Maps)</span>
                         <button type="button" onClick={(e) => { e.preventDefault(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address || event.locationName || 'Local')}`, '_blank'); }} className="text-[10px] bg-slate-100 text-blue-600 px-2.5 py-1 rounded-lg shadow-sm hover:bg-white hover:border-slate-300 transition-all flex items-center gap-1 font-sans border border-slate-200">
                             <Search size={10} /> Pesquisar no Maps
                         </button>
                     </div>
                     <InlineText value={event.mapLink || ''} isEditing={isEditing} onChange={(val) => onFieldChange?.('mapLink', val)} placeholder="https://maps.google.com/..." className="text-xs text-blue-500 underline w-full text-center" />
                 </div>
             )}
             
             <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full sm:w-auto">
                 <Button onClick={() => window.open(mapLink, '_blank')} variant="navy" className="shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto hover:scale-105 transition-transform active:scale-95">
                     <ExternalLink size={18} /> Abrir no Google Maps
                 </Button>
                 <Button onClick={handleCopy} variant="outline" className="flex items-center justify-center gap-2 bg-white w-full sm:w-auto hover:scale-105 transition-transform active:scale-95 border-slate-200 hover:bg-slate-50">
                     {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                     {copied ? 'Link Copiado!' : 'Copiar Link'}
                 </Button>
             </div>
        </div>
    );
};

