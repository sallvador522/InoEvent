/* Hallmark · pre-emit critique: P5 H5 E5 S4 R5 V5 · macrostructure: Workbench · theme: Linen · genre: editorial */
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
    q: "Como criar convites digitais online?",
    a: "Criar convites digitais na InoEvents é simples e rápido. Basta criar a sua conta, escolher o plano ideal (Essencial, Premium, VIP ou Business) e selecionar um template do nosso catálogo. Depois, preencha os dados do evento (data, local, etc) e ative ferramentas como confirmação de presença (RSVP) e lista de presentes. Por fim, publique e partilhe o link exclusivo com os seus convidados via WhatsApp — eles abrem o link e confirmam na página.",
    category: "features",
    icon: Sparkles
  },
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
    a: "Sim, de forma integrada e muito elegante! No painel de controle, pode criar uma lista de presentes virtuais (cotas engraçadas, lua de mel, etc.) com valores em Kwanza. Os convidados escolhem o presente na página e fazem a transferência por IBAN (BAI, BFA, BIC, SOL, etc.), e o painel regista cada contribuição recebida para acompanhar tudo num só lugar.",
    category: "features",
    icon: Heart
  },
  {
    q: "Como funciona o rastreamento em tempo real e o check-in dos convidados?",
    a: "Cada convidado recebe o link do convite por WhatsApp e confirma presença na página. Nos planos avançados (VIP e Business), cada convidado tem um código QR individual no bilhete virtual. No dia do evento, a sua equipa de receção usa a câmara de check-in para escanear os códigos e o status é marcado de imediato na lista de presença.",
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
    a: "Sim. No plano Premium remove a marca d'água da InoEvents dos convites. No plano Business (para agências e cerimonialistas), vai além: coloca a sua própria marca no rodapé dos convites dos seus clientes (white-label).",
    category: "features",
    icon: Eye
  }
];

const categoryMeta: Record<string, { label: string; accent: string; dot: string }> = {
  all: { label: 'Todas as Dúvidas', accent: 'border-brand-blue', dot: 'bg-brand-blue' },
  customization: { label: 'Personalização & Design', accent: 'border-amber-500', dot: 'bg-amber-500' },
  tracking: { label: 'Controle de Convidados & QR', accent: 'border-emerald-500', dot: 'bg-emerald-500' },
  features: { label: 'Lista de Presentes & Extras', accent: 'border-pink-500', dot: 'bg-pink-500' },
};

const getCategoryAccent = (cat: string) => {
  if (cat === 'customization') return 'border-amber-500 bg-amber-50 text-amber-700';
  if (cat === 'tracking') return 'border-emerald-500 bg-emerald-50 text-emerald-700';
  return 'border-pink-500 bg-pink-50 text-pink-700';
};

