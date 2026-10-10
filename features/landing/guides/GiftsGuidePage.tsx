import React from 'react';
import { Link } from 'react-router-dom';
import { GuideLayout } from './GuideLayout';

/**
 * /guia/lista-presentes-iban — keyword: "lista de presentes casamento Angola IBAN".
 * O diferencial que a concorrência local não faz bem: liderar com ele.
 */
export const GiftsGuidePage: React.FC = () => (
  <GuideLayout
    title="Lista de Presentes de Casamento por IBAN em Angola (BAI, BFA, BIC, SOL) | InoEvents"
    description="Como receber presentes de casamento em dinheiro por transferência em Angola: lista de presentes com valores em Kwanza e IBAN do BAI, BFA, BIC, SOL e outros bancos. O convidado escolhe na página e transfere na app do banco."
    keywords="lista de presentes casamento Angola IBAN, presentes de casamento em dinheiro Angola, cotas lua de mel Angola, IBAN BAI BFA BIC SOL casamento, lista de casamento Luanda"
    kicker="Guia · Presentes em Angola"
    h1Lead="Lista de presentes por IBAN em"
    h1Accent="Angola"
    intro="Em vez de embrulhos repetidos ou envelopes perdidos na festa, os noivos criam uma lista de presentes com valores em Kwanza — cotas da lua de mel, eletrodomésticos, ajudas com piada — e recebem por transferência direta para o seu IBAN, nos bancos angolanos."
    faqs={[
      {
        q: 'Que bancos são suportados?',
        a: 'Todos os bancos angolanos via IBAN: BAI, BFA, BIC, SOL e outros. Basta indicar o IBAN e o nome do titular ao configurar a lista.',
      },
      {
        q: 'Como o convidado oferece?',
        a: 'Abre o convite, escolhe o presente na lista e faz a transferência na app do seu banco para o IBAN indicado. A confirmação do dinheiro aparece no extrato bancário dos noivos.',
      },
      {
        q: 'A plataforma recebe ou confirma o dinheiro?',
        a: 'Não. A InoEvents não debita nem confirma transferências — apenas organiza a lista e regista as contribuições declaradas. A confirmação é sempre no extrato do banco.',
      },
      {
        q: 'Posso criar cotas com valores à minha escolha?',
        a: 'Sim. Cada presente tem o valor que os noivos definirem, em Kwanza — desde cotas simbólicas até valores maiores como a lua de mel.',
      },
    ]}
    related={[
      { to: '/guia/convite-digital-casamento-angola', label: 'Convite digital de casamento' },
      { to: '/guia/precos-convite-digital', label: 'Preços de convites digitais' },
      { to: '/guia/cha-de-panela', label: 'Convite de chá de panela' },
    ]}
  >
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">Como funciona</h2>
      <ol className="list-decimal ml-5 flex flex-col gap-2">
        <li><strong>Criem a lista</strong> no painel do evento: cada presente com nome, valor em Kwanza e, se quiserem, uma descrição com piada.</li>
        <li><strong>Indiquem o IBAN</strong> (BAI, BFA, BIC, SOL ou outro banco angolano) e o nome do titular.</li>
        <li><strong>Partilhem o convite.</strong> O convidado escolhe o presente na página e transfere na app do banco.</li>
        <li><strong>Confirmem no extrato</strong> e marquem a contribuição como recebida no painel.</li>
      </ol>
    </section>
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">Ideias de presentes que funcionam em Angola</h2>
      <ul className="list-disc ml-5 flex flex-col gap-2">
        <li><strong>Cotas da lua de mel:</strong> dividir a viagem em partes pequenas para todos participarem.</li>
        <li><strong>Eletrodomésticos por cotas:</strong> arcas, fogões e geleiras pagos a meias pelos convidados.</li>
        <li><strong>Ajudas práticas:</strong> "táxi da noiva", "fato do noivo", "bolo" — presentes com humor que os convidados adoram escolher.</li>
      </ul>
    </section>
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">Transparência honesta</h2>
      <p>
        A lista organiza e regista; o dinheiro circula entre bancos, fora da plataforma. Isso significa duas coisas
        boas: não há comissões sobre os vossos presentes e não há dependência de pagamentos online — funciona com
        qualquer banco angolano que faça transferências. E uma responsabilidade vossa: confirmar cada entrada no
        extrato antes de agradecer.
      </p>
    </section>
    <section>
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">Quanto custa</h2>
      <p>
        A lista de presentes está incluída nos convites — sem taxa por presente. Ver o{' '}
        <Link to="/guia/precos-convite-digital" className="font-bold text-[#1B365D] underline underline-offset-2">guia de preços</Link>{' '}
        e começar pelo <Link to="/guia/convite-digital-casamento-angola" className="font-bold text-[#1B365D] underline underline-offset-2">convite digital de casamento</Link>.
      </p>
    </section>
  </GuideLayout>
);
