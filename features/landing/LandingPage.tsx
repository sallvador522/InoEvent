import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENTS } from '../../mockData';
import { ThemeType } from '../../types';
import { useFirebase, signOut, auth, db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

// Create a motion component from the React Router Link
const MotionLink = motion(Link);

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: 'apps' },
  { id: 'wedding', label: 'Casamento', icon: 'diamond' },
  { id: 'birthday', label: 'Aniversário', icon: 'cake' },
  { id: 'baby', label: 'Chá de Bebê', icon: 'crib' }, 
  { id: 'bridal', label: 'Chá de Panela', icon: 'kitchen' }, 
  { id: 'kids', label: 'Infantil', icon: 'smart_toy' },
  { id: '15years', label: '15 Anos', icon: 'celebration' },
  { id: 'adult', label: 'Adulto', icon: 'nightlife' },
];

const TESTIMONIALS = [
  { text: "A melhor plataforma de convites que já usei. Simplesmente elegante.", author: "Maria Silva", role: "Noiva", rating: 5 },
  { text: "Meus convidados ficaram maravilhados com a facilidade do RSVP.", author: "João Pereira", role: "Aniversariante", rating: 5 },
  { text: "Design impecável! O QR code individual facilitou muito a recepção.", author: "Ana Costa", role: "Assessora de Eventos", rating: 5 },
  { text: "Suporte VIP incrível via WhatsApp. Resolveram tudo em minutos.", author: "Carlos Santos", role: "Produtor B2B", rating: 5 },
  { text: "Os templates são maravilhosos. O meu casamento ganhou outro nível.", author: "Juliana Mendes", role: "Noiva", rating: 5 },
  { text: "Painel de controle excelente para gerir milhares de convidados.", author: "Sérgio Almeida", role: "Organizador Corporate", rating: 5 },
];

