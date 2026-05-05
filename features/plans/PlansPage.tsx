import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { useFirebase, db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';

const plans = [
  {
    name: 'Essencial',
    subtitle: 'Individual',
    price: '7.500 Kz',
    features: [
      '1 Modelo padrão de convite',
      'RSVP Até 50 convidados',
      'Código QR Único',
      'Localização no Maps',
      'Suporte via E-mail',
    ],
  },
  {
    name: 'Premium',
    subtitle: 'Festas & Bodas',
    price: '20.000 Kz',
    popular: true,
    features: [
      'Modelos Personalizáveis',
      'Gestão RSVP Ilimitada',
      'Código QR Individual',
      'Maps + Galeria de Fotos',
      'Suporte WhatsApp Prioritário',
    ],
  },
  {
    name: 'Business',
    subtitle: 'Corporativo',
    price: '50.000 Kz',
    features: [
      'Design Sob Medida (White Label)',
      'RSVP Ilimitado + Dashboard de Check-in',
      'Validação de Código QR na portaria',
      'Maps + Agenda + Integração CRM',
      'Gestor de Conta Dedicado',
    ],
  },
];

export const PlansPage: React.FC = () => {
  const { user, userProfile } = useFirebase();
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);

  const handlePlanSelect = async (planName: string) => {
    if (!user) {
      alert("Por favor, entre na sua conta para escolher um plano.");
      return;
    }
    setLoadingPlan(planName);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        await updateDoc(userRef, { plan: planName });
      } else {
        await setDoc(userRef, { uid: user.uid, email: user.email, plan: planName });
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao alterar o plano. Tente novamente.");
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoadingPlan(null);
    }
  }

  const currentPlan = userProfile?.plan || 'Essencial';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-display">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-brand-blue mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Voltar ao Início
        </Link>
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-blue mb-4">Escolha o plano ideal</h1>
          <p className="text-slate-600 text-lg">Soluções feitas sob medida para o seu evento.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const isCurrentPlan = currentPlan === plan.name;
            const isLoading = loadingPlan === plan.name;
            
            return (
              <motion.div 
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-3xl p-8 shadow-sm border ${plan.popular || isCurrentPlan ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-slate-100'} relative`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">Seu Plano Atual</span>
                  </div>
                )}
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">Mais Popular</span>
                  </div>
                )}
                <h2 className="text-2xl font-bold text-brand-blue mt-4">{plan.name}</h2>
                <p className="text-sm text-slate-500 mb-6">{plan.subtitle}</p>
                <div className="text-4xl font-bold text-brand-blue mb-8">{plan.price} <span className="text-base font-normal text-slate-400">/ evento</span></div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-slate-600">
                      <Check size={20} className="text-primary shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => handlePlanSelect(plan.name)} 
                  disabled={isCurrentPlan || !!loadingPlan}
                  className={`block text-center w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isCurrentPlan 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : plan.popular 
                        ? 'bg-primary text-white hover:bg-opacity-90' 
                        : 'bg-brand-blue text-white hover:bg-brand-blue/90'
                  }`}
                >
                  {isLoading && <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-5 h-5 mr-2" />}
                  {isCurrentPlan ? 'Plano Atual' : isLoading ? 'Processando...' : 'Escolher Plano'}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
