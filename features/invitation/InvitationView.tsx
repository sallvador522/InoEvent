
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getEventById } from '../../mockData';
import { EventDetails } from '../../types';
import { TocaPlayer } from '../../components/music/TocaPlayer';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { Button } from '../../components/ui/Button';

// ============================================================================
// COMPONENT: INVITATION CONTROLLER
// Decides which layout to render based on event.layoutMode
// ============================================================================
const InvitationView: React.FC = () => {
  const { id } = useParams();
  const event = getEventById(id || '');
  const [isRSVPOpen, setRSVPOpen] = useState(false);

  // Scroll to top on mount to ensure the user sees the Hero section first
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!event) return <div className="p-10 text-center">Evento não encontrado.</div>;

  // Simulate Guest Name (In a real app, this comes from URL token/param)
  const guestName = "Família Silva";

  // Common Props passed to all layouts
  const props = { event, onRSVP: () => setRSVPOpen(true), guestName };

  return (
    <>
      <TocaPlayer trackName={event.musicTrack} isDark={event.layoutMode === 'LUXURY' || event.layoutMode === 'INDUSTRIAL'} />
      
      {/* Dynamic Layout Rendering */}
      {event.layoutMode === 'CLASSIC' && <ClassicLayout {...props} />}
      {event.layoutMode === 'MODERN' && <ModernLayout {...props} />}
      {event.layoutMode === 'LUXURY' && <LuxuryLayout {...props} />}
      {event.layoutMode === 'GARDEN' && <GardenLayout {...props} />}
      {event.layoutMode === 'RUSTIC' && <RusticLayout {...props} />}
      {event.layoutMode === 'INDUSTRIAL' && <IndustrialLayout {...props} />}

      {/* Shared RSVP Modal */}
      <BottomSheet 
        isOpen={isRSVPOpen} 
        onClose={() => setRSVPOpen(false)} 
        title="Sua Presença"
        themeClasses={
          event.layoutMode === 'LUXURY' || event.layoutMode === 'INDUSTRIAL' 
          ? 'bg-[#151515] text-white border-t border-gray-700' 
          : 'bg-white text-slate-900'
        }
      >
        <RSVPForm event={event} onClose={() => setRSVPOpen(false)} />
      </BottomSheet>
    </>
  );
};

// ============================================================================
// HELPER: ANIMATION WRAPPER (PREMIUM SMOOTH SCROLL)
// Updated for better mobile responsiveness and fluidity
// ============================================================================
const FadeInSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }}
    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    viewport={{ once: true, margin: "-50px" }} // Trigger slightly before element is full view
    transition={{ 
      duration: 1.2, 
      ease: [0.22, 1, 0.36, 1], // Custom Bezier for "Luxury" feel (OutExpo-ish)
      delay 
    }}
    className={`will-change-[transform,opacity] ${className}`}
  >
    {children}
  </motion.div>
);

// ============================================================================
// HELPER: COUNTDOWN TIMER
// ============================================================================
const CountdownTimer: React.FC<{ targetDate: string; colorClass?: string }> = ({ targetDate, colorClass = "text-[#BF9B30]" }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };
    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeBox = ({ val, label }: { val: number, label: string }) => (
    <div className="flex flex-col items-center min-w-[60px]">
      <span className={`text-2xl md:text-3xl font-serif font-bold tabular-nums ${colorClass}`}>
        {val < 10 ? `0${val}` : val}
      </span>
      <span className="text-[10px] uppercase tracking-widest opacity-60 mt-1">{label}</span>
    </div>
  );

  return (
    <div className="flex gap-4 md:gap-8 justify-center py-6">
      <TimeBox val={timeLeft.days} label="Dias" />
      <div className="text-xl opacity-30 self-start mt-2">:</div>
      <TimeBox val={timeLeft.hours} label="Hrs" />
      <div className="text-xl opacity-30 self-start mt-2">:</div>
      <TimeBox val={timeLeft.minutes} label="Min" />
    </div>
  );
};


// ============================================================================
// LAYOUT 1: CLASSIC ROMANTIC (Refined)
// ============================================================================
const ClassicLayout: React.FC<{ event: EventDetails; onRSVP: () => void; guestName: string }> = ({ event, onRSVP }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-serif pb-28">
      {/* Formal Header */}
      <div className="bg-white p-6 text-center shadow-sm">
         <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Save the Date</p>
      </div>

      {/* Hero Card */}
      <div className="p-4">
        <div className="relative h-[65vh] rounded-t-full rounded-b-[200px] overflow-hidden border-8 border-white shadow-2xl mx-auto max-w-lg">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] hover:scale-110" style={{ backgroundImage: `url('${event.heroImage}')` }} />
          <div className="absolute inset-0 bg-black/30" />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 flex flex-col justify-end items-center pb-24 text-white text-center p-6"
          >
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="text-5xl font-script mb-2"
            >
              {event.title}
            </motion.h1>
            <div className="w-12 h-px bg-white/60 my-4"></div>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-xl tracking-widest uppercase"
            >
              {event.date}
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-6 mt-8 text-center space-y-12">
         <FadeInSection>
            <p className="text-slate-600 italic text-lg leading-relaxed px-4">"{event.description}"</p>
         </FadeInSection>

         <FadeInSection>
           <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Programação</h3>
           <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-slate-200">
              {event.timeline.map((item, idx) => (
                <div key={idx} className="relative flex flex-col items-center bg-white p-4 rounded-lg shadow-sm z-10 w-[80%] mx-auto border border-slate-100">
                   <span className="text-brand-blue font-bold text-lg mb-1">{item.time}</span>
                   <span className="font-bold text-slate-800">{item.title}</span>
                   <span className="text-xs text-slate-500">{item.description}</span>
                </div>
              ))}
           </div>
         </FadeInSection>

         <FadeInSection>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
               <h3 className="font-bold text-xl mb-1 text-slate-800">{event.locationName}</h3>
               <p className="text-slate-500 text-sm mb-4">{event.address}</p>
               <Button onClick={() => window.open(event.mapLink || '#', '_blank')} variant="navy" fullWidth className="text-xs uppercase tracking-widest h-10">
                 Ver Mapa
               </Button>
            </div>
         </FadeInSection>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button onClick={onRSVP} className="bg-brand-blue text-white px-10 py-4 rounded-full font-sans font-bold shadow-2xl shadow-brand-blue/40 uppercase tracking-widest text-xs hover:scale-105 transition-transform">
           Confirmar Presença
        </button>
      </div>
    </div>
  );
};


