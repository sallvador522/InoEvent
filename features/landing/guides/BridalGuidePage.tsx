import React from 'react';
import { Link } from 'react-router-dom';
import { GuideLayout } from './GuideLayout';

/**
 * /guia/cha-de-panela — keyword: "chá de panela Angola convite".
 */
export const BridalGuidePage: React.FC = () => (
  <GuideLayout
    title="Convite Digital de Chá de Panela em Angola: confirmação rápida e presentes | InoEvents"
    description="Como criar um convite digital de chá de panela (chá de cozinha) em Angola: formulário simples sem campos de casamento, confirmação de presença rápida, lista de presentes práticos e partilha por WhatsApp."
    keywords="chá de panela Angola convite, convite digital chá de panela Luanda, chá de cozinha Angola, convite chá de bebé Angola, confirmar presença chá panela"
    kicker="Guia · Chás em Angola"
    h1Lead="Convite de chá de panela em"
    h1Accent="Angola"
    intro="O chá de panela (ou chá de cozinha) é mais íntimo que o casamento — e o convite acompanha: formulário curto, sem perguntas de cerimónia, confirmação num toque e lista de presentes práticos para a casa nova."
    faqs={[
      {
        q: 'O formulário é igual ao do casamento?',
        a: 'Não. Ao escolher um modelo de chá de panela, os campos de casamento (nome do noivo, dress code, receção, cronograma alargado) são escondidos automaticamente — só aparece o que interessa para um chá.',
      },
      {
        q: 'Dá para fazer lista de presentes para o chá?',
        a: 'Sim, com a mesma lógica do casamento: presentes práticos com valores em Kwanza e IBAN. Ver o guia de lista de presentes por IBAN.',
      },
      {
        q: 'Como convido as amigas?',
        a: 'Partilhas o link no WhatsApp — no grupo das amigas ou individualmente. Cada uma abre e confirma presença na página.',
      },
      {
        q: 'Serve também para chá de bebé?',
        a: 'Sim. A plataforma trata chás de bebé com o mesmo formulário simplificado do chá de panela.',
      },
    ]}
    related={[
      { to: '/guia/convite-digital-casamento-angola', label: 'Convite digital de casamento' },
      { to: '/guia/lista-presentes-iban', label: 'Lista de presentes por IBAN' },
      { to: '/guia/precos-convite-digital', label: 'Preços de convites digitais' },
    ]}
  >
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">Simples de propósito</h2>
      <p>
        Nada de noivo, dress code ou cronograma de cerimónia: o convite de chá pede o essencial — anfitriã, data,
        local e presentes. Menos campos, mais confirmações. Escolhe um modelo na{' '}
        <Link to="/templates?category=bridal" className="font-bold text-[#1B365D] underline underline-offset-2">galeria de chás de panela</Link>.
      </p>
    </section>
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">Presentes que fazem sentido</h2>
      <p>
        Panelas, jogos de copos, pequenos eletrodomésticos — a lista com valores em Kwanza deixa cada amiga
        contribuir com o que pode, por transferência. Detalhes no{' '}
        <Link to="/guia/lista-presentes-iban" className="font-bold text-[#1B365D] underline underline-offset-2">guia de presentes por IBAN</Link>.
      </p>
    </section>
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">Do chá ao casamento</h2>
      <p>
        Muitas noivas fazem os dois: chá íntimo agora, casamento grande depois. O mesmo registo serve para ambos —
        começa pelo <Link to="/guia/convite-digital-casamento-angola" className="font-bold text-[#1B365D] underline underline-offset-2">guia do casamento</Link> quando chegar a hora
        e consulta os <Link to="/guia/precos-convite-digital" className="font-bold text-[#1B365D] underline underline-offset-2">preços</Link>.
      </p>
    </section>
  </GuideLayout>
);