export const FAQSection: React.FC<{ preview?: boolean }> = ({ preview = false }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'customization' | 'tracking' | 'features'>('all');
  const [expanded, setExpanded] = useState(false);

  const baseItems = preview && !expanded ? FAQ_ITEMS.slice(0, 4) : FAQ_ITEMS;
  const filteredItems = baseItems.filter(item => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const categories = [
    { id: 'all', label: 'Todas as Dúvidas' },
    { id: 'customization', label: 'Personalização & Design' },
    { id: 'tracking', label: 'Controle de Convidados & QR' },
    { id: 'features', label: 'Lista de Presentes & Extras' }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 bg-[#FDFBF7] relative border-t border-[#C5A028]/30 overflow-x-clip" id="faq" style={{ overflowWrap: 'anywhere' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-[1280px] mx-auto">
        {/* Workbench layout: left sticky intro, right content */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-10 lg:gap-14 xl:gap-20 items-start">
          
          {/* LEFT - Sticky editorial */}
          <div className="lg:sticky lg:top-28 self-start min-w-0">
            <span className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-brand-blue bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
              Dúvidas Frequentes
            </span>
            
            <h2 className="mt-5 text-[28px] sm:text-[32px] lg:text-[38px] font-serif font-bold tracking-tight text-slate-900 leading-[0.95] overflow-wrap-anywhere min-w-0" style={{ overflowWrap: 'anywhere' }}>
              Ainda tem<br />
              dúvidas?<br />
              <span className="text-brand-blue">Nós respondemos.</span>
            </h2>
            
            <p className="mt-4 text-[14px] sm:text-[15px] leading-[1.6] text-slate-600 max-w-[36ch]">
              Respostas directas sobre criação, design, RSVP e gestão de convidados — sem enrolar.
            </p>

            <div className="mt-6 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                <span className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-black">{FAQ_ITEMS.length}</span>
                perguntas
              </span>
              <span className="w-px h-4 bg-slate-200" />
              <span className="text-slate-500">4 categorias</span>
              <span className="w-px h-4 bg-slate-200" />
              <span className="text-slate-500">Actualizado hoje</span>
            </div>

            {/* Desktop CTA - stays in left column on Workbench */}
            <div className="hidden lg:flex mt-8 p-5 rounded-2xl bg-slate-50 border border-slate-200 flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <HelpCircle size={16} className="text-brand-blue" />
                </span>
                <span className="text-sm font-bold text-slate-900">Precisa de ajuda humana?</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                A nossa equipa cria layouts, importa listas em massa e configura IBAN/QR em minutos.
              </p>
              <a
                href="https://wa.me/244952815430?text=Ol%C3%A1%20InoEvents%21%20Tenho%20d%C3%BAvidas%20sobre%20o%20meu%20evento"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 bg-[#1B365D] hover:bg-[#122a4a] active:scale-[0.98] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
              >
                Falar no WhatsApp <span aria-hidden>→</span>
              </a>
            </div>
          </div>

          {/* RIGHT - Tabs + Accordion */}
          <div className="min-w-0">
            {/* Tab bar - single line scroll on mobile, no wrap */}
            <div className="relative -mx-4 sm:mx-0">
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 sm:px-0 pb-2 sm:pb-0 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                <div className="flex items-center gap-1.5 sm:gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/60 shrink-0">
                  {categories.map((cat) => {
                    const isActive = activeTab === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveTab(cat.id as any);
                          setActiveIndex(null);
                        }}
                        className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap snap-start transition-all duration-200 cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 whitespace-nowrap shrink-0 ml-2">
                  <span className={`w-2 h-2 rounded-full ${categoryMeta[activeTab].dot}`} />
                  {filteredItems.length} {filteredItems.length === 1 ? 'resposta' : 'respostas'}
                </span>
              </div>
              {/* fade hint on mobile */}
              <div className="sm:hidden pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#FDFBF7] to-transparent" />
            </div>
            <div className="sm:hidden mt-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 px-1">
              <span className={`w-2 h-2 rounded-full ${categoryMeta[activeTab].dot}`} />
              {filteredItems.length} {filteredItems.length === 1 ? 'resposta' : 'respostas'} • deslize para ver categorias
            </div>

            {/* Accordion */}
            <div className="mt-6 space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => {
                  const originalIndex = FAQ_ITEMS.findIndex(f => f.q === item.q);
                  const isOpen = activeIndex === originalIndex;
                  const Icon = item.icon;
                  const accent = getCategoryAccent(item.category);

                  return (
                    <motion.div
                      key={originalIndex}
                      layout="position"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`group bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
                        isOpen
                          ? `border-l-4 ${categoryMeta[item.category].accent} shadow-lg shadow-slate-900/5`
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      <button
                        onClick={() => setActiveIndex(isOpen ? null : originalIndex)}
                        className="w-full flex items-start sm:items-center justify-between gap-3 sm:gap-4 text-left outline-none select-none cursor-pointer p-4 sm:p-5"
                      >
                        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                          <span className={`hidden sm:flex w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${isOpen ? accent : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            <Icon size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 sm:hidden">
                              <span className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${isOpen ? accent : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                <Icon size={12} />
                              </span>
                              <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                                {String(originalIndex + 1).padStart(2, '0')} • {item.category === 'customization' ? 'Design' : item.category === 'tracking' ? 'Convidados' : 'Presentes'}
                              </span>
                            </div>
                            <span className="block font-bold text-slate-900 text-[14px] sm:text-[15px] leading-[1.35] pr-1" style={{ overflowWrap: 'anywhere' }}>
                              {item.q}
                            </span>
                            <span className="hidden sm:block text-[11px] font-medium text-slate-500 mt-1">
                              {item.category === 'customization' ? 'Personalização' : item.category === 'tracking' ? 'Check-in & QR' : 'Presentes & White-label'} • toque para expandir
                            </span>
                          </div>
                        </div>
                        
                        <span className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 mt-0.5 sm:mt-0 ${isOpen ? 'bg-brand-blue border-brand-blue text-white rotate-180' : 'bg-white border-slate-200 text-slate-500 group-hover:border-slate-300 group-hover:text-slate-700'}`}>
                          <ChevronDown size={16} />
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                          >
                            <div className="mx-4 sm:mx-5 mb-4 sm:mb-5 rounded-xl bg-slate-50 border border-slate-100 px-4 sm:px-5 py-4 text-[13px] sm:text-[14px] leading-[1.65] text-slate-700">
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

            {preview && !expanded && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setExpanded(true)}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1B365D] border-b border-[#C5A028]/60 pb-1 hover:text-[#8a6d1c] cursor-pointer"
                  style={{ transition: 'color 200ms ease' }}
                >
                  Ver todas as {FAQ_ITEMS.length} dúvidas
                </button>
              </div>
            )}

            {/* Mobile CTA - only on small */}
            <div className="lg:hidden mt-8 p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <HelpCircle size={16} className="text-brand-blue" />
                </span>
                <span className="text-sm font-bold text-slate-900">Fale com a equipa</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Criamos layouts, importamos listas e configuramos pagamentos no mesmo dia.
              </p>
              <a
                href="https://wa.me/244952815430?text=Ol%C3%A1%20InoEvents%21%20Tenho%20d%C3%BAvidas%20sobre%20o%20meu%20evento"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 bg-[#1B365D] hover:bg-[#122a4a] active:scale-[0.98] text-white font-bold text-xs px-4 py-3 rounded-xl transition-all"
              >
                Falar no WhatsApp <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