// ============================================================================
// LAYOUT 2: MINIMALIST ETHEREAL (Redesigned Modern)
// High-End, Clean, Airy, with Bible Verse, Gallery, Gifts, etc.
// ============================================================================
const ModernLayout: React.FC<{ event: EventDetails; onRSVP: () => void; guestName: string }> = ({ event, onRSVP, guestName }) => {
  // Ethereal Color Palette
  const accentText = "text-[#8A817C]"; // Taupe gray
  const darkText = "text-[#2C2C2C]";
  const bgSoft = "bg-[#F9F9F9]";
  
  return (
    <div className="min-h-screen bg-[#FDFDFD] font-serif text-[#333] pb-32">
      
      {/* 1. HERO - Minimalist Split or Overlay */}
      <div className="h-screen relative w-full overflow-hidden">
         <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${event.heroImage}')` }}
         />
         <div className="absolute inset-0 bg-white/30 mix-blend-screen" />
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FDFDFD]" />

         <motion.div 
           initial={{ opacity: 0, y: 40, filter: 'blur(5px)' }}
           animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
           transition={{ delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
           className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
         >
            <div className="border border-[#8A817C]/30 bg-white/80 backdrop-blur-sm p-10 md:p-16 max-w-lg w-full shadow-2xl shadow-gray-200/50">
               <span className="font-display text-[10px] uppercase tracking-[0.4em] text-gray-500 mb-6 block">Convite de Casamento</span>
               <h1 className="text-5xl md:text-7xl font-serif text-[#1a1a1a] mb-4 leading-tight">
                  {event.title.split(' & ')[0]} <br/> <span className="text-3xl italic text-[#C2B280]">&</span> <br/> {event.title.split(' & ')[1]}
               </h1>
               <div className="w-10 h-px bg-[#C2B280] mx-auto my-6"></div>
               <p className="text-sm font-display uppercase tracking-widest text-gray-600">{event.date}</p>
            </div>
         </motion.div>
      </div>

      {/* 2. BIBLE QUOTE & WELCOME */}
      <div className="max-w-2xl mx-auto px-8 -mt-20 relative z-10">
         <FadeInSection className="bg-white p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] text-center">
            <span className="font-script text-4xl text-[#C2B280] mb-4 block">Bem-vindos</span>
            <p className="text-xl italic font-light leading-relaxed text-gray-600 mb-6">
               {event.description}
            </p>
            <div className="py-4 border-t border-gray-100">
               <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Especialmente para</p>
               <p className="text-lg font-bold text-[#2C2C2C] font-display">{guestName}</p>
            </div>
         </FadeInSection>
      </div>

      {/* 3. COUNTDOWN (Minimal Line) */}
      <FadeInSection className="py-20 text-center">
         <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-6">Contagem Regressiva</p>
         <CountdownTimer targetDate={event.isoDate} colorClass="text-[#2C2C2C]" />
      </FadeInSection>

      {/* 4. DETAILS SECTION (Ceremony & Party) */}
      <div className="max-w-5xl mx-auto px-6 mb-24 space-y-24">
         {/* Ceremony */}
         <FadeInSection className="flex flex-col md:flex-row items-center gap-12">
             <div className="w-full md:w-1/2 aspect-[4/5] bg-gray-100 relative overflow-hidden group">
                 <img src="https://images.unsplash.com/photo-1544070274-1b48b1111003?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                 <div className="absolute top-4 left-4 bg-white px-4 py-2 text-xs font-bold tracking-widest uppercase">Cerimônia</div>
             </div>
             <div className="w-full md:w-1/2 text-center md:text-left space-y-4">
                 <h2 className="text-4xl font-serif text-[#1a1a1a]">{event.locationName}</h2>
                 <p className="text-[#C2B280] font-display uppercase tracking-widest text-sm">{event.time} Horas</p>
                 <p className="text-gray-500 leading-relaxed font-light text-lg">{event.address}</p>
                 <button onClick={() => window.open(event.mapLink || '#', '_blank')} className="mt-4 inline-block border-b border-black pb-1 text-xs font-bold uppercase tracking-widest hover:text-[#C2B280] hover:border-[#C2B280] transition-colors">
                    Ver Localização
                 </button>
             </div>
         </FadeInSection>

         {/* Reception */}
         {event.receptionName && (
            <FadeInSection className="flex flex-col md:flex-row-reverse items-center gap-12">
               <div className="w-full md:w-1/2 aspect-[4/5] bg-gray-100 relative overflow-hidden group">
                   <img src={event.mapImage} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                   <div className="absolute top-4 right-4 bg-white px-4 py-2 text-xs font-bold tracking-widest uppercase">Recepção</div>
               </div>
               <div className="w-full md:w-1/2 text-center md:text-right space-y-4">
                   <h2 className="text-4xl font-serif text-[#1a1a1a]">{event.receptionName}</h2>
                   <p className="text-[#C2B280] font-display uppercase tracking-widest text-sm">Após a cerimônia</p>
                   <p className="text-gray-500 leading-relaxed font-light text-lg">{event.receptionAddress}</p>
                   <button onClick={() => window.open(`https://maps.google.com/?q=${event.receptionAddress}`, '_blank')} className="mt-4 inline-block border-b border-black pb-1 text-xs font-bold uppercase tracking-widest hover:text-[#C2B280] hover:border-[#C2B280] transition-colors">
                      Ver Localização
                   </button>
               </div>
            </FadeInSection>
         )}
      </div>

      {/* 5. TIMELINE (Clean Vertical) */}
      <FadeInSection className="bg-[#F4F4F4] py-24 px-6">
         <div className="max-w-xl mx-auto text-center mb-12">
            <h3 className="text-3xl font-serif italic text-[#1a1a1a]">Nosso Dia</h3>
         </div>
         <div className="max-w-md mx-auto space-y-12 relative before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-gray-300">
            {event.timeline.map((item, i) => (
               <div key={i} className="relative flex items-center justify-between">
                  <div className={`w-[45%] ${i % 2 === 0 ? 'text-right' : 'order-last text-left'}`}>
                     <h4 className="font-serif text-xl">{item.title}</h4>
                     <p className="text-xs text-gray-500 mt-1 font-display uppercase tracking-wider">{item.description}</p>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-[#C2B280] rounded-full border-4 border-[#F4F4F4]"></div>
                  <div className={`w-[45%] ${i % 2 === 0 ? 'text-left' : 'text-right'}`}>
                     <span className="font-display font-bold text-[#C2B280]">{item.time}</span>
                  </div>
               </div>
            ))}
         </div>
      </FadeInSection>

      {/* 6. DRESS CODE & TIPS */}
      <div className="grid md:grid-cols-2 max-w-6xl mx-auto w-full">
         <FadeInSection className="bg-white p-16 md:p-24 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-100">
             <span className="material-symbols-outlined text-4xl text-[#C2B280] mb-6">checkroom</span>
             <h3 className="text-2xl font-serif mb-4">Dress Code</h3>
             <p className="text-gray-500 leading-relaxed max-w-sm mb-6">{event.dressCode?.description || 'Traje Passeio Completo'}</p>
             {event.dressCode?.image && (
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 grayscale opacity-80">
                   <img src={event.dressCode.image} className="w-full h-full object-cover" />
                </div>
             )}
         </FadeInSection>
         
         <FadeInSection className="bg-white p-16 md:p-24 flex flex-col items-center justify-center text-center">
             <span className="material-symbols-outlined text-4xl text-[#C2B280] mb-6">featured_seasonal_and_gifts</span>
             <h3 className="text-2xl font-serif mb-4">Lista de Presentes</h3>
             <p className="text-gray-500 leading-relaxed max-w-sm mb-8">
               {event.gifts?.[0].description || 'Sua presença é nosso maior presente.'}
             </p>
             {event.gifts && (
               <button 
                  onClick={() => {navigator.clipboard.writeText(event.gifts![0].value); alert('IBAN Copiado!')}}
                  className="px-8 py-3 bg-[#2C2C2C] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#C2B280] transition-colors"
               >
                  Copiar IBAN
               </button>
             )}
         </FadeInSection>
      </div>

      {/* 7. GALLERY (Masonry-ish) */}
      {event.gallery && (
         <FadeInSection className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3">
               {event.gallery.map((img, i) => (
                  <div key={i} className="aspect-square relative group overflow-hidden">
                     <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                     <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
               ))}
            </div>
         </FadeInSection>
      )}

      {/* FOOTER ACTION */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
         <button 
            onClick={onRSVP}
            className="bg-white text-[#1a1a1a] px-10 py-4 rounded-full font-display font-bold text-xs uppercase tracking-widest shadow-2xl hover:bg-[#1a1a1a] hover:text-white transition-colors duration-300 flex items-center gap-2 border border-gray-100"
         >
            <span>Confirmar Presença</span>
         </button>
      </div>

    </div>
  );
};


// ============================================================================
// LAYOUT 3: GARDEN ELEGANCE (New Model)
// Soft, Floral, Serif, Comprehensive features (Bible, Gallery, etc.)
// ============================================================================
const GardenLayout: React.FC<{ event: EventDetails; onRSVP: () => void; guestName: string }> = ({ event, onRSVP, guestName }) => {
  const accentColor = "text-[#5D6D55]"; // Sage green
  const accentBg = "bg-[#5D6D55]";
  
  return (
    <div className="min-h-screen bg-[#F9F6F2] font-serif text-[#4A4A4A] pb-28 overflow-x-hidden selection:bg-[#D6CFC7]">
      
      {/* 1. HERO WITH OVERLAY */}
      <div className="relative h-[85vh] w-full overflow-hidden">
         <motion.div 
           initial={{ scale: 1.1 }}
           animate={{ scale: 1 }}
           transition={{ duration: 10, ease: "linear" }}
           className="absolute inset-0 bg-cover bg-center" 
           style={{ backgroundImage: `url('${event.heroImage}')` }} 
         />
         <div className="absolute inset-0 bg-white/20 mix-blend-overlay" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#F9F6F2] via-transparent to-transparent h-40 bottom-0 top-auto" />
         
         <motion.div 
            initial={{ opacity: 0, y: 30, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 drop-shadow-sm"
         >
            <div className="bg-white/70 backdrop-blur-sm p-8 px-10 rounded-t-[100px] rounded-b-[100px] shadow-xl border border-white">
                <p className={`text-xs uppercase tracking-[0.3em] mb-4 ${accentColor} font-sans`}>O Casamento de</p>
                <h1 className="text-5xl md:text-6xl font-script text-[#2C2C2C] mb-2 leading-tight">
                  {event.title.split(' & ')[0]} <br/> <span className="text-3xl font-serif italic text-[#8A8A8A]">&</span> <br/> {event.title.split(' & ')[1]}
                </h1>
                <p className="mt-4 font-sans text-sm uppercase tracking-widest text-gray-500">{event.date}</p>
            </div>
         </motion.div>
      </div>

      {/* 2. BIBLE QUOTE & WELCOME */}
      <div className="max-w-2xl mx-auto px-6 -mt-10 relative z-10 text-center">
         <FadeInSection>
            <div className="mb-8">
               <span className="material-symbols-outlined text-4xl text-[#D6CFC7]">format_quote</span>
               <p className="text-xl md:text-2xl italic font-medium leading-relaxed mt-2 text-[#5D5C61]">
                 {event.description.split('(')[0].replace(/"/g, '')}
               </p>
               {event.description.includes('(') && (
                 <p className="text-sm font-sans uppercase tracking-widest mt-4 text-[#8C8C8C]">
                   {event.description.split('(')[1].replace(')', '')}
                 </p>
               )}
            </div>
            
            <div className="w-px h-16 bg-[#D6CFC7] mx-auto mb-8"></div>

            <div className="font-sans">
               <p className="uppercase tracking-[0.2em] text-xs text-[#8C8C8C] mb-2">Convidado Especial</p>
               <p className="text-2xl font-serif text-[#2C2C2C]">{guestName}</p>
            </div>
         </FadeInSection>
      </div>

      {/* 3. COUNTDOWN */}
      <FadeInSection className="mt-16 bg-white py-12 px-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border-y border-[#EAE5DF]">
         <p className="text-center font-sans text-xs uppercase tracking-[0.2em] mb-2 text-[#8C8C8C]">Falta Pouco</p>
         <CountdownTimer targetDate={event.isoDate} colorClass="text-[#5D5C61]" />
      </FadeInSection>

      {/* 4. LOCATIONS (Ceremony & Reception) */}
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
         <FadeInSection className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-right order-2 md:order-1">
               <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white mb-4 ${accentBg} uppercase tracking-widest`}>Cerimônia</span>
               <h3 className="text-3xl font-serif mb-2">{event.locationName}</h3>
               <p className="text-[#8C8C8C] font-sans text-sm mb-1">{event.time} Horas</p>
               <p className="text-[#5D5C61] mb-6 leading-relaxed">{event.address}</p>
               <button onClick={() => window.open(event.mapLink || '#', '_blank')} className={`text-xs font-bold border-b border-[#2C2C2C] pb-0.5 hover:opacity-50 transition-opacity uppercase tracking-widest`}>
                 Ver no Mapa
               </button>
            </div>
            <div className="flex-1 order-1 md:order-2">
               <div className="aspect-[3/4] rounded-t-[100px] overflow-hidden shadow-lg">
                  <img src="https://images.unsplash.com/photo-1544070274-1b48b1111003?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover" />
               </div>
            </div>
         </FadeInSection>

         {event.receptionName && (
           <FadeInSection className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                 <div className="aspect-[3/4] rounded-t-[100px] overflow-hidden shadow-lg">
                    <img src={event.mapImage} className="w-full h-full object-cover" />
                 </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                 <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white mb-4 ${accentBg} uppercase tracking-widest`}>Recepção</span>
                 <h3 className="text-3xl font-serif mb-2">{event.receptionName}</h3>
                 <p className="text-[#8C8C8C] font-sans text-sm mb-1">Após a cerimônia</p>
                 <p className="text-[#5D5C61] mb-6 leading-relaxed">{event.receptionAddress}</p>
                 <button onClick={() => window.open(`https://maps.google.com/?q=${event.receptionAddress}`, '_blank')} className={`text-xs font-bold border-b border-[#2C2C2C] pb-0.5 hover:opacity-50 transition-opacity uppercase tracking-widest`}>
                   Ver no Mapa
                 </button>
              </div>
           </FadeInSection>
         )}
      </div>

      {/* 5. TIMELINE (Elegant Vertical) */}
      <FadeInSection className="bg-white py-20 px-6 border-y border-[#EAE5DF]">
         <div className="max-w-lg mx-auto">
            <h3 className="text-center font-serif text-3xl mb-12 italic">Cronograma</h3>
            <div className="space-y-10 relative pl-8 border-l border-[#EAE5DF]">
               {event.timeline.map((item, i) => (
                 <div key={i} className="relative">
                    <div className={`absolute -left-[37px] top-1 w-4 h-4 rounded-full border-4 border-white ${accentBg} shadow-sm`}></div>
                    <span className="text-xs font-bold font-sans text-[#8C8C8C] block mb-1">{item.time}</span>
                    <h4 className="text-xl font-serif text-[#2C2C2C] mb-1">{item.title}</h4>
                    <p className="text-sm text-[#5D5C61] font-light">{item.description}</p>
                 </div>
               ))}
            </div>
         </div>
      </FadeInSection>

      {/* 6. GALLERY (Grid Layout) */}
      {event.gallery && (
        <FadeInSection className="py-20 px-4 max-w-5xl mx-auto">
           <h3 className="text-center font-sans text-xs uppercase tracking-[0.2em] mb-8 text-[#8C8C8C]">Momentos Especiais</h3>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
              {event.gallery.map((img, i) => (
                <div key={i} className={`rounded-lg overflow-hidden shadow-sm ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                   <img src={img} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
           </div>
        </FadeInSection>
      )}

      {/* 7. GIFTS & DRESS CODE */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto px-6 mb-24">
         {event.dressCode && (
           <FadeInSection className="bg-white p-8 rounded-2xl shadow-sm border border-[#EAE5DF] text-center">
              <span className="material-symbols-outlined text-3xl mb-4 text-[#8C8C8C]">styler</span>
              <h4 className="text-lg font-serif font-bold mb-2">{event.dressCode.title}</h4>
              <p className="text-sm text-[#5D5C61]">{event.dressCode.description}</p>
           </FadeInSection>
         )}
         
         {event.gifts && (
           <FadeInSection className="bg-white p-8 rounded-2xl shadow-sm border border-[#EAE5DF] text-center">
              <span className="material-symbols-outlined text-3xl mb-4 text-[#8C8C8C]">card_giftcard</span>
              <h4 className="text-lg font-serif font-bold mb-2">Lista de Presentes</h4>
              <p className="text-sm text-[#5D5C61] mb-4">{event.gifts[0].description}</p>
              <button 
                 onClick={() => {navigator.clipboard.writeText(event.gifts![0].value); alert('IBAN Copiado!')}}
                 className={`px-6 py-2 rounded-full border border-[#D6CFC7] text-xs font-bold uppercase tracking-widest hover:bg-[#F9F6F2] transition-colors`}
              >
                 Copiar IBAN
              </button>
           </FadeInSection>
         )}
      </div>

      {/* FIXED BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-[#EAE5DF] p-4 z-50 flex items-center justify-center">
         <Button 
           onClick={onRSVP}
           className={`w-full max-w-md ${accentBg} text-white font-sans font-bold uppercase tracking-widest text-xs py-4 shadow-lg flex items-center justify-center gap-2 hover:opacity-90`}
         >
           <span>Confirmar Presença</span>
         </Button>
      </div>
    </div>
  );
};

// ============================================================================
// LAYOUT 4: RUSTIC CHIC (Warm, Texture, Nature)
// ============================================================================
const RusticLayout: React.FC<{ event: EventDetails; onRSVP: () => void; guestName: string }> = ({ event, onRSVP, guestName }) => {
   const warmText = "text-[#5D4037]"; // Dark warm brown
   const lightText = "text-[#8D6E63]"; // Lighter brown
   const bgPaper = "bg-[#FDF5E6]"; // Old Lace / Paper
   
   return (
     <div className={`min-h-screen ${bgPaper} font-serif text-[#4E342E] pb-28 overflow-x-hidden`}>
       
       {/* HERO: Framed Image */}
       <div className="p-4 md:p-8">
          <div className="relative h-[75vh] w-full rounded-[40px] overflow-hidden border-8 border-white shadow-xl">
             <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${event.heroImage}')` }} />
             <div className="absolute inset-0 bg-gradient-to-t from-[#4E342E]/80 via-transparent to-transparent" />
             
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5, duration: 1 }}
               className="absolute bottom-0 w-full p-8 md:p-16 text-center text-[#FDF5E6]"
             >
                <p className="uppercase tracking-[0.3em] text-xs mb-2">Save the Date</p>
                <h1 className="text-5xl md:text-7xl font-script mb-2">{event.title}</h1>
                <p className="text-lg">{event.date}</p>
             </motion.div>
          </div>
       </div>
 
       {/* INTRO & BIBLE */}
       <FadeInSection className="max-w-2xl mx-auto text-center px-6 py-12">
          <span className="material-symbols-outlined text-4xl text-[#A1887F] mb-4">forest</span>
          <p className="text-xl md:text-2xl font-script leading-relaxed text-[#5D4037] mb-6">"{event.description}"</p>
          <div className="w-24 h-px bg-[#D7CCC8] mx-auto my-6"></div>
          <p className="uppercase tracking-widest text-xs text-[#8D6E63]">Convidado Especial</p>
          <p className="text-xl font-bold mt-2">{guestName}</p>
       </FadeInSection>
 
       {/* LOCATIONS - Side by Side Cards */}
       <div className="px-4 md:px-8 space-y-4 mb-16">
          <FadeInSection className="bg-white p-8 rounded-3xl shadow-sm border border-[#EFEBE9] flex flex-col md:flex-row items-center gap-8">
             <div className="flex-1 text-center md:text-left">
                <span className="inline-block px-3 py-1 bg-[#EFEBE9] text-[#5D4037] text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">Cerimônia</span>
                <h3 className="text-3xl font-serif mb-2 text-[#4E342E]">{event.locationName}</h3>
                <p className="text-[#8D6E63] mb-4">{event.address}</p>
                <button onClick={() => window.open(event.mapLink || '#', '_blank')} className="text-xs font-bold border-b border-[#5D4037] pb-1 uppercase tracking-widest">Ver Mapa</button>
             </div>
             <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden">
                <img src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover" />
             </div>
          </FadeInSection>
       </div>
 
       {/* TIMELINE - Rustic Path */}
       <FadeInSection className="bg-[#FFF8E1] py-16 px-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full border-l-2 border-dashed border-[#D7CCC8] opacity-50"></div>
          <div className="relative z-10 max-w-xl mx-auto space-y-12">
             <h3 className="text-center font-script text-4xl text-[#5D4037] mb-12">Nosso Grande Dia</h3>
             {event.timeline.map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-[#EFEBE9] text-center relative">
                   <div className="absolute top-1/2 -left-[45px] md:-left-[calc(50vw-50%+20px)] w-4 h-4 bg-[#8D6E63] rounded-full border-4 border-[#FFF8E1]"></div>
                   <span className="text-[#8D6E63] font-bold block mb-1">{item.time}</span>
                   <h4 className="text-xl font-serif text-[#4E342E]">{item.title}</h4>
                </div>
             ))}
          </div>
       </FadeInSection>

       {/* GIFTS & DRESS CODE */}
       <div className="grid md:grid-cols-2 gap-4 px-4 mt-16 mb-24">
          <FadeInSection className="bg-[#5D4037] text-[#FDF5E6] p-10 rounded-3xl text-center flex flex-col items-center justify-center">
             <span className="material-symbols-outlined text-4xl mb-4">checkroom</span>
             <h3 className="text-2xl font-serif mb-2">Dress Code</h3>
             <p className="opacity-80 text-sm max-w-xs">{event.dressCode?.description}</p>
          </FadeInSection>
          <FadeInSection className="bg-white border border-[#EFEBE9] p-10 rounded-3xl text-center flex flex-col items-center justify-center">
             <span className="material-symbols-outlined text-4xl text-[#5D4037] mb-4">card_giftcard</span>
             <h3 className="text-2xl font-serif text-[#4E342E] mb-2">Presentes</h3>
             <button 
                onClick={() => {navigator.clipboard.writeText(event.gifts![0].value); alert('IBAN Copiado!')}}
                className="mt-4 px-6 py-2 border border-[#5D4037] text-[#5D4037] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#5D4037] hover:text-white transition-colors"
             >
                Copiar IBAN
             </button>
          </FadeInSection>
       </div>
 
       {/* FIXED ACTION */}
       <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <button 
             onClick={onRSVP}
             className="w-full bg-[#5D4037] text-[#FDF5E6] py-4 rounded-full font-bold shadow-2xl shadow-[#5D4037]/40 text-sm uppercase tracking-widest hover:scale-105 transition-transform"
          >
             Confirmar Presença
          </button>
       </div>
     </div>
   );
 };


// ============================================================================
// LAYOUT 5: INDUSTRIAL (Modern, Edgy, High Contrast)
// ============================================================================
const IndustrialLayout: React.FC<{ event: EventDetails; onRSVP: () => void; guestName: string }> = ({ event, onRSVP, guestName }) => {
   
   return (
     <div className="min-h-screen bg-[#111] text-white font-display pb-32 selection:bg-white selection:text-black">
       
       {/* HERO: Full Typographic */}
       <div className="h-screen relative flex flex-col justify-between p-6 md:p-12 border-b border-white/20">
          <div className="flex justify-between items-start">
             <span className="text-xs font-bold uppercase tracking-widest border border-white px-2 py-1">Save The Date</span>
             <span className="text-xs font-bold uppercase tracking-widest">{event.date}</span>
          </div>
          
          <div className="relative z-10">
             <motion.h1 
               initial={{ y: 50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ duration: 0.8 }}
               className="text-6xl md:text-9xl font-black uppercase leading-[0.85] tracking-tighter mix-blend-difference"
             >
                {event.title.replace(' & ', '\n&\n')}
             </motion.h1>
          </div>

          <div className="absolute inset-0 z-0 opacity-40">
             <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
             <img src={event.heroImage} className="w-full h-full object-cover grayscale" />
          </div>
       </div>

       {/* GRID LAYOUT FOR DETAILS */}
       <div className="grid grid-cols-1 md:grid-cols-2 border-b border-white/20">
          <div className="p-8 md:p-16 border-b md:border-b-0 md:border-r border-white/20 flex flex-col justify-center">
             <FadeInSection>
               <span className="text-xs text-gray-400 uppercase tracking-widest mb-4 block">O Conceito</span>
               <p className="text-xl md:text-2xl font-light leading-relaxed">
                  {event.description}
               </p>
             </FadeInSection>
          </div>
          <div className="p-8 md:p-16 flex flex-col justify-center bg-white text-black">
             <FadeInSection>
                <span className="text-xs font-bold uppercase tracking-widest mb-4 block border-b border-black pb-2">Guest Access</span>
                <p className="text-4xl font-bold uppercase mb-2">{guestName}</p>
                <div className="flex gap-2 mt-4">
                   <div className="h-2 w-2 bg-black rounded-full animate-pulse"></div>
                   <p className="text-xs font-mono uppercase">VIP ACCESS GRANTED</p>
                </div>
             </FadeInSection>
          </div>
       </div>

       {/* TIMELINE - Raw List */}
       <div className="p-8 md:p-16">
          <h3 className="text-4xl md:text-6xl font-black uppercase mb-12 text-transparent stroke-white" style={{ WebkitTextStroke: '1px white' }}>Timeline</h3>
          <div className="space-y-6">
             {event.timeline.map((item, i) => (
                <FadeInSection key={i} className="group flex items-baseline border-b border-white/10 pb-6 hover:border-white transition-colors cursor-default">
                   <span className="w-24 font-mono text-sm text-gray-500 group-hover:text-white transition-colors">{item.time}</span>
                   <div>
                      <h4 className="text-2xl font-bold uppercase group-hover:translate-x-2 transition-transform">{item.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                   </div>
                </FadeInSection>
             ))}
          </div>
       </div>

       {/* LOCATIONS */}
       <div className="grid grid-cols-1 md:grid-cols-2 h-[60vh]">
          <div className="relative border-r border-white/20 group overflow-hidden">
             <img src="https://images.unsplash.com/photo-1544070274-1b48b1111003?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-700" />
             <div className="absolute bottom-0 left-0 p-8 bg-black/80 w-full backdrop-blur-sm">
                <p className="text-xs uppercase tracking-widest mb-1 text-gray-400">Cerimônia</p>
                <h3 className="text-2xl font-bold uppercase">{event.locationName}</h3>
                <button onClick={() => window.open(event.mapLink || '#', '_blank')} className="mt-4 text-xs font-bold border border-white px-4 py-2 hover:bg-white hover:text-black transition-colors uppercase">Map</button>
             </div>
          </div>
          <div className="relative group overflow-hidden">
             <img src={event.mapImage} className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-700" />
             <div className="absolute bottom-0 left-0 p-8 bg-white/90 text-black w-full backdrop-blur-sm">
                <p className="text-xs uppercase tracking-widest mb-1 text-gray-600">Recepção</p>
                <h3 className="text-2xl font-bold uppercase">{event.receptionName}</h3>
                <button onClick={() => window.open(`https://maps.google.com/?q=${event.receptionAddress}`, '_blank')} className="mt-4 text-xs font-bold border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors uppercase">Map</button>
             </div>
          </div>
       </div>

       {/* RSVP BUTTON */}
       <div className="fixed bottom-8 right-8 z-50">
          <button 
             onClick={onRSVP}
             className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-white text-black font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform animate-spin-slow"
          >
             RSVP
          </button>
       </div>

     </div>
   );
 };

// ============================================================================
// HELPERS FOR LUXURY LAYOUT
// ============================================================================
const GoldDivider = () => (
  <div className="flex items-center justify-center gap-4 py-8 opacity-60">
     <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#BF9B30]"></div>
     <div className="w-1.5 h-1.5 rotate-45 border border-[#BF9B30]"></div>
     <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#BF9B30]"></div>
  </div>
);

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <div className="text-center mb-6">
    <h3 className="text-[#BF9B30] font-bold uppercase tracking-widest text-xs inline-block border-b border-[#BF9B30]/30 pb-1">
      {title}
    </h3>
  </div>
);


// ============================================================================
// LUXURY LAYOUT (Existing - kept for reference, no changes needed here)
// ============================================================================
const LuxuryLayout: React.FC<{ event: EventDetails; onRSVP: () => void; guestName: string }> = ({ event, onRSVP, guestName }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(val);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-serif pb-28 border-[12px] border-[#111] overflow-x-hidden relative">
      
      {/* BACKGROUND: Deep Elegant Radial Gradient (Spotlight Effect) */}
      <div className="fixed inset-0 bg-[radial-gradient(100%_100%_at_50%_0%,_#2C3038_0%,_#0F1419_50%,_#000000_100%)] z-0" />
      
      {/* BACKGROUND: Subtle Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-0 mix-blend-screen"></div>

      {/* Gold Frame Container */}
      <div className="border border-[#BF9B30]/30 min-h-[calc(100vh-24px)] relative flex flex-col items-center z-10 backdrop-blur-[1px]">
        
        {/* 1. HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="pt-12 pb-2 px-8 text-center w-full relative z-10"
        >
          <div className="w-16 h-16 mx-auto mb-6 border border-[#BF9B30] rounded-full flex items-center justify-center">
             <span className="font-script text-3xl text-[#BF9B30] pt-2">{event.title.charAt(0)}</span>
          </div>
          <p className="text-[#BF9B30] text-[10px] uppercase tracking-[0.3em] mb-4">Convite Formal</p>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="text-4xl text-white mb-2"
          >
            {event.title}
          </motion.h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest">{event.hosts}</p>
        </motion.div>

        {/* 2. GUEST PERSONALIZATION */}
        <FadeInSection delay={0.2} className="my-6 text-center w-full px-6">
           <div className="bg-[#BF9B30]/10 border-y border-[#BF9B30]/20 py-3">
             <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Convidado de Honra</p>
             <p className="text-xl text-[#BF9B30] font-script">{guestName}</p>
           </div>
        </FadeInSection>

        {/* 3. HERO IMAGE & DATE */}
        <FadeInSection delay={0.3} className="w-full px-6 mb-4">
           <div className="w-full aspect-[4/5] rounded-t-[10rem] rounded-b-xl overflow-hidden relative border border-[#BF9B30]/20 mx-auto max-w-sm">
              <div className="absolute inset-0 bg-cover bg-center grayscale contrast-125" style={{ backgroundImage: `url('${event.heroImage}')` }} />
              <div className="absolute inset-0 bg-[#0F1419]/30 mix-blend-color"></div>
              
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#0F1419] to-transparent pt-20 pb-6 text-center">
                 <p className="text-2xl text-white font-italic">{event.date}</p>
                 <p className="text-[#BF9B30] text-sm">{event.time} Horas</p>
              </div>
           </div>
        </FadeInSection>

        {/* 4. COUNTDOWN */}
        <FadeInSection className="w-full mb-8">
           <p className="text-center text-[10px] uppercase tracking-widest text-gray-500 mb-0">Contagem Regressiva</p>
           <CountdownTimer targetDate={event.isoDate} />
        </FadeInSection>

        {/* 5. COUPLE MESSAGE */}
        <FadeInSection className="px-8 text-center max-w-md mx-auto pb-4">
           <p className="text-lg leading-relaxed font-light text-gray-400 border-t border-b border-[#BF9B30]/20 py-8">
             {event.description}
           </p>
        </FadeInSection>

        <GoldDivider />

        {/* 6. CEREMONY & RECEPTION (Split Locations) */}
        <div className="w-full px-6 mb-8 space-y-8">
           <FadeInSection>
             <SectionTitle title="Cerimônia Religiosa" />
             <div className="border border-[#BF9B30]/30 rounded-xl overflow-hidden bg-[#0F1419] max-w-md mx-auto">
                <div className="h-32 relative">
                   <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544070274-1b48b1111003?q=80&w=2670&auto=format&fit=crop')` }}></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0F1419] to-transparent"></div>
                   <div className="absolute bottom-3 left-4">
                      <p className="text-white text-lg font-serif">{event.locationName}</p>
                      <p className="text-gray-400 text-xs">{event.time}</p>
                   </div>
                </div>
                <div className="p-4 flex flex-col gap-3">
                   <p className="text-xs text-gray-500 text-center leading-relaxed">{event.address}</p>
                   <Button 
                     className="w-full bg-[#BF9B30] text-[#0F1419] hover:bg-white hover:text-black text-xs font-bold uppercase tracking-widest h-10 border-none shadow-lg"
                     onClick={() => window.open(event.mapLink || `https://maps.google.com/?q=${event.address}`, '_blank')}
                   >
                      Ver no Mapa
                   </Button>
                </div>
             </div>
           </FadeInSection>

           {event.receptionName && (
             <FadeInSection>
               <SectionTitle title="Recepção & Festa" />
               <div className="border border-[#BF9B30]/30 rounded-xl overflow-hidden bg-[#0F1419] max-w-md mx-auto">
                  <div className="h-32 relative">
                     <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url('${event.mapImage}')` }}></div>
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0F1419] to-transparent"></div>
                     <div className="absolute bottom-3 left-4">
                        <p className="text-white text-lg font-serif">{event.receptionName}</p>
                        <p className="text-gray-400 text-xs">Logo após a cerimônia</p>
                     </div>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                     <p className="text-xs text-gray-500 text-center leading-relaxed">{event.receptionAddress}</p>
                     <Button 
                       className="w-full bg-[#BF9B30] text-[#0F1419] hover:bg-white hover:text-black text-xs font-bold uppercase tracking-widest h-10 border-none shadow-lg"
                       onClick={() => window.open(`https://maps.google.com/?q=${event.receptionAddress}`, '_blank')}
                     >
                        Ver no Mapa
                     </Button>
                  </div>
               </div>
             </FadeInSection>
           )}
        </div>

        <GoldDivider />

        {/* 8. GIFTS (Lista de Presentes) */}
        {event.gifts && (
          <FadeInSection className="w-full px-6 mb-24 max-w-md mx-auto">
            <SectionTitle title="Lista de Presentes" />
            {event.gifts.map((gift, i) => (
              <div key={i} className="bg-[#1A1F26] p-6 rounded-xl border border-[#BF9B30]/20 text-center space-y-4">
                 <span className="material-symbols-outlined text-3xl text-[#BF9B30]">featured_seasonal_and_gifts</span>
                 <div>
                    <h4 className="text-white font-bold">{gift.title}</h4>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">{gift.description}</p>
                 </div>
                 
                 {/* IBAN DISPLAY */}
                 {gift.type === 'IBAN' && (
                    <div className="bg-black/60 p-4 rounded-lg border border-[#BF9B30]/30 shadow-inner">
                       <p className="text-[10px] text-[#BF9B30] mb-2 uppercase tracking-widest font-bold">Enviar Presentes</p>
                       <p className="text-white font-mono text-base break-all mb-4 tracking-wider select-all">{gift.value}</p>
                       <button 
                          onClick={() => handleCopy(gift.value)}
                          className={`
                            w-full py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2
                            ${copiedKey === gift.value 
                              ? 'bg-[#BF9B30] text-[#0F1419] shadow-[0_0_15px_rgba(191,155,48,0.4)] scale-105' 
                              : 'bg-transparent border border-[#BF9B30] text-[#BF9B30] hover:bg-[#BF9B30]/10'}
                          `}
                       >
                          <span className="material-symbols-outlined text-sm">
                            {copiedKey === gift.value ? 'check_circle' : 'content_copy'}
                          </span>
                          <span>{copiedKey === gift.value ? 'IBAN Copiado' : 'Copiar IBAN'}</span>
                       </button>
                    </div>
                 )}
              </div>
            ))}
          </FadeInSection>
        )}

        {/* 10. GALLERY (Horizontal Scroll) */}
        {event.gallery && (
          <FadeInSection className="w-full mb-24 pl-6">
            <h3 className="text-[#BF9B30] font-bold uppercase tracking-widest text-xs mb-4 text-left">Nossa Galeria</h3>
            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
               {event.gallery.map((img, i) => (
                 <img key={i} src={img} className="h-48 w-36 object-cover rounded-lg border border-[#BF9B30]/20 grayscale hover:grayscale-0 transition-all duration-500" />
               ))}
            </div>
          </FadeInSection>
        )}

        {/* Gold Action Button (Fixed Bottom Bar) */}
        <div className="fixed bottom-0 left-0 w-full bg-[#0F1419]/95 backdrop-blur-md border-t border-[#BF9B30]/20 p-4 z-50 flex items-center justify-center">
           <Button 
             onClick={onRSVP}
             className="w-full max-w-md bg-[#BF9B30] text-[#0F1419] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors py-4 shadow-[0_0_20px_rgba(191,155,48,0.3)] flex items-center justify-center gap-2"
           >
             <span>RESPONDER</span>
             <span className="material-symbols-outlined text-sm">mail</span>
           </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SHARED: RSVP FORM
// ============================================================================
const RSVPForm: React.FC<{ event: EventDetails; onClose: () => void }> = ({ event, onClose }) => {
   const isLuxury = event.layoutMode === 'LUXURY' || event.layoutMode === 'INDUSTRIAL';
   const [status, setStatus] = useState<'yes' | 'no'>('yes');
   
   return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
      <p className={`text-sm ${isLuxury ? 'text-gray-400' : 'opacity-70'}`}>
        Por favor, confirme sua presença para o evento de <strong>{event.title}</strong>.
      </p>
      
      <div className="flex gap-4">
         <button 
           type="button"
           onClick={() => setStatus('yes')}
           className={`flex-1 py-3 border rounded-lg text-sm font-bold transition-all ${status === 'yes' 
             ? (isLuxury ? 'bg-[#BF9B30] text-black border-[#BF9B30]' : 'bg-brand-blue text-white border-brand-blue') 
             : (isLuxury ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-200 text-gray-400')}`}
         >
           Sim, estarei lá
         </button>
         <button 
           type="button"
           onClick={() => setStatus('no')}
           className={`flex-1 py-3 border rounded-lg text-sm font-bold transition-all ${status === 'no' 
             ? (isLuxury ? 'bg-red-900/80 text-white border-red-800' : 'bg-red-50 text-red-600 border-red-200') 
             : (isLuxury ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-200 text-gray-400')}`}
         >
           Não poderei ir
         </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${isLuxury ? 'text-[#BF9B30]' : 'opacity-50'}`}>Nome Completo</label>
          <input type="text" className={`w-full bg-transparent border-b py-2 focus:outline-none ${isLuxury ? 'border-gray-600 text-white focus:border-[#BF9B30]' : 'border-gray-300 text-black focus:border-black'}`} placeholder="Seu nome" required />
        </div>
        
        {status === 'yes' && (
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${isLuxury ? 'text-[#BF9B30]' : 'opacity-50'}`}>Acompanhantes</label>
            <select className={`w-full bg-transparent border-b py-2 focus:outline-none ${isLuxury ? 'border-gray-600 text-white focus:border-[#BF9B30] [&>option]:text-black' : 'border-gray-300 text-black focus:border-black'}`}>
              <option value="0">Apenas eu</option>
              <option value="1">+1 Acompanhante</option>
              <option value="2">+2 Acompanhantes</option>
            </select>
          </div>
        )}

        <div>
           <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${isLuxury ? 'text-[#BF9B30]' : 'opacity-50'}`}>Mensagem aos Noivos (Opcional)</label>
           <textarea 
             rows={3}
             className={`w-full bg-transparent border rounded-lg p-3 focus:outline-none text-sm ${isLuxury ? 'border-gray-600 text-white focus:border-[#BF9B30]' : 'border-gray-200 text-black focus:border-black'}`}
             placeholder={status === 'yes' ? "Mal posso esperar..." : "Desejo muitas felicidades..."} 
           />
        </div>
      </div>

      <Button type="submit" fullWidth variant={isLuxury ? 'outline' : 'primary'} className={isLuxury ? 'border-[#BF9B30] text-[#BF9B30] hover:bg-[#BF9B30] hover:text-black font-bold uppercase tracking-widest' : ''}>
         {status === 'yes' ? 'ENVIAR RESPOSTA' : 'ENVIAR JUSTIFICATIVA'}
      </Button>
    </form>
   );
};

export default InvitationView;
