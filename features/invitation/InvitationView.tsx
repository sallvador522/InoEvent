
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
import { GalleryLightbox } from '../../components/GalleryLightbox';
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
      if (userProfile && userProfile.plan === 'Essencial' && !['MODERN', 'CLASSIC', 'ESSENTIAL'].includes(event.layoutMode)) {
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

  const handleDownloadDesign = async () => {
      const node = document.getElementById('invitation-capture-node');
      if (!node) return;
      
      const toastId = toast.loading('Gerando imagem do convite em alta qualidade...');
      try {
          const dataUrl = await toPng(node, { 
              quality: 1, 
              backgroundColor: '#ffffff',
              pixelRatio: 2,
              filter: (n) => {
                  // Remove text nodes check that don't have classList
                  if (n && (n as Element).classList) {
                      const classes = (n as Element).classList;
                      if (classes.contains('fixed') && (classes.contains('z-50') || classes.contains('bottom-0') || classes.contains('bottom-6') || classes.contains('bottom-8'))) {
                          return false; // Exclude floating action elements like RSVP
                      }
                  }
                  return true;
              }
          });
          const link = document.createElement('a');
          link.download = `convite-${event?.title?.replace(/\s+/g, '-').toLowerCase() || 'design'}.png`;
          link.href = dataUrl;
          link.click();
          toast.success('Imagem baixada com sucesso!', { id: toastId });
      } catch (err) {
          toast.error('Erro ao baixar imagem do convite.', { id: toastId });
          console.error(err);
      }
  };

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
        gifts: (createdEventData.gifts && createdEventData.gifts.length > 0) ? createdEventData.gifts : (createdEventData.iban ? [ { type: 'IBAN', title: createdEventData.giftTitle || 'Presente', description: createdEventData.giftDescription || 'Dados bancários para contribuição', value: createdEventData.iban || '', accountName: createdEventData.accountName || '', bankName: createdEventData.bankName || '' } ] : []),
        giftTitle: (createdEventData.gifts && createdEventData.gifts.length > 0) ? createdEventData.gifts[0].title : createdEventData.giftTitle,
        giftDescription: (createdEventData.gifts && createdEventData.gifts.length > 0) ? createdEventData.gifts[0].description : createdEventData.giftDescription,
        iban: (createdEventData.gifts && createdEventData.gifts.length > 0) ? createdEventData.gifts[0].value : createdEventData.iban,
        bankName: (createdEventData.gifts && createdEventData.gifts.length > 0) ? createdEventData.gifts[0].bankName : createdEventData.bankName,
        accountName: (createdEventData.gifts && createdEventData.gifts.length > 0) ? createdEventData.gifts[0].accountName : createdEventData.accountName,
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
            gifts: (data.gifts && data.gifts.length > 0) ? data.gifts : (data.iban ? [ { type: 'IBAN', title: data.giftTitle || 'Presente', description: data.giftDescription || 'Dados bancários para contribuição', value: data.iban || '', accountName: data.accountName || '', bankName: data.bankName || '' } ] : []),
            giftTitle: (data.gifts && data.gifts.length > 0) ? data.gifts[0].title : data.giftTitle,
            giftDescription: (data.gifts && data.gifts.length > 0) ? data.gifts[0].description : data.giftDescription,
            iban: (data.gifts && data.gifts.length > 0) ? data.gifts[0].value : data.iban,
            bankName: (data.gifts && data.gifts.length > 0) ? data.gifts[0].bankName : data.bankName,
            accountName: (data.gifts && data.gifts.length > 0) ? data.gifts[0].accountName : data.accountName,
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
  const props = { 
    event, 
    onRSVP: () => setRSVPOpen(true), 
    guestName,
    onLikeUpdate: (newGallery: any) => setEvent({ ...event, gallery: newGallery }) 
  };

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
                  {!['MODERN', 'CLASSIC', 'ESSENTIAL'].includes(event.layoutMode) && (
                      <span className="text-[9px] bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full">PRO</span>
                  )}
              </span>
           </div>
           <Link 
              onClick={handleUseTemplate}
              to={(event?.type === 'BRIDAL_SHOWER' || event?.layoutMode?.startsWith('BRIDAL_')) ? `/create-bridal?template=${event.layoutMode}` : `/create-invitation?template=${event.layoutMode}`}
              className="bg-brand-blue text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-blue/30 hover:bg-brand-blue/90 hover:scale-105 transition-all text-center flex-shrink-0"
           >
              Usar Modelo
           </Link>
        </div>
      )}

      {isOwner && (
        <div className="fixed top-4 left-4 z-50 flex flex-wrap gap-2">
           <Link to="/" className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-slate-800 px-4 py-2 rounded-full shadow-xl hover:bg-white transition-all font-display text-sm font-bold border border-slate-200">
              <ArrowLeft size={16} /> <span className="hidden md:inline">Voltar para Início</span>
           </Link>
           {isOwner && (
             <button onClick={handleDownloadDesign} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-xl hover:bg-emerald-700 transition-all font-display text-sm font-bold">
                <Camera size={16} /> {(event?.type === 'BRIDAL_SHOWER' || event?.layoutMode?.startsWith('BRIDAL_')) ? 'Baixar Convite do Chá' : 'Baixar Imagem'}
             </button>
           )}
           {event.id !== 'created' && (
             <Link to={`/dashboard/${event.id}`} className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-full shadow-xl hover:bg-brand-blue/90 transition-all font-display text-sm font-bold">
                Gerenciar RSVP
             </Link>
           )}
        </div>
      )}

      {/* Dynamic Layout Rendering */}
      <div id="invitation-capture-node" className="w-full relative bg-white">
          {event.layoutMode === 'CLASSIC' && <ClassicLayout {...props} />}
          {event.layoutMode === 'ESSENTIAL' && <EssentialLayout {...props} />}
          {event.layoutMode === 'MODERN' && <ModernLayout {...props} />}
          {event.layoutMode === 'LUXURY' && <LuxuryLayout {...props} />}
          {event.layoutMode === 'GARDEN' && <GardenLayout {...props} />}
          {event.layoutMode === 'RUSTIC' && <RusticLayout {...props} />}
          {event.layoutMode === 'INDUSTRIAL' && <IndustrialLayout {...props} />}
          {event.layoutMode?.startsWith('BRIDAL_') && <BridalStandardLayout {...props} />}
          
          <div className="w-full flex flex-col items-center justify-center py-10 pb-32 text-xs font-bold tracking-widest uppercase text-slate-500 gap-3 z-10 relative">
            {event.whiteLabelName && (
               <span className="opacity-70">Powered by</span>
            )}
            {event.whiteLabelLogo && (
                <img src={event.whiteLabelLogo} alt={event.whiteLabelName} className="h-10 object-contain" />
            )}
            <span>{event.whiteLabelName ? event.whiteLabelName : 'Criado com InoEvents'}</span>
          </div>
      </div>

      {/* Shared RSVP Modal */}
      <BottomSheet 
        isOpen={isRSVPOpen} 
        onClose={() => setRSVPOpen(false)} 
        title={getRSVPModalTitle(event)}
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
// DEFINITIONS
// ============================================================================
export interface LayoutProps {
  event: EventDetails;
  onRSVP: () => void;
  guestName: string;
  onLikeUpdate: (newGallery: any) => void;
}

export const getRSVPText = (event: any) => {
  if (event?.type === 'BRIDAL_SHOWER' || event?.layoutMode?.startsWith('BRIDAL_')) {
    return 'Confirmar Presença no Chá';
  }
  return 'Confirmar Presença';
};

export const getRSVPModalTitle = (event: any) => {
  if (event?.type === 'BRIDAL_SHOWER' || event?.layoutMode?.startsWith('BRIDAL_')) {
    return 'RSVP Chá de Panela';
  }
  return 'Sua Presença';
};

// ============================================================================
// LAYOUT ESSENTIAL: CLEAN & FAST
// ============================================================================
const EssentialLayout: React.FC<LayoutProps> = ({ event, onRSVP, onLikeUpdate }) => {
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
      
      {event.gallery && event.gallery.length > 0 && (
          <div className="max-w-xl mx-auto px-6 mt-8 relative z-10">
            <h2 className="font-bold text-brand-blue mb-4 text-center">Nossa Galeria</h2>
            <GalleryLightbox eventId={event.id} gallery={event.gallery} onLikeUpdate={onLikeUpdate} renderMode="ESSENTIAL" />
          </div>
      )}
      
      <GuestManual mode="ESSENTIAL" />
      
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <Button onClick={onRSVP} variant="navy" fullWidth>{getRSVPText(event)}</Button>
      </div>
    </div>
  );
};

