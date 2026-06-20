import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase, signOut, auth, db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Navbar } from '../../components/Navbar';
import { SEO } from '../../components/SEO';
import { FAQSection } from './FAQSection';
import { SupportModal } from '../../components/SupportModal';

// Create a motion component from the React Router Link
const MotionLink = motion(Link);

const TESTIMONIALS = [
  { text: "A melhor plataforma de convites que já usei. Simplesmente elegante.", author: "Maria Silva", role: "Noiva", rating: 5 },
  { text: "Meus convidados ficaram maravilhados com a facilidade do RSVP.", author: "João Pereira", role: "Aniversariante", rating: 5 },
  { text: "Design impecável! O QR code individual facilitou muito a recepção.", author: "Ana Costa", role: "Assessora de Eventos", rating: 5 },
  { text: "Suporte VIP incrível via WhatsApp. Resolveram tudo em minutos.", author: "Carlos Santos", role: "Produtor B2B", rating: 5 },
  { text: "Os templates são maravilhosos. O meu casamento ganhou outro nível.", author: "Juliana Mendes", role: "Noiva", rating: 5 },
  { text: "Painel de controle excelente para gerir milhares de convidados.", author: "Sérgio Almeida", role: "Organizador Corporate", rating: 5 },
];

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const { user, userProfile } = useFirebase();
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [supportOpen, setSupportOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [location]);

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

  const handleCreateEvent = () => {
    if (!user) {
        navigate('/auth');
        return;
    }
    navigate('/create-invitation');
  }

  return (
    <div className="min-h-screen relative font-display overflow-x-hidden bg-white">
      <SEO 
        title="Crie Convites Digitais Interativos de Casamento e Chás" 
        description="A plataforma mais elegante para criar seus convites de casamento, chás de panela ou noivado. Design premium, confirmação RSVP instantânea, controle de presença com QR Code e mais."
      />
      
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-blue-50/50 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <Navbar />

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

        {/* Templates CTA Section */}
        <section className="flex flex-col items-center justify-center mt-12 mb-12 bg-slate-50/50 rounded-3xl border border-slate-100 py-24 px-6 max-w-7xl mx-auto w-full">
          <div className="max-w-3xl w-full text-center space-y-8">
            <span className="material-symbols-outlined text-5xl text-brand-blue">auto_awesome</span>
            <h3 className="text-brand-blue text-4xl md:text-5xl font-serif font-bold">Galeria de Modelos</h3>
            <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto">
              Explore nossa coleção exclusiva de modelos para casamentos, chás de panela, aniversários e muito mais. Escolha o design perfeito e personalize para o seu evento.
            </p>
            <div className="pt-6">
              <MotionLink 
                 to="/templates"
                 className="inline-flex items-center gap-3 bg-brand-blue text-white px-10 py-5 rounded-full font-bold shadow-lg shadow-brand-blue/30 hover:shadow-xl hover:-translate-y-1 hover:shadow-brand-blue/40 transition-all"
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
              >
                 <span className="text-sm uppercase tracking-widest">Ver Todos os Modelos</span>
                 <span className="material-symbols-outlined">arrow_forward</span>
              </MotionLink>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 flex flex-col gap-10 max-w-5xl mx-auto w-full pt-8 pb-12">
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
        <FAQSection />

        {/* Footer */}
        <footer className="px-6 py-16 bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
             <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                   <span className="material-symbols-outlined text-brand-blue text-2xl" style={{display: 'none'}}>auto_awesome</span><img src="/favicon.ico" alt="InoEvents Logo" className="w-8 h-8 rounded-lg object-contain bg-white/10 p-1 border border-white/10 mr-1" referrerPolicy="no-referrer" />
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
                     <li><a href="#" onClick={(e) => { e.preventDefault(); setSupportOpen(true); }} className="hover:text-white transition-colors cursor-pointer">Suporte</a></li>
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

      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />

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