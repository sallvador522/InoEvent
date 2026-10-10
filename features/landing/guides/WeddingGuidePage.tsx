import React from 'react';
import { Link } from 'react-router-dom';
import { PLANS, PREMIUM_PROMO_FREE } from '../../../config/plans';
import { GuideLayout } from './GuideLayout';

const premiumLine = PREMIUM_PROMO_FREE
  ? `O Premium custa ${PLANS.premium.price.toLocaleString('pt-AO')} Kz, mas está grátis em promoção de lançamento`
  : `O Premium custa ${PLANS.premium.price.toLocaleString('pt-AO')} Kz`;

/**
 * /guia/convite-digital-casamento-angola — keyword: "convite digital casamento Angola".
 */
export const WeddingGuidePage: React.FC = () => (
  <GuideLayout
    title="Convite Digital de Casamento em Angola: como funciona e quanto custa | InoEvents"
    description={`Como criar um convite digital de casamento em Angola: RSVP online, QR Code de check-in, lista de presentes por IBAN e mapa com Como chegar. ${premiumLine} — pagamento único por evento.`}
    keywords="convite digital casamento Angola, convite de casamento Luanda, RSVP casamento Angola, convite digital noivos Angola, site de casamento Angola, confirmação de presença casamento Luanda"
    kicker="Guia · Casamentos em Angola"
    h1Lead="Convite digital de casamento em"
    h1Accent="Angola"
    intro="O convite digital substitui o papel e a lista em caderno: um link por convidado, confirmação de presença na página, check-in com QR Code no dia e presentes por transferência. Aqui explicamos como funciona em Angola — preços em Kwanza, bancos locais e partilha por WhatsApp."
    faqs={[
      {
        q: 'Quanto custa um convite digital de casamento em Angola?',
        a: `${premiumLine} (até ${PLANS.premium.guestLimit} convidados, pagamento único por evento, sem mensalidade). O VIP custa ${PLANS.vip.price.toLocaleString('pt-AO')} Kz (até ${PLANS.vip.guestLimit} convidados, check-in inteligente e mesas avançadas).`,
      },
      {
        q: 'Como os convidados confirmam presença?',
        a: 'Cada convidado recebe o link no WhatsApp e confirma na página do convite — sem telefonemas, sem listas em papel. As confirmações entram sozinhas na lista do painel.',
      },
      {
        q: 'Como funciona a entrada no dia do casamento?',
        a: `Nos planos Premium e VIP, cada convidado tem um código QR individual. A equipa da receção lê o código com a câmara e o check-in fica registado de imediato.`,
      },
      {
        q: 'Dá para receber presentes em dinheiro?',
        a: 'Sim. Cria-se uma lista de presentes com valores em Kwanza e o IBAN dos noivos (BAI, BFA, BIC, SOL e outros bancos angolanos). O convidado transfere na app do banco; a confirmação aparece no extrato.',
      },
    ]}
    related={[
      { to: '/guia/lista-presentes-iban', label: 'Lista de presentes por IBAN' },
      { to: '/guia/precos-convite-digital', label: 'Preços de convites digitais' },
      { to: '/guia/cha-de-panela', label: 'Convite de chá de panela' },
    ]}
  >
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">O que é um convite digital?</h2>
      <p>
        É uma página web pessoal do vosso casamento: nomes dos noivos, data, local com mapa e botão Como chegar,
        galeria de fotos, contagem regressiva, confirmação de presença e lista de presentes — tudo num só link,
        partilhado por WhatsApp. Em Luanda, onde quase tudo se combina no WhatsApp, o convite digital elimina o
        papel, as deslocações para entregar convites e as listas de presença em cadernos.
      </p>
    </section>
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">Como funciona, em 3 passos</h2>
      <ol className="list-decimal ml-5 flex flex-col gap-2">
        <li><strong>Criem a conta grátis</strong> e escolham um modelo na <Link to="/templates" className="font-bold text-[#1B365D] underline underline-offset-2">galeria de modelos</Link> — há temas de casamento e de chá de panela.</li>
        <li><strong>Preencham os dados</strong> (nomes, data, local, fotos, IBAN para presentes) e publiquem. O primeiro evento de casamento é grátis em Premium.</li>
        <li><strong>Partilhem o link</strong> por WhatsApp. Cada convidado abre, confirma presença e, no dia, apresenta o QR Code à entrada.</li>
      </ol>
    </section>
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">O que vem incluído</h2>
      <ul className="list-disc ml-5 flex flex-col gap-2">
        <li><strong>RSVP online:</strong> confirmações automáticas, com gestão de acompanhantes (+1) nos planos avançados.</li>
        <li><strong>QR Code individual e check-in:</strong> leitura à entrada, sem confusão na receção.</li>
        <li><strong>Mapa das mesas:</strong> cada convidado distribuído pelo seu lugar.</li>
        <li><strong>Lista de presentes por IBAN:</strong> cotas em Kwanza nos bancos angolanos — ver o <Link to="/guia/lista-presentes-iban" className="font-bold text-[#1B365D] underline underline-offset-2">guia de presentes por IBAN</Link>.</li>
        <li><strong>Mapa com Como chegar:</strong> o convidado vê a zona e chega sem ligar.</li>
      </ul>
    </section>
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">Preço em Angola</h2>
      <p>
        {premiumLine} (até {PLANS.premium.guestLimit} convidados). O VIP fica em {PLANS.vip.price.toLocaleString('pt-AO')} Kz
        (até {PLANS.vip.guestLimit} convidados). Sempre pagamento único por evento — sem mensalidade para noivos.
        Detalhe completo no <Link to="/guia/precos-convite-digital" className="font-bold text-[#1B365D] underline underline-offset-2">guia de preços</Link> e na <Link to="/plans" className="font-bold text-[#1B365D] underline underline-offset-2">página de planos</Link>.
      </p>
    </section>
  </GuideLayout>
);
