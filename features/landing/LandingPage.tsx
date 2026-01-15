import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EVENTS } from '../../mockData';
import { ThemeType } from '../../types';

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

export const LandingPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
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

  const filteredEvents = selectedCategory === 'all' 
    ? EVENTS 
    : EVENTS.filter(e => {
        if (selectedCategory === 'wedding') return e.type === ThemeType.WEDDING;
        if (selectedCategory === 'birthday' || selectedCategory === 'kids' || selectedCategory === '15years' || selectedCategory === 'adult') return e.type === ThemeType.BIRTHDAY;
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
           <a href="#" className="hover:text-white transition-colors">Início</a>
           <a href="#" className="hover:text-white transition-colors">Casamentos</a>
           <a href="#" className="hover:text-white transition-colors">Preços</a>
           <a href="#" className="hover:text-white transition-colors">Contactos</a>
           <a href="#" className="hover:text-white transition-colors">Perguntas</a>
           <a href="#" className="hover:text-white transition-colors">Sobre Nós</a>
           
           <div className="flex items-center gap-6 pl-2">
             <span className="text-white/20 text-lg font-light select-none">|</span>
             <button className="hover:text-primary transition-colors font-semibold text-white">Entrar</button>
           </div>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-4 md:hidden">
          <button className="text-sm font-semibold text-blue-100 hover:text-white transition-colors">Entrar</button>
          <button className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
        </div>
      </nav>

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

              <motion.button 
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/40 text-white font-bold rounded-full hover:bg-white hover:text-brand-blue transition-all duration-300 shadow-2xl"
              >
                 COMEÇAR AGORA
              </motion.button>
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
              <h3 className="text-brand-blue text-2xl font-serif font-bold">Modelos em Destaque</h3>
              <p className="text-slate-500 text-sm mt-1">Design de classe mundial para {CATEGORIES.find(c => c.id === selectedCategory)?.label}</p>
            </div>
            <button className="text-brand-blue text-sm font-bold flex items-center hover:underline gap-1 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
               Ver Galeria
               <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          
          {/* Horizontal Scroll Container */}
          <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 pb-8 gap-6 md:justify-center">
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
                          {badge.label}
                        </span>
                      </div>
                    </div>
                    <div className="px-1">
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
              icon="check_circle" 
              title="RSVP Inteligente"
              desc="Confirmação de presença em tempo real integrada ao WhatsApp."
            />
            <FeatureCard 
              icon="photo_library" 
              title="Álbum Digital"
              desc="Seus convidados compartilham fotos em um feed exclusivo do evento."
            />
            <FeatureCard 
              icon="location_on" 
              title="Navegação Fácil"
              desc="Mapas interativos integrados com Uber e Waze para seus convidados."
            />
          </div>
        </section>

        {/* Social Proof */}
        <section className="px-4 py-12 text-center bg-brand-blue text-white">
          <div className="max-w-4xl mx-auto">
             <span className="material-symbols-outlined text-4xl mb-4 text-primary">verified</span>
             <h2 className="text-4xl font-serif font-bold mb-2">10.000+</h2>
             <p className="text-blue-200 text-sm uppercase tracking-widest font-medium mb-8">Eventos Realizados</p>
             <p className="text-xl font-light italic opacity-90">"A melhor plataforma de convites que já usei. Simplesmente elegante."</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-10 bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500">auto_awesome</span>
                <span className="font-bold text-slate-200">InoEvents</span>
             </div>
             <div className="flex gap-8">
                <a className="hover:text-white transition-colors" href="#">Preços</a>
                <a className="hover:text-white transition-colors" href="#">Suporte</a>
                <a className="hover:text-white transition-colors" href="#">Termos</a>
             </div>
             <p>© 2024 InoEvents.</p>
          </div>
        </footer>

      </main>

      {/* Mobile Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-40 md:hidden shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <button className="w-full h-12 bg-brand-blue text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <span>Começar Agora</span>
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