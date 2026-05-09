
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getEventById } from '../../mockData';
import { EventDetails } from '../../types';
import { TocaPlayer } from '../../components/music/TocaPlayer';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { Button } from '../../components/ui/Button';
import { QRCodeSVG } from 'qrcode.react';
import { Users, CalendarClock, Mail, PartyPopper, Shirt, Camera, Music4, Smile, ArrowLeft } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useFirebase, db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { doc, getDoc, setDoc, getCountFromServer, collection, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';

// ============================================================================
// COMPONENT: INVITATION CONTROLLER
// Decides which layout to render based on event.layoutMode
// ============================================================================
const InvitationView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useFirebase();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const handleUseTemplate = (e: React.MouseEvent) => {
      if (userProfile && userProfile.plan === 'Essencial' && event.layoutMode !== 'MODERN') {
          e.preventDefault();
          toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl flex flex-col border border-slate-100 overflow-hidden`}>
                  <div className="p-4">
                      <h3 className="font-bold text-slate-900 mb-1">Modelo Exclusivo</h3>
                      <p className="text-sm text-slate-500">O modelo {event.layoutMode} é exclusivo para planos Premium e Business.</p>
                  </div>
                  <div className="flex border-t border-slate-100">
                      <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
                      <div className="w-px bg-slate-100" />
                      <button onClick={() => { toast.dismiss(t.id); navigate('/plans'); }} className="flex-1 px-4 py-3 text-sm font-bold text-brand-blue hover:bg-slate-50 transition-colors">Ver Planos</button>
                  </div>
              </div>
          ), { duration: 5000 });
      }
  };
  const [isRSVPOpen, setRSVPOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // First check mock data
    const mockEvent = getEventById(id || '');
    if (mockEvent) {
      setEvent(mockEvent);
      setLoading(false);
      return;
    }

    // Check 'created' flow
    const isCreatedEvent = id === 'created';
    if (isCreatedEvent) {
      const createdEventData = JSON.parse(sessionStorage.getItem('createdEventData') || '{}');
      setEvent({
        id: 'created',
        type: 'WEDDING',
        layoutMode: 'MODERN',
        title: createdEventData.title || 'Novos Noivos',
        hosts: 'Convidam',
        date: createdEventData.date || 'Data a definir',
        isoDate: createdEventData.date || new Date().toISOString(),
        time: createdEventData.time || '19:00',
        locationName: createdEventData.locationName || createdEventData.location || 'Local a definir',
        address: createdEventData.address || 'Luanda, Angola', 
        heroImage: 'https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop',
        description: createdEventData.description || 'Estamos ansiosos para celebrar nosso amor com você!',
        musicTrack: 'Turning Page - Sleeping At Last',
        timeline: createdEventData.timeline || [
            { time: createdEventData.time || '19:00', title: 'Cerimônia', description: createdEventData.location || "Local do Evento" }
        ],
        dressCode: (createdEventData.dressCodeTitle || createdEventData.dressCodeDescription) ? { title: createdEventData.dressCodeTitle, description: createdEventData.dressCodeDescription } : undefined,
        gifts: [ { type: 'IBAN', title: 'Presente', description: 'Dados bancários para contribuição', value: createdEventData.iban || '', accountName: createdEventData.accountName || '', bankName: createdEventData.bankName || '' } ],
        mapLink: createdEventData.location || '#',
        phone: createdEventData.contactPhone,
        ownerId: user?.uid
      });
      setLoading(false);
      return;
    }

    // Fetch from firestore
    const fetchEvent = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          let finalWhiteLabelName = data.whiteLabelName;
          let finalWhiteLabelLogo = data.whiteLabelLogo;
          
          if (data.ownerId && (!finalWhiteLabelName || !finalWhiteLabelLogo) && (data.plan === 'Business' || data.plan === 'Corporate')) {
              try {
                  const ownerSnap = await getDoc(doc(db, 'users', data.ownerId));
                  if (ownerSnap.exists()) {
                      const ownerData = ownerSnap.data();
                      finalWhiteLabelName = finalWhiteLabelName || ownerData.whiteLabelName;
                      finalWhiteLabelLogo = finalWhiteLabelLogo || ownerData.whiteLabelLogo;
                  }
              } catch(err) {
                  console.warn("Could not fetch owner data for white label", err);
              }
          }

          setEvent({
            ...data,
            id: docSnap.id,
            whiteLabelName: finalWhiteLabelName,
            whiteLabelLogo: finalWhiteLabelLogo,
            type: data.type || 'WEDDING',
            layoutMode: data.layoutMode || 'MODERN',
            heroImage: data.heroImage || 'https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop',
            musicTrack: data.musicTrack || 'Turning Page - Sleeping At Last',
            isoDate: data.date || new Date().toISOString(),
            timeline: data.timeline || [{ time: data.time || '19:00', title: 'Cerimônia', description: data.location || "Local" }],
            gifts: data.iban ? [ { type: 'IBAN', title: 'Presente', description: 'Dados bancários para contribuição', value: data.iban || '', accountName: data.accountName || '', bankName: data.bankName || '' } ] : data.gifts,
            dressCode: (data.dressCodeTitle || data.dressCodeDescription) ? { title: data.dressCodeTitle, description: data.dressCodeDescription } : data.dressCode,
            address: data.address || 'Luanda, Angola',
            locationName: data.locationName || data.location || 'Local do Evento',
            mapLink: data.location || '#',
            phone: data.contactPhone || ''
          });
        }
      } catch (error: any) {
         if(!error.message?.includes("Missing or insufficient permissions")) {
            handleFirestoreError(error, OperationType.GET, `events/${id}`);
         } else {
            console.warn("Guest attempted to access private event or missing rules");
         }
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id, user]);

  if (loading) return <div className="p-10 text-center font-display text-brand-blue">Carregando convite...</div>;
  if (!event) return <div className="p-10 text-center font-display text-brand-blue">Evento não encontrado ou fechado.</div>;

  // Simulate Guest Name (In a real app, this comes from URL token/param)
  const guestName = "Família Silva";

  const isTemplate = !!getEventById(event.id);

  // Check if owner is viewing
  const isOwner = user && event.ownerId === user.uid && !isTemplate;

  // Common Props passed to all layouts
  const props = { event, onRSVP: () => setRSVPOpen(true), guestName };

  return (
    <>
      <TocaPlayer trackName={event.musicTrack} isDark={event.layoutMode === 'LUXURY' || event.layoutMode === 'INDUSTRIAL'} />
      
      {isTemplate && (
        <Link to="/" className="fixed top-4 left-4 z-[110] flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-sm text-slate-800 rounded-full shadow-xl hover:bg-white transition-all border border-slate-200">
           <ArrowLeft size={16} />
        </Link>
      )}

      {isTemplate && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[85%] md:w-[90%] max-w-lg bg-white/95 backdrop-blur-xl border border-brand-blue/20 rounded-2xl p-4 shadow-[0_10px_40px_-10px_rgba(0,40,100,0.2)] flex items-center justify-between">
           <div className="flex flex-col mr-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1 text-left">Pré-visualização</span>
              <span className="text-sm font-serif font-bold text-brand-blue leading-none text-left flex items-center gap-1">
                  Modelo {event.layoutMode}
                  {event.layoutMode !== 'MODERN' && (
                      <span className="text-[9px] bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full">PRO</span>
                  )}
              </span>
           </div>
           <Link 
              onClick={handleUseTemplate}
              to={`/create-invitation?template=${event.layoutMode}`}
              className="bg-brand-blue text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-blue/30 hover:bg-brand-blue/90 hover:scale-105 transition-all text-center flex-shrink-0"
           >
              Usar Modelo
           </Link>
        </div>
      )}

      {isOwner && (
        <div className="fixed top-4 left-4 z-50 flex gap-2">
           <Link to="/" className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-slate-800 px-4 py-2 rounded-full shadow-xl hover:bg-white transition-all font-display text-sm font-bold border border-slate-200">
              <ArrowLeft size={16} /> Voltar para Início
           </Link>
           {event.id !== 'created' && (
             <Link to={`/dashboard/${event.id}`} className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-full shadow-xl hover:bg-brand-blue/90 transition-all font-display text-sm font-bold">
                Gerenciar RSVP
             </Link>
           )}
        </div>
      )}

      {/* Dynamic Layout Rendering */}
      {event.layoutMode === 'CLASSIC' && <ClassicLayout {...props} />}
      {event.layoutMode === 'ESSENTIAL' && <EssentialLayout {...props} />}
      {event.layoutMode === 'MODERN' && <ModernLayout {...props} />}
      {event.layoutMode === 'LUXURY' && <LuxuryLayout {...props} />}
      {event.layoutMode === 'GARDEN' && <GardenLayout {...props} />}
      {event.layoutMode === 'RUSTIC' && <RusticLayout {...props} />}
      {event.layoutMode === 'INDUSTRIAL' && <IndustrialLayout {...props} />}

      <div className="w-full flex flex-col items-center justify-center py-10 pb-32 text-xs font-bold tracking-widest uppercase text-slate-500 gap-3 z-10 relative">
        {event.whiteLabelName && (
           <span className="opacity-70">Powered by</span>
        )}
        {event.whiteLabelLogo && (
            <img src={event.whiteLabelLogo} alt={event.whiteLabelName} className="h-10 object-contain" />
        )}
        <span>{event.whiteLabelName ? event.whiteLabelName : 'Criado com InoEvents'}</span>
      </div>

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
// LAYOUT ESSENTIAL: CLEAN & FAST
// ============================================================================
const EssentialLayout: React.FC<{ event: EventDetails; onRSVP: () => void; guestName: string }> = ({ event, onRSVP }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-display pb-28">
      {/* Hero Image */}
      <div className="h-[40vh] w-full overflow-hidden">
        <img src={event.heroImage} className="w-full h-full object-cover" />
      </div>

      <div className="max-w-xl mx-auto px-6 -mt-16 relative z-10 space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
          <h1 className="text-3xl font-bold text-brand-blue mb-2">{event.title}</h1>
          <p className="text-sm text-slate-500 mb-6">{event.date} às {event.time}</p>
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-4">
            <h2 className="font-bold text-brand-blue uppercase tracking-widest text-xs text-center border-b border-slate-100 pb-2">Contagem Regressiva</h2>
            <CountdownTimer targetDate={event.isoDate} colorClass="text-brand-blue" />
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-4">
            <h2 className="font-bold text-brand-blue">Informações</h2>
            <p className="text-sm text-slate-600">{event.description}</p>
            <Button onClick={() => window.open(event.mapLink || '#', '_blank')} variant="navy" fullWidth>Localização (Maps)</Button>
            {event.phone && (
              <Button onClick={() => window.open(`https://wa.me/${event.phone.replace(/\D/g, '')}?text=Olá!`, '_blank')} variant="outline" fullWidth className="border-green-500 text-green-700 hover:bg-green-50">Falar no WhatsApp</Button>
            )}
        </div>
      </div>
      
      <GuestManual />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <Button onClick={onRSVP} variant="navy" fullWidth>Confirmar Presença</Button>
      </div>
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
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Contagem Regressiva</h3>
            <CountdownTimer targetDate={event.isoDate} colorClass="text-slate-800" />
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

         {event.gallery && (
            <FadeInSection>
               <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Nossa Galeria</h3>
               <div className="grid grid-cols-2 gap-4">
                  {event.gallery.map((img, i) => (
                     <div key={i} className={`rounded-xl overflow-hidden shadow-sm ${i === 0 ? 'col-span-2' : ''}`}>
                        <img src={img} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                     </div>
                  ))}
               </div>
            </FadeInSection>
         )}
      </div>

      <GuestManual />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button onClick={onRSVP} className="bg-brand-blue text-white px-10 py-4 rounded-full font-sans font-bold shadow-2xl shadow-brand-blue/40 uppercase tracking-widest text-xs hover:scale-105 transition-transform">
           Confirmar Presença
        </button>
      </div>
    </div>
  );
};


