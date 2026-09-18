import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase, signOut, auth, db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Navbar } from '../../components/Navbar';
import { SEO } from '../../components/SEO';
import { FAQSection } from './FAQSection';
import { SupportModal } from '../../components/SupportModal';
import { MapEmbed } from '../../components/MapEmbed';
import { buildEmbedSrc, buildDirectionsUrl, DEFAULT_CENTER } from '../../lib/maps';
import { EVENTS } from '../../mockData';
import { X, Copy, MessageSquare, ArrowRight, Award, CheckCircle2, Gem, Utensils, Briefcase, QrCode, Gift, Users, BookOpen, Globe, ChevronLeft, ChevronRight, MapPin, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../../lib/clipboard';
import { PLANS } from '../../config/plans';

// NOTA: depoimentos ilustrativos — trocar por clientes reais com nome, foto e autorização assim que existirem.
const QUOTES = [
  { text: "Os templates são maravilhosos. O meu casamento ganhou outro nível.", author: "Juliana M. — Noiva" },
  { text: "A melhor plataforma de convites que já usei. Simplesmente elegante.", author: "Maria S. — Noiva" },
  { text: "Enviei o link no WhatsApp e as confirmações entraram sozinhas.", author: "Carla D. — Aniversariante" },
  { text: "O check-in com QR na entrada acabou com a confusão da receção.", author: "Sérgio A. — Organizador" },
  { text: "Os presentes caíram direto na conta por IBAN, sem complicação.", author: "Ana P. — Noiva" },
  { text: "Em duas noites tínhamos o convite pronto e partilhado.", author: "Domingos K. — Noivo" },
];

const QuoteRotator: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (dir: number) => setIndex((i) => (i + dir + QUOTES.length) % QUOTES.length);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % QUOTES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [paused, index]);

  const quote = QUOTES[index];

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label="Depoimentos"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="flex items-center gap-2 sm:gap-6"
    >
      <button
        onClick={() => go(-1)}
        aria-label="Depoimento anterior"
        className="w-11 h-11 shrink-0 rounded-full border border-[#C5A028]/40 text-[#1B365D] hidden sm:flex items-center justify-center hover:bg-[#1B365D] hover:text-white hover:border-[#1B365D] cursor-pointer"
        style={{ transition: 'background-color 200ms ease, color 200ms ease' }}
      >
        <ChevronLeft size={20} />
      </button>
      <figure className="flex-1 min-w-0 min-h-[190px] sm:min-h-[170px] flex flex-col justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.blockquote
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="font-serif text-2xl md:text-[1.75rem] leading-snug text-[#1B365D]"
            aria-live="polite"
          >
            “{quote.text}”
            <figcaption className="mt-4 text-sm font-sans font-light text-slate-500 not-italic">{quote.author}</figcaption>
          </motion.blockquote>
        </AnimatePresence>
        <div className="flex items-center gap-2 mt-6" role="tablist" aria-label="Escolher depoimento">
          {QUOTES.map((q, i) => (
            <button
              key={q.author}
              role="tab"
              aria-selected={i === index}
              aria-label={`Depoimento ${i + 1} de ${q.author}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full cursor-pointer ${i === index ? "w-6 bg-[#C5A028]" : "w-1.5 bg-slate-300 hover:bg-slate-400"}`}
              style={{ transition: 'background-color 200ms ease, width 200ms ease' }}
            />
          ))}
        </div>
      </figure>
      <button
        onClick={() => go(1)}
        aria-label="Próximo depoimento"
        className="w-11 h-11 shrink-0 rounded-full border border-[#C5A028]/40 text-[#1B365D] hidden sm:flex items-center justify-center hover:bg-[#1B365D] hover:text-white hover:border-[#1B365D] cursor-pointer"
        style={{ transition: 'background-color 200ms ease, color 200ms ease' }}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

