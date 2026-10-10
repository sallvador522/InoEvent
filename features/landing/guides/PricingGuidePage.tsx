import React from 'react';
import { Link } from 'react-router-dom';
import { PLANS, ADDONS, PREMIUM_PROMO_FREE } from '../../../config/plans';
import { GuideLayout } from './GuideLayout';

const premiumPrice = PREMIUM_PROMO_FREE
  ? `Preço normal ${PLANS.premium.price.toLocaleString('pt-AO')} Kz — neste momento grátis em promoção de lançamento`
  : `${PLANS.premium.price.toLocaleString('pt-AO')} Kz`;

/**
 * /guia/precos-convite-digital — keyword: "convite digital Luanda preço".
 * Preços sempre dinâmicos da fonte central (nunca duplicar).
 */
export const PricingGuidePage: React.FC = () => (
  <GuideLayout
    title={`Quanto custa um convite digital em Luanda? Preços em Kwanza | InoEvents`}
    description={`Preços de convites digitais em Luanda e Angola: Premium ${premiumPrice}, VIP ${PLANS.vip.price.toLocaleString('pt-AO')} Kz, Business ${PLANS.business.price.toLocaleString('pt-AO')} Kz/mês. Pagamento único por evento, sem mensalidade para noivos.`}
    keywords="convite digital Luanda preço, quanto custa convite digital Angola, preços convites casamento Luanda, convite digital Kwanza preço, planos convites digitais Angola"
    kicker="Guia · Preços em Angola"
    h1Lead="Quanto custa um convite digital em"
    h1Accent="Luanda?"
    intro="Preços em Kwanza, sem mensalidade para noivos: paga-se uma vez por evento. Abaixo, os valores atuais, o que cada plano inclui e quando vale a pena cada um — os números desta página atualizam-se automaticamente com a tabela oficial."
    faqs={[
      {
        q: 'Qual é o plano mais barato?',
        a: PREMIUM_PROMO_FREE
          ? `O Premium (preço normal ${PLANS.premium.price.toLocaleString('pt-AO')} Kz) está grátis em promoção de lançamento — até ${PLANS.premium.guestLimit} convidados, pagamento único.`
          : `O Premium: ${PLANS.premium.price.toLocaleString('pt-AO')} Kz por evento (até ${PLANS.premium.guestLimit} convidados), pagamento único.`,
      },
      {
        q: 'O que muda entre Premium e VIP?',
        a: `O VIP (${PLANS.vip.price.toLocaleString('pt-AO')} Kz) inclui tudo do Premium mais até ${PLANS.vip.guestLimit} convidados, gestão de acompanhantes, mesas avançadas, analytics avançados e suporte prioritário. Para casamentos grandes, o VIP compensa.`,
      },
      {
        q: 'Há mensalidade?',
        a: `Para noivos, não — Premium e VIP são pagamento único por evento com validade de ${PLANS.premium.validityDays} e ${PLANS.vip.validityDays} dias, respetivamente. Só o plano Business (para agências e cerimonialistas) é mensal: ${PLANS.business.price.toLocaleString('pt-AO')} Kz/mês com eventos ilimitados.`,
      },
      {
        q: 'Existe serviço de criação por vocês (concierge)?',
        a: `Sim, como extra opcional de ${ADDONS.concierge.price.toLocaleString('pt-AO')} Kz por evento: a equipa cria o convite por vocês.`,
      },
    ]}
    related={[
      { to: '/guia/convite-digital-casamento-angola', label: 'Convite digital de casamento' },
      { to: '/guia/lista-presentes-iban', label: 'Lista de presentes por IBAN' },
      { to: '/guia/cha-de-panela', label: 'Convite de chá de panela' },
    ]}
  >
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">Tabela atual</h2>
      <ul className="list-disc ml-5 flex flex-col gap-2">
        <li><strong>Premium — {premiumPrice}:</strong> até {PLANS.premium.guestLimit} convidados, RSVP, QR individual, check-in, galeria, música, livro de assinaturas, mapa das mesas, válido {PLANS.premium.validityDays} dias.</li>
        <li><strong>VIP — {PLANS.vip.price.toLocaleString('pt-AO')} Kz:</strong> até {PLANS.vip.guestLimit} convidados, tudo do Premium + acompanhantes, mesas avançadas, analytics avançados, suporte prioritário, válido {PLANS.vip.validityDays} dias.</li>
        <li><strong>Business — {PLANS.business.price.toLocaleString('pt-AO')} Kz/mês:</strong> eventos ilimitados, marca própria da agência, painel de clientes, equipa.</li>
      </ul>
    </section>
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">Como pagar</h2>
      <p>
        A ativação combina-se no WhatsApp após a escolha do plano na{' '}
        <Link to="/plans" className="font-bold text-[#1B365D] underline underline-offset-2">página de planos</Link> —
        pagamento por transferência/IBAN com confirmação pela equipa. Sem cartão de crédito, sem subscrições escondidas.
      </p>
    </section>
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">Qual devo escolher?</h2>
      <ul className="list-disc ml-5 flex flex-col gap-2">
        <li><strong>Casamento até {PLANS.premium.guestLimit} convidados:</strong> Premium — tem tudo o que o dia precisa.</li>
        <li><strong>Casamento grande ou com protocolo:</strong> VIP — check-in inteligente e mesas avançadas pagam-se na tranquilidade da receção.</li>
        <li><strong>Organizas eventos para clientes:</strong> Business — um preço mensal, eventos ilimitados, a tua marca.</li>
      </ul>
    </section>
  </GuideLayout>
);
