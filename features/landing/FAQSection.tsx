import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Sparkles, Sliders, Eye, Heart, BellRing, QrCode } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
  category: 'customization' | 'tracking' | 'features';
  icon: React.ComponentType<any>;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    q: "O InoEvents é a melhor plataforma para convites de casamento e chá de panela em Angola?",
    a: "Com certeza! O InoEvents é a plataforma de referência em Angola para criar convites de casamento, chás de panela, noivados, aniversários e eventos corporativos de luxo. A nossa plataforma foi desenvolvida pensando no público angolano, oferecendo suporte nativo para listas de presentes com IBAN de bancos de Angola (BAI, BFA, BIC, SOL, etc.), confirmação de presença (RSVP) intuitiva e bilhetes com código QR para recepções de alto padrão em Luanda e outras províncias.",
    category: "features",
    icon: Sparkles
  },
  {
    q: "Como posso personalizar o design dos meus convites?",
    a: "O InoEvents oferece controle estético refinado. Pode escolher entre vários temas premium meticulosamente desenhados (Classic, Modern, Luxury, Garden, Rustic, Industrial, Essential) que trazem combinações tipográficas profissionais (como serifas elegantes e fontes minimalistas), carregar belas fotos para a galeria interativa com likes de convidados, configurar botões de mapas interativos e definir músicas de fundo personalizadas com o player integrado TocaPlayer.",
    category: "customization",
    icon: Sliders
  },
  {
    q: "A plataforma adapta o formulário para diferentes tipos de eventos (ex: Chá de Panela vs. Casamento)?",
    a: "Sim! Implementamos lógica condicional inteligente de formulário. Se escolher um modelo de Chá de Panela, os campos complexos de Casamento (como Nome do Noivo, Dress Code, Recepção e Cronograma estendido) são ocultados automaticamente, gerando uma experiência fluida e focada no seu evento.",
    category: "customization",
    icon: Sparkles
  },
  {
    q: "É possível configurar uma lista de presentes ou contribuições?",
    a: "Sim, de forma integrada e muito elegante! No painel de controle, pode criar uma lista de presentes virtuais (cotas engraçadas, lua de mel, etc.). Os convidados selecionam o presente e realizam o pagamento seguro de forma automática via Multicaixa Express (com geração de Entidade e Referência) ou podem copiar diretamente os seus dados bancários (IBAN/Conta) para transferência manual, livre de taxas abusivas de terceiros.",
    category: "features",
    icon: Heart
  },
  {
    q: "Como funciona o rastreamento em tempo real e o check-in dos convidados?",
    a: "Cada convidado que confirma presença recebe um código QR personalizável e exclusivo no seu bilhete virtual. No dia do evento, a sua equipe de recepcionistas ou cerimonialistas pode utilizar a nossa câmara de check-in em tempo real no dashboard para escanear os códigos. O status do bilhete é marcado imediatamente na lista de presença.",
    category: "tracking",
    icon: QrCode
  },
  {
    q: "Posso partilhar os convites diretamente através do WhatsApp?",
    a: "Com certeza! Criamos uma funcionalidade de partilha inteligente. No painel ou no próprio convite, há um botão de partilha rápida via WhatsApp. Este botão abre a sua aplicação com uma mensagem personalizada e o link exclusivo do evento, otimizando o envio individual para os seus contactos.",
    category: "tracking",
    icon: BellRing
  },
  {
    q: "Dá para ocultar a marca d'água InoEvents e usar marca própria?",
    a: "Sim. Ao escolher os planos Premium, Business ou Corporate, ganha acesso às funcionalidades de White-Label. Pode remover toda a marca d'água da nossa plataforma e definir o seu próprio nome personalizado no rodapé dos convites.",
    category: "features",
    icon: Eye
  }
];

export const FAQSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'customization' | 'tracking' | 'features'>('all');

  const filteredItems = FAQ_ITEMS.filter(item => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const categories = [
    { id: 'all', label: 'Todas as Dúvidas' },
    { id: 'customization', label: 'Personalização & Design' },
    { id: 'tracking', label: 'Controle de Convidados & QR' },
    { id: 'features', label: 'Lista de Presentes & Extras' }
  ];

  return (
    <section className="py-28 px-6 bg-slate-50/50 relative border-t border-b border-slate-100" id="faq">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-extrabold tracking-widest text-brand-blue bg-blue-50/85 px-4 py-2 rounded-full uppercase inline-block mb-4 shadow-sm border border-blue-100/60">
            Dúvidas Frequentes
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 font-serif">
            Ainda tem dúvidas? <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-blue to-emerald-600 bg-clip-text text-transparent">Nós respondemos.</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Consulte as respostas para as principais dúvidas sobre criação, personalização de design, RSVP móvel e rastreamento de convidados.
          </p>
        </div>

        {/* Tab Filter buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12 p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl max-w-2xl mx-auto border border-slate-200/50">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveTab(cat.id as any);
                setActiveIndex(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === cat.id
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-900/5'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, idx) => {
              const originalIndex = FAQ_ITEMS.findIndex(f => f.q === item.q);
              const isOpen = activeIndex === originalIndex;
              const Icon = item.icon;

              return (
                <motion.div
                  key={originalIndex}
                  layout="position"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                    isOpen 
                      ? 'border-brand-blue/30 shadow-xl shadow-brand-blue/5 md:scale-[1.01]' 
                      : 'border-slate-200/70 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => setActiveIndex(isOpen ? null : originalIndex)}
                    className="w-full flex items-center justify-between p-6/5 text-left outline-none select-none cursor-pointer p-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isOpen ? 'bg-blue-50 text-brand-blue' : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'
                      }`}>
                        <Icon size={18} />
                      </div>
                      <span className="font-bold text-slate-800 text-sm md:text-base pr-4">
                        {item.q}
                      </span>
                    </div>
                    
                    <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-blue-50 text-brand-blue' : ''
                    }`}>
                      <ChevronDown size={16} />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pl-20 pr-10 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-4">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bottom CTA within FAQ */}
        <div className="mt-16 text-center bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm max-w-2xl mx-auto flex flex-col items-center">
          <HelpCircle size={28} className="text-emerald-500 mb-3" />
          <h4 className="text-base font-bold text-slate-800 mb-1">Tem alguma dúvida específica para o seu evento?</h4>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed max-w-md">
            A nossa equipa técnica está pronta para criar layouts personalizados, carregar listas de convidados em massa ou resolver qualquer integração especial.
          </p>
          <a
            href="https://wa.me/244912000000?text=Ol%C3%A1!%20Tenho%20d%C3%BAvidas%20sobre%20a%20personaliza%C3%A7%C3%A3o%20e%20recursos%20do%20InoEvents..."
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            Falar pelo WhatsApp
          </a>
        </div>

      </div>
    </section>
  );
};