import { getOptimizedImageUrl } from '../../lib/imageOptimizer';

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const { user, userProfile } = useFirebase();
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [supportOpen, setSupportOpen] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [whatsappModal, setWhatsappModal] = useState<{
    name: string;
    price: string;
    billingCycle?: "monthly" | "annual";
  } | null>(null);
  const typeModalPanelRef = useRef<HTMLDivElement>(null);
  const waModalPanelRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Diálogos acessíveis: Escape fecha, scroll do fundo bloqueia, foco entra e volta
  useEffect(() => {
    const anyOpen = showTypeModal || whatsappModal !== null;
    if (!anyOpen) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    (showTypeModal ? typeModalPanelRef.current : waModalPanelRef.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowTypeModal(false);
        setWhatsappModal(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      lastFocusedRef.current?.focus();
    };
  }, [showTypeModal, whatsappModal]);

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    toast.success("Copiado!");
  };

  const confirmPlanSelection = (planName: string, price: string, billingCycle?: "monthly" | "annual") => {
    if (!user) {
      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-sm w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl flex flex-col border border-slate-100 overflow-hidden relative z-[80]`}
          >
            <div className="p-4">
              <h3 className="font-bold text-slate-900 mb-1">
                Acesso Necessário
              </h3>
              <p className="text-sm text-slate-500">
                Você precisa entrar na sua conta para escolher um plano.
              </p>
            </div>
            <div className="flex border-t border-slate-100">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-1 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <div className="w-px bg-slate-100" />
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate("/auth");
                }}
                className="flex-1 px-4 py-3 text-sm font-bold text-brand-blue hover:bg-slate-50 transition-colors"
              >
                Fazer Login
              </button>
            </div>
          </div>
        ),
        { duration: 5000 },
      );
      return;
    }

    const currentPlan = userProfile?.plan || "Essencial";

    if (currentPlan === planName) {
      toast.error(`Você já possui o plano ${planName} ativo na sua conta.`);
      return;
    }

    setWhatsappModal({
      name: planName,
      price,
      billingCycle,
    });
  };

  const handleOpenWhatsApp = (whatsappNumber: string) => {
    if (!whatsappModal || !user) return;

    const messageText = whatsappModal.name === "Business"
      ? `Olá! Gostaria de subscrever ao Plano ${whatsappModal.name.toUpperCase()} para a minha agência.\n\nID da Plataforma: ${user.uid}\nE-mail: ${user.email || "Não informado"}\n\nEstou em contacto para concluir o pagamento do meu plano. Obrigado!`
      : `Olá! Gostaria de comprar o Plano ${whatsappModal.name.toUpperCase()} por ${whatsappModal.price}.\n\nID da Plataforma: ${user.uid}\nE-mail: ${user.email || "Não informado"}\n\nEstou em contacto para concluir o pagamento do meu plano. Obrigado!`;

    const cleanNumber = whatsappNumber.replace(/\D/g, "");
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setWhatsappModal(null);
  };
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location]);

  useEffect(() => {
    if (!user) {
      setUserEvents([]);
      return;
    }
    
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where("ownerId", "==", user.uid));
      
      const unsubscribeEvents = onSnapshot(q, (snapshot: any) => {
        const eventsList = snapshot.docs.map((doc: any) => ({
          ...doc.data(),
          id: doc.id
        }));
        setUserEvents(eventsList);
      }, (error: any) => {
        // Suppress missing permissions error during development if rule not exist
        if(error.message.includes("Missing or insufficient permissions")) {
            console.warn("Firestore rules test or missing index error, ignore if dev", error);
        } else {
            handleFirestoreError(error, OperationType.LIST, 'events');
        }
      });
      return unsubscribeEvents;
    } catch(err) {
      console.warn("Failed to set up events listener", err);
    }
  }, [user]);

  const handleCreateEvent = () => {
    setShowTypeModal(true);
  }

  const handleConcierge = () => {
    const msg = "Olá InoEvents! Quero o serviço Concierge (+10.000 Kz) — que a vossa equipa crie o meu convite por mim.";
    window.open(`https://wa.me/244952815430?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between relative font-display overflow-x-hidden bg-[#FDFBF7] text-slate-900">
      <SEO 
        title="InoEvents Angola | Convites Digitais de Casamento, Chá de Panela e Gestão de Eventos" 
        description="A plataforma mais elegante de Angola para criar convites digitais de casamento e chás de panela a partir de 7.500 Kz, com RSVP online, QR Code de acesso, mapa da zona com botão Como chegar, check-in presencial no evento, lista de convidados e presentes por IBAN."
      />

      <Navbar />

      <main className="relative z-10 flex flex-col flex-1 gap-0">
        
        {/* HERO — banner contínuo atrás de tudo */}
        <section className="relative w-full flex flex-col overflow-hidden pt-28">
            {/* Fotografia + véu navy para legibilidade */}
            <img
              src="/bannerIno.webp"
              alt="Casal de noivos ao pôr-do-sol sobre o mar"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover object-[55%_20%] md:object-[50%_25%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1f38]/90 via-[#0d1f38]/35 to-[#0d1f38]/15 pointer-events-none" aria-hidden="true" />
            {/* Derretido suave para o creme, no fim da composição */}
            <div className="absolute bottom-0 left-0 right-0 h-40 md:h-52 bg-gradient-to-b from-transparent via-[#FDFBF7]/60 to-[#FDFBF7] pointer-events-none" aria-hidden="true" />
            {/* Selo quieto */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="relative z-20 flex justify-center w-full mb-8"
            >
               <div className="flex items-center gap-3 px-1 py-2">
                  <span className="h-px w-8 bg-[var(--color-gold-soft)]/80" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">Convites digitais · Angola</span>
                  <span className="h-px w-8 bg-[var(--color-gold-soft)]/80" />
               </div>
            </motion.div>

            <div className="relative z-20 max-w-5xl mx-auto px-6 pb-12 md:pb-16 text-center flex flex-col items-center">
              
               <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  className="text-[2.9rem] md:text-7xl lg:text-[5rem] font-serif font-bold text-white tracking-tight leading-[1.02] md:leading-[1.05] mb-6"
               >
                  O convite do seu<br />
                  <span className="italic font-medium text-[var(--color-gold-soft)] inline-block mt-2">grande dia.</span>
               </motion.h1>
               
               <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                  className="text-lg md:text-xl text-white/85 max-w-xl mx-auto leading-relaxed mb-10 font-light text-center"
               >
                  Convites digitais de casamento e chá de panela, com confirmação de presença, lista de presentes e mapa com Como chegar — tudo num só link.
               </motion.p>
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                 className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto px-4"
              >
                {/* Primary CTA — hierarquia clara, lado a lado no desktop */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto">
                   <button
                     onClick={handleCreateEvent}
                     className="w-full sm:w-auto h-12 px-8 bg-[#C5A028] text-[#1B365D] text-xs font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-2 group cursor-pointer hover:bg-[#d4af37] active:scale-[0.97]"
                     style={{ transition: 'transform 160ms ease-out, background-color 200ms ease' }}
                  >
                     <span>Criar Convite</span>
                     <ArrowRight size={16} className="group-hover:translate-x-0.5 shrink-0" style={{ transition: 'transform 160ms ease-out' }} />
                  </button>

                   {/* Secundário — botão fantasma com peso de botão */}
                   <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                     <button
                        onClick={handleConcierge}
                        className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-7 rounded-full border-2 border-white/70 text-white text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-[#1B365D] hover:border-white active:scale-[0.97] cursor-pointer"
                        style={{ transition: 'transform 160ms ease-out, background-color 200ms ease, color 200ms ease' }}
                     >
                        <Award size={15} className="shrink-0" />
                        Concierge: criamos por si
                     </button>
                   </div>
                 </div>
                 {/* Selo MAP — prova no hero, sem iframe para não pesar o LCP */}
                 <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90">
                   <MapPin size={14} className="text-[#E9BE5D] shrink-0" />
                   Mapa + Como chegar incluído
                 </span>
               </motion.div>
           </div>

            {/* Composição por cima do banner — painel de templates + telemóvel + confirmação */}
            <motion.div
              id="exemplo"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
              className="relative z-10 w-full max-w-5xl mx-auto px-4 h-[420px] md:h-[500px] scroll-mt-28"
            >
               {/* Painel central de templates com desfile automático */}
               <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[92%] md:w-[620px] h-[340px] md:h-[420px] bg-[#FFFDF8] rounded-t-3xl border border-[#C5A028]/30 border-b-0 shadow-[0_-10px_50px_rgba(27,54,93,0.08)] overflow-hidden flex flex-col">
                  <div className="h-1.5 bg-[#C5A028]/70 shrink-0 z-10" />
                  <div className="flex-1 p-4 md:p-6 overflow-hidden relative">
                     <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF8] via-transparent to-[#FFFDF8] z-10 pointer-events-none" />
                     <div className="grid grid-cols-2 gap-6 h-full relative z-0">
                        <motion.div
                           animate={{ y: ["0%", "-50%"] }}
                           transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                           className="flex flex-col gap-6 will-change-transform"
                        >
                           <img src="/casalModel.webp" className="rounded-2xl shadow-sm object-cover w-full aspect-[3/4]" alt="Convite de casamento" />
                           <img src="/bridal-templates/templateCha3.webp" className="rounded-2xl shadow-sm object-cover w-full aspect-[3/4]" alt="Convite de chá de panela" />
                           <img src="/bridal-templates/templateCha1.webp" className="rounded-2xl shadow-sm object-cover w-full aspect-[3/4]" alt="Convite de chá de panela" />
                        </motion.div>
                        <motion.div
                           animate={{ y: ["-50%", "0%"] }}
                           transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
                           className="flex flex-col gap-6 mt-[-50%] will-change-transform"
                        >
                           <img src="/bridal-templates/templateCha2.webp" className="rounded-2xl shadow-sm object-cover w-full aspect-[3/4]" alt="Convite de chá de panela" />
                           <img src="/bridal-templates/templateCha4.webp" className="rounded-2xl shadow-sm object-cover w-full aspect-[3/4]" alt="Convite de chá de panela" />
                           <img src="/bridal-templates/templateCha1.webp" className="rounded-2xl shadow-sm object-cover w-full aspect-[3/4]" alt="Convite de chá de panela" />
                        </motion.div>
                     </div>
                  </div>
               </div>

               {/* Telemóvel da noiva */}
               <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  className="absolute left-2 md:left-24 top-12 w-[160px] md:w-[220px] h-[320px] md:h-[400px] bg-white rounded-3xl border-4 md:border-8 border-[#1B365D] shadow-2xl flex flex-col overflow-hidden z-20"
               >
                  <img src="/casalModel.webp" className="w-full h-full object-cover" alt="Convite visto no telemóvel" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[80%] bg-white/90 backdrop-blur text-center py-2 rounded-full text-[10px] sm:text-xs font-bold text-[#1B365D] shadow-lg">
                     Confirmar Presença
                  </div>
               </motion.div>

               {/* Cartão de confirmação */}
               <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                  className="absolute right-0 md:right-16 top-24 w-[180px] md:w-[260px] rounded-2xl bg-[#FFFDF8] border border-[#C5A028]/30 p-4 shadow-[0_20px_40px_rgba(27,54,93,0.12)] hidden sm:block"
               >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
                     <CheckCircle2 size={24} />
                  </div>
                  <h4 className="font-serif font-bold text-[#1B365D] mb-1">Presença Confirmada</h4>
                  <p className="text-xs text-slate-500 font-light mb-4">Os convidados confirmam na página e entram na lista.</p>
                  <div className="text-xs font-bold text-[#1B365D] bg-[#C5A028]/15 py-2 px-3 rounded-lg text-center">
                     Ver lista de presenças
                  </div>
               </motion.div>
            </motion.div>
        </section>

        {/* Legenda — já no creme */}
        <div className="bg-[#FDFBF7] flex items-center justify-center gap-3 text-center px-6 py-8">
           <span className="h-px w-8 bg-[#C5A028]/60" />
           <span className="text-sm text-slate-500 font-light">
              O catálogo em montra.
              <Link to="/templates" className="ml-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1B365D] hover:text-[#8a6d1c] whitespace-nowrap" style={{ transition: 'color 200ms ease' }}>
                 Ver todos →
              </Link>
           </span>
           <span className="h-px w-8 bg-[#C5A028]/60" />
        </div>

        {/* Como funciona — três gestos */}
        <section id="features" className="px-6 pt-4 md:pt-8 pb-4 md:pb-8 w-full">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-[2.75rem] font-serif font-bold text-[#1B365D] tracking-tight leading-[1.1] mb-4">
              Do link ao <span className="italic font-medium text-[#8a6d1c]">sim</span>, em três gestos.
            </h2>
            <p className="text-slate-600 font-light text-lg leading-relaxed mb-12">
              Sem papel, sem listas em cadernos, sem telefonemas a confirmar um a um.
            </p>
            <ol className="flex flex-col">
              <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-6 py-8 border-t border-[#C5A028]/30">
                <span className="font-serif italic text-2xl text-[#8a6d1c] leading-none pt-1">I.</span>
                <div>
                  <h3 className="font-serif font-bold text-xl text-slate-900 mb-2">Partilhe o link</h3>
                  <p className="text-slate-600 font-light leading-relaxed">Do painel, envie o convite a cada convidado por WhatsApp com uma mensagem pronta a acompanhar.</p>
                </div>
              </li>
              <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-6 py-8 border-t border-[#C5A028]/30">
                <span className="font-serif italic text-2xl text-[#8a6d1c] leading-none pt-1">II.</span>
                <div>
                  <h3 className="font-serif font-bold text-xl text-slate-900 mb-2">Confirmam na página</h3>
                  <p className="text-slate-600 font-light leading-relaxed">Cada convidado abre o link e confirma presença; nos planos avançados recebe um código QR individual.</p>
                </div>
              </li>
              <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-6 py-8 border-t border-b border-[#C5A028]/30">
                <span className="font-serif italic text-2xl text-[#8a6d1c] leading-none pt-1">III.</span>
                <div>
                  <h3 className="font-serif font-bold text-xl text-slate-900 mb-2">Receba no dia</h3>
                  <p className="text-slate-600 font-light leading-relaxed">Check-in à entrada com a câmara, presentes por IBAN registados e mesas organizadas.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Funcionalidades — só o que a plataforma faz */}
        <section className="px-6 py-16 md:py-24 w-full" aria-label="Funcionalidades">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-[2.75rem] font-serif font-bold text-[#1B365D] tracking-tight leading-[1.1] mb-4">
              Tudo o que o convite <span className="italic font-medium text-[#8a6d1c]">faz por si</span>
            </h2>
            <p className="text-slate-600 font-light text-lg leading-relaxed mb-12 max-w-2xl">
              Nada aqui é promessa — cada linha corresponde a uma ferramenta real do painel.
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 border-b border-[#C5A028]/30">
              <li className="flex gap-4 py-6 border-t border-[#C5A028]/30">
                <MessageSquare size={20} className="text-[#8a6d1c] shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Confirmação sem telefonemas</h3>
                  <p className="text-sm text-slate-600 font-light leading-relaxed">O convidado recebe o link no WhatsApp e confirma presença na página.</p>
                </div>
              </li>
              <li className="flex gap-4 py-6 border-t border-[#C5A028]/30">
                <QrCode size={20} className="text-[#8a6d1c] shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Entrada com check-in</h3>
                  <p className="text-sm text-slate-600 font-light leading-relaxed">QR individual por convidado e leitura à entrada, nos planos VIP e Business.</p>
                </div>
              </li>
              <li className="flex gap-4 py-6 border-t border-[#C5A028]/30">
                <Gift size={20} className="text-[#8a6d1c] shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Presentes em Kwanza</h3>
                  <p className="text-sm text-slate-600 font-light leading-relaxed">Cotas com valores, transferência por IBAN e registo de cada contribuição.</p>
                </div>
              </li>
              <li className="flex gap-4 py-6 border-t border-[#C5A028]/30">
                <Users size={20} className="text-[#8a6d1c] shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Mesas organizadas</h3>
                  <p className="text-sm text-slate-600 font-light leading-relaxed">Distribua cada convidado pelo seu lugar, a partir do Premium.</p>
                </div>
              </li>
              <li className="flex gap-4 py-6 border-t border-[#C5A028]/30">
                <BookOpen size={20} className="text-[#8a6d1c] shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Livro, galeria e música</h3>
                  <p className="text-sm text-slate-600 font-light leading-relaxed">Recados dos convidados, fotos com likes e fundo musical, conforme o plano.</p>
                </div>
              </li>
              <li className="flex gap-4 py-6 border-t border-[#C5A028]/30">
                <MapPin size={20} className="text-[#8a6d1c] shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Mapa e Como chegar</h3>
                  <p className="text-sm text-slate-600 font-light leading-relaxed">Mapa bonito da zona com foto, endereço e botão Como chegar — o convidado chega sem ligar.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Prova MAP — exemplo real lazy, fora do hero para não pesar o LCP */}
        <section id="mapa" className="px-6 py-16 md:py-24 w-full scroll-mt-24" aria-label="Exemplo de mapa do convite">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              <MapPin size={14} className="text-emerald-600 shrink-0" />
              Exemplo real
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.75rem] font-serif font-bold text-[#1B365D] tracking-tight leading-[1.1]">
              O convite vem com <span className="italic font-medium text-[#8a6d1c]">mapa bonito</span>
            </h2>
            <p className="mt-3 text-slate-600 font-light text-lg leading-relaxed max-w-xl mx-auto">
              Zona da festa com foto, endereço e botão Como chegar. O convidado vê onde é e chega sem ligar — 100% só leitura.
            </p>
            <div className="mt-8 mx-auto max-w-xl text-left">
              <div className="rounded-[1.5rem] border border-slate-200/60 shadow-lg overflow-hidden bg-white">
                <div className="relative w-full aspect-[16/10] min-h-[220px] bg-slate-100">
                  <MapEmbed
                    src={buildEmbedSrc({ latitude: DEFAULT_CENTER.lat, longitude: DEFAULT_CENTER.lng, locationName: 'Luanda' })}
                    title="Exemplo de mapa do convite — Luanda"
                  />
                  <div className="absolute bottom-3 right-3 pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/90 backdrop-blur-md border border-slate-200 text-slate-600 shadow-sm">
                      <MapPin size={10} /> Só leitura
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-2.5">
                  <p className="flex items-start gap-2 font-bold text-slate-900 text-[15px] leading-snug">
                    <MapPin size={16} className="text-[#8a6d1c] shrink-0 mt-0.5" />
                    <span>Zona da festa com foto e endereço</span>
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed ml-6">No convite real aparece a sua zona, com foto do espaço, avaliação e Plus Code.</p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <a
                      href={buildDirectionsUrl(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B365D] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#224373] active:scale-[0.97] px-6 py-3"
                      style={{ transition: 'transform 160ms ease-out, background-color 200ms ease' }}
                    >
                      <Navigation size={16} /> Como chegar
                    </a>
                    <Link
                      to="/templates"
                      className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 text-slate-800 bg-white text-xs font-bold uppercase tracking-widest hover:bg-slate-50 active:scale-[0.97] px-6 py-3"
                    >
                      Ver convites
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section (New) */}
        <section id="pricing" className="px-6 py-16 md:py-24 w-full relative z-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl md:text-[2.75rem] font-serif font-bold text-[#1B365D] tracking-tight leading-[1.1] mb-4">Um plano para cada <span className="italic font-medium text-[#8a6d1c]">celebração</span></h2>
              <p className="text-slate-600 font-light">Pagamento único por evento. Sem mensalidades para noivos.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-stretch justify-center gap-6">
              {/* Plan 1: Essencial */}
              <div className="w-full bg-[#FFFDF8] rounded-2xl p-8 border border-[#C5A028]/30 flex flex-col relative" style={{ transition: 'border-color 200ms ease, box-shadow 200ms ease' }}>
                  <h4 className="font-serif text-2xl font-bold text-[#1B365D] mb-1">Essencial</h4>
                  <p className="text-slate-500 text-[13px] font-light leading-relaxed mb-6">Para festas íntimas, sem complicações.</p>
                  <div className="mb-2 flex items-baseline gap-1">
                     <span className="text-4xl font-serif font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{PLANS.essential.price.toLocaleString('pt-AO')}</span>
                     <span className="text-slate-500 text-sm font-medium">Kz / evento</span>
                  </div>
                  <p className="text-xs text-slate-500 font-light mb-6">Válido por {PLANS.essential.validityDays} dias · Até {PLANS.essential.guestLimit} convidados</p>
                 <ul className="flex flex-col gap-3 mb-8 flex-1">
                     <li className="flex items-center gap-3 text-[13px] text-slate-600">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Até 100 convidados</span>
                     </li>
                     <li className="flex items-center gap-3 text-[13px] text-slate-600">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Temas clássicos</span>
                     </li>
                      <li className="flex items-center gap-3 text-[13px] text-slate-600">
                         <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                         <span>Galeria de fotos</span>
                      </li>
                      <li className="flex items-center gap-3 text-[13px] text-slate-600">
                         <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                         <span>QR do evento e contagem regressiva</span>
                      </li>
                  </ul>
                  <button
                     onClick={() => confirmPlanSelection("Essencial", "7.500 Kz")}
                     className="w-full py-3.5 rounded-full border border-[#1B365D]/30 text-[#1B365D] font-bold text-xs uppercase tracking-wider hover:bg-[#1B365D] hover:text-white active:scale-[0.97] cursor-pointer"
                     style={{ transition: 'transform 160ms ease-out, background-color 200ms ease, color 200ms ease' }}
                  >
                     Escolher Essencial
                  </button>
               </div>
              
              {/* Plan 2: Premium (Highlighted) */}
              <div className="w-full bg-[#1B365D] rounded-2xl p-8 relative flex flex-col xl:-translate-y-3 border border-[#1B365D]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#C5A028] text-white text-[10px] font-bold uppercase tracking-[0.14em] py-1 px-4 rounded-full whitespace-nowrap">
                     O mais escolhido
                  </div>
                  <h4 className="font-serif text-2xl font-bold text-white mb-1">Premium</h4>
                  <p className="text-blue-200/70 text-[13px] font-light leading-relaxed mb-6">O grande dia, sem limites nem marca.</p>
                  <div className="mb-2 flex items-baseline gap-1">
                     <span className="text-4xl font-serif font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{PLANS.premium.price.toLocaleString('pt-AO')}</span>
                     <span className="text-blue-200/70 text-sm font-medium">Kz / evento</span>
                  </div>
                  <p className="text-xs text-blue-200/60 font-light mb-6">Válido por {PLANS.premium.validityDays} dias · Até {PLANS.premium.guestLimit} convidados</p>
                  <ul className="flex flex-col gap-3 mb-8 flex-1">
                     <li className="flex items-center gap-3 text-[13px] text-blue-50">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Até {PLANS.premium.guestLimit} convidados</span>
                     </li>
                     <li className="flex items-center gap-3 text-[13px] text-blue-50">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Temas premium e luxury</span>
                     </li>
                     <li className="flex items-center gap-3 text-[13px] text-blue-50">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Música de fundo no convite</span>
                     </li>
                     <li className="flex items-center gap-3 text-[13px] text-blue-50">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Sem marca InoEvents</span>
                     </li>
                     <li className="flex items-center gap-3 text-[13px] text-blue-50">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Partilha por WhatsApp</span>
                     </li>
                     <li className="flex items-center gap-3 text-[13px] text-blue-50">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Mapa das mesas e livro de assinaturas</span>
                     </li>
                  </ul>
                 <button
                     onClick={() => confirmPlanSelection("Premium", "15.000 Kz")}
                     className="w-full py-3.5 rounded-full bg-[#C5A028] text-[#1B365D] font-bold text-xs uppercase tracking-wider hover:bg-[#d4af37] active:scale-[0.97] cursor-pointer"
                     style={{ transition: 'transform 160ms ease-out, background-color 200ms ease' }}
                  >
                     Criar Convite Premium
                  </button>
               </div>
              
              {/* Plan 3: VIP */}
              <div className="w-full bg-[#FFFDF8] rounded-2xl p-8 border border-[#C5A028]/30 flex flex-col relative" style={{ transition: 'border-color 200ms ease, box-shadow 200ms ease' }}>
                  <h4 className="font-serif text-2xl font-bold text-[#1B365D] mb-1">VIP</h4>
                  <p className="text-slate-500 text-[13px] font-light leading-relaxed mb-6">Receção com check-in e endereço próprio.</p>
                  <div className="mb-2 flex items-baseline gap-1">
                     <span className="text-4xl font-serif font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{PLANS.vip.price.toLocaleString('pt-AO')}</span>
                     <span className="text-slate-500 text-sm font-medium">Kz / evento</span>
                  </div>
                  <p className="text-xs text-slate-500 font-light mb-6">Válido por {PLANS.vip.validityDays} dias · Até {PLANS.vip.guestLimit} convidados</p>
                  <ul className="flex flex-col gap-3 mb-8 flex-1">
                     <li className="flex items-center gap-3 text-[13px] text-slate-600">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Tudo do Premium</span>
                     </li>
                     <li className="flex items-center gap-3 text-[13px] text-slate-600">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>QR individual e check-in à entrada</span>
                     </li>
                     <li className="flex items-center gap-3 text-[13px] text-slate-600">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Gestão de acompanhantes</span>
                     </li>
                     <li className="flex items-center gap-3 text-[13px] text-slate-600">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Estatísticas avançadas</span>
                     </li>
                     <li className="flex items-center gap-3 text-[13px] text-slate-600">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Suporte prioritário</span>
                     </li>
                  </ul>
                  <button
                     onClick={() => confirmPlanSelection("VIP", `${PLANS.vip.price.toLocaleString('pt-AO')} Kz`)}
                     className="w-full py-3.5 rounded-full border border-[#1B365D]/30 text-[#1B365D] font-bold text-xs uppercase tracking-wider hover:bg-[#1B365D] hover:text-white active:scale-[0.97] cursor-pointer"
                     style={{ transition: 'transform 160ms ease-out, background-color 200ms ease, color 200ms ease' }}
                  >
                     Escolher VIP
                  </button>
               </div>

                {/* Plan 4: Business */}
              <div className="w-full bg-[#FFFDF8] rounded-2xl p-8 border border-[#C5A028]/30 flex flex-col relative" style={{ transition: 'border-color 200ms ease, box-shadow 200ms ease' }}>
                  <h4 className="font-serif text-2xl font-bold text-[#1B365D] mb-1 flex items-center gap-2">
                    Business
                    <Briefcase size={18} className="text-[#C5A028]" />
                  </h4>
                  <p className="text-slate-500 text-[13px] font-light leading-relaxed mb-6">Para agências e cerimonialistas, todos os meses.</p>
                  <div className="mb-2 flex items-baseline gap-1">
                     <span className="text-3xl font-serif font-bold text-slate-900 leading-[1.2]" style={{ fontVariantNumeric: 'tabular-nums' }}>{PLANS.business.price.toLocaleString('pt-AO')}</span>
                     <span className="text-slate-500 text-sm font-medium">Kz / mês</span>
                  </div>
                  <p className="text-xs text-slate-500 font-light mb-6">Eventos ilimitados · sem fidelização</p>
                 <ul className="flex flex-col gap-3 mb-8 flex-1">
                     <li className="flex items-center gap-3 text-[13px] text-slate-600">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Eventos ilimitados</span>
                     </li>
                     <li className="flex items-center gap-3 text-[13px] text-slate-600">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Com a marca da sua agência</span>
                     </li>
                     <li className="flex items-center gap-3 text-[13px] text-slate-600">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Painel para os seus clientes</span>
                     </li>
                     <li className="flex items-center gap-3 text-[13px] text-slate-600">
                        <CheckCircle2 size={18} className="text-[#C5A028] shrink-0" />
                        <span>Suporte prioritário</span>
                     </li>
                  </ul>
                  <button
                     onClick={() => confirmPlanSelection("Business", "39.900 Kz", "monthly")}
                     className="w-full py-3.5 rounded-full border border-[#1B365D]/30 text-[#1B365D] font-bold text-xs uppercase tracking-wider hover:bg-[#1B365D] hover:text-white active:scale-[0.97] cursor-pointer"
                     style={{ transition: 'transform 160ms ease-out, background-color 200ms ease, color 200ms ease' }}
                  >
                     Falar sobre o Business
                   </button>
                </div>
            </div>
          </div>
        </section>

        {/* Vozes — rotação fluida de seis */}
        <section className="px-6 py-16 md:py-24 w-full" aria-label="Depoimentos">
          <h2 className="sr-only">O que dizem os noivos</h2>
          <div className="max-w-3xl mx-auto">
            <QuoteRotator />
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection preview />

      </main>

      {/* Fecho — colofão */}
      <footer className="px-6 pt-16 md:pt-20 pb-10 text-sm border-t border-[#C5A028]/30">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
              <p className="font-serif text-3xl md:text-4xl text-[#1B365D] tracking-tight leading-tight">O vosso dia merece um <span className="italic font-medium text-[#8a6d1c]">convite à altura.</span></p>
              <button
                 onClick={handleCreateEvent}
                 className="h-12 px-8 bg-[#1B365D] text-white text-xs font-bold uppercase tracking-wider rounded-full cursor-pointer hover:bg-[#224373] active:scale-[0.97]"
                 style={{ transition: 'transform 160ms ease-out, background-color 200ms ease' }}
              >
                 Criar Convite
              </button>
              <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] text-slate-500 [&>a]:min-h-[44px] [&>a]:inline-flex [&>a]:items-center [&>a]:px-1" aria-label="Rodapé">
                 <Link to="/templates" className="hover:text-slate-900" style={{ transition: 'color 200ms ease' }}>Templates</Link>
                 <Link to="/plans" className="hover:text-slate-900" style={{ transition: 'color 200ms ease' }}>Planos</Link>
                 <Link to="/about" className="hover:text-slate-900" style={{ transition: 'color 200ms ease' }}>Sobre Nós</Link>
                 <Link to="/terms" className="hover:text-slate-900" style={{ transition: 'color 200ms ease' }}>Termos</Link>
                 <Link to="/privacy" className="hover:text-slate-900" style={{ transition: 'color 200ms ease' }}>Privacidade</Link>
                 <a href="https://wa.me/244952815430" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900" style={{ transition: 'color 200ms ease' }}>WhatsApp</a>
              </nav>
              <p className="text-xs text-slate-500 font-light">© {new Date().getFullYear()} InoEvents · Feito em Luanda, Angola</p>
          </div>
        </footer>


      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />

      {/* Event Type Selection Modal */}
      <AnimatePresence>
        {showTypeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              ref={typeModalPanelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Escolher tipo de evento"
              tabIndex={-1}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.15 } }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="bg-[#FFFDF8] rounded-3xl p-6 md:p-8 max-w-md w-full flex flex-col shadow-2xl border border-[#C5A028]/30 relative overflow-hidden text-left outline-none"
            >
              <button
                onClick={() => setShowTypeModal(false)}
                aria-label="Fechar"
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 w-11 h-11 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer border border-slate-100"
                style={{ transition: 'background-color 200ms ease, color 200ms ease' }}
              >
                <X size={20} className="block" />
              </button>

              <div className="text-center mb-6 shrink-0 px-2">
                <h3 className="text-2xl font-serif font-bold text-[#1B365D] tracking-tight mb-2">Que momento vamos celebrar?</h3>
                <p className="text-slate-500 text-sm font-light">Dois caminhos, um só cuidado.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'wedding', label: 'Casamento', desc: 'RSVP detalhado, lista de presentes e IBAN.', icon: <Gem size={24} />, color: 'from-amber-500/10 to-amber-600/10 text-amber-600' },
                  { id: 'bridal', label: 'Chá de Panela', desc: 'Presentes práticos e confirmação rápida.', icon: <Utensils size={24} />, color: 'from-pink-500/10 to-rose-600/10 text-pink-600' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      // Template primeiro (padrão Evite/Paperless): os dois tipos passam pela galeria;
                      // o questionário/editor mostra só os campos que o tema escolhido renderiza.
                      navigate(`/templates?category=${item.id}`);
                      setShowTypeModal(false);
                    }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-[#C5A028]/60 hover:bg-white text-left cursor-pointer w-full bg-white"
                    style={{ transition: 'border-color 200ms ease, background-color 200ms ease' }}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm md:text-base group-hover:text-brand-blue transition-colors flex items-center gap-1.5">
                        {item.label}
                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </h4>
                      <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Activation Modal */}
      <AnimatePresence>
        {whatsappModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWhatsappModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              ref={waModalPanelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Ativar plano via WhatsApp"
              tabIndex={-1}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.15 } }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="bg-white rounded-3xl p-5 md:p-6 max-w-sm w-full relative z-10 shadow-2xl flex flex-col border border-slate-100 max-h-[90vh] overflow-y-auto text-left outline-none"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-brand-blue font-bold tracking-widest text-[10px] uppercase mb-0.5 block">
                    Concluir no WhatsApp
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Activar {whatsappModal.name}
                  </h3>
                </div>
                <button
                  onClick={() => setWhatsappModal(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-2xl p-3.5 mb-4">
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  Escolha um operador abaixo. Você será redirecionado para o WhatsApp com uma mensagem personalizada com o seu ID para que o administrador ative o seu plano de imediato.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5 mb-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/40">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Artigo
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {whatsappModal.name}
                  </span>
                </div>
                {whatsappModal.billingCycle && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/40">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Faturação
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {whatsappModal.billingCycle === "annual"
                        ? "Anual"
                        : "Mensal"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/40">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Valor
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {whatsappModal.price}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-3 pt-0.5">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                      ID da Plataforma
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700 truncate block">
                      {user?.uid}
                    </span>
                  </div>
                  <button
                    onClick={() => user && handleCopy(user.uid)}
                    className="p-1 px-2.5 bg-white text-slate-500 hover:text-brand-blue hover:bg-slate-50 border border-slate-200 shadow-sm rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Copy size={11} /> Copiar
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Selecione um operador de suporte:
                </p>

                <button
                  onClick={() => handleOpenWhatsApp("952815430")}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3 px-3.5 font-bold text-xs transition-all duration-200 flex items-center justify-between shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 select-none cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare size={16} />
                    WhatsApp (952 815 430)
                  </span>
                  <span className="bg-white/20 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">
                    Canal 1
                  </span>
                </button>

                <button
                  onClick={() => handleOpenWhatsApp("939384315")}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3 px-3.5 font-bold text-xs transition-all duration-200 flex items-center justify-between shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 select-none cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare size={16} />
                    WhatsApp (939 384 315)
                  </span>
                  <span className="bg-white/20 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">
                    Canal 2
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};