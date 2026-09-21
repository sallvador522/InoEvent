import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ArrowLeft,
  Building2,
  X,
  Copy,
  MessageSquare,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import {
  useFirebase,
  auth,
  db,
} from "../../components/FirebaseProvider";
import { Navbar } from "../../components/Navbar";
import { SEO } from "../../components/SEO";
import toast from "react-hot-toast";
import { PLANS, ADDONS } from "../../config/plans";
import { trackPixelInitiateCheckout, trackPixelLead } from "../../lib/metaPixel";

const plans = [
  {
    id: "essential",
    name: "Essencial",
    subtitle: "Pagamento Único por Evento",
    prices: {
      monthly: `${PLANS.essential.price.toLocaleString('pt-AO')} Kz`,
      annual: "Válido por evento",
    },
    savings: `Activo durante ${PLANS.essential.validityDays} dias • Até ${PLANS.essential.guestLimit} convidados`,
    description: PLANS.essential.description,
    features: [
      "Acesso por Evento Específico",
      "Casamentos, Chás e Aniversários",
      `RSVP Até ${PLANS.essential.guestLimit} convidados`,
      "Galeria de Fotos Básica",
      "Código QR Exclusivo",
      "Localização & Mapa",
      "Countdown",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    subtitle: "Pagamento Único por Evento",
    prices: {
      monthly: `${PLANS.premium.price.toLocaleString('pt-AO')} Kz`,
      annual: "Válido por evento",
    },
    savings: `Activo durante ${PLANS.premium.validityDays} dias • Até ${PLANS.premium.guestLimit} convidados`,
    popular: true,
    description: PLANS.premium.description,
    features: [
      "Acesso por Evento Específico",
      "Todos os 8 Temas Incluídos",
      `RSVP Até ${PLANS.premium.guestLimit} convidados`,
      "Convidados Individualizados",
      "Galeria Premium",
      "Música de Fundo (TocaPlayer)",
      "Livro de Assinaturas Digital",
      "Mapa das Mesas",
      "Sem marca d'água (White-label)",
      "Analytics Básicos",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    subtitle: "Pagamento Único por Evento",
    prices: {
      monthly: `${PLANS.vip.price.toLocaleString('pt-AO')} Kz`,
      annual: "Válido por evento",
    },
    savings: `Activo durante ${PLANS.vip.validityDays} dias • Até ${PLANS.vip.guestLimit} convidados`,
    description: PLANS.vip.description,
    features: [
      "Tudo do Premium",
      `RSVP Até ${PLANS.vip.guestLimit} convidados`,
      "QR Individual por Convidado",
      "Check-in Inteligente",
      "Gestão +1",
      "Mesas Avançadas",
      "Lembretes Automáticos",
      "Analytics Avançados",
      "Domínio Personalizado",
      "Suporte Prioritário",
    ],
  },
  {
    id: "business",
    name: "Business",
    displayName: "Business (B2B)",
    subtitle: "Assinatura Mensal",
    prices: {
      monthly: `${PLANS.business.price.toLocaleString('pt-AO')} Kz`,
      annual: "Por mês",
    },
    savings: "Eventos ilimitados • Faturado como SaaS",
    description: PLANS.business.description,
    features: [
      "Eventos Ativos Ilimitados (∞)",
      "Design White-Label p/ seus clientes",
      "Painel de Gestão de Clientes",
      "Check-in Inteligente",
      "Equipa & Gestão Profissional",
      `Concierge +${ADDONS.concierge.price.toLocaleString('pt-AO')} Kz (opcional)`,
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

import { copyToClipboard } from "../../lib/clipboard";

export const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useFirebase();
  const [searchParams] = useSearchParams();
  const activatingEventId = searchParams.get("eventId");
  const [activatingEventTitle, setActivatingEventTitle] = useState<string | null>(null);
  const [whatsappModal, setWhatsappModal] = useState<{
    name: string;
    price: string;
    planId: string;
    billingCycle?: "monthly" | "annual";
  } | null>(null);

  useEffect(() => {
    if (!activatingEventId) {
      setActivatingEventTitle(null);
      return;
    }
    getDoc(doc(db, "events", activatingEventId))
      .then((snap) => {
        if (snap.exists() && snap.data().ownerId === user?.uid) {
          setActivatingEventTitle(snap.data().title || "o seu evento");
        } else {
          setActivatingEventTitle(null);
        }
      })
      .catch(() => setActivatingEventTitle(null));
  }, [activatingEventId, user]);

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    toast.success("Copiado!");
  };

  const confirmPlanSelection = (plan: any) => {
    if (!user) {
      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-sm w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl flex flex-col border border-slate-100 overflow-hidden`}
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

    const priceVal = plan.prices.monthly;
    setWhatsappModal({
      name: plan.name,
      price: priceVal,
      planId: plan.id,
      billingCycle: plan.id === "business" ? "monthly" : undefined,
    });
  };

  const createOrderForEvent = async (planId: string): Promise<string | null> => {
    if (!activatingEventId || !user) return null;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.uid,
          eventId: activatingEventId,
          plan: planId,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.order?.id || null;
    } catch {
      return null;
    }
  };

  const handleOpenWhatsApp = async (whatsappNumber: string) => {
    if (!whatsappModal || !user) return;

    const orderId = await createOrderForEvent(whatsappModal.planId);
    const orderRef = orderId ? `\nPedido: ${orderId}` : "";

    const messageText = whatsappModal.name === "Business"
      ? `Olá! Gostaria de subscrever ao Plano ${whatsappModal.name.toUpperCase()} para a minha agência.\n\nID da Plataforma: ${user.uid}\nE-mail: ${user.email || "Não informado"}${orderRef ? `\nEvento: ${activatingEventId || "—"}${orderRef}` : ""}\n\nEstou em contacto para concluir o pagamento do meu plano. Obrigado!`
      : `Olá! Gostaria de comprar o Plano ${whatsappModal.name.toUpperCase()} por ${whatsappModal.price}.\n\nID da Plataforma: ${user.uid}\nE-mail: ${user.email || "Não informado"}${orderRef ? `\nEvento: ${activatingEventId || "—"}${orderRef}` : ""}\n\nEstou em contacto para concluir o pagamento do meu plano. Obrigado!`;

    const cleanNumber = whatsappNumber.replace(/\D/g, "");
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`;
    const planPrice = PLANS[whatsappModal.planId as keyof typeof PLANS]?.price ?? 0;
    const capiUser = user?.email ? { user_data: { email: user.email } } : {};
    trackPixelInitiateCheckout(
      {
        content_ids: [whatsappModal.planId],
        content_name: whatsappModal.name,
        value: planPrice,
        currency: 'AOA',
      },
      {
        ...capiUser,
        custom_data: {
          content_ids: [whatsappModal.planId],
          content_name: whatsappModal.name,
          value: planPrice,
          currency: 'AOA',
        },
      },
    );
    if (orderId) {
      trackPixelLead(
        { content_ids: [whatsappModal.planId], order_id: orderId },
        {
          ...capiUser,
          custom_data: { content_ids: [whatsappModal.planId], order_id: orderId },
        },
      );
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setWhatsappModal(null);
    if (activatingEventId) {
      toast.success(
        orderId
          ? `Pedido ${orderId} registado! Conclua no WhatsApp e avisamos aqui.`
          : "A abrir o WhatsApp para concluir o pagamento."
      );
      navigate(`/dashboard/${activatingEventId}?orderPending=1`);
    }
  };

  const currentPlan = userProfile?.plan || "Essencial";

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-display text-slate-900 relative overflow-x-hidden flex flex-col">
      <SEO
        title="Planos e Preços de Convites Digitais | InoEvents"
        description="Escolha o plano perfeito para o seu momento. Do Essencial ao Luxo Corporativo, encontre as ferramentas ideais para casamentos, chás de panela ou aniversários com RSVP."
      />
      <Navbar />

      {/* Ambient subtil — mesmo espírito da landing, sem emerald */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-blue/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10 my-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 md:mb-12"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-slate-500 hover:text-brand-blue transition-colors outline-none cursor-pointer"
          >
            <ArrowLeft size={16} className="mr-2" />
            <span className="text-sm font-medium tracking-wide uppercase">
              Voltar
            </span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10 md:mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4" aria-hidden="true">
            <span className="h-px w-8 bg-[#C5A028]/60" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1B365D]/70">
              Preços · Angola
            </span>
            <span className="h-px w-8 bg-[#C5A028]/60" />
          </div>
          <h1 className="text-3xl md:text-[2.75rem] font-serif font-bold text-[#1B365D] tracking-tight leading-[1.1] mb-4">
            Um plano para cada <span className="italic font-medium text-[#8a6d1c]">celebração</span>
          </h1>
          <p className="text-slate-600 font-light text-lg md:text-xl max-w-2xl mx-auto">
            Pagamento único por evento. Sem mensalidades para noivos.
          </p>
          {activatingEventTitle && (
            <div className="mt-6 inline-flex items-center gap-2 bg-[#1B365D] text-white text-sm font-bold px-5 py-3 rounded-full shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#C5A028] animate-pulse" />
              A ativar: “{activatingEventTitle}” — escolhe o plano abaixo
            </div>
          )}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-stretch justify-center gap-6 max-w-6xl mx-auto"
        >
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan && (currentPlan.toLowerCase() === plan.name.toLowerCase() || (plan as any).id && currentPlan.toLowerCase() === (plan as any).id);
            const isHighlighted = !!plan.popular;
            const ctaLabel = isCurrentPlan
              ? "Plano atual"
              : plan.id === "essential"
                ? "Escolher Essencial"
                : plan.id === "premium"
                  ? "Criar Convite Premium"
                  : plan.id === "vip"
                    ? "Escolher VIP"
                    : "Falar sobre o Business";

            return (
              <motion.div
                key={plan.name}
                variants={itemVariants as any}
                className={`relative w-full rounded-2xl p-8 flex flex-col border ${
                  isHighlighted
                    ? "bg-[#1B365D] border-[#1B365D] xl:-translate-y-3"
                    : "bg-[#FFFDF8] border-[#C5A028]/30"
                }`}
                style={{ transition: 'border-color 200ms ease, box-shadow 200ms ease' }}
              >
                {isHighlighted && !isCurrentPlan && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#C5A028] text-white text-[10px] font-bold uppercase tracking-[0.14em] py-1 px-4 rounded-full whitespace-nowrap">
                    O mais escolhido
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full border border-[#C5A028]/50 bg-[#FFFDF8]">
                    <span className="text-[#8a6d1c] text-[10px] font-bold uppercase tracking-[0.14em]">
                      Plano atual
                    </span>
                  </div>
                )}

                  <h2 className={`font-serif text-2xl font-bold mb-1 flex items-center gap-2 ${isHighlighted ? "text-white" : "text-[#1B365D]"}`}>
                    {plan.displayName || plan.name}
                    {plan.id === "business" && (
                      <Building2 size={18} className="text-[#C5A028] shrink-0" aria-hidden="true" />
                    )}
                  </h2>
                  <p className={`text-[13px] font-light leading-relaxed mb-6 ${isHighlighted ? "text-blue-200/70" : "text-slate-500"}`}>
                    {plan.id === "essential"
                      ? "Para festas íntimas, sem complicações."
                      : plan.id === "premium"
                        ? "O grande dia, sem limites nem marca."
                        : plan.id === "vip"
                          ? "Receção com check-in e endereço próprio."
                          : "Para agências e cerimonialistas, todos os meses."}
                  </p>

                  <div className="mb-2 flex items-baseline gap-1">
                    <span
                      className={`font-serif font-bold ${plan.id === "business" ? "text-3xl leading-[1.2]" : "text-4xl"}`}
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      <span className={isHighlighted ? "text-white" : "text-slate-900"}>
                        {plan.prices.monthly}
                      </span>
                    </span>
                    {plan.id === "business" && (
                      <span className={`text-sm font-medium ${isHighlighted ? "text-blue-200/70" : "text-slate-500"}`}>
                        Kz / mês
                      </span>
                    )}
                    {plan.id !== "business" && (
                      <span className={`text-sm font-medium ${isHighlighted ? "text-blue-200/70" : "text-slate-500"}`}>
                        Kz / evento
                      </span>
                    )}
                  </div>

                  {plan.savings ? (
                    <p className={`text-xs font-light mb-6 ${isHighlighted ? "text-blue-200/60" : "text-slate-500"}`}>
                      {plan.savings}
                    </p>
                  ) : (
                    <div className="mb-6 h-4" aria-hidden="true" />
                  )}

                  <ul className="flex flex-col gap-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check
                          size={18}
                          className="text-[#C5A028] shrink-0"
                          aria-hidden="true"
                        />
                        <span className={`text-[13px] ${isHighlighted ? "text-blue-50" : "text-slate-600"}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => confirmPlanSelection(plan)}
                    disabled={!!isCurrentPlan}
                    title={isCurrentPlan ? "Este já é o seu plano ativo" : `Escolher plano ${plan.displayName || plan.name}`}
                    className={`w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider active:scale-[0.97] cursor-pointer disabled:cursor-not-allowed ${
                      isCurrentPlan
                        ? "bg-slate-100 text-slate-400 border border-slate-200"
                        : isHighlighted
                          ? "bg-[#C5A028] text-[#1B365D] hover:bg-[#d4af37]"
                          : "border border-[#1B365D]/30 text-[#1B365D] hover:bg-[#1B365D] hover:text-white"
                    }`}
                    style={{ transition: 'transform 160ms ease-out, background-color 200ms ease, color 200ms ease' }}
                  >
                    {ctaLabel}
                  </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <AnimatePresence>
        {whatsappModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWhatsappModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#FFFDF8] rounded-2xl p-5 md:p-6 max-w-sm w-full relative z-10 shadow-2xl flex flex-col border border-[#C5A028]/30 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[#8a6d1c] font-bold tracking-[0.18em] text-[10px] uppercase mb-1 block">
                    Concluir no WhatsApp
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-[#1B365D] tracking-tight">
                    Activar {whatsappModal.name}
                  </h3>
                </div>
                <button
                  onClick={() => setWhatsappModal(null)}
                  aria-label="Fechar"
                  className="text-slate-400 hover:text-[#1B365D] transition-colors bg-slate-100 hover:bg-slate-200 p-2 rounded-full cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-[#1B365D]/5 border border-[#C5A028]/30 rounded-2xl p-3.5 mb-4">
                <p className="text-[13px] text-slate-600 leading-relaxed font-light">
                  Escolha um operador abaixo. Você será redirecionado para o WhatsApp com uma mensagem personalizada com o seu ID para que o administrador ative o seu plano de imediato.
                </p>
              </div>

              <div className="bg-white border border-[#C5A028]/20 rounded-2xl p-4 space-y-2.5 mb-4">
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full py-3.5 px-5 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-between select-none cursor-pointer active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare size={16} aria-hidden="true" />
                    WhatsApp (952 815 430)
                  </span>
                  <span className="bg-white/20 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">
                    Canal 1
                  </span>
                </button>

                <button
                  onClick={() => handleOpenWhatsApp("939384315")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full py-3.5 px-5 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-between select-none cursor-pointer active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare size={16} aria-hidden="true" />
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
