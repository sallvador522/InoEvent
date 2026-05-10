import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, Gem, Sparkles, Building2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { useFirebase, db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const plans = [
  {
    name: 'Essencial',
    subtitle: 'Para comemorações íntimas',
    prices: {
      monthly: '7.500 Kz',
      annual: '75.000 Kz'
    },
    savings: 'Economize 15.000 Kz ao ano',
    description: 'O início perfeito para um evento inesquecível com o essencial que você precisa.',
    icon: <Sparkles className="w-8 h-8 text-blue-400" />,
    features: [
      'Até 5 convites por mês',
      '2 Modelos Base',
      'RSVP Até 100 convidados',
      'Código QR Único',
      'Localização no Maps',
      'Suporte via E-mail',
    ],
  },
  {
    name: 'Premium',
    subtitle: 'Casamentos & Festas',
    prices: {
      monthly: '20.000 Kz',
      annual: '190.000 Kz'
    },
    savings: 'Economize 50.000 Kz ao ano',
    popular: true,
    description: 'A experiência luxuosa completa para o seu grande dia.',
    icon: <Gem className="w-8 h-8 text-purple-400" />,
    features: [
      'Eventos Ilimitados',
      'Modelos Exclusivos Ilimitados',
      'RSVP Até 500 convidados',
      'Código QR Individual por convidado',
      'Maps + Galeria de Fotos Interativa',
      'Suporte VIP via WhatsApp 24/7',
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
    description: 'Solução robusta para quem organiza múltiplos eventos. Escale com o InoEvents.',
    icon: <Building2 className="w-8 h-8 text-amber-400" />,
    features: [
      'Painel do Parceiro (Múltiplos Eventos)',
      'Design White-Label (Remoção da marca)',
      'Pacote de Créditos (Desconto em Lote)',
      'Check-in Inteligente via QR Code individual',
      'Gestor de Conta Dedicado',
    ],
  },
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
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

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
    setSelectedPlanToBuy(plan);
    setIsSimulateModalOpen(true);
  };

  const handleSimulatePayment = async () => {
    if (!user || !selectedPlanToBuy) return;
    setLoadingPlan(selectedPlanToBuy.name);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        await updateDoc(userRef, { plan: selectedPlanToBuy.name });
      } else {
        await setDoc(userRef, { uid: user.uid, email: user.email, plan: selectedPlanToBuy.name });
      }
      setIsSimulateModalOpen(false);
      setSelectedPlanToBuy(null);
      toast.success("Plano modificado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao alterar o plano. Tente novamente.");
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoadingPlan(null);
    }
  }

  const currentPlan = userProfile?.plan || 'Essencial';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-display relative overflow-hidden flex flex-col justify-center">
      
      {/* Elegant Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] right-[-10%] w-[60vw] h-[60vw] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10 my-auto pb-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 md:mb-12"
        >
          <Link to="/" className="inline-flex items-center text-slate-500 hover:text-brand-blue transition-colors">
            <ArrowLeft size={16} className="mr-2" /> 
            <span className="text-sm font-medium tracking-wide uppercase">Voltar ao Início</span>
          </Link>
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
            const isLoading = loadingPlan === plan.name;
            
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
                    disabled={isCurrentPlan || !!loadingPlan}
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
                    ) : isLoading ? (
                      <span className="animate-spin border-2 border-current border-t-transparent rounded-full w-5 h-5" />
                    ) : (
                      'SELECIONAR PLANO'
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <AnimatePresence>
          {isSimulateModalOpen && selectedPlanToBuy && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSimulateModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl">
                      <button onClick={() => setIsSimulateModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
                          <X size={24} />
                      </button>
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-6">
                          <Check size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Simular Assinatura</h3>
                      <p className="text-slate-500 text-sm mb-6">
                        Você está prestes a transitar para o plano <strong>{selectedPlanToBuy.displayName || selectedPlanToBuy.name}</strong>.
                        Como não possuímos gateway de pagamentos implementado para essa demonstração, esta ação é inteiramente gratuita e instantânea.
                      </p>
                      
                      <Button fullWidth onClick={handleSimulatePayment} disabled={!!loadingPlan}>
                          {loadingPlan ? "Processando..." : "Confirmar Modificação"}
                      </Button>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

    </div>
  );
};
