import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Map, ExternalLink, Copy, Check } from 'lucide-react';

export const TravelMap: React.FC<{ event: any }> = ({ event }) => {
    const address = event.address || event.locationName || 'Luanda, Angola';
    const [copied, setCopied] = useState(false);
    const mapLink = event.mapLink || `https://maps.google.com/?q=${encodeURIComponent(address)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(mapLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full my-8 bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] shadow-xl text-center flex flex-col items-center justify-center relative overflow-hidden">
             
             {/* Decorative Background Map Pattern */}
             <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cartographer.png")' }}></div>

             <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mb-4 relative z-10 shadow-sm border border-blue-100">
                 <Map size={32} />
             </div>
             
             <h3 className="font-bold text-slate-800 text-xl mb-2 relative z-10">{event.locationName || 'Localização'}</h3>
             
             {event.address && (
                 <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 max-w-md relative z-10">
                     {event.address}
                 </p>
             )}
             
             <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full sm:w-auto">
                 <Button onClick={() => window.open(mapLink, '_blank')} variant="navy" className="shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto">
                     <ExternalLink size={18} /> Abrir no Google Maps
                 </Button>
                 <Button onClick={handleCopy} variant="outline" className="flex items-center justify-center gap-2 bg-white w-full sm:w-auto">
                     {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                     {copied ? 'Link Copiado!' : 'Copiar Link'}
                 </Button>
             </div>
        </div>
    );
};