export const LandingPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const { user, userProfile } = useFirebase();
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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

  const getBadgeConfig = (type: ThemeType) => {
    switch (type) {
      case ThemeType.WEDDING:
        return { label: 'LUXO', className: 'bg-white/90 text-brand-blue' };
      case ThemeType.BIRTHDAY:
        return { label: 'VIBRANTE', className: 'bg-purple-600/90 text-white' };
      case ThemeType.CORPORATE:
        return { label: 'MINIMAL', className: 'bg-brand-blue/90 text-white' };
      default:
        return { label: 'PREMIUM', className: 'bg-gray-800/90 text-white' };
    }
  };

  const handleCreateEvent = () => {
    if (!user) {
        navigate('/auth');
        return;
    }
    navigate('/create-invitation');
  }

  const filteredEvents = selectedCategory === 'all' 
    ? EVENTS 
    : EVENTS.filter(e => {
        if (selectedCategory === 'wedding') return e.type === ThemeType.WEDDING;
        if (selectedCategory === 'birthday' || selectedCategory === 'kids' || selectedCategory === '15years' || selectedCategory === 'adult') return e.type === ThemeType.BIRTHDAY;
        if (selectedCategory === 'bridal') return e.type === ThemeType.BRIDAL_SHOWER;
        return true; 
      });

  return (
    <div className="min-h-screen relative font-display overflow-x-hidden bg-white">
      
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-blue-50/50 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Elegant Blue Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-brand-blue text-white shadow-lg shadow-brand-blue/10 px-6 py-4 flex items-center justify-between transition-all">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
          <h2 className="text-white text-xl font-serif font-bold tracking-wide">InoEvents</h2>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-blue-100">
           <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
           <Link to="/plans" className="hover:text-white transition-colors">Preços</Link>
           <a href="mailto:suporte@inoevents.com" className="hover:text-white transition-colors">Contactos</a>
           <a href="#faq" className="hover:text-white transition-colors">Perguntas</a>
           <Link to="/about" className="hover:text-white transition-colors">Sobre Nós</Link>
           
           <div className="flex items-center gap-6 pl-2">
             <span className="text-white/20 text-lg font-light select-none">|</span>
             {user ? (
               <div className="flex items-center gap-4 relative group">
                  <span className="cursor-pointer font-semibold text-white flex items-center gap-1 hover:text-blue-200 transition-colors">
                    Meus Eventos <span className="material-symbols-outlined text-sm transition-transform group-hover:rotate-180">expand_more</span>
                  </span>
                  
                  {/* Dropdown Desktop */}
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col overflow-hidden">
                     {userEvents.length > 0 ? (
                        <>
                          <div className="flex flex-col max-h-80 overflow-y-auto">
                            {[...userEvents].reverse().slice(0, 3).map(event => (
                              <Link to={`/dashboard/${event.id}`} key={event.id} className="px-4 py-3 hover:bg-slate-50 text-slate-700 hover:text-brand-blue truncate font-medium text-sm transition-colors border-b border-slate-50 last:border-0 block">
                                {event.title}
                              </Link>
                            ))}
                          </div>
                          {userEvents.length > 3 && (
                            <Link to="/dashboard" className="px-4 py-3 text-primary text-center font-bold text-xs hover:bg-slate-50 transition-colors uppercase tracking-wider bg-slate-50/50">
                              Ver todos os eventos ({userEvents.length})
                            </Link>
                          )}
                        </>
                     ) : (
                        <div className="px-4 py-4 text-slate-400 text-sm text-center">Nenhum evento criado.</div>
                     )}
                     {(userProfile?.plan === 'Business' || userProfile?.plan === 'Corporate') && (
                        <Link to="/b2b" className="px-4 py-3 text-brand-blue border-t border-slate-100 text-center font-bold text-xs hover:bg-slate-50 transition-colors uppercase tracking-wider bg-blue-50/50 block">
                           Meu Negócio
                        </Link>
                     )}
                  </div>
               
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white shadow-sm border border-white/10 ml-2">{userProfile?.plan || 'Essencial'}</span>
                  <button onClick={() => signOut(auth)} className="hover:text-red-400 transition-colors font-semibold text-white ml-4">Sair</button>
               </div>
             ) : (
               <Link to="/auth" className="hover:text-primary transition-colors font-semibold text-white">Entrar</Link>
             )}
           </div>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-4 md:hidden">
          <Link to="/plans" className="text-sm font-semibold text-blue-100 hover:text-white transition-colors">Preços</Link>
          {!user && (
            <Link to="/auth" className="text-sm font-semibold text-blue-100 hover:text-white transition-colors">Entrar</Link>
          )}
          <button 
           onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
           className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-[20px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-blue/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 p-6 shadow-2xl md:hidden overflow-y-auto flex flex-col font-display"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="font-bold text-2xl text-brand-blue w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined">celebration</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-6 font-semibold text-lg text-slate-700">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">home</span> Início</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </Link>
              
              {user && (
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => setDashboardOpen(!dashboardOpen)} 
                    className="hover:text-primary transition-colors flex items-center justify-between w-full"
                  >
                    <span className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">dashboard</span> Meus Eventos</span>
                    <span className="material-symbols-outlined text-slate-300 text-xl transition-transform duration-300" style={{ transform: dashboardOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      expand_more
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {dashboardOpen && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-3 ml-[38px] bg-slate-50 p-4 rounded-2xl text-base font-medium border border-slate-100 max-h-60 overflow-y-auto">
                          {userEvents.length > 0 ? (
                            <>
                              {[...userEvents].reverse().slice(0, 3).map(event => (
                                <Link to={`/dashboard/${event.id}`} key={event.id} onClick={() => setMobileMenuOpen(false)} className="hover:text-primary truncate text-slate-600 block py-1">
                                  {event.title}
                                </Link>
                              ))}
                              {userEvents.length > 3 && (
                                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-primary mt-2 flex items-center gap-1 font-bold">
                                  Ver todos <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 text-sm">Nenhum evento criado.</span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {(userProfile?.plan === 'Business' || userProfile?.plan === 'Corporate') && (
                  <Link to="/b2b" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
                    <span className="flex items-center gap-3"><span className="material-symbols-outlined text-brand-blue">business_center</span> <span className="font-bold text-brand-blue">Meu Negócio</span></span>
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </Link>
              )}
              
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">favorite</span> Funcionalidades</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </a>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">info</span> Sobre Nós</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </Link>
              <a href="mailto:suporte@inoevents.com" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">call</span> Contactos</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </a>
            </div>
            
            <div className="mt-auto pt-8 flex flex-col gap-4">
              {user ? (
                   <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 max-w-[70%]">
                         <div className="w-10 h-10 bg-brand-blue text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                           {userProfile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                         </div>
                         <div className="flex flex-col overflow-hidden">
                           <span className="text-sm font-bold text-brand-blue truncate w-full">{userProfile?.name || user.email}</span>
                           <span className="text-xs text-slate-500 font-medium">Plano {userProfile?.plan || 'Essencial'}</span>
                         </div>
                       </div>
                       <button onClick={() => { signOut(auth); setMobileMenuOpen(false); }} className="text-red-500 bg-red-50 w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl hover:bg-red-100 transition-colors">
                         <span className="material-symbols-outlined text-xl">logout</span>
                       </button>
                     </div>
                     <button 
                       onClick={() => { setMobileMenuOpen(false); handleCreateEvent(); }} 
                       className="w-full py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-blue/90 transition-colors flex items-center justify-center gap-2"
                     >
                       <span className="material-symbols-outlined text-xl">add</span>
                       Criar Evento
                     </button>
                   </div>
              ) : (
                  <div className="flex flex-col gap-3">
                    <Link 
                      to="/auth" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-4 bg-slate-100 text-brand-blue rounded-xl font-bold hover:bg-slate-200 transition-colors text-center"
                    >
                      Entrar na sua conta
                    </Link>
                    <button 
                      onClick={() => { setMobileMenuOpen(false); handleCreateEvent(); }}
                      className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-center shadow-lg shadow-primary/20"
                    >
                      Começar Agora
                    </button>
                  </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex flex-col gap-0 pb-24">
        
        {/* HERO BANNER SECTION (New) */}
        <section className="relative w-full h-[65vh] md:h-[80vh] min-h-[500px] overflow-hidden">
           {/* Background Image with slight zoom effect */}
           <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105" 
                style={{backgroundImage: "url('https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=2670&auto=format&fit=crop')"}}>
           </div>
           
           {/* Overlays */}
           <div className="absolute inset-0 bg-black/10"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"></div>

           {/* Content Centered */}
           <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4"
           >
              <span className="font-display font-medium tracking-[0.3em] text-xs md:text-sm uppercase mb-2 md:mb-4 drop-shadow-md">
                Convites & Experiências Digitais
              </span>
              
              <h1 className="font-script text-7xl md:text-[9rem] leading-none mb-4 md:mb-6 drop-shadow-lg text-white">
                Amor & Eternidade
              </h1>
              
              <div className="flex items-center gap-4 mb-10">
                 <div className="h-px w-8 md:w-16 bg-white/80"></div>
                 <span className="font-serif italic text-lg md:text-2xl tracking-wide drop-shadow-md">
                   Planeje seu evento perfeito
                 </span>
                 <div className="h-px w-8 md:w-16 bg-white/80"></div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 mt-4">
                <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={handleCreateEvent}
                   className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/40 text-white font-bold rounded-full hover:bg-white hover:text-brand-blue transition-all duration-300 shadow-2xl"
                >
                   {user ? 'CRIAR EVENTOS' : 'COMEÇAR AGORA'}
                </motion.button>
                
                <motion.div 
                   whileHover={{ scale: 1.05, y: -2 }}
                   whileTap={{ scale: 0.95 }}
                   className="relative group"
                >
                   <span className="absolute -top-2 -right-2 flex h-5 w-5 z-10">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border border-white"></span>
                   </span>
                   <Link 
                     to="/plans"
                     className="px-8 py-4 bg-brand-blue/80 backdrop-blur-md border border-brand-blue/50 text-white font-bold rounded-full hover:bg-brand-blue transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.3)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center gap-2"
                   >
                     <span>VER PREÇOS</span>
                     <span className="ml-2 pl-2 border-l border-white/20 text-xs text-blue-100 font-medium">A partir de 7.500 Kz</span>
                   </Link>
                </motion.div>
              </div>
           </motion.div>
        </section>

        {/* Category Selector */}
        <section className="px-4 -mt-10 relative z-20 max-w-6xl mx-auto w-full">
           <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5, duration: 0.6 }}
               className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-brand-blue/5 border border-white p-4 md:p-6"
            >
              <div className="flex overflow-x-auto no-scrollbar py-2 px-2 gap-6 md:justify-center items-start">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button 
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className="group flex flex-col items-center gap-3 min-w-[70px] transition-all duration-300"
                    >
                      <div 
                        className={`
                          w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all duration-300
                          ${isSelected 
                            ? 'bg-brand-blue text-white shadow-brand-blue/30 shadow-lg scale-110' 
                            : 'bg-slate-50 border border-slate-100 text-slate-400 group-hover:border-brand-blue/30 group-hover:text-brand-blue group-hover:bg-blue-50'}
                        `}
                      >
                        <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
                      </div>
                      <span 
                        className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${isSelected ? 'text-brand-blue' : 'text-slate-400 group-hover:text-brand-blue'}`}
                      >
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
        </section>

        {/* Carousel / Models */}
        <section className="flex flex-col gap-6 bg-transparent py-12">
          <div className="px-6 flex items-center justify-between max-w-5xl mx-auto w-full">
            <div>
              <h3 className="text-brand-blue text-2xl font-serif font-bold">Todos os Modelos</h3>
              <p className="text-slate-500 text-sm mt-1">Design de classe mundial para {CATEGORIES.find(c => c.id === selectedCategory)?.label}</p>
            </div>
          </div>
          
          {/* Horizontal Scroll Container */}
          <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 pb-8 gap-6 md:justify-center max-w-7xl mx-auto w-full">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, index) => {
                const badge = getBadgeConfig(event.type);
                return (
                  <MotionLink 
                    to={`/invite/${event.id}`} 
                    key={event.id} 
                    className="snap-center shrink-0 w-[280px] flex flex-col gap-4 group cursor-pointer"
                    initial={{ opacity: 0, x: 50, scale: 0.95 }}
                    whileInView={{ opacity: 1, x: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
                  >
                    <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden relative shadow-lg group-hover:shadow-2xl group-hover:shadow-brand-blue/20 transition-all duration-500">
                      <img 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        src={event.heroImage}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                      <div className="absolute top-3 right-3 z-20">
                        <span className={`inline-block px-3 py-1 backdrop-blur-md rounded-full text-[10px] font-bold shadow-sm ${badge.className}`}>
                          {event.layoutMode}
                        </span>
                        {!['MODERN', 'CLASSIC', 'ESSENTIAL'].includes(event.layoutMode) && (
                          <span className="inline-block px-3 py-1 ml-2 bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 rounded-full text-[10px] font-bold shadow-sm">
                              PRO
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="px-1 text-center">
                      <h4 className="text-slate-900 font-serif font-bold text-xl group-hover:text-brand-blue transition-colors">{event.title}</h4>
                      <p className="text-slate-500 text-sm mt-1 line-clamp-2">{event.description}</p>
                    </div>
                  </MotionLink>
                );
              })
            ) : (
               <div className="w-full text-center py-10 text-slate-400">
                  <p>Em breve novos modelos para esta categoria.</p>
               </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 flex flex-col gap-10 max-w-5xl mx-auto w-full pt-8 pb-12">
          <div className="flex flex-col gap-4 text-center max-w-2xl mx-auto">
            <span className="text-primary font-bold tracking-widest text-xs uppercase">Tecnologia & Design</span>
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-brand-blue">Funcionalidades Premium</h3>
            <p className="text-slate-500">Tudo o que você precisa para gerenciar seu evento com classe e eficiência.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon="qr_code_scanner" 
              title="RSVP & QR Code"
              desc="Confirmação de presença online com emissão automática de convite com QR Code."
            />
            <FeatureCard 
              icon="dashboard" 
              title="Gestão de Convidados"
              desc="Acompanhe quem confirmou presença e controle as entradas diretamente pelo App."
            />
            <FeatureCard 
              icon="redeem" 
              title="Lista de Presentes"
              desc="Adicione IBAN de forma segura para receber presentes em dinheiro diretamente na sua conta."
            />
          </div>
        </section>

        {/* Social Proof Gallery */}
        <section className="py-24 overflow-hidden bg-brand-blue relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-6 mb-16 text-center">
             <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-sm font-medium mb-6">
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                 </span>
                 Mais de 10.000 Eventos Realizados
             </span>
             <h2 className="text-4xl md:text-6xl font-script text-white mb-4">O que dizem os nossos clientes</h2>
             <p className="text-blue-100 max-w-2xl mx-auto text-lg backdrop-blur-sm">Experiências inesquecíveis partilhadas por quem confia no InoEvents.</p>
          </div>

          <div className="relative z-10 font-sans w-full max-w-[100vw] overflow-x-hidden">
             <motion.div 
               className="flex gap-6 w-max px-4"
               animate={{ x: ["0%", "-50%"] }}
               transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
               whileHover={{ animationPlayState: 'paused' } as any}
             >
                 {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, idx) => (
                     <div key={idx} className="w-[350px] md:w-[450px] flex-shrink-0 bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors">
                         <div className="flex gap-1 mb-6 text-[#BF9B30]">
                             {[...Array(testimonial.rating)].map((_, i) => (
                                 <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"/></svg>
                             ))}
                         </div>
                         <p className="text-white text-lg font-light leading-relaxed mb-8 font-serif">"{testimonial.text}"</p>
                         <div className="flex items-center gap-4 mt-auto">
                             <div className="w-12 h-12 bg-gradient-to-br from-[#BF9B30] to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                 {testimonial.author.charAt(0)}
                             </div>
                             <div>
                                 <h4 className="text-white font-bold tracking-wide">{testimonial.author}</h4>
                                 <p className="text-blue-200 text-sm">{testimonial.role}</p>
                             </div>
                         </div>
                     </div>
                 ))}
             </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-6 max-w-4xl mx-auto" id="faq">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">Perguntas Frequentes</h2>
            <p className="text-slate-500 text-lg">Tudo que você precisa saber sobre o InoEvents.</p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Como funciona o check-in por QR Code?",
                a: "Cada convite gerado possui um QR Code único. No dia do evento, basta utilizar o InoEvents para escanear o código na tela do celular do convidado para confirmar a presença de forma rápida e segura."
              },
              {
                q: "A plataforma funciona offline?",
                a: "O aplicativo precisa de internet para sincronizar a lista em tempo real. No entanto, se o sinal cair durante o evento, o check-in continuará funcionando e sincronizará assim que a conexão for reestabelecida."
              },
              {
                q: "Posso personalizar a aparência do convite?",
                a: "Sim! Oferecemos templates como Classic, Modern, Luxury e mais. Nos planos pagos, você também pode adicionar banners e remover a marca d'água do InoEvents."
              },
              {
                q: "Os meus convidados precisam de aplicativo?",
                a: "Não. Os convidados recebem um link via WhatsApp, E-mail ou SMS e acessam a página do convite diretamente no navegador do seu smartphone."
              },
              {
                q: "Existe um limite de convidados?",
                a: "O plano Essencial tem limite de até 100 convidados. Dependendo da dimensão do seu evento, você pode migrar para os planos Premium (até 500), Business (até 5.000) ou Corporate (ilimitado)."
              }
            ].map((faq, idx) => (
              <details key={idx} className="group bg-white border border-slate-200 rounded-2xl cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-6 font-bold text-slate-800 text-lg outline-none select-none">
                  {faq.q}
                  <span className="ml-4 flex-shrink-0 transition-transform duration-300 group-open:rotate-180">
                    <span className="material-symbols-outlined text-brand-blue">expand_more</span>
                  </span>
                </summary>
                <div className="p-6 pt-0 text-slate-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-16 bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
             <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                   <span className="material-symbols-outlined text-brand-blue text-2xl">auto_awesome</span>
                   <span className="font-extrabold text-white text-xl tracking-tight">InoEvents</span>
                </div>
                <p className="text-slate-400 leading-relaxed max-w-sm mb-6">
                   Transformando a forma como você convida e gere eventos. Tecnologias de elite para memoráveis recepções.
                </p>
                <div className="flex gap-4">
                   <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-blue hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">public</span>
                   </a>
                </div>
             </div>
             
             <div>
                 <h4 className="text-white font-bold mb-6 tracking-wide">Produto</h4>
                 <ul className="space-y-4">
                     <li><Link to="/plans" className="hover:text-white transition-colors">Planos & Preços</Link></li>
                     <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                     <li><Link to="/b2b" className="hover:text-white transition-colors">Soluções Corporativas</Link></li>
                     <li><Link to="/about" className="hover:text-white transition-colors">Sobre Nós</Link></li>
                 </ul>
             </div>

             <div>
                 <h4 className="text-white font-bold mb-6 tracking-wide">Legal</h4>
                 <ul className="space-y-4">
                     <li><Link to="/terms" className="hover:text-white transition-colors">Termos de Serviço</Link></li>
                     <li><Link to="/privacy" className="hover:text-white transition-colors">Políticas de Privacidade</Link></li>
                     <li><a href="mailto:suporte@inoevents.com" className="hover:text-white transition-colors">Suporte</a></li>
                 </ul>
             </div>
          </div>
          
          <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
             <p>© {new Date().getFullYear()} InoEvents. Todos os direitos reservados.</p>
             <p className="text-xs">Feito com foco no design e na experiência do usuário.</p>
          </div>
        </footer>

      </main>

      {/* Mobile Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-40 md:hidden shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <button onClick={handleCreateEvent} className="w-full h-12 bg-brand-blue text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <span>{user ? 'Criar Eventos' : 'Começar Agora'}</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

    </div>
  );
};

const FeatureCard: React.FC<{ icon: string, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="bg-white border border-slate-100 p-8 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-xl hover:shadow-brand-blue/5 transition-all duration-300 group">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors`}>
      <span className="material-symbols-outlined text-[32px]">{icon}</span>
    </div>
    <div className="flex flex-col gap-2">
      <h4 className="text-slate-900 font-bold text-lg">{title}</h4>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);