// ============================================================================
// HELPER: MANUAL DO CONVIDADO
// ============================================================================
const GuestManual: React.FC<{ isDark?: boolean }> = ({ isDark }) => {
    const points = [
        { icon: Users, text: "Contamos com a sua presença!" },
        { icon: CalendarClock, text: "Seja pontual!" },
        { icon: Mail, text: "Convidado não convida!" },
        { icon: PartyPopper, text: "Comemore a nossa união!" },
        { icon: Shirt, text: "Branco é a cor da noiva!" },
        { icon: Camera, text: "Faça muitas fotos e stories!" },
        { icon: Music4, text: "É obrigatório dançar muito!" },
        { icon: Smile, text: "Sorria e seja muito feliz!" },
    ];
    
    const textColor = isDark ? "text-gray-300" : "text-gray-600";
    const iconColor = isDark ? "text-white/70" : "text-[#C2B280]";
    const headingColor = isDark ? "text-white" : "text-[#C2B280]";
    const bgColor = isDark ? "bg-black/20 border-white/10" : "bg-white border-gray-100";
    
    return (
        <FadeInSection className={`py-16 md:py-24 px-6 ${bgColor} border-t mt-12 text-center`}>
            <h3 className={`text-3xl font-serif ${headingColor} mb-12`}>Manual do Convidado</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                {points.map((p, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <p.icon className={`w-8 h-8 ${iconColor} mb-4`} strokeWidth={1} />
                        <p className={`text-sm ${textColor}`}>{p.text}</p>
                    </div>
                ))}
            </div>
            <p className={`mt-12 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} italic`}>Agradecemos o carinho e a compreensão!</p>
        </FadeInSection>
    )
}

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
      {event.dressCode && (
         <FadeInSection className="py-16 bg-white text-center px-6 border-b border-gray-100">
             <span className="font-display text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-4 block">Dress Code</span>
             <h4 className="text-2xl font-serif mb-4 text-[#1a1a1a]">{event.dressCode.title}</h4>
             <p className="text-gray-500 max-w-md mx-auto leading-relaxed font-light">
                 {event.dressCode.description}
             </p>
         </FadeInSection>
      )}

      {/* 7. GIFTS / IBAN Section */}
      {event.gifts && event.gifts[0].value && (
         <FadeInSection className="py-12 border-t border-gray-100 mt-12 text-center px-6">
            <span className="font-display text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-4 block">Presente</span>
            <h4 className="text-xl font-serif mb-6">Querido(a) convidado(a)!</h4>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
              {event.gifts[0].description} Caso queira nos presentear, agradecemos desde já o seu lindo gesto e gostaríamos que o fizesse por transferência bancária para o IBAN indicado abaixo:
            </p>
            
            <div className="bg-[#F4F4F4] p-6 rounded-2xl border border-gray-200 mb-8 max-w-sm mx-auto shadow-inner">
               <p className="text-xl md:text-2xl font-mono text-gray-900 tracking-widest mb-4">{event.gifts[0].value}</p>
               <div className="space-y-1">
                 <p className="text-xs text-gray-500 uppercase tracking-widest">Titular</p>
                 <p className="text-sm text-gray-800 font-bold mb-2">{event.gifts[0].accountName}</p>
                 <p className="text-xs text-gray-500 uppercase tracking-widest">Banco</p>
                 <p className="text-sm text-gray-800 font-bold">{event.gifts[0].bankName}</p>
               </div>
            </div>

            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
               Os comprovativos podem ser enviados via WhatsApp para o número {event.phone}. <br/>
               Muito obrigado(a)! <br/>
               Deus lhe abençoe sempre!
            </p>
            
            <button 
               onClick={() => {navigator.clipboard.writeText(event.gifts![0].value); toast.success('IBAN Copiado!')}}
               className="px-8 py-3 border border-[#C2B280] text-[#C2B280] text-xs font-bold uppercase tracking-widest hover:bg-[#C2B280] hover:text-white transition-colors"
            >
               Copiar IBAN
            </button>
         </FadeInSection>
      )}



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

      {/* 8. MANUAL DO CONVIDADO */}
      <GuestManual />

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

      {/* MANUAL DO CONVIDADO */}
      <GuestManual />

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
                 onClick={() => {navigator.clipboard.writeText(event.gifts![0].value); toast.success('IBAN Copiado!')}}
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
          <p className="text-xl font-bold mt-2 mb-10">{guestName}</p>
          
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#8D6E63] mb-6 border-t border-[#D7CCC8] pt-6 inline-block">Contagem Regressiva</p>
          <CountdownTimer targetDate={event.isoDate} colorClass="text-[#4E342E]" />
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
                onClick={() => {navigator.clipboard.writeText(event.gifts![0].value); toast.success('IBAN Copiado!')}}
                className="mt-4 px-6 py-2 border border-[#5D4037] text-[#5D4037] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#5D4037] hover:text-white transition-colors"
             >
                Copiar IBAN
             </button>
          </FadeInSection>
       </div>

       {/* GALLERY */}
       {event.gallery && (
          <FadeInSection className="max-w-5xl mx-auto px-6 mb-24">
             <h3 className="text-center font-serif text-3xl text-[#4E342E] mb-8">Nossa Galeria</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {event.gallery.map((img, i) => (
                   <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-sm">
                      <img src={img} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                   </div>
                ))}
             </div>
          </FadeInSection>
       )}
       
       <GuestManual />
 
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
               <p className="text-xl md:text-2xl font-light leading-relaxed mb-10">
                  {event.description}
               </p>
               <span className="text-xs text-gray-400 uppercase tracking-widest mb-4 block">Contagem Regressiva</span>
               <CountdownTimer targetDate={event.isoDate} colorClass="text-white" />
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
       
       {/* GALLERY */}
       {event.gallery && (
          <div className="p-8 md:p-16 border-b border-white/20">
             <h3 className="text-2xl font-bold uppercase mb-8 border-l-4 border-white pl-4">Galeria</h3>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                {event.gallery.map((img, i) => (
                   <div key={i} className="aspect-square overflow-hidden bg-white/5">
                      <img src={img} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                   </div>
                ))}
             </div>
          </div>
       )}

       <GuestManual isDark />

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
          <FadeInSection className="w-full mb-12 pl-6">
            <h3 className="text-[#BF9B30] font-bold uppercase tracking-widest text-xs mb-4 text-left">Nossa Galeria</h3>
            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
               {event.gallery.map((img, i) => (
                 <img key={i} src={img} className="h-48 w-36 object-cover rounded-lg border border-[#BF9B30]/20 grayscale hover:grayscale-0 transition-all duration-500" />
               ))}
            </div>
          </FadeInSection>
        )}

        <div className="w-full border-t border-[#BF9B30]/30 mt-8">
           <GuestManual isDark />
        </div>

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
const RSVPForm: React.FC<{ event: EventDetails | any; onClose: () => void }> = ({ event, onClose }) => {
   const isLuxury = event.layoutMode === 'LUXURY' || event.layoutMode === 'INDUSTRIAL';
   const [status, setStatus] = useState<'yes' | 'no'>('yes');
   const [isConfirmed, setIsConfirmed] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [guestId, setGuestId] = useState('');
   const [isFull, setIsFull] = useState(false);
   const [checkingCapacity, setCheckingCapacity] = useState(true);
   const [formData, setFormData] = useState({
      name: '',
      phone: '',
      companions: '0',
      message: ''
   });
   
   useEffect(() => {
       const savedRSVP = localStorage.getItem(`rsvp_${event.id}`);
       if (savedRSVP) {
           const parsed = JSON.parse(savedRSVP);
           setStatus(parsed.status);
           setGuestId(parsed.guestId);
           setFormData(prev => ({ ...prev, name: parsed.name, phone: parsed.phone || '' }));
           setIsConfirmed(true);
           setCheckingCapacity(false);
           return;
       }

       const checkCapacity = async () => {
           try {
               const q = query(collection(db, 'events', event.id, 'guests'), where('status', '==', 'CONFIRMED'));
                const snap = await getCountFromServer(q);
                const count = snap.data().count;

                if (event.plan === 'Essencial' || !event.plan) {
                    if (count >= 100) setIsFull(true);
                } else if (event.plan === 'Premium') {
                    if (count >= 500) setIsFull(true);
                } else if (event.plan === 'Business') {
                    if (count >= 5000) setIsFull(true);
                }
           } catch(e) {
               console.error(e);
           } finally {
               setCheckingCapacity(false);
           }
       };
       checkCapacity();
   }, [event.id]);

   const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       setIsSubmitting(true);
       try {
           const normalizedPhone = formData.phone.trim().replace(/\D/g, ''); // Extract only digits
           
           // Check if guest already exists by phone
           const guestsRef = collection(db, 'events', event.id, 'guests');
           const q = query(guestsRef, where('phone', '==', normalizedPhone));
           
           // We need to import getDocs if not imported already. Let's assume we can get it from firebase/firestore which is already imported.
           // Actually, let's just make sure getDocs is imported at the top of the file. I'll add it in a subsequent edit if needed.
           // Wait, I can just use getDocs from firebase/firestore.
           
           // Actually wait, let me just add getDocs to the imports if needed. Let me edit the imports too.
           const { getDocs } = await import('firebase/firestore');
           const snap = await getDocs(q);
           
           let finalGuestId = '';
           
           if (!snap.empty) {
               // Update existing guest
               const existingDoc = snap.docs[0];
               finalGuestId = existingDoc.id;
               const guestRef = doc(db, 'events', event.id, 'guests', finalGuestId);
               await setDoc(guestRef, {
                   name: formData.name,
                   phone: normalizedPhone,
                   status: status === 'yes' ? 'CONFIRMED' : 'DECLINED',
                   adults: status === 'yes' ? (1 + Number(formData.companions)) : 0,
                   children: 0,
                   message: formData.message,
                   updatedAt: new Date().toISOString()
               }, { merge: true });
           } else {
               // Create new guest
               finalGuestId = "gst_" + Math.random().toString(36).substr(2, 9);
               const guestRef = doc(db, 'events', event.id, 'guests', finalGuestId);
               await setDoc(guestRef, {
                   name: formData.name,
                   phone: normalizedPhone,
                   status: status === 'yes' ? 'CONFIRMED' : 'DECLINED',
                   adults: status === 'yes' ? (1 + Number(formData.companions)) : 0,
                   children: 0,
                   message: formData.message,
                   createdAt: new Date().toISOString()
               });
           }
           
           setGuestId(finalGuestId);
           setIsConfirmed(true);
           
           localStorage.setItem(`rsvp_${event.id}`, JSON.stringify({
               status: status === 'yes' ? 'yes' : 'no',
               guestId: finalGuestId,
               name: formData.name,
               phone: normalizedPhone
           }));
       } catch (err: any) {
           console.error("RSVP Error:", err);
           if (!err.message?.includes("Missing or insufficient permissions")) {
               handleFirestoreError(err, OperationType.WRITE, `events/${event.id}/guests`);
           }
           toast.error("Houve um erro ao enviar seu RSVP. Tente novamente.");
       } finally {
           setIsSubmitting(false);
       }
   };

   const handleDownloadTicket = async () => {
       const node = document.getElementById('qr-ticket');
       if (node) {
           try {
               const dataUrl = await toPng(node, { quality: 1, backgroundColor: '#ffffff' });
               const link = document.createElement('a');
               link.download = `convite-${event.title.replace(/\s+/g, '-').toLowerCase()}.png`;
               link.href = dataUrl;
               link.click();
           } catch (err) {
               console.error('Oops, something went wrong!', err);
               toast.error("Falha ao transferir o convite. Tente novamente.");
           }
       }
   };

   if (checkingCapacity) {
     return (
       <div className="text-center p-6 space-y-6 flex flex-col items-center justify-center min-h-[300px]">
           <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
           <p className="text-sm opacity-70">A verificar disponibilidade...</p>
       </div>
     );
   }

   if (isFull) {
       return (
         <div className="text-center p-6 space-y-6 flex flex-col items-center justify-center min-h-[250px]">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto">
                <Users size={32} />
             </div>
             <h3 className="font-bold text-lg text-red-600">Lista Cheia!</h3>
             <p className="text-sm opacity-80">A lista de convidados para este evento atingiu a capacidade máxima.</p>
             <Button onClick={onClose} fullWidth variant={isLuxury ? 'outline' : 'primary'}>Fechar</Button>
         </div>
       );
   }

   if (isConfirmed) {
     return (
       <div className="text-center p-6 space-y-6">
          {status === 'yes' ? (
              <div className="flex flex-col items-center gap-4">
                <div id="qr-ticket" className="w-64 mx-auto bg-white p-6 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-4 text-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-brand-blue" />
                    <h4 className="font-bold text-center text-lg leading-tight mt-2">{event.title}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">{event.date} • {event.time}</p>
                    {(!event.plan || event.plan === 'Essencial') ? (
                        <QRCodeSVG value={`${window.location.origin}/#/invite/${event.id}`} size={160} />
                    ) : (
                        <QRCodeSVG value={`${window.location.origin}/#/checkin/${event.id}?guest=${guestId}`} size={160} />
                    )}
                    <p className="text-xs font-bold bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">{formData.name}</p>
                </div>
                <div>
                   <h3 className="font-bold text-lg">Confirmação Recebida!</h3>
                   <p className="text-sm opacity-70 mb-2">Apresente este QRCode na recepção do evento.</p>
                </div>
                <Button onClick={handleDownloadTicket} className="bg-slate-800 text-white hover:bg-black font-bold uppercase tracking-widest text-xs h-12 w-full rouded-xl">
                   Baixar Convite
                </Button>
              </div>
          ) : (
              <>
                  <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                      <Smile size={32} />
                  </div>
                  <h3 className="font-bold text-lg">Obrigado por nos avisar!</h3>
                  <p className="text-sm opacity-70">Sentiremos sua falta.</p>
              </>
          )}
          <Button onClick={onClose} fullWidth variant={isLuxury ? 'outline' : 'secondary'}>Fechar Janela</Button>
       </div>
     );
   }

   return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <p className={`text-sm ${isLuxury ? 'text-gray-400' : 'opacity-70'}`}>
        Por favor, confirme sua presence para o evento de <strong>{event.title}</strong>.
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
          <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className={`w-full bg-transparent border-b py-2 focus:outline-none ${isLuxury ? 'border-gray-600 text-white focus:border-[#BF9B30]' : 'border-gray-300 text-black focus:border-black'}`} placeholder="Seu nome" />
        </div>

        <div>
          <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${isLuxury ? 'text-[#BF9B30]' : 'opacity-50'}`}>WhatsApp (Apenas números)</label>
          <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={`w-full bg-transparent border-b py-2 focus:outline-none ${isLuxury ? 'border-gray-600 text-white focus:border-[#BF9B30]' : 'border-gray-300 text-black focus:border-black'}`} placeholder="Ex: 11999999999" pattern="[0-9]*" />
          <p className="text-[10px] opacity-50 mt-1">Seu número garante que não perdes seu convite.</p>
        </div>
        
        {status === 'yes' && (
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${isLuxury ? 'text-[#BF9B30]' : 'opacity-50'}`}>Acompanhantes</label>
            <select value={formData.companions} onChange={e => setFormData({...formData, companions: e.target.value})} className={`w-full bg-transparent border-b py-2 focus:outline-none ${isLuxury ? 'border-gray-600 text-white focus:border-[#BF9B30] [&>option]:text-black' : 'border-gray-300 text-black focus:border-black'}`}>
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
             value={formData.message} 
             onChange={e => setFormData({...formData, message: e.target.value})}
             className={`w-full bg-transparent border rounded-lg p-3 focus:outline-none text-sm ${isLuxury ? 'border-gray-600 text-white focus:border-[#BF9B30]' : 'border-gray-200 text-black focus:border-black'}`}
             placeholder={status === 'yes' ? "Mal posso esperar..." : "Desejo muitas felicidades..."} 
           />
        </div>
      </div>

      <Button disabled={isSubmitting} type="submit" fullWidth variant={isLuxury ? 'outline' : 'primary'} className={isLuxury ? 'border-[#BF9B30] text-[#BF9B30] hover:bg-[#BF9B30] hover:text-black font-bold uppercase tracking-widest mt-4' : 'mt-4'}>
         {isSubmitting ? 'Enviando...' : (status === 'yes' ? 'ENVIAR RESPOSTA' : 'ENVIAR JUSTIFICATIVA')}
      </Button>
    </form>
   );
};

export default InvitationView;
