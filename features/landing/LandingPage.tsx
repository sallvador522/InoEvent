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
    if (!location.hash) {
      window.scrollTo(0, 0);
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
    navigate('/templates');
  }

  return (
    <div className="min-h-screen relative font-display overflow-x-hidden bg-white">
      <SEO 
        title="Convites Digitais em Angola | Casamentos e Eventos" 
        description="A plataforma mais elegante de Angola para criar seus convites de casamento, chás de panela ou noivado. Confirmação instantânea (RSVP), UX premium e mais."
      />
      
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-blue-50/50 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <Navbar />

      <main className="relative z-10 flex flex-col gap-0 pb-24">
        
        {/* HERO BANNER SECTION (High-Conversion, Spatial UI) */}
        <section className="relative w-full flex flex-col justify-center overflow-hidden bg-[#FDFBF7] pt-24 md:pt-32 pb-20">
           {/* Ambient Background Glows */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-brand-blue/10 blur-[120px] rounded-full pointer-events-none" />
           <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#BF9B30]/5 blur-[100px] rounded-full pointer-events-none" />
           
           {/* Trust Badge Top */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
             className="relative z-20 flex justify-center w-full mb-8"
           >
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-slate-200/60 px-4 py-2 rounded-full shadow-sm">
                 <div className="flex -space-x-2">
                    <img src="https://i.pravatar.cc/100?img=1" className="w-6 h-6 rounded-full border-2 border-white" alt="User" />
                    <img src="https://i.pravatar.cc/100?img=5" className="w-6 h-6 rounded-full border-2 border-white" alt="User" />
                    <img src="https://i.pravatar.cc/100?img=9" className="w-6 h-6 rounded-full border-2 border-white" alt="User" />
                 </div>
                 <div className="flex items-center gap-1 text-[#BF9B30]">
                    <span className="material-symbols-outlined text-sm font-bold">star</span>
                    <span className="material-symbols-outlined text-sm font-bold">star</span>
                    <span className="material-symbols-outlined text-sm font-bold">star</span>
                    <span className="material-symbols-outlined text-sm font-bold">star</span>
                    <span className="material-symbols-outlined text-sm font-bold">star</span>
                 </div>
                 <span className="text-xs font-semibold text-slate-600 ml-1">Amado por +10.000 clientes</span>
              </div>
           </motion.div>

           <div className="relative z-20 max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
              
              <motion.h1 
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                 className="text-5xl md:text-7xl lg:text-[5rem] font-serif font-bold text-slate-900 tracking-tight leading-[1.05] mb-6"
              >
                 Convites Digitais de <br className="hidden md:block"/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue flex-col md:flex-row to-[#BF9B30] inline-block mt-2">Nível Elite.</span>
              </motion.h1>
              
              <motion.p 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                 className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10 font-light"
              >
                 Diga adeus ao papel. Impressione seus convidados com uma experiência interativa, confirme presenças automaticamente e receba presentes, tudo em um só lugar.
              </motion.p>
              
              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                 className="flex justify-center w-full"
              >
                {/* Primary CTA */}
                <button 
                   onClick={handleCreateEvent}
                   className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-brand-blue hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.25)] flex items-center justify-center gap-2 group"
                >
                   <span>Criar Convite de Alta Costura</span>
                   <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
                
                {/* Secondary CTA */}
                <Link 
                  to="/templates"
                  className="hidden"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#BF9B30]">view_carousel</span>
                  <span>Ver Todos os Modelos</span>
                </Link>
              </motion.div>
           </div>

           {/* Hero Floating Mockups / Abstract Product Visualization */}
           <motion.div 
             initial={{ opacity: 0, y: 60 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
             className="relative z-10 w-full max-w-5xl mx-auto mt-16 md:mt-24 px-4 h-[350px] md:h-[450px]"
           >
              {/* Center Templates Preview Mockup */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[90%] md:w-[650px] h-[300px] md:h-[400px] bg-white rounded-t-3xl border border-slate-200 shadow-[0_-10px_50px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
                 <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2 shrink-0 z-10">
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                 </div>
                 <div className="flex-1 bg-slate-50 p-4 md:p-6 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-transparent to-slate-50 z-10 pointer-events-none"></div>
                    <div className="grid grid-cols-2 gap-6 h-full relative z-0">
                       <motion.div 
                          animate={{ y: ["0%", "-50%"] }}
                          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                          className="flex flex-col gap-6"
                       >
                          <img src="/bridal-templates/templateCha1.png" className="rounded-2xl shadow-sm object-cover w-full aspect-[3/4]" alt="Template" />
                          <img src="/bridal-templates/templateCha3.png" className="rounded-2xl shadow-sm object-cover w-full aspect-[3/4]" alt="Template" />
                          <img src="/bridal-templates/templateCha1.png" className="rounded-2xl shadow-sm object-cover w-full aspect-[3/4]" alt="Template" />
                       </motion.div>
                       <motion.div 
                          animate={{ y: ["-50%", "0%"] }}
                          transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
                          className="flex flex-col gap-6 mt-[-50%]"
                       >
                          <img src="/bridal-templates/templateCha2.png" className="rounded-2xl shadow-sm object-cover w-full aspect-[3/4]" alt="Template" />
                          <img src="/bridal-templates/templateCha4.png" className="rounded-2xl shadow-sm object-cover w-full aspect-[3/4]" alt="Template" />
                          <img src="/bridal-templates/templateCha2.png" className="rounded-2xl shadow-sm object-cover w-full aspect-[3/4]" alt="Template" />
                       </motion.div>
                    </div>
                 </div>
              </div>

              {/* Left Overlay Phone Mockup */}
              <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                 className="absolute left-2 md:left-24 top-12 w-[160px] md:w-[220px] h-[320px] md:h-[420px] bg-white rounded-3xl border-4 md:border-8 border-slate-900 shadow-2xl flex flex-col overflow-hidden z-20"
              >
                 <img src="/bridal-templates/templateCha4.png" className="w-full h-full object-cover" alt="Phone Template Preview" />
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[80%] bg-white/90 backdrop-blur text-center py-2 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
                    Confirmar Presença
                 </div>
              </motion.div>

              {/* Right Overlay Event Card */}
              <motion.div 
                 animate={{ y: [0, 8, 0] }}
                 transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                 className="absolute right-0 md:right-16 top-24 w-[180px] md:w-[260px] rounded-2xl bg-white/80 backdrop-blur-xl border border-white p-4 shadow-[0_20px_40px_rgba(0,0,0,0.1)] hidden sm:block"
              >
                 <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
                    <span className="material-symbols-outlined">check_circle</span>
                 </div>
                 <h4 className="font-bold text-slate-800 mb-1">Presença Confirmada</h4>
                 <p className="text-xs text-slate-500 mb-4">Ana Clara Silva confirmou para o seu Casamento.</p>
                 <div className="text-xs font-bold text-brand-blue bg-blue-50 py-2 px-3 rounded-lg text-center">
                    Ver Lista (142/200)
                 </div>
              </motion.div>
           </motion.div>
        </section>

        {/* Templates CTA Section (Removed) */}

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