// ============================================================================
// BRIDAL STANDARD LAYOUT (Based on provided image structure)
// ============================================================================
const getBridalTheme = (mode: string) => {
    switch (mode) {
        case 'BRIDAL_MINIMAL': return { 
            color: '#BCAAA4', flower: '/bridal-templates/templateCha3.png', bg: '#FFFDFD', text: '#4E342E',
            titleFont: '"Josefin Sans", sans-serif', cursiveFont: '"Dancing Script", cursive', bodyFont: '"Inter", sans-serif'
        };
        case 'BRIDAL_BEAUTY': return { 
            color: '#E57373', flower: '/bridal-templates/templateCha1.png', bg: '#FFFDFD', text: '#5D4037',
            titleFont: '"Cormorant Garamond", serif', cursiveFont: '"Pinyon Script", cursive', bodyFont: '"Cormorant Garamond", serif'
        };
        case 'BRIDAL_TEA_PARTY': return { 
            color: '#7986CB', flower: '/bridal-templates/templateCha2.png', bg: '#F8BBD0', text: '#3F51B5',
            titleFont: '"Playfair Display", serif', cursiveFont: '"Great Vibes", cursive', bodyFont: '"Playfair Display", serif'
        };
        case 'BRIDAL_CHEF': return { 
            color: '#FF8A65', flower: '/bridal-templates/templateCha4.png', bg: '#FFF3E0', text: '#E64A19',
            titleFont: '"Montserrat", sans-serif', cursiveFont: '"Great Vibes", cursive', bodyFont: '"Montserrat", sans-serif'
        };
        case 'BRIDAL_TROPICAL': return { 
            color: '#66BB6A', flower: '/bridal-templates/templateCha1.png', bg: '#F1F8E9', text: '#2E7D32',
            titleFont: '"Cormorant Garamond", serif', cursiveFont: '"Pinyon Script", cursive', bodyFont: '"Cormorant Garamond", serif'
        };
        case 'BRIDAL_ROMANTIC': 
        default: return { 
            color: '#F48FB1', flower: '/bridal-templates/templateCha2.png', bg: '#FFF8FA', text: '#D81B60',
            titleFont: '"Playfair Display", serif', cursiveFont: '"Pinyon Script", cursive', bodyFont: '"Inter", sans-serif'
        };
    }
}

const BridalStandardLayout: React.FC<LayoutProps> = ({ event, onRSVP }) => {
    const theme = getBridalTheme(event.layoutMode || 'BRIDAL_ROMANTIC');
    const titleLines = event.title.replace('Chá de Panela da ', '').replace('Chá da ', '') || 'A Noiva';
    
    return (
        <div className="w-full h-[100dvh] relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: theme.bodyFont }}>
            {/* Background Image full fit */}
            {theme.flower && (
                <div 
                    className="absolute inset-0 z-0 bg-center bg-no-repeat pointer-events-none" 
                    style={{ backgroundImage: `url(${theme.flower})`, backgroundSize: '100% 100%', opacity: 1 }}
                />
            )}

            {/* Framed Text Container */}
            <div 
                className="relative z-10 w-[85%] max-w-md h-[85%] flex flex-col items-center text-center overflow-y-auto no-scrollbar"
                style={{ color: theme.text }}
            >
                <div className="flex flex-col items-center justify-start min-h-full py-12 w-full space-y-6 md:space-y-8">
                    <FadeInSection className="w-full flex justify-center items-center flex-col">
                        <h2 className="text-2xl md:text-3xl uppercase tracking-[0.2em] font-bold mb-2 text-center" style={{ color: theme.color, fontFamily: theme.titleFont }}>
                            CHÁ DE PANELA
                        </h2>
                        <div className="flex items-center justify-center gap-3 mb-4 mt-1">
                            <div className="w-8 h-[1px]" style={{ backgroundColor: theme.color, opacity: 0.5 }} />
                            <div className="text-[11px] uppercase tracking-[0.3em]" style={{ color: theme.color, fontFamily: theme.titleFont }}>DA</div>
                            <div className="w-8 h-[1px]" style={{ backgroundColor: theme.color, opacity: 0.5 }} />
                        </div>
                        
                        <h1 className="text-5xl md:text-6xl leading-tight font-extrabold pb-1 text-center" style={{ fontFamily: theme.cursiveFont, color: theme.color }}>
                            {titleLines}
                        </h1>
                    </FadeInSection>

                    {event.description && (
                        <FadeInSection className="w-full flex justify-center items-center flex-col space-y-3 px-2">
                            {event.description?.split('\n\n').map((paragraph: string, i: number) => (
                                <p key={i} className="text-[13px] md:text-sm leading-relaxed whitespace-pre-wrap text-gray-700" style={{ fontFamily: theme.bodyFont }}>
                                    {paragraph}
                                </p>
                            ))}
                        </FadeInSection>
                    )}

                    <FadeInSection className="w-full space-y-5">
                        <div className="w-full h-px mx-auto" style={{ backgroundColor: theme.color, opacity: 0.2 }} />
                        
                        {/* Data */}
                        <div className="flex flex-col items-center">
                            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold mb-1 opacity-80" style={{ color: theme.color, fontFamily: theme.titleFont }}>Data e Hora</p>
                            <p className="text-sm md:text-base text-gray-800" style={{ fontFamily: theme.bodyFont }}>{event.date} às {event.time}</p>
                        </div>

                        <div className="w-full h-px mx-auto" style={{ backgroundColor: theme.color, opacity: 0.2 }} />
                        
                        {/* Local */}
                        <div className="flex flex-col items-center">
                            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold mb-1 opacity-80" style={{ color: theme.color, fontFamily: theme.titleFont }}>Local</p>
                            <p className="text-sm md:text-base text-gray-800 text-center" style={{ fontFamily: theme.bodyFont }}>{event.locationName || event.location}</p>
                            {event.address && <p className="text-xs mt-1 text-gray-600 text-center mx-1" style={{ fontFamily: theme.bodyFont }}>{event.address}</p>}
                        </div>

                        {(event.giftTitle || event.giftDescription || event.iban) && (
                            <>
                                <div className="w-full h-px mx-auto" style={{ backgroundColor: theme.color, opacity: 0.2 }} />
                                <div className="flex flex-col items-center mt-4">
                                    <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold mb-1 opacity-80" style={{ color: theme.color, fontFamily: theme.titleFont }}>Mimos</p>
                                    {event.giftTitle && <p className="text-sm md:text-base text-gray-800 mb-1 text-center" style={{ fontFamily: theme.bodyFont }}>{event.giftTitle}</p>}
                                    {event.giftDescription && <p className="text-[11px] md:text-xs text-gray-600 mb-2 text-center" style={{ fontFamily: theme.bodyFont }}>{event.giftDescription}</p>}
                                </div>
                            </>
                        )}
                    </FadeInSection>

                    <FadeInSection className="w-full pt-2 pb-8">
                        <Button onClick={onRSVP} className="w-full max-w-[250px] mx-auto py-3 rounded-full shadow-md text-xs uppercase tracking-widest font-bold transition-transform hover:scale-105 active:scale-95" style={{ backgroundColor: theme.color, color: 'white', fontFamily: theme.titleFont }}>
                            {getRSVPText(event)}
                        </Button>
                    </FadeInSection>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// LAYOUT 1: CLASSIC ROMANTIC (Refined)
// ============================================================================
const ClassicLayout: React.FC<LayoutProps> = ({ event, onRSVP, onLikeUpdate }) => {
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

         {event.timeline && event.timeline.length > 0 && (
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
         )}

         <FadeInSection>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
               <h3 className="font-bold text-xl mb-1 text-slate-800">{event.locationName}</h3>
               <p className="text-slate-500 text-sm mb-4">{event.address}</p>
               <Button onClick={() => window.open(event.mapLink || '#', '_blank')} variant="navy" fullWidth className="text-xs uppercase tracking-widest h-10">
                 Ver Mapa
               </Button>
            </div>
         </FadeInSection>

         {event.gallery && event.gallery.length > 0 && (
            <FadeInSection>
               <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Nossa Galeria</h3>
               <GalleryLightbox eventId={event.id} gallery={event.gallery} onLikeUpdate={onLikeUpdate} renderMode="CLASSIC" />
            </FadeInSection>
         )}

         {event.dressCode && (
            <FadeInSection>
               <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 mt-8">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Dress Code (Trajes)</h3>
                  <h4 className="font-bold text-xl mb-2 text-slate-800">{event.dressCode.title}</h4>
                  <p className="text-slate-500 text-sm mb-4">{event.dressCode.description}</p>
                  {event.dressCode.image && (
                      <div className="mt-4 rounded-xl overflow-hidden shadow-sm">
                          <img src={event.dressCode.image} alt="Referência de Traje" className="w-full h-64 object-cover" />
                      </div>
                  )}
               </div>
            </FadeInSection>
         )}

         {event.gifts && event.gifts.length > 0 && (
            <FadeInSection>
               <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 mt-8 mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 text-center">Lista de Presentes</h3>
                  {event.gifts.map((gift, i) => (
                      <div key={i} className="mb-6 last:mb-0 text-center">
                          <h4 className="font-bold text-xl mb-2 text-slate-800">{gift.title}</h4>
                          <p className="text-slate-500 text-sm mb-4">{gift.description}</p>
                          {gift.type === 'IBAN' && (
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center mt-4">
                                  {gift.bankName && <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">{gift.bankName}</p>}
                                  {gift.accountName && <p className="text-sm font-bold text-slate-800 mb-2">{gift.accountName}</p>}
                                  <span className="font-mono text-sm tracking-wider font-bold text-brand-blue block mb-4">{gift.value}</span>
                                  <Button onClick={() => {
                                      navigator.clipboard.writeText(gift.value || '');
                                      toast.success('IBAN copiado!');
                                  }} className="bg-brand-blue text-white hover:bg-brand-blue/90 text-xs py-2 px-6 rounded-full font-bold uppercase tracking-widest transition-colors w-full">
                                      Copiar IBAN
                                  </Button>
                              </div>
                          )}
                          {gift.type === 'LINK' && (
                              <Button onClick={() => window.open(gift.value || '#', '_blank')} className="bg-brand-blue text-white hover:bg-brand-blue/90 text-xs py-3 px-8 rounded-full font-bold uppercase tracking-widest transition-colors mt-4">
                                  Acessar Lista
                              </Button>
                          )}
                      </div>
                  ))}
               </div>
            </FadeInSection>
         )}
      </div>

      <GuestManual mode="CLASSIC" />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button onClick={onRSVP} className="bg-brand-blue text-white px-10 py-4 rounded-full font-sans font-bold shadow-2xl shadow-brand-blue/40 uppercase tracking-widest text-xs hover:scale-105 transition-transform">
           {getRSVPText(event)}
        </button>
      </div>
    </div>
  );
};


// ============================================================================
// HELPER: MANUAL DO CONVIDADO
// ============================================================================
const GuestManual: React.FC<{ isDark?: boolean; mode?: string }> = ({ isDark, mode }) => {
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
    
    let textColor = "text-gray-600";
    let iconColor = "text-[#C2B280]";
    let headingColor = "text-[#C2B280]";
    let bgColor = "bg-white border-gray-100";
    let footerTextColor = "text-gray-500";
    
    if (mode === 'CLASSIC') {
        textColor = "text-slate-500";
        iconColor = "text-brand-blue";
        headingColor = "text-slate-800";
        bgColor = "bg-slate-50 border-slate-200";
        footerTextColor = "text-slate-400";
    } else if (mode === 'ESSENTIAL') {
        textColor = "text-gray-500";
        iconColor = "text-brand-blue";
        headingColor = "text-brand-blue";
        bgColor = "bg-white border-slate-100";
        footerTextColor = "text-gray-400";
    } else if (mode === 'MODERN') {
        textColor = "text-gray-500";
        iconColor = "text-[#8A817C]";
        headingColor = "text-[#2C2C2C]";
        bgColor = "bg-[#F9F9F9] border-gray-200";
        footerTextColor = "text-gray-400";
    } else if (mode === 'GARDEN') {
        textColor = "text-[#5D5C61]";
        iconColor = "text-[#5D6B5A]";
        headingColor = "text-[#5D6B5A]";
        bgColor = "bg-[#F9F6F2] border-[#EAE5DF]";
        footerTextColor = "text-[#8C8C8C]";
    } else if (mode === 'RUSTIC') {
        textColor = "text-[#5D4037]";
        iconColor = "text-[#8D6E63]";
        headingColor = "text-[#4E342E]";
        bgColor = "bg-[#FDF5E6] border-[#DED0B6]";
        footerTextColor = "text-[#8D6E63]";
    } else if (mode === 'INDUSTRIAL' || isDark) {
        textColor = "text-gray-400";
        iconColor = "text-[#BF9B30]";
        headingColor = "text-white";
        bgColor = "bg-[#111111] border-gray-800";
        footerTextColor = "text-gray-500";
    } else if (mode === 'LUXURY') {
        textColor = "text-gray-400";
        iconColor = "text-[#BF9B30]";
        headingColor = "text-[#BF9B30]";
        bgColor = "bg-[#0A0D10] border-[#BF9B30]/20";
        footerTextColor = "text-gray-500";
    }
    
    return (
        <FadeInSection className={`py-16 md:py-24 px-6 ${bgColor} border-t mt-12 text-center`}>
            <h3 className={`text-2xl md:text-3xl font-serif ${headingColor} mb-12`}>Manual do Convidado</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                {points.map((p, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <p.icon className={`w-8 h-8 ${iconColor} mb-4`} strokeWidth={1} />
                        <p className={`text-sm ${textColor}`}>{p.text}</p>
                    </div>
                ))}
            </div>
            <p className={`mt-12 text-sm ${footerTextColor} italic`}>Agradecemos o carinho e a compreensão!</p>
        </FadeInSection>
    )
}

// ============================================================================
// LAYOUT 2: MINIMALIST ETHEREAL (Redesigned Modern)
// High-End, Clean, Airy, with Bible Verse, Gallery, Gifts, etc.
// ============================================================================
const ModernLayout: React.FC<LayoutProps> = ({ event, onRSVP, guestName, onLikeUpdate }) => {
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
                   {event.mapImage && <img src={event.mapImage} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />}
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
      {event.timeline && event.timeline.length > 0 && (
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
      )}

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
      {event.gifts && event.gifts.length > 0 && (
         <FadeInSection className="py-12 border-t border-gray-100 mt-12 text-center px-6">
            <span className="font-display text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-4 block">Presente</span>
            <h4 className="text-xl font-serif mb-6">Querido(a) convidado(a)!</h4>
            
            <div className="space-y-8 max-w-sm mx-auto">
              {event.gifts.map((gift, i) => (
                <div key={i} className="mb-8 last:mb-0">
                  {gift.title && <h5 className="font-bold text-gray-800 text-lg mb-2">{gift.title}</h5>}
                  <p className="text-gray-500 mb-6 leading-relaxed">
                    {gift.description}
                  </p>
                  
                  {gift.type === 'IBAN' && gift.value && (
                    <div className="bg-[#F4F4F4] p-6 rounded-2xl border border-gray-200 shadow-inner mt-4">
                       <p className="text-xl md:text-2xl font-mono text-gray-900 tracking-widest mb-4 break-all">{gift.value}</p>
                       <div className="space-y-4">
                         {gift.accountName && (
                           <div>
                             <p className="text-xs text-gray-500 uppercase tracking-widest leading-tight">Titular</p>
                             <p className="text-sm text-gray-800 font-bold">{gift.accountName}</p>
                           </div>
                         )}
                         {gift.bankName && (
                           <div>
                             <p className="text-xs text-gray-500 uppercase tracking-widest leading-tight">Banco</p>
                             <p className="text-sm text-gray-800 font-bold">{gift.bankName}</p>
                           </div>
                         )}
                       </div>
                       
                       <button 
                          onClick={() => {navigator.clipboard.writeText(gift.value); toast.success('IBAN Copiado!')}}
                          className="mt-6 px-8 py-3 w-full border border-[#C2B280] text-[#C2B280] text-xs font-bold uppercase tracking-widest hover:bg-[#C2B280] hover:text-white transition-colors"
                       >
                          Copiar IBAN
                       </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-gray-500 mb-8 mt-8 text-sm leading-relaxed max-w-sm mx-auto">
               Os comprovativos podem ser enviados via WhatsApp para o número {event.phone}. <br/>
               Muito obrigado(a)! <br/>
               Deus lhe abençoe sempre!
            </p>
         </FadeInSection>
      )}



      {/* 7. GALLERY (Masonry-ish) */}
      {event.gallery && event.gallery.length > 0 && (
         <FadeInSection className="w-full">
            <GalleryLightbox eventId={event.id} gallery={event.gallery} onLikeUpdate={onLikeUpdate} renderMode="MODERN" />
         </FadeInSection>
      )}

      {/* 8. MANUAL DO CONVIDADO */}
      <GuestManual mode="MODERN" />

      {/* FOOTER ACTION */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
         <button 
            onClick={onRSVP}
            className="bg-white text-[#1a1a1a] px-10 py-4 rounded-full font-display font-bold text-xs uppercase tracking-widest shadow-2xl hover:bg-[#1a1a1a] hover:text-white transition-colors duration-300 flex items-center gap-2 border border-gray-100"
         >
            <span>{getRSVPText(event)}</span>
         </button>
      </div>

    </div>
  );
};


// ============================================================================
// LAYOUT 3: GARDEN ELEGANCE (New Model)
// Soft, Floral, Serif, Comprehensive features (Bible, Gallery, etc.)
// ============================================================================
const GardenLayout: React.FC<LayoutProps> = ({ event, onRSVP, guestName, onLikeUpdate }) => {
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
                    {event.mapImage && <img src={event.mapImage} className="w-full h-full object-cover" />}
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
      {event.timeline && event.timeline.length > 0 && (
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
      )}

      {/* 6. GALLERY (Grid Layout) */}
      {event.gallery && event.gallery.length > 0 && (
        <FadeInSection className="py-20 px-4 max-w-5xl mx-auto">
           <h3 className="text-center font-sans text-xs uppercase tracking-[0.2em] mb-8 text-[#8C8C8C]">Momentos Especiais</h3>
           <GalleryLightbox eventId={event.id} gallery={event.gallery} onLikeUpdate={onLikeUpdate} renderMode="GARDEN" />
        </FadeInSection>
      )}

      {/* MANUAL DO CONVIDADO */}
      <GuestManual mode="GARDEN" />

      {/* 7. GIFTS & DRESS CODE */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto px-6 mb-24">
         {event.dressCode && (
           <FadeInSection className="bg-white p-8 rounded-2xl shadow-sm border border-[#EAE5DF] text-center">
              <span className="material-symbols-outlined text-3xl mb-4 text-[#8C8C8C]">styler</span>
              <h4 className="text-lg font-serif font-bold mb-2">{event.dressCode.title}</h4>
              <p className="text-sm text-[#5D5C61]">{event.dressCode.description}</p>
           </FadeInSection>
         )}
         
         {event.gifts && event.gifts.length > 0 && (
           <FadeInSection className="bg-white p-8 rounded-2xl shadow-sm border border-[#EAE5DF] text-center">
              <span className="material-symbols-outlined text-3xl mb-4 text-[#8C8C8C]">card_giftcard</span>
              <h4 className="text-lg font-serif font-bold mb-4">Lista de Presentes</h4>
              <div className="space-y-6">
                {event.gifts.map((gift, i) => (
                  <div key={i}>
                    {gift.title && <h5 className="font-bold text-[#2C2C2C] mb-1">{gift.title}</h5>}
                    <p className="text-sm text-[#5D5C61] mb-4">{gift.description}</p>
                    {gift.type === 'IBAN' && gift.value && (
                      <div className="bg-[#F9F6F2] p-4 rounded-xl text-center space-y-2">
                        <p className="font-mono text-[#2C2C2C] font-bold tracking-widest break-all">{gift.value}</p>
                        {gift.accountName && <p className="text-xs text-[#5D5C61] uppercase tracking-widest">Titular: <strong className="text-[#2C2C2C]">{gift.accountName}</strong></p>}
                        {gift.bankName && <p className="text-xs text-[#5D5C61] uppercase tracking-widest">Banco: <strong className="text-[#2C2C2C]">{gift.bankName}</strong></p>}
                        <button 
                           onClick={() => {navigator.clipboard.writeText(gift.value); toast.success('IBAN Copiado!')}}
                           className={`mt-4 px-6 py-2 rounded-full border border-[#D6CFC7] text-xs font-bold uppercase tracking-widest hover:bg-[#EAE5DF] transition-colors w-full`}
                        >
                           Copiar IBAN
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
           </FadeInSection>
         )}
      </div>

      {/* FIXED BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-[#EAE5DF] p-4 z-50 flex items-center justify-center">
         <Button 
           onClick={onRSVP}
           className={`w-full max-w-md ${accentBg} text-white font-sans font-bold uppercase tracking-widest text-xs py-4 shadow-lg flex items-center justify-center gap-2 hover:opacity-90`}
         >
           <span>{getRSVPText(event)}</span>
         </Button>
      </div>
    </div>
  );
};

// ============================================================================
// LAYOUT 4: RUSTIC CHIC (Warm, Texture, Nature)
// ============================================================================
const RusticLayout: React.FC<LayoutProps> = ({ event, onRSVP, guestName, onLikeUpdate }) => {
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
       {event.timeline && event.timeline.length > 0 && (
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
       )}

       {/* GIFTS & DRESS CODE */}
       <div className="grid md:grid-cols-2 gap-4 px-4 mt-16 mb-24">
          <FadeInSection className="bg-[#5D4037] text-[#FDF5E6] p-10 rounded-3xl text-center flex flex-col items-center justify-center">
             <span className="material-symbols-outlined text-4xl mb-4">checkroom</span>
             <h3 className="text-2xl font-serif mb-2">Dress Code</h3>
             <p className="opacity-80 text-sm max-w-xs">{event.dressCode?.description}</p>
          </FadeInSection>
          {event.gifts && event.gifts.length > 0 && (
             <FadeInSection className="bg-white border border-[#EFEBE9] p-10 rounded-3xl text-center flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-[#5D4037] mb-4">card_giftcard</span>
                <h3 className="text-2xl font-serif text-[#4E342E] mb-4">Presentes</h3>
                <div className="space-y-6 w-full">
                  {event.gifts.map((gift, i) => (
                    <div key={i} className="space-y-4">
                      {gift.title && <h5 className="font-bold text-[#5D4037]">{gift.title}</h5>}
                      <p className="text-sm text-[#8D6E63]">{gift.description}</p>
                      {gift.type === 'IBAN' && gift.value && (
                        <div className="bg-[#FFF8E1] p-4 rounded-2xl text-center space-y-2 border border-[#EFEBE9]">
                          {gift.accountName && <p className="text-xs text-[#5D4037] font-bold uppercase">{gift.accountName}</p>}
                          {gift.bankName && <p className="text-xs text-[#8D6E63]">{gift.bankName}</p>}
                          <p className="font-mono text-[#4E342E] font-bold tracking-widest break-all">{gift.value}</p>
                          <button 
                             onClick={() => {navigator.clipboard.writeText(gift.value); toast.success('IBAN Copiado!')}}
                             className="mt-4 px-6 py-2 border border-[#5D4037] text-[#5D4037] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#5D4037] hover:text-[#FDF5E6] transition-colors w-full"
                          >
                             Copiar IBAN
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
             </FadeInSection>
          )}
       </div>

       {/* GALLERY */}
       {event.gallery && event.gallery.length > 0 && (
          <FadeInSection className="max-w-5xl mx-auto px-6 mb-24">
             <h3 className="text-center font-serif text-3xl text-[#4E342E] mb-8">Nossa Galeria</h3>
             <GalleryLightbox eventId={event.id} gallery={event.gallery} onLikeUpdate={onLikeUpdate} renderMode="RUSTIC" />
          </FadeInSection>
       )}
       
       <GuestManual mode="RUSTIC" />
 
       {/* FIXED ACTION */}
       <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <button 
             onClick={onRSVP}
             className="w-full bg-[#5D4037] text-[#FDF5E6] py-4 rounded-full font-bold shadow-2xl shadow-[#5D4037]/40 text-sm uppercase tracking-widest hover:scale-105 transition-transform"
          >
             {getRSVPText(event)}
          </button>
       </div>
     </div>
   );
 };


// ============================================================================
// LAYOUT 5: INDUSTRIAL (Modern, Edgy, High Contrast)
// ============================================================================
const IndustrialLayout: React.FC<LayoutProps> = ({ event, onRSVP, guestName, onLikeUpdate }) => {
   
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
       {event.timeline && event.timeline.length > 0 && (
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
       )}

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
             {event.mapImage && <img src={event.mapImage} className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-700" />}
             <div className="absolute bottom-0 left-0 p-8 bg-white/90 text-black w-full backdrop-blur-sm">
                <p className="text-xs uppercase tracking-widest mb-1 text-gray-600">Recepção</p>
                <h3 className="text-2xl font-bold uppercase">{event.receptionName}</h3>
                <button onClick={() => window.open(`https://maps.google.com/?q=${event.receptionAddress}`, '_blank')} className="mt-4 text-xs font-bold border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors uppercase">Map</button>
             </div>
          </div>
       </div>
       
       {/* GALLERY */}
       {event.gallery && event.gallery.length > 0 && (
          <div className="p-8 md:p-16 border-b border-white/20">
             <h3 className="text-2xl font-bold uppercase mb-8 border-l-4 border-white pl-4">Galeria</h3>
             <GalleryLightbox eventId={event.id} gallery={event.gallery} onLikeUpdate={onLikeUpdate} renderMode="INDUSTRIAL" />
          </div>
       )}

       <GuestManual mode="INDUSTRIAL" />

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
const LuxuryLayout: React.FC<LayoutProps> = ({ event, onRSVP, guestName, onLikeUpdate }) => {
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
                     {event.mapImage && <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url('${event.mapImage}')` }}></div>}
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
                       <div className="space-y-4 mb-4">
                         {gift.accountName && (
                           <div>
                             <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-tight">Titular</p>
                             <p className="text-sm text-gray-200 font-bold">{gift.accountName}</p>
                           </div>
                         )}
                         {gift.bankName && (
                           <div>
                             <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-tight">Banco</p>
                             <p className="text-sm text-gray-200 font-bold">{gift.bankName}</p>
                           </div>
                         )}
                       </div>
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
        {event.gallery && event.gallery.length > 0 && (
          <FadeInSection className="w-full mb-12 pl-6">
            <h3 className="text-[#BF9B30] font-bold uppercase tracking-widest text-xs mb-4 text-left">Nossa Galeria</h3>
            <GalleryLightbox eventId={event.id} gallery={event.gallery} onLikeUpdate={onLikeUpdate} renderMode="LUXURY" />
          </FadeInSection>
        )}

        <div className="w-full border-t border-[#BF9B30]/30 mt-8">
           <GuestManual mode="LUXURY" />
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
// BRIDAL BEAUTY LAYOUT
// Inspired by image 1: salons, soft pink gradient, hair/makeup items
// ============================================================================
const BridalBeautyLayout: React.FC<LayoutProps> = ({ event, onRSVP, guestName, onLikeUpdate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F5] to-[#FFEBEB] text-[#5A3E36] font-serif pb-32 relative overflow-x-hidden pt-12">
      {/* Top Floral Image */}
      <div className="absolute top-0 left-0 w-full h-48 opacity-70 pointer-events-none">
         <img src="https://images.unsplash.com/photo-1518895949257-2342800160b7?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover" style={{ maskImage: 'linear-gradient(to bottom, black, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 max-w-lg mx-auto text-center">
         
         <FadeInSection>
            <div className="w-48 h-48 rounded-full overflow-hidden mb-6 mx-auto border-4 border-white shadow-xl">
               <img src={event.heroImage} className="w-full h-full object-cover" alt="Beauty Items" />
            </div>
         </FadeInSection>

         <FadeInSection>
            <h2 className="text-3xl font-display text-[#BD8C8C] mb-1">Chá de Panela</h2>
            <p className="text-sm italic mb-2 opacity-80">da</p>
            <h1 className="text-6xl text-[#784646] mb-8" style={{ fontFamily: '"Pinyon Script", cursive' }}>{event.title.replace('Chá de Panela da ', '').replace('Chá da ', '') || 'Jussineide'}</h1>
            <p className="text-xl font-medium tracking-wide mb-8 font-sans uppercase text-[#BD8C8C]">{event.hosts || 'Vai Estar no Salão'}</p>
         </FadeInSection>

         <FadeInSection>
            <p className="text-lg leading-relaxed mb-10 max-w-sm whitespace-pre-wrap">
               {event.description}
            </p>
         </FadeInSection>

         <FadeInSection className="w-full bg-white/60 p-8 rounded-3xl shadow-sm border border-white/80 mb-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold mb-2 text-[#784646]">{event.date}</h3>
            <p className="text-lg font-medium mb-4">{event.time}</p>
            <p className="text-lg">{event.locationName}</p>
            {event.address && <p className="text-sm opacity-80">{event.address}</p>}
         </FadeInSection>

         {(event.giftTitle || event.giftDescription || event.iban || event.bankName) && (
             <FadeInSection className="w-full bg-white/60 p-8 rounded-3xl shadow-sm border border-white/80 mb-8 backdrop-blur-sm text-center">
                 <h3 className="text-2xl font-bold mb-3 text-[#784646]">{event.giftTitle || 'Lista de Presentes'}</h3>
                 <p className="text-sm opacity-80 mb-6 italic">{event.giftDescription}</p>
                 
                 {(event.iban || event.bankName) && (
                     <div className="bg-[#FFF5F5] p-5 rounded-2xl border border-[#BD8C8C]/20">
                         {event.bankName && <p className="font-bold text-[#784646] mb-1">{event.bankName}</p>}
                         {event.accountName && <p className="text-sm opacity-80 mb-4">{event.accountName}</p>}
                         {event.iban && (
                             <div className="pt-4 border-t border-[#BD8C8C]/20">
                                 <p className="text-xs uppercase tracking-widest text-[#BD8C8C] mb-2 font-bold">Chave / IBAN</p>
                                 <p className="font-medium text-[#784646] break-all mb-4">{event.iban}</p>
                                 <button 
                                     onClick={() => {
                                         navigator.clipboard.writeText(event.iban || '');
                                         alert("Copiado com sucesso!");
                                     }}
                                     className="text-xs px-5 py-2.5 bg-[#BD8C8C] text-white hover:bg-[#784646] rounded-full transition-colors uppercase tracking-widest font-bold shadow-md"
                                 >
                                     Copiar
                                 </button>
                             </div>
                         )}
                     </div>
                 )}
             </FadeInSection>
         )}

         {event.gallery && event.gallery.length > 0 && (
            <FadeInSection className="w-full mb-8">
               <h3 className="text-xl font-bold mb-6 text-[#784646] text-center border-b border-[#BD8C8C]/30 pb-2 inline-block">Galeria</h3>
               <GalleryLightbox eventId={event.id} gallery={event.gallery} onLikeUpdate={onLikeUpdate} renderMode="MODERN" />
            </FadeInSection>
         )}

         {/* Bottom Floral Image */}
         <div className="w-full h-48 opacity-70 mt-8 pointer-events-none">
            <img src="https://images.unsplash.com/photo-1518895949257-2342800160b7?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover rounded-xl" style={{ maskImage: 'linear-gradient(to top, black, transparent)', WebkitMaskImage: 'linear-gradient(to top, black, transparent)' }} />
         </div>
         
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md p-4 z-50 flex items-center justify-center">
          <Button onClick={onRSVP} className="w-full max-w-sm bg-[#E6A8A8] text-white hover:bg-[#D59898] py-4 rounded-full shadow-lg text-sm uppercase tracking-widest font-bold">
             {getRSVPText(event)}
          </Button>
      </div>
    </div>
  );
};

// ============================================================================
// BRIDAL ROMANTIC LAYOUT
// Inspired by image 2: white bg, thin pink border, large watercolor pink flowers, structured list
// ============================================================================
const BridalRomanticLayout: React.FC<LayoutProps> = ({ event, onRSVP, guestName, onLikeUpdate }) => {
  return (
    <div className="min-h-screen bg-white text-[#6D5A5A] font-sans pb-32 p-4 relative overflow-x-hidden">
        
       {/* Corner Flowers */}
       <img src="https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&auto=format&fit=crop" className="fixed top-[-50px] left-[-50px] w-64 h-64 object-cover opacity-50 rounded-full mix-blend-multiply pointer-events-none z-0" style={{ filter: 'blur(2px)' }} />
       <img src="https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&auto=format&fit=crop" className="fixed bottom-[-50px] right-[-50px] w-64 h-64 object-cover opacity-50 rounded-full mix-blend-multiply pointer-events-none z-0" style={{ filter: 'blur(2px)' }} />

       <div className="relative z-10 w-full h-full min-h-[calc(100vh-32px)] border-[2px] border-[#F48FB1]/40 rounded-xl p-6 flex flex-col items-center text-center bg-white/80 backdrop-blur-sm">
           
           <FadeInSection>
               <p className="text-xs uppercase tracking-[0.3em] text-[#E06A8B] font-bold mt-8 mb-6">{event.hosts || 'CONVITE ESPECIAL'}</p>
               
               <p className="text-xl uppercase tracking-widest text-[#E06A8B] mb-2">Chá de</p>
               <h2 className="text-6xl text-[#E06A8B] mb-2" style={{ fontFamily: '"Pinyon Script", cursive' }}>Panela</h2>
               <p className="text-sm uppercase tracking-widest text-[#E06A8B] mb-4">da</p>
               <h1 className="text-7xl text-[#E06A8B] mb-10" style={{ fontFamily: '"Pinyon Script", cursive' }}>{event.title.replace('Chá de Panela da ', '').replace('Chá da ', '') || 'Jussineide'}</h1>
           </FadeInSection>

           <FadeInSection>
               <div className="text-[#E06A8B] mb-6">♥</div>
               <p className="text-base leading-relaxed mb-6 max-w-sm whitespace-pre-wrap px-4 font-serif">
                  {event.description}
               </p>
               <div className="text-[#E06A8B] mb-10">♥</div>
           </FadeInSection>

           <FadeInSection className="w-full max-w-xs space-y-8 mb-12">
               
               {/* Local */}
               <div className="flex flex-col items-center">
                   <div className="w-10 h-10 rounded-full border border-[#F48FB1] flex items-center justify-center text-[#E06A8B] mb-3">
                       <span className="material-symbols-outlined text-lg">location_on</span>
                   </div>
                   <p className="text-xs uppercase tracking-widest text-[#E06A8B] font-bold mb-1">Local</p>
                   <p className="text-lg font-serif">{event.locationName}</p>
                   {event.address && <p className="text-sm opacity-80 font-serif">{event.address}</p>}
               </div>
               
               <div className="w-16 h-px bg-[#F48FB1]/40 mx-auto" />

               {/* Data */}
               <div className="flex flex-col items-center">
                   <div className="w-10 h-10 rounded-full border border-[#F48FB1] flex items-center justify-center text-[#E06A8B] mb-3">
                       <span className="material-symbols-outlined text-lg">calendar_month</span>
                   </div>
                   <p className="text-xs uppercase tracking-widest text-[#E06A8B] font-bold mb-1">Data</p>
                   <p className="text-lg font-serif">{event.date}</p>
               </div>

               <div className="w-16 h-px bg-[#F48FB1]/40 mx-auto" />

               {/* Horário */}
               <div className="flex flex-col items-center">
                   <div className="w-10 h-10 rounded-full border border-[#F48FB1] flex items-center justify-center text-[#E06A8B] mb-3">
                       <span className="material-symbols-outlined text-lg">schedule</span>
                   </div>
                   <p className="text-xs uppercase tracking-widest text-[#E06A8B] font-bold mb-1">Horário</p>
                   <p className="text-lg font-serif">{event.time}</p>
               </div>

           </FadeInSection>

           {(event.giftTitle || event.giftDescription || event.iban || event.bankName) && (
               <FadeInSection className="w-full max-w-xs mb-12 flex flex-col items-center">
                   <div className="w-10 h-10 rounded-full border border-[#F48FB1] flex items-center justify-center text-[#E06A8B] mb-3">
                       <span className="material-symbols-outlined text-lg">featured_seasonal_and_gifts</span>
                   </div>
                   <p className="text-xs uppercase tracking-widest text-[#E06A8B] font-bold mb-3">Mimos</p>
                   <div className="bg-[#FFF8FA] p-6 rounded-2xl border border-[#F48FB1]/30 w-full text-center">
                       <h3 className="font-serif text-xl mb-2 text-[#E06A8B]">{event.giftTitle || 'Lista de Presentes'}</h3>
                       <p className="text-xs text-[#6D5A5A] mb-4 max-w-[200px] mx-auto italic">{event.giftDescription}</p>
                       
                       {(event.iban || event.bankName) && (
                           <div className="bg-white p-4 rounded-xl shadow-sm border border-[#F48FB1]/20">
                               {event.bankName && <p className="text-sm font-bold text-[#E06A8B]">{event.bankName}</p>}
                               {event.accountName && <p className="text-xs text-[#6D5A5A] mt-1">{event.accountName}</p>}
                               {event.iban && (
                                   <div className="mt-4 pt-3 border-t border-[#F48FB1]/20">
                                       <p className="text-[10px] uppercase tracking-widest text-[#E06A8B] mb-1 font-bold">Chave / IBAN</p>
                                       <p className="text-sm font-medium text-[#6D5A5A] break-all mb-3">{event.iban}</p>
                                       <button 
                                           onClick={() => {
                                               navigator.clipboard.writeText(event.iban || '');
                                               alert("Copiado com sucesso!");
                                           }}
                                           className="text-[10px] px-4 py-2 bg-[#F48FB1] text-white hover:bg-[#E06A8B] rounded-full transition-colors uppercase tracking-widest font-bold"
                                       >
                                           Copiar
                                       </button>
                                   </div>
                               )}
                           </div>
                       )}
                   </div>
               </FadeInSection>
           )}
       </div>

       <div className="fixed bottom-4 left-0 w-full px-4 z-50 flex items-center justify-center">
           <Button onClick={onRSVP} className="w-full max-w-sm bg-[#F48FB1] text-white hover:bg-[#E06A8B] py-4 rounded-xl shadow-lg text-sm uppercase tracking-widest font-bold">
              {getRSVPText(event)}
           </Button>
       </div>
    </div>
  );
};

// ============================================================================
// BRIDAL MINIMAL LAYOUT
// Sleek, nude/beige tones, high fashion, large elegant typography
// ============================================================================
const BridalMinimalLayout: React.FC<LayoutProps> = ({ event, onRSVP, guestName, onLikeUpdate }) => {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#333333] font-sans pb-32 overflow-x-hidden selection:bg-[#EDEAE1]">
      <div className="max-w-md mx-auto">
        <FadeInSection className="w-full h-[55vh] relative overflow-hidden">
           <img src={event.heroImage} className="w-full h-full object-cover rounded-b-[40px]" alt="Minimal Decor" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] to-transparent h-full max-h-[200px] mt-auto"></div>
        </FadeInSection>

        <div className="px-8 flex flex-col items-center text-center -mt-10 relative z-10">
          <FadeInSection>
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-[#A09383] mb-4">
               {event.hosts || "Let's Celebrate"}
            </p>
            <h1 className="text-7xl mb-4 text-[#333333]" style={{ fontFamily: '"Playfair Display", serif', letterSpacing: '-0.02em', lineHeight: '0.9' }}>
               {event.title.replace('Chá de Panela da ', '').replace('Chá da ', '') || 'Sofia'}
            </h1>
            <p className="text-sm uppercase tracking-widest text-[#A09383] mb-8 relative inline-block">
               Chá de Panela
               <span className="absolute -bottom-2 left-1/4 right-1/4 h-[1px] bg-[#D3C4B7]"></span>
            </p>
          </FadeInSection>

          <FadeInSection className="mt-8 mb-12">
            <p className="text-[#555] font-serif text-lg leading-relaxed max-w-sm">
               {event.description}
            </p>
          </FadeInSection>

          <FadeInSection className="w-full grid grid-cols-2 gap-4 mb-16">
            <div className="p-6 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[#F0ECE1]">
                <p className="text-[10px] uppercase tracking-widest text-[#A09383] mb-2">Quando</p>
                <p className="font-serif text-xl">{event.date.split(' ')[0]}</p>
                <p className="text-[#888] text-sm">{event.date.split(' ').slice(1).join(' ')}</p>
                <p className="text-[#888] text-sm mt-1">{event.time}</p>
            </div>
            <div className="p-6 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[#F0ECE1]">
                <p className="text-[10px] uppercase tracking-widest text-[#A09383] mb-2">Onde</p>
                <p className="font-serif text-xl leading-tight">{event.locationName}</p>
                <p className="text-[#888] text-sm mt-2">{event.address}</p>
            </div>
          </FadeInSection>

          {event.gallery && event.gallery.length > 0 && (
            <FadeInSection className="w-full mb-12">
               <p className="text-[10px] uppercase tracking-widest text-[#A09383] mb-6 inline-block border-b border-[#D3C4B7] pb-1">Galeria</p>
               <GalleryLightbox eventId={event.id} gallery={event.gallery} onLikeUpdate={onLikeUpdate} renderMode="MODERN" />
            </FadeInSection>
          )}

          {(event.giftTitle || event.giftDescription || event.iban || event.bankName) && (
            <FadeInSection className="w-full mb-12">
                <div className="p-8 bg-[#FDFBF7] border border-[#F0ECE1] rounded-3xl text-center">
                    <p className="text-[10px] uppercase tracking-widest text-[#A09383] mb-4">Mimos</p>
                    <h3 className="font-serif text-2xl mb-3 text-[#333333]">{event.giftTitle || 'Lista de Presentes'}</h3>
                    <p className="text-sm text-[#888] mb-6 max-w-[250px] mx-auto">{event.giftDescription}</p>
                    
                    {(event.iban || event.bankName) && (
                        <div className="bg-white p-4 rounded-xl border border-[#F0ECE1]">
                            {event.bankName && <p className="text-sm font-bold text-[#333333]">{event.bankName}</p>}
                            {event.accountName && <p className="text-xs text-[#888] mt-1">{event.accountName}</p>}
                            {event.iban && (
                                <div className="mt-4 pt-4 border-t border-[#F0ECE1]">
                                    <p className="text-[10px] uppercase tracking-widest text-[#A09383] mb-2 font-bold">Chave / IBAN</p>
                                    <p className="text-sm font-medium text-[#333333] break-all mb-3">{event.iban}</p>
                                    <button 
                                        onClick={() => {
                                            const bankInfo = `Banco: ${event.bankName || ''}\nTitular: ${event.accountName || ''}\nIBAN: ${event.iban || ''}`;
                                            navigator.clipboard.writeText(event.iban || bankInfo);
                                            // Assume toast is available globally or just visual feedback on the button isn't strict here.
                                            alert("Copiado com sucesso!");
                                        }}
                                        className="text-xs px-4 py-2 bg-[#F0ECE1] text-[#333333] hover:bg-[#E5DFD3] rounded-full transition-colors uppercase tracking-widest font-bold"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </FadeInSection>
          )}

        </div>
      </div>

      <div className="fixed bottom-6 left-0 w-full px-6 z-50 flex justify-center pointer-events-none">
          <Button onClick={onRSVP} className="pointer-events-auto w-full max-w-sm bg-[#333333] text-white hover:bg-[#1A1A1A] py-6 rounded-2xl shadow-xl text-xs uppercase tracking-[0.2em] transition-transform active:scale-95">
             {getRSVPText(event)}
          </Button>
      </div>
    </div>
  );
};

// ============================================================================
// BRIDAL TEA PARTY LAYOUT
// Vintage, Bridgerton-esque, soft blues/lavander, elegant cursive
// ============================================================================
const BridalTeaPartyLayout: React.FC<LayoutProps> = ({ event, onRSVP, guestName, onLikeUpdate }) => {
  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#2C3E50] font-serif pb-32 overflow-x-hidden relative">
      
      {/* Background Decor - simple css pattern */}
      <div className="fixed inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#B5C1C8 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>

      <div className="relative z-10 max-w-lg mx-auto pt-12 px-6 flex flex-col items-center text-center">
         
         <FadeInSection>
            <div className="w-full aspect-[4/3] rounded-t-full bg-white p-2 shadow-sm mb-8 border border-[#D5DFE5]">
               <img src={event.heroImage} className="w-full h-full object-cover rounded-t-full rounded-b-xl" alt="Tea Party" />
            </div>
         </FadeInSection>

         <FadeInSection className="bg-white/80 backdrop-blur-md w-full p-8 rounded-3xl border border-white shadow-xl relative mt-[-60px] z-20">
            <p className="text-xs font-sans uppercase tracking-[0.3em] text-[#8194A5] mb-2">{event.hosts || 'Chá de Panela'}</p>
            <h1 className="text-5xl text-[#5C7487] mb-6" style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}>
               {event.title}
            </h1>
            
            <div className="w-12 h-px bg-[#B5C1C8] mx-auto mb-6"></div>
            
            <p className="text-base leading-relaxed text-[#5C7487] mb-8 px-2">
               {event.description}
            </p>

            <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0]">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-[#8194A5] text-sm">calendar_today</span>
                    <p className="uppercase font-sans text-xs tracking-widest font-bold text-[#5C7487]">{event.date} • {event.time}</p>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-[#8194A5] text-sm">location_on</span>
                    <p className="uppercase font-sans text-xs tracking-widest font-bold text-[#5C7487]">{event.locationName}</p>
                </div>
                {event.address && <p className="text-sm mt-2 text-[#8194A5] italic">{event.address}</p>}
            </div>
         </FadeInSection>

         {event.gallery && event.gallery.length > 0 && (
            <FadeInSection className="w-full mt-12 bg-white/60 p-6 rounded-3xl border border-white">
               <h3 className="font-sans uppercase text-xs tracking-[0.3em] font-bold text-[#8194A5] mb-6">Recordações</h3>
               <GalleryLightbox eventId={event.id} gallery={event.gallery} onLikeUpdate={onLikeUpdate} renderMode="CLASSIC" />
            </FadeInSection>
         )}

         {(event.giftTitle || event.giftDescription || event.iban || event.bankName) && (
             <FadeInSection className="w-full mt-12 bg-[#F8FAFC] p-6 rounded-3xl border border-[#E2E8F0] text-center">
                 <h3 className="font-sans uppercase text-xs tracking-[0.3em] font-bold text-[#8194A5] mb-4">Mimos</h3>
                 <p className="font-serif text-xl text-[#5C7487] mb-2">{event.giftTitle || 'Lista de Presentes'}</p>
                 <p className="text-sm text-[#8194A5] italic mb-6 max-w-[250px] mx-auto">{event.giftDescription}</p>
                 
                 {(event.iban || event.bankName) && (
                     <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E2E8F0] text-left">
                         {event.bankName && <p className="font-bold text-[#5C7487] text-sm">{event.bankName}</p>}
                         {event.accountName && <p className="text-xs text-[#8194A5] mt-1">{event.accountName}</p>}
                         {event.iban && (
                             <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                                 <p className="text-[10px] uppercase tracking-widest text-[#8194A5] mb-1 font-bold">Chave / IBAN</p>
                                 <p className="text-sm font-medium text-[#5C7487] break-all mb-4">{event.iban}</p>
                                 <div className="flex justify-center">
                                     <button 
                                         onClick={() => {
                                             navigator.clipboard.writeText(event.iban || '');
                                             alert("Copiado com sucesso!");
                                         }}
                                         className="text-xs px-6 py-2.5 bg-[#8194A5] text-white hover:bg-[#5C7487] rounded-full transition-colors uppercase tracking-[0.2em] font-bold"
                                     >
                                         Copiar
                                     </button>
                                 </div>
                             </div>
                         )}
                     </div>
                 )}
             </FadeInSection>
         )}

      </div>

      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white via-white/80 to-transparent pt-12 pb-6 px-6 z-50 flex justify-center pointer-events-none">
          <Button onClick={onRSVP} className="pointer-events-auto w-full max-w-sm bg-[#8194A5] text-white hover:bg-[#5C7487] py-6 rounded-full shadow-lg text-xs font-sans uppercase tracking-[0.2em] transition-transform active:scale-95">
             {getRSVPText(event)}
          </Button>
      </div>
    </div>
  );
};

// ============================================================================
// BRIDAL CHEF LAYOUT
// Minimalista, focado em alta gastronomia, tons terrosos, line art
// ============================================================================
const BridalChefLayout: React.FC<LayoutProps> = ({ event, onRSVP, guestName, onLikeUpdate }) => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2C2C2C] font-sans pb-32">
      
      {/* Head decor - Line art */}
      <div className="w-full flex justify-center pt-8 pb-4 opacity-80">
        <svg viewBox="0 0 24 24" width="42" height="42" stroke="#CB6843" strokeWidth="1" fill="none">
           <polygon points="12 2, 7 8, 17 8" />
           <polygon points="7 8, 17 8, 15 13, 9 13" />
           <rect x="9" y="13" width="6" height="1" />
           <polygon points="9 14, 15 14, 17 22, 7 22" />
           <path d="M16 5c1-1 2 1 3 2s-1 3-2 2" />
           <path d="M7 18H5c-1 0-2-1-2-2v-1" />
        </svg>
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 flex flex-col items-center text-center">
         <FadeInSection>
            <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-[#879F84] mb-3">{event.hosts || 'Chá de Panela'}</p>
            <h1 className="text-5xl text-[#2C2C2C] mb-6 tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
               {event.title}
            </h1>
         </FadeInSection>

         <FadeInSection delay={0.1} className="w-full aspect-[4/5] rounded-[3rem] bg-white p-2 shadow-sm mb-10 border border-[#E8E6E1]">
            <img src={event.heroImage} className="w-full h-full object-cover rounded-[2.5rem]" alt="Chef/Kitchen" />
         </FadeInSection>

         <FadeInSection delay={0.2} className="w-full bg-white p-8 rounded-[2rem] border border-[#E8E6E1] mb-10">
            <div className="flex justify-center mb-6 opacity-40">
                <svg viewBox="0 0 24 24" width="32" height="32" stroke="#2C2C2C" strokeWidth="1" fill="none">
                  <path d="M12 22v-5M9 17h6v-3a3 3 0 00-6 0v3z" />
                  <path d="M12 14c-2.5-3-4-8-2-12C11 3 12 6 12 14z" />
                  <path d="M12 14c2.5-3 4-8 2-12C13 3 12 6 12 14z" />
                </svg>
            </div>
            <p className="text-sm leading-relaxed text-[#555] mb-8 font-serif italic">
               "{event.description}"
            </p>

            <div className="flex flex-col gap-6 items-center">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#879F84] font-bold mb-1">Quando</span>
                    <p className="font-serif text-lg text-[#2C2C2C]">{event.date} às {event.time}</p>
                </div>
                <div className="w-px h-8 bg-[#E8E6E1]"></div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#879F84] font-bold mb-1">Onde</span>
                    <p className="font-serif text-lg text-[#2C2C2C]">{event.locationName}</p>
                    {event.address && <p className="text-xs mt-2 text-[#777] max-w-[200px]">{event.address}</p>}
                </div>
            </div>
         </FadeInSection>

         {/* Gift Button as requested */}
         {(event.giftTitle || event.giftDescription || event.iban || event.bankName) && (
            <FadeInSection delay={0.3} className="w-full mb-10">
               <div className="bg-[#CB6843]/5 border border-[#CB6843]/20 p-8 rounded-2xl flex flex-col items-center relative overflow-hidden">
                   {/* Decorative wooden board SVG faded in background */}
                   <svg viewBox="0 0 24 24" width="120" height="120" stroke="#CB6843" strokeWidth="0.5" fill="none" className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
                     <path d="M8 2h8a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" />
                     <circle cx="12" cy="5" r="1.5" />
                   </svg>
                   <h3 className="text-[#CB6843] font-serif text-xl mb-3 relative z-10">{event.giftTitle || 'Lista de Presentes'}</h3>
                   <p className="text-xs text-[#666] mb-6 relative z-10 leading-relaxed font-serif italic">{event.giftDescription}</p>
                   {(event.iban || event.bankName) && (
                       <button onClick={() => {
                           const bankInfo = `Banco: ${event.bankName || ''}\nTitular: ${event.accountName || ''}\nIBAN: ${event.iban || ''}`;
                           navigator.clipboard.writeText(event.iban || bankInfo);
                           toast.success('Informações bancárias copiadas!');
                       }} className="bg-[#CB6843] text-white px-8 py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold shadow-md hover:bg-[#B55938] transition-colors relative z-10 w-full max-w-[240px]">
                          Copiar Informações
                       </button>
                   )}
               </div>
            </FadeInSection>
         )}

         {event.gallery && event.gallery.length > 0 && (
            <FadeInSection className="w-full mb-12">
               <h3 className="font-sans uppercase text-[10px] tracking-[0.4em] font-bold text-[#879F84] mb-8">Nossa Coleção</h3>
               <GalleryLightbox eventId={event.id} gallery={event.gallery} onLikeUpdate={onLikeUpdate} renderMode="MODERN" />
            </FadeInSection>
         )}

      </div>

      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6]/90 to-transparent pt-12 pb-6 px-6 z-50 flex justify-center pointer-events-none">
          <Button onClick={onRSVP} className="pointer-events-auto w-full max-w-sm bg-[#879F84] text-[#FAF9F6] border border-[#879F84] hover:bg-[#FAF9F6] hover:text-[#879F84] py-5 rounded-full shadow-lg text-[10px] font-bold uppercase tracking-[0.3em] transition-all active:scale-95">
             {getRSVPText(event)}
          </Button>
      </div>
    </div>
  );
};

// ============================================================================
// BRIDAL TROPICAL LAYOUT
// Focado em cores quentes, folhagens exóticas, contador e mapa dinâmico
// ============================================================================
const BridalTropicalLayout: React.FC<LayoutProps> = ({ event, onRSVP, guestName, onLikeUpdate }) => {
  return (
    <div className="min-h-screen bg-[#f4fdf6] text-gray-800 font-sans pb-32">
      {/* Header / Hero Section */}
      <div 
        className="h-[400px] flex flex-col justify-center items-center text-center px-6 rounded-b-[3rem] relative"
        style={{
          backgroundImage: `linear-gradient(rgba(13, 40, 24, 0.6), rgba(13, 40, 24, 0.4)), url('${event.heroImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <FadeInSection>
          <span className="text-emerald-200 text-xs uppercase tracking-[0.3em] mb-4 font-semibold block drop-shadow-md">
            {event.hosts || 'Vocês estão convidados!'}
          </span>
          <h1 className="text-5xl text-white font-bold leading-tight drop-shadow-lg font-serif">
            {event.title}
          </h1>
          <p className="text-white mt-6 text-sm font-light tracking-[0.2em] uppercase">Chá de Panela</p>
        </FadeInSection>
      </div>

      <div className="relative -mt-16 z-10 max-w-lg mx-auto px-4">
        
        {/* Intro Card */}
        <FadeInSection delay={0.1} className="bg-white px-8 py-10 text-center rounded-3xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] mb-10 border border-emerald-50">
          <h2 className="text-emerald-800 font-serif font-bold text-2xl mb-4">Celebrando o nosso novo lar!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            {event.description}
          </p>
          
          <div className="flex justify-center items-center gap-6 text-emerald-900">
            <div className="text-center">
              <p className="text-[10px] uppercase text-gray-400 font-bold tracking-[0.2em] mb-1">Data</p>
              <p className="font-serif font-bold text-lg">{event.date.split(' de ')[0] + ' ' + (event.date.split(' de ')[1]?.substring(0,3) || '')}</p>
            </div>
            <div className="w-px h-10 bg-emerald-100"></div>
            <div className="text-center">
              <p className="text-[10px] uppercase text-gray-400 font-bold tracking-[0.2em] mb-1">Hora</p>
              <p className="font-serif font-bold text-lg">{event.time}</p>
            </div>
          </div>
        </FadeInSection>

        {/* Contador Regressivo */}
        <FadeInSection delay={0.2} className="mb-12">
            <h3 className="text-center text-xs uppercase tracking-[0.3em] text-emerald-600 mb-6 font-bold">Contagem Regressiva</h3>
            <div className="flex justify-center">
                <CountdownTimer targetDate={event.isoDate} colorClass="text-emerald-800 text-3xl font-serif" />
            </div>
        </FadeInSection>

        {/* Local & Map */}
        <FadeInSection delay={0.3} className="mb-12 px-2">
            <h3 className="text-center text-xs uppercase tracking-[0.3em] text-emerald-600 mb-3 font-bold">Localização</h3>
            <p className="text-center text-gray-600 text-sm mb-6 font-serif">{event.locationName}<br/><span className="text-xs opacity-70 font-sans">{event.address}</span></p>
            
            <div className="rounded-3xl overflow-hidden shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] h-48 bg-gray-200 border-2 border-white relative group">
                <iframe 
                    src={`https://www.google.com/maps?q=${encodeURIComponent(event.address || event.locationName)}&output=embed`} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy">
                </iframe>
                <div className="absolute inset-0 bg-emerald-900/10 pointer-events-none group-hover:bg-transparent transition-colors"></div>
            </div>
            <div className="flex justify-center mt-6">
               <button onClick={() => window.open(event.mapLink || event.location || `https://maps.google.com/?q=${encodeURIComponent(event.address || event.locationName)}`, '_blank')} className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 border-b border-emerald-300 pb-1 hover:text-emerald-800 transition-colors">
                  Ver no Google Maps
               </button>
            </div>
        </FadeInSection>

        {/* Gifts Section */}
        {(event.giftTitle || event.giftDescription || event.iban || event.bankName) && (
            <FadeInSection delay={0.4} className="mb-12 w-full">
               <div className="bg-[#FFF8F5] border border-[#FFD2C1]/50 p-8 flex flex-col items-center rounded-3xl relative overflow-hidden shadow-sm">
                   {/* Tropical decorative SVG */}
                   <svg viewBox="0 0 24 24" width="100" height="100" stroke="#FF7F50" strokeWidth="1" fill="none" className="absolute -left-6 -bottom-6 opacity-[0.07] rotate-[-20deg]">
                       <path d="M12 22C12 22 4 16 4 10C4 5.5 8 2 12 2C16 2 20 5.5 20 10C20 16 12 22 12 22Z" />
                   </svg>
                   <svg viewBox="0 0 24 24" width="80" height="80" stroke="#059669" strokeWidth="1" fill="none" className="absolute -right-4 -top-4 opacity-[0.05] rotate-[45deg]">
                       <path d="M12 2L2 22l10-4 10 4L12 2z" />
                   </svg>
                   
                   <h3 className="text-[#FF7F50] font-serif text-2xl mb-3 relative z-10 font-bold">{event.giftTitle || 'Lista de Presentes'}</h3>
                   <p className="text-xs text-gray-500 mb-6 relative z-10 leading-relaxed text-center">{event.giftDescription}</p>
                   {(event.iban || event.bankName) && (
                       <button onClick={() => {
                           const bankInfo = `Banco: ${event.bankName || ''}\nTitular: ${event.accountName || ''}\nIBAN: ${event.iban || ''}`;
                           navigator.clipboard.writeText(event.iban || bankInfo);
                           toast.success('Informações bancárias copiadas!');
                       }} className="bg-white border-[#FF7F50] border text-[#FF7F50] px-6 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold shadow-sm hover:bg-[#FF7F50] hover:text-white transition-colors relative z-10 w-full max-w-[240px]">
                          Copiar Informações
                       </button>
                   )}
               </div>
            </FadeInSection>
        )}

        {/* Gallery */}
        {event.gallery && event.gallery.length > 0 && (
            <FadeInSection className="w-full mb-12">
               <h3 className="text-center text-xs uppercase tracking-[0.3em] text-emerald-600 mb-8 font-bold">Nossa Coleção</h3>
               <GalleryLightbox eventId={event.id} gallery={event.gallery} onLikeUpdate={onLikeUpdate} renderMode="MODERN" />
            </FadeInSection>
        )}

      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#f4fdf6] via-[#f4fdf6]/90 to-transparent pt-12 pb-6 px-6 z-50 flex justify-center pointer-events-none">
          <Button onClick={onRSVP} className="pointer-events-auto w-full max-w-sm bg-emerald-700 text-white hover:bg-emerald-800 py-5 rounded-2xl shadow-xl shadow-emerald-900/20 text-xs font-bold uppercase tracking-[0.2em] transition-all active:scale-95">
             {getRSVPText(event)}
          </Button>
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
               const dataUrl = await toPng(node, { 
                   quality: 1, 
                   backgroundColor: '#ffffff',
                   pixelRatio: 2
               });
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
