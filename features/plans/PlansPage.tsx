import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, Gem, Sparkles, Building2, X, Copy, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { useFirebase, db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const plans = [
  {
    name: 'Essencial',
    subtitle: 'Para pequenas celebrações',
    prices: {
      monthly: '7.500 Kz',
      annual: '75.000 Kz'
    },
    savings: 'Economize 15.000 Kz ao ano',
    description: 'Comece com 5 créditos mensais para criar eventos inesquecíveis.',
    icon: <Sparkles className="w-8 h-8 text-blue-400" />,
    features: [
      '5 Créditos por mês',
      'Casamento (Custa 2 Créditos)',
      'Chá de Panela (Custa 1 Crédito)',
      'RSVP Até 100 convidados',
      'Código QR Exclusivo',
    ],
  },
  {
    name: 'Premium',
    subtitle: 'Acesso VIP',
    prices: {
      monthly: '20.000 Kz',
      annual: '190.000 Kz'
    },
    savings: 'Economize 50.000 Kz ao ano',
    popular: true,
    description: 'Inclui 20 créditos mensais. Ideal para noivos.',
    icon: <Gem className="w-8 h-8 text-purple-400" />,
    features: [
      '20 Créditos por mês',
      'Todos os temas premium',
      'RSVP Ilimitado',
      'Galeria de Fotos Interativa',
      'Suporte VIP via WhatsApp',
    ],
  },
  {
    name: 'Business',
    displayName: 'Business (B2B)',
    subtitle: 'Agências e Produtores',
    prices: {
      monthly: 'Sob Consulta',
      annual: 'Sob Consulta'
    },
    savings: '',
    description: 'Créditos em massa para empresas que gerenciam múltiplos eventos.',
    icon: <Building2 className="w-8 h-8 text-amber-400" />,
    features: [
      'Créditos Ilimitados ou Lotes customizados',
      'Design White-Label (Remoção da marca)',
      'Painel de Gestão de Clientes',
      'Check-in Inteligente',
      'Gestor de Conta Dedicado',
    ],
  },
];

// Credit packages below plans
const creditPackages = [
  { amount: 1, price: '2.000 Kz', savings: '', bonus: '' },
  { amount: 5, price: '8.500 Kz', savings: 'Economize 1.500 Kz', bonus: 'Mais Popular' },
  { amount: 10, price: '15.000 Kz', savings: 'Economize 5.000 Kz', bonus: 'Melhor Valor' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
};

export const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useFirebase();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [whatsappModal, setWhatsappModal] = useState<{
    type: 'PLAN' | 'CREDITS';
    name: string;
    price: string;
    billingCycle?: 'monthly' | 'annual';
  } | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const confirmPlanSelection = (plan: any) => {
    if (!user) {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl flex flex-col border border-slate-100 overflow-hidden`}>
            <div className="p-4">
                <h3 className="font-bold text-slate-900 mb-1">Acesso Necessário</h3>
                <p className="text-sm text-slate-500">Você precisa entrar na sua conta para escolher um plano.</p>
            </div>
            <div className="flex border-t border-slate-100">
                <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
                <div className="w-px bg-slate-100" />
                <button onClick={() => { toast.dismiss(t.id); navigate('/auth'); }} className="flex-1 px-4 py-3 text-sm font-bold text-brand-blue hover:bg-slate-50 transition-colors">Fazer Login</button>
            </div>
        </div>
      ), { duration: 5000 });
      return;
    }

    if (plan.name === 'Business') {
      setWhatsappModal({
        type: 'PLAN',
        name: plan.name,
        price: 'Sob Consulta',
        billingCycle: 'monthly'
      });
      return;
    }

    const priceVal = billingCycle === 'annual' ? plan.prices.annual : plan.prices.monthly;
    setWhatsappModal({
      type: 'PLAN',
      name: plan.name,
      price: priceVal,
      billingCycle
    });
  };

  const handleBuyCredits = (amount: number, priceKzStr: string) => {
    if (!user) {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl flex flex-col border border-slate-100 overflow-hidden`}>
            <div className="p-4">
                <h3 className="font-bold text-slate-900 mb-1">Acesso Necessário</h3>
                <p className="text-sm text-slate-500">Você precisa estar logado para comprar créditos.</p>
            </div>
            <div className="flex border-t border-slate-100">
                <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
                <div className="w-px bg-slate-100" />
                <button onClick={() => { toast.dismiss(t.id); navigate('/auth'); }} className="flex-1 px-4 py-3 text-sm font-bold text-brand-blue hover:bg-slate-50 transition-colors">Fazer Login</button>
            </div>
        </div>
      ), { duration: 5000 });
      return;
    }

    setWhatsappModal({
      type: 'CREDITS',
      name: `${amount} Crédito${amount > 1 ? 's' : ''}`,
      price: priceKzStr
    });
  };

  const handleOpenWhatsApp = (whatsappNumber: string) => {
    if (!whatsappModal || !user) return;
    
    const messageText = whatsappModal.type === 'PLAN'
      ? `Olá! Gostaria de activar o Plano ${whatsappModal.name.toUpperCase()} (${whatsappModal.billingCycle === 'annual' ? 'Anual' : 'Mensal'}) para a minha conta.\n\n` +
        `ID da Plataforma: ${user.uid}\n` +
        `E-mail: ${user.email || 'Não informado'}\n\n` +
        `Estou em contacto para concluir a compra do plano. Obrigado!`
      : `Olá! Gostaria de adquirir o pacote de ${whatsappModal.name} (${whatsappModal.price}) para a minha conta.\n\n` +
        `ID da Plataforma: ${user.uid}\n` +
        `E-mail: ${user.email || 'Não informado'}\n\n` +
        `Estou em contacto para concluir a compra do pacote de créditos. Obrigado!`;

    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setWhatsappModal(null);
  };

  const currentPlan = userProfile?.plan || 'Essencial';

  return (
    <div className="min-h-screen bg-slate-50 font-display relative overflow-x-hidden flex flex-col">
      <Navbar />
      
      {/* Elegant Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] right-[-10%] w-[60vw] h-[60vw] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10 my-auto py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 md:mb-12"
        >
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center text-slate-500 hover:text-brand-blue transition-colors outline-none cursor-pointer">
            <ArrowLeft size={16} className="mr-2" /> 
            <span className="text-sm font-medium tracking-wide uppercase">Voltar</span>
          </button>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10 md:mb-12"
        >
          <span className="text-brand-blue font-bold tracking-widest text-xs uppercase mb-3 block">Transparência & Elegância</span>
          <h1 className="text-4xl md:text-6xl font-script text-slate-900 mb-6">Investimento no seu momento</h1>
          <p className="text-slate-500 text-lg md:text-xl font-light max-w-2xl mx-auto">
            Design impecável e tecnologia premium, estruturados para tornar o seu evento inesquecível.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-slate-200/50 p-1 rounded-full flex items-center shadow-inner">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all flex items-center gap-2 ${billingCycle === 'annual' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Anual
              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest ${billingCycle === 'annual' ? 'bg-white/20 text-white' : 'bg-brand-blue/10 text-brand-blue'}`}>
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-6 lg:gap-8 max-w-6xl mx-auto"
        >
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.name;
            
            return (
              <motion.div 
                key={plan.name}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative rounded-3xl p-[1px] overflow-hidden group w-full ${plan.popular ? 'z-10' : 'z-0 lg:mt-6'}`}
              >
                {/* Gradient Border Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.popular ? 'from-brand-blue via-brand-blue/80 to-blue-400 opacity-100' : 'from-slate-200 to-slate-100 opacity-50 group-hover:opacity-100'} transition-opacity duration-500`} />
                
                {/* Glass Card Content */}
                <div className={`relative h-full bg-white/90 backdrop-blur-xl rounded-[23px] p-8 md:p-10 flex flex-col ${plan.popular ? 'shadow-[0_20px_40px_-15px_rgba(0,40,100,0.2)]' : 'shadow-sm'}`}>
                  
                  {isCurrentPlan && (
                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-50 border-b border-l border-emerald-100 rounded-bl-2xl rounded-tr-[22px]">
                      <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest">Plano Atual</span>
                    </div>
                  )}

                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-brand-blue to-blue-600 border-b border-l border-blue-700/30 rounded-bl-2xl rounded-tr-[22px]">
                       <span className="text-white text-[10px] font-bold uppercase tracking-widest shadow-sm">Mais Desejado</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                      {plan.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-slate-900 leading-tight">{plan.displayName || plan.name}</h2>
                      <p className="text-xs text-brand-blue font-medium uppercase tracking-wider">{plan.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mb-8 min-h-[40px]">
                    {plan.description}
                  </p>

                  <div className="mb-4">
                    <span className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                      {billingCycle === 'monthly' ? plan.prices.monthly : plan.prices.annual}
                    </span>
                    {plan.prices.monthly !== 'Sob Consulta' && (
                      <span className="text-sm text-slate-400 ml-2">/ {billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
                    )}
                  </div>
                  
                  {billingCycle === 'annual' && plan.savings && (
                    <div className="mb-4 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-lg inline-block self-start">
                      {plan.savings}
                    </div>
                  )}
                  {billingCycle === 'monthly' && plan.savings && (
                    <div className="mb-4 text-emerald-600 text-sm font-bold px-3 py-1.5 rounded-lg inline-block self-start invisible">
                      Placeholder
                    </div>
                  )}
                  {(!plan.savings) && (
                    <div className="mb-4 h-[32px]"></div>
                  )}
                  
                  <div className="h-px w-full bg-slate-100 mb-8" />
                  
                  <ul className="space-y-4 mb-10 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-4">
                        <motion.div
                          initial={false}
                          whileHover={{ scale: 1.2, rotate: 5 }}
                        >
                          <Check size={18} className={`${plan.popular ? 'text-brand-blue' : 'text-slate-400'} shrink-0 mt-0.5`} />
                        </motion.div>
                        <span className="text-slate-700 text-sm leading-relaxed font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    onClick={() => confirmPlanSelection(plan)} 
                    disabled={isCurrentPlan}
                    className={`mt-auto block text-center w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden ${
                      isCurrentPlan 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                        : plan.popular 
                          ? 'bg-brand-blue text-white hover:bg-brand-blue/90 hover:scale-[1.02] hover:shadow-[0_10px_20px_rgba(0,40,100,0.2)]' 
                          : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-brand-blue/30 hover:bg-slate-50 hover:text-brand-blue'
                    }`}
                  >
                    {isCurrentPlan ? (
                      'SEU PLANO ATUAL'
                    ) : (
                      'SELECIONAR PLANO'
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Credit Packages Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 max-w-5xl mx-auto"
        >
          <div className="text-center mb-10">
            <span className="text-brand-blue font-bold tracking-widest text-xs uppercase mb-3 block">Compre Apenas o Necessário</span>
            <h2 className="text-3xl md:text-4xl font-script text-slate-900 mb-4">Pacotes de Créditos Avulsos</h2>
            <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto">
              Precisa apenas de mais um convite? Compre créditos sob demanda. (1 Casamento = 2 Créditos, 1 Chá de Panela = 1 Crédito)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPackages.map((pkg, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-slate-200/60 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col">
                {pkg.bonus && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-brand-blue to-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
                    {pkg.bonus}
                  </div>
                )}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center text-xl shadow-inner border border-blue-100">
                     <span className="font-bold">{pkg.amount}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Crédito{pkg.amount > 1 ? 's' : ''}</h3>
                  </div>
                </div>
                <div className="mb-2">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{pkg.price}</span>
                </div>
                {pkg.savings ? (
                  <div className="text-emerald-500 text-xs font-bold mb-8 uppercase tracking-wide bg-emerald-50 px-2 py-1 rounded inline-block self-start">{pkg.savings}</div>
                ) : (
                  <div className="h-[28px] mb-8"></div>
                )}
                <button 
                  onClick={() => handleBuyCredits(pkg.amount, pkg.price)} 
                  className={`w-full mt-auto py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                    pkg.bonus ? 'bg-brand-blue text-white hover:bg-blue-700 shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {`COMPRAR PACOTE`}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      <AnimatePresence>
          {whatsappModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWhatsappModal(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl flex flex-col border border-slate-100">
                      <div className="flex justify-between items-start mb-6">
                         <div>
                            <span className="text-brand-blue font-bold tracking-widest text-[10px] uppercase mb-1 block">Concluir no WhatsApp</span>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Activar {whatsappModal.name}</h3>
                         </div>
                         <button onClick={() => setWhatsappModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full">
                           <X size={20} />
                         </button>
                      </div>

                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
                         <p className="text-sm text-blue-800 leading-relaxed font-medium">
                           Para concluir o seu pedido, fale com um dos nossos agentes autorizados via WhatsApp. O seu plano/créditos serão activos de imediato.
                         </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 mb-4">
                         <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Artigo</span>
                            <span className="text-sm font-bold text-slate-800">{whatsappModal.name}</span>
                         </div>
                         {whatsappModal.billingCycle && (
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                               <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Faturação</span>
                               <span className="text-sm font-bold text-slate-800">{whatsappModal.billingCycle === 'annual' ? 'Anual' : 'Mensal'}</span>
                            </div>
                         )}
                         <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Valor</span>
                            <span className="text-sm font-bold text-slate-900">{whatsappModal.price}</span>
                         </div>
                         <div className="flex justify-between items-center gap-4">
                            <div className="min-w-0 flex-1">
                               <span className="text-[10px] text-slate-400 uppercase tracking-wider block">ID da Plataforma</span>
                               <span className="text-xs font-mono font-bold text-slate-800 truncate block">{user?.uid}</span>
                            </div>
                            <button onClick={() => user && handleCopy(user.uid)} className="p-1 px-2.5 bg-white text-slate-500 hover:text-brand-blue hover:bg-slate-50 border border-slate-200 shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0">
                               <Copy size={12} /> Copiar
                            </button>
                         </div>
                      </div>

                      {/* Manual Payment Information (Angola IBAN details) */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-3 mb-6">
                         <h4 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                            <span className="material-symbols-outlined text-[13px] text-brand-blue">account_balance</span>
                            Nossos dados bancários (Angola)
                         </h4>
                         
                         <div className="space-y-2 pt-1">
                            <div className="bg-white p-2 rounded-lg border border-slate-100 relative">
                               <p className="font-bold text-slate-700 text-[10px]">INDEV (BAI)</p>
                               <p className="font-mono text-[10px] text-slate-500 mt-0.5 truncate pr-16 select-all">IBAN: AO06.0040.0000.4930.2919.1011.8</p>
                               <button 
                                  onClick={() => handleCopy('AO06004000004930291910118')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-blue bg-blue-50 hover:bg-blue-100 p-1 px-2 rounded cursor-pointer"
                               >
                                  Copiar
                               </button>
                            </div>

                            <div className="bg-white p-2 rounded-lg border border-slate-100 relative">
                               <p className="font-bold text-slate-700 text-[10px]">INDEV (BFA)</p>
                               <p className="font-mono text-[10px] text-slate-500 mt-0.5 truncate pr-16 select-all">IBAN: AO06.0006.0000.3129.8492.1012.3</p>
                               <button 
                                  onClick={() => handleCopy('AO06000600003129849210123')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-blue bg-blue-50 hover:bg-blue-100 p-1 px-2 rounded cursor-pointer"
                               >
                                  Copiar
                               </button>
                            </div>
                         </div>
                         <p className="text-[10px] text-slate-400 font-medium">Anexe o comprovativo da transferência ou depósito no chat do WhatsApp para aprovação imediata.</p>
                      </div>

                      <div className="space-y-3">
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Selecione o número de suporte:</p>
                         
                         <button 
                            onClick={() => handleOpenWhatsApp('952815430')} 
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3.5 px-4 font-bold text-sm transition-all duration-200 flex items-center justify-between shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 select-none cursor-pointer"
                         >
                            <span className="flex items-center gap-2">
                               <MessageSquare size={18} className="animate-pulse" />
                               WhatsApp (952 815 430)
                            </span>
                            <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">
                               Canal 1
                            </span>
                         </button>

                         <button 
                            onClick={() => handleOpenWhatsApp('939384315')} 
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3.5 px-4 font-bold text-sm transition-all duration-200 flex items-center justify-between shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 select-none cursor-pointer"
                         >
                            <span className="flex items-center gap-2">
                               <MessageSquare size={18} className="animate-pulse" />
                               WhatsApp (939 384 315)
                            </span>
                            <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">
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
