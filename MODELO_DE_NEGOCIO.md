# Modelo de Negócio InoEvents

O InoEvents transita de um modelo estritamente SaaS (Assinaturas) para um **Modelo Híbrido: Pagamento Único por Evento (B2C) + Assinatura Recorrente (B2B)**.

A lógica é simples: consumidores normais (noivos, aniversariantes) organizam eventos 1 a 2 vezes por ano. Uma assinatura mensal não faz sentido e gera cancelamentos imediatos (churn). Para eles, vendemos o convite como um "produto" (pagamento único). Para agências e cerimonialistas que organizam festas todos os meses, vendemos uma assinatura de software.

## 1. Mercado B2C (Consumidor Final) - Pagamento Único

Os planos para o consumidor final são cobrados uma única vez por cada evento criado. **Regra: 1 evento de casamento por plano** (chás de panela/bebé não contam e são livres); vários eventos só no Business. O convite fica ativo durante a validade do plano, contada a partir da ativação: Premium 180 dias, VIP 365 dias. (Fonte: `config/plans.ts` — o código manda.)

### Convite Essencial — FORA DE VENDA (legado)
Retirado do catálogo. Fichas e eventos antigos mantêm as regras originais (7.500 Kz, 90 dias, 100 convidados) e o caminho de upgrade para Premium.

### Convite Premium (Pagamento Único)
Para quem procura requinte e exclusividade no grande dia. **1 evento de casamento por plano.**
- **Preço**: 15.000 Kz / por evento.
- **Duração**: Ativo durante 180 dias após a ativação.
- **Recursos**:
  - Todos os layouts (Premium/Luxury) desbloqueados.
  - RSVP até 50 convidados (nomes na lista).
  - TocaPlayer (Música de Fundo no convite).
  - Mapa das Mesas e Livro de Assinaturas Digital.
  - Animações avançadas e Analytics básicos.
  - Nota: sem marca InoEvents SÓ no Business (white-label exclusivo B2B).

### Convite VIP (Pagamento Único)
Para grandes festas que precisam de controlo total e endereço próprio. **1 evento de casamento por plano.**
- **Preço**: 25.000 Kz / por evento.
- **Duração**: Ativo durante 365 dias após a ativação.
- **Recursos**:
  - Tudo do Premium.
  - RSVP até 200 convidados (nomes na lista).
  - QR Individual por convidado e check-in inteligente na porta.
  - Gestão de acompanhantes (+1) e mesas avançadas.
  - Analytics avançados (filtros de período, acompanhantes, PDF executivo).
  - Suporte prioritário.

### Plano Free (Degustação sem custo)
Para ver modelos, criar e provar o convite antes de pagar.
- **Preço**: 0 Kz.
- **Recursos**:
  - Criar e provar o convite.
  - Partilha e gestão de convidados só após um plano pago.

## 2. Mercado B2B (Agências e Profissionais) - Assinatura Mensal/Anual

Para cerimonialistas, wedding planners e agências de eventos, a InoEvents atua como um SaaS (Software de Gestão e Criação de Convites).

### Plano Business (SaaS)
- **Preço**: 39.900 Kz / mês (assinatura, sem expiração enquanto ativa).
- **Ciclo (manual, via WhatsApp + painel admin)**: sem débito automático. A equipa confirma o pagamento e ativa; renovar = +30 dias no admin; cancelar = 7 dias de graça e depois corta (conta baixa para Free, eventos bloqueiam).
- **Recursos**:
  - Criação de eventos ativos ilimitados (∞).
  - White-label: a marca d'água no rodapé dos convites passa a ser o nome da Agência/Cerimonialista, e não da InoEvents.
  - Painel de gestão B2B (organizar os clientes e RSVPs num só lugar).
  - Suporte VIP prioritário.

## 3. Aquisição e Retenção
- **Efeito de Rede (Network Effect)**: Cada evento Premium coloca a experiência InoEvents na frente de 50 potenciais clientes; cada VIP, 200.
- **Migração Orgânica (Upsell)**: Se um utilizador comprar 2 ou mais planos Premium num ano (comportamento de profissional disfarçado — cada plano só aceita 1 casamento), a plataforma convida-o a fazer upgrade para o plano Business, onde pagará uma mensalidade mas terá acesso a criar múltiplos eventos para os seus clientes com a sua própria marca.
