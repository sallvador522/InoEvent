---
name: elite-ux
description: Elite UX Engineering — interfaces compreensíveis, previsíveis, acessíveis, consistentes, resilientes e difíceis de usar incorrectamente. Use para desenhar+implementar (DESIGN_AND_IMPLEMENT), auditar+corrigir (AUDIT_AND_FIX) ou só diagnosticar UI (AUDIT_ONLY).
trigger: /elite-ux
---

# Elite UX Engineering

O objectivo não é apenas criar uma interface que funciona. É criar uma interface que seja **compreensível, previsível, acessível, consistente, resiliente e difícil de usar incorrectamente**.

**Princípio-mestre: prevenção > validação > recuperação.**

Uma boa interface não espera o utilizador cometer o erro para depois lhe dizer que errou. Ela remove condições que tornam o erro provável, comunica claramente o estado do sistema e fornece recuperação quando algo falha.

As heurísticas de Nielsen colocam explicitamente a prevenção de erros entre os princípios fundamentais de usabilidade.

## Usage

```
/elite-ux <task>              DESIGN_AND_IMPLEMENT (default): descobrir, modelar, desenhar, implementar, auditar, verificar
/elite-ux audit-fix <target>  AUDIT_AND_FIX: Scan → Report → Fix → Re-scan → Verify
/elite-ux audit <target>      AUDIT_ONLY: só diagnosticar, nunca modificar código
```

## 1. MISSÃO

Esta skill existe para impedir que um coding agent:

- crie UI inconsistente;
- invente componentes desnecessários;
- implemente fluxos confusos;
- coloque vários CTAs concorrentes;
- esconda estados importantes;
- apresente loaders falsos;
- perca dados do utilizador;
- produza erros sem recuperação;
- aceite dados que o backend depois rejeita;
- trate falhas de rede como dados vazios;
- crie botões que parecem funcionar mas não funcionam;
- crie interfaces inacessíveis;
- faça layouts que quebram em mobile;
- use copy ambígua;
- esconda o estado real de pagamentos, uploads ou processamento;
- introduza padrões visuais diferentes dos já existentes;
- declare uma feature terminada sem a testar adequadamente.

## 2. REGRA DE OURO

Antes de escrever código, o agent deve responder:

> Quem está a tentar fazer o quê, em que contexto, com quais dados, quais erros podem ocorrer, como o sistema comunica cada estado e como o utilizador recupera?

Se estas respostas não estiverem claras, a implementação ainda não está suficientemente especificada.

## 3. MODOS DE EXECUÇÃO

- **DESIGN_AND_IMPLEMENT** — desenhar e implementar nova feature. Fluxo: Discover → Understand → Model → Design → Implement → Audit → Verify.
- **AUDIT_AND_FIX** — feature já implementada, detectar e corrigir. Fluxo: Scan → Report → Fix → Re-scan → Verify.
- **AUDIT_ONLY** — somente diagnosticar. Nunca modificar código.

## 4. ORDEM DE AUTORIDADE

Quando houver conflito entre regras, esta ordem prevalece (1 = maior):

1. Segurança
2. Acessibilidade
3. Integridade dos dados
4. Requisitos funcionais
5. Regras de negócio
6. Consistência do produto
7. Convenções da plataforma
8. Performance
9. Clareza de conteúdo
10. Preferência estética

Nunca sacrificar segurança, acessibilidade, integridade ou clareza para obter uma interface visualmente mais bonita.

## 5. PERFIL DO PROJECTO

Antes da auditoria ou implementação, descobrir o perfil real. Primeiro procurar no projecto. Não inventar.

```yaml
produto:
plataforma:
audiencia:
user_goals:
stack:
framework:
ui_library:
design_system:
icons:
theme:
breakpoints:
fonts:
routing:
state_management:
backend:
database:
auth:
billing:
storage:
i18n:
locale:
a11y_target:
analytics:
verification_commands: # ex: npm run lint, npm run typecheck, npm run build, npm test
restrictions:
business_critical_flows:
```

**REGRA:** Não inventar informações que possam ser descobertas no projecto. Se uma informação não puder ser confirmada: `UNKNOWN — NEEDS VERIFICATION`. Nunca apresentar uma suposição como facto.

## 6. DISCOVER BEFORE CODE

Antes de criar qualquer componente, procurar:

- componentes equivalentes; variantes existentes; layouts semelhantes;
- tokens; hooks; utilitários; validators;
- estados existentes; copy semelhante; features com fluxo parecido.

A busca deve ser semântica, não apenas nominal. Um componente chamado `Panel` pode cumprir a função de um `Card`.

## 7. REGRA ANTI-REDESIGN

Nunca criar um novo padrão visual quando um padrão existente já resolve correctamente o problema.

Ordem obrigatória: `existing component → existing variant → composition → new component`

Antes de criar botão, modal, dialog, drawer, card, badge, input, select, toast, stepper, progress ou skeleton — procurar primeiro equivalentes no projecto.

## 8. REGRA ANTI-OVERENGINEERING

Não adicionar biblioteca, abstraction, state layer, design pattern, animation, component ou dependency sem benefício verificável.

Cada nova camada precisa justificar pelo menos um destes pontos: reutilização, segurança, acessibilidade, consistência, manutenção, escalabilidade, performance.

Complexidade sem benefício verificável é dívida técnica.

## 9. USER GOAL FIRST

Antes de escolher a UI, definir:

- **User Goal:** o que o utilizador quer concluir?
- **Business Goal:** o que o produto precisa alcançar?
- **Context:** porque o utilizador está nesta página agora?
- **Mental Model:** como ele provavelmente interpreta a tarefa?
- **Primary Action:** qual é a acção principal?
- **Secondary Actions:** o que é complementar?
- **Cost of Error:** o que acontece se ele errar?
- **Success:** como saberá que terminou?

## 10. INFORMATION ARCHITECTURE

Verificar: agrupamento, ordem, hierarquia, proximidade, nomenclatura, progressive disclosure, complexidade, densidade, frequência de uso, relações entre páginas.

Não mostrar informação só porque ela existe. Privilegiar reconhecimento em vez de depender da memória do utilizador (heurísticas de Nielsen).

## 11. LEI DE HICK — CARGA COGNITIVA

Avaliar o número de escolhas relevantes apresentadas simultaneamente. Perguntar: o utilizador sabe qual é o próximo passo?

Não permitir que vários CTAs de igual peso visual concorram pela mesma intenção. Aplicar hierarquia Primary / Secondary / Tertiary. Acções raras devem ser agrupadas quando isso melhorar a compreensão.

Hick não significa "sempre remover opções". O objectivo é reduzir decisões desnecessárias sem esconder funcionalidades importantes.

## 12. LEI DE FITTS — TARGETS

Avaliar: tamanho, distância, espaçamento, posição, frequência de uso.

Para touch/mobile, usar **44×44 px como baseline de produto** quando compatível com o design, sem tratar isso como requisito universal da WCAG. Na WCAG 2.2, Target Size (Minimum) AA estabelece **24×24 CSS px**, com excepções.

Nunca criar icon-only controls minúsculos sem área de hit apropriada.

## 13. CTA CONSISTENCY

Para cada fluxo: **uma intenção principal = uma acção primária por estado.**

Detectar: dois botões com o mesmo texto; dois handlers para a mesma intenção; rótulos diferentes para a mesma acção; mesmo rótulo para acções diferentes.

Evitar labels genéricos como `Continue`, `Next`, `Submit`, `Confirm` quando uma descrição específica for possível. Exemplos: `Criar conta`, `Guardar alterações`, `Publicar música`, `Exportar ficheiros`.

A NN/g destaca que os labels dos botões devem comunicar claramente a acção e que os seus estados ajudam a formar expectativas correctas.

## 14. NAVEGAÇÃO

Verificar: localização actual, hierarquia, back, browser history, deep links, breadcrumbs, tabs, filtros, paginação, navigation state.

Links devem comportar-se como links. Acções devem comportar-se como buttons. Não utilizar div clicável quando uma semântica nativa existe.

## 15. ESTADOS DE INTERFACE

Todo componente relevante deve possuir os estados que realmente se aplicam. O agent deve decidir explicitamente quais estados existem. Um estado não especificado não deve ser assumido inexistente.

Possíveis estados: `idle, hover, focus, pressed, active, selected, loading, success, warning, error, disabled, empty, partial, offline, reconnecting, permission-denied, rate-limited, retrying, cancelled, completed, stale`.

## 16. PAGE STATE MODEL

Cada ecrã deve ser avaliado em: first visit, empty, populated, dense, loading, partial loading, processing, success, error, offline, permission denied, expired session, stale data, completed.

Não testar apenas o happy path.

## 17. PAINEL DE ESTADO HONESTO

Nunca representar um estado que o sistema não possui.

- Errado: `Published` quando `upload queued`.
- Errado: `Saved` quando a operação ainda está em processamento.
- Errado: `0 credits` quando a API falhou.

O estado visual deve ser uma representação fiel do estado real.

## 18. LOADING

Não usar spinner apenas porque um valor é `undefined`. Distinguir: initial loading, refreshing, saving, uploading, processing, retrying, background processing.

- **Skeleton:** preferir quando o layout final é conhecido, a espera é perceptível, existe conteúdo estruturado.
- **Spinner:** adequado para acções curtas, botões, pequenas operações, estados cuja estrutura não pode ser antecipada.

Não tratar `Skeleton > Spinner` como lei universal. O feedback deve corresponder ao tipo de operação.

## 19. LAYOUT STABILITY

Auditar: CLS, mensagens que empurram conteúdo, loaders que mudam dimensões, imagens sem dimensão reservada, fontes que alteram layout, banners dinâmicos, action bars, sticky elements.

Erro clássico: click button → validation text appears → entire page moves → click lands elsewhere. A posição dos elementos críticos deve permanecer suficientemente estável.

## 20. CLEAN UI / NO GHOST STATE

Detectar: preview antigo, ficheiro removido que ainda aparece, artwork antiga, metadata de outro item, selected state sem item, botão activo sem capacidade real, resultados de execução anterior.

Quando o contexto muda: `invalidate stale state → clear incompatible state → recompute`.

## 21. AÇÕES POR CAPACIDADE REAL

Não derivar capacidade de rótulos. Errado: `source.type === "image" → show image action`. Correcto: verificar `canDecode, canTransform, hasBytes, hasPermission, supportedFormat, validState`.

Uma acção só deve aparecer activa quando a pré-condição real estiver satisfeita.

## 22. DISABLED

Um controlo disabled precisa permitir ao utilizador compreender "Porque não posso fazer isto?". Quando apropriado: helper text, tooltip, inline explanation. Não utilizar apenas `opacity: .5` para comunicar o motivo.

## 23. SEM DEAD ENDS

Nenhum error state, empty state, disabled state ou permission state deve deixar o utilizador sem caminho válido quando existir uma recuperação razoável.

Exemplos: Retry, Replace file, Generate, Go back, Edit, Request access, Sign in, Create new. Beco-sem-saída é bug de UX.

## 24. ERROS — O QUÊ + PORQUÊ + COMO

Toda mensagem de erro deve, quando possível, conter: o que aconteceu, porquê, como resolver.

Exemplo: "Não conseguimos carregar o áudio porque o formato não é suportado. Converte-o para WAV e tenta novamente."

Evitar `Something went wrong`, `Error 500`, `Try again` sem contexto. Códigos técnicos pertencem aos logs, não ao caminho principal do utilizador.

## 25. ERRO SEM RECUPERAÇÃO

Qualquer `setError`, `setBlockMsg`, error banner ou error toast deve ser verificado para existência de caminho de recuperação quando aplicável. Texto que diz "volta e tenta novamente" sem fornecer caminho adequado é insuficiente.

## 26. POKA-YOKE — ERROR PREVENTION

Antes de validar depois do erro, perguntar: podemos impedir que o erro aconteça?

Utilizar: constraints, defaults seguros, sugestões, input types adequados, formatos guiados, previews, confirmação, limites, desambiguação. Nielsen recomenda eliminar condições propensas a erro ou verificá-las antes de comprometer a acção.

## 27. FORMS

Auditar: labels, required/optional, defaults, autofill, input type, keyboard, validation, preserving input, submit state, error placement, success state.

Não utilizar placeholder como substituto de label.

## 28. INPUT PREVENTION

Quando o domínio permitir: impedir caracteres inválidos, usar `inputMode`/`type`, limitar range, normalizar, formatar, validar no momento adequado. Mas não criar masks agressivas que impeçam edição natural. Prevenção não deve tornar a entrada mais difícil do que o erro que tenta evitar.

## 29. LOCALE

Para datas, horas, números, moedas, unidades e telefones: utilizar locale apropriado. Aceitar formatos naturais quando o contexto exigir e normalizar para representação canónica. Data de calendário deve ser tratada no contexto temporal correcto. Nunca introduzir bugs de timezone ao validar uma data que não representa um instante UTC.

## 30. INPUT FEEDBACK

Quando apropriado: `typed → normalized → previewed → validated`. Exemplo: "Entendido: 9 de Setembro de 2026." Isto reduz mal-entendidos antes do submit.

## 31. VALIDATION SYMMETRY

A regra usada para aceitar dados deve ser compatível com frontend, backend, processamento, armazenamento e exportação.

Problema crítico: UI says valid → backend rejects. Também problemático: backend accepts → processor rejects. Criar um portal coerente de validação sempre que possível.

## 32. ASYNC OPERATIONS

Toda operação longa deve definir: start, loading, progress, success, failure, retry, cancel, timeout, duplicate trigger, navigation away, refresh, recovery.

Perguntar: o segundo clique duplica a operação? A resposta pode chegar fora de ordem? Pode ser cancelada/retomada? Pode sobreviver a navigation? É idempotente? O resultado pode ficar stale?

## 33. IDEMPOTENCY

Operações como pagamento, geração, publicação, export, envio e criação devem impedir duplicação acidental. Ao iniciar: `disable duplicate trigger → show true loading → preserve operation identity`. Em operações sensíveis, retry seguro deve ser explícito. Nunca confundir `request failed` com `operation definitely did not happen`.

## 34. PAGAMENTOS / CRÉDITOS

Separar semanticamente: authorization, charge, processing, delivery. Uma falha na entrega não implica automaticamente que a cobrança não ocorreu. UX deve comunicar honestamente o estado financeiro.

## 35. PERSISTENCE VS VOLATILITY

Para cada estado persistido, identificar dependências voláteis: File, Blob, `blob:`, Object URL, worker, browser memory, temporary upload. Nunca restaurar uma etapa que depende de dados já destruídos. Ao rehidratar: `load persisted state → verify prerequisites → migrate → clamp invalid state → explain recovery`.

## 36. DRAFTS

Fluxos longos devem considerar: autosave, draft, local persistence, server persistence, recovery, unsaved changes. O nível de persistência deve ser proporcional ao custo de perder o trabalho.

## 37. NETWORK STATES

Nunca confundir: offline, timeout, server error, permission denied, empty result — são estados diferentes. Para dados remotos: `loading, success, error` e, quando necessário, `stale + refreshing`.

## 38. OFFLINE ≠ EMPTY

Uma falha de rede nunca deve apresentar `0 credits`, `free plan`, `no projects`, `no data` sem confirmação. Preservar último estado conhecido quando for seguro. Mostrar claramente "A tentar actualizar…" ou "Sem ligação. A mostrar os últimos dados disponíveis."

## 39. POLLING

Polling deve: pausar quando offline; não consumir retries desnecessariamente; retomar ao recuperar ligação; evitar requests concorrentes; respeitar cancellation; parar depois de sucesso/falha terminal.

## 40. FILE UX

Para uploads: escolher, validar, preview, progress, processar, cancelar, retry, substituir, remover. Validar MIME, extensão, tamanho, bytes, decoding e integridade. Nunca confiar apenas na extensão do ficheiro.

## 41. DRAG & DROP

Todo drag interaction deve possuir alternativa equivalente: file picker, botão, teclado quando aplicável. WCAG 2.2 adicionou critério específico para Dragging Movements.

## 42. ACCESSIBILITY — WCAG 2.2

Auditar profundamente:

- **Semantics:** native HTML, buttons, links, labels, headings, landmarks.
- **Keyboard:** tab order, enter, space, escape, arrows, no keyboard traps.
- **Focus:** visible, correct, unobscured, managed after dialogs/navigation.
- **Screen Readers:** accessible names, descriptions, states, announcements.
- **Contrast:** text, icons, borders, focus, states.
- **Interaction:** target size, dragging alternatives, pointer interactions.

WCAG 2.2 inclui requisitos novos/relevantes para Focus Not Obscured, Dragging Movements, Target Size, Consistent Help, Redundant Entry e Accessible Authentication.

## 43. SEMANTICS BEFORE ARIA

Preferir `button, a, label, input, select, dialog, nav, main` antes de recriar comportamento com `div + click + aria`. ARIA deve melhorar semântica, não compensar HTML inadequado. As Web Interface Guidelines da Vercel também recomendam semântica nativa antes de ARIA.

## 44. FOCUS MANAGEMENT

Ao abrir modal: `move focus → trap if required → perform action → return focus`. Ao navegar: destination identifiable, focus strategy appropriate. Sticky headers, footers e overlays nunca devem esconder o elemento focado.

## 45. MODALS / DRAWERS

Perguntar antes de criar: a informação realmente precisa interromper o utilizador? Se sim, definir: trigger, reason, initial focus, focus trap, escape, outside click, close, scroll, mobile, loading, error, return focus. Não usar modal para qualquer pequena informação.

## 46. DESTRUCTIVE ACTIONS

Classificar: reversible, recoverable, destructive, irreversible, financial, legal. Quanto maior o risco → maior clareza, prevenção, necessidade de confirmação e recuperação. Confirmações não devem ser usadas indiscriminadamente; a NN/g alerta que dialogs de confirmação ajudam sobretudo quando existe risco real e podem ser prejudiciais quando excessivos.

## 47. UNDO

Quando uma operação é reversível, preferir frequentemente `Delete → item disappears → Undo` em vez de `Are you absolutely sure?`. A liberdade de recuperação é um princípio clássico de UX.

## 48. CONTENT UX

Auditar: terminology, labels, CTAs, titles, descriptions, helper text, error messages, empty states, confirmation copy, capitalization, pluralization, number/date formatting. O mesmo conceito deve ter o mesmo nome no produto.

## 49. LANGUAGE CONSISTENCY

Um fluxo deve manter um idioma coerente. Não misturar sem intenção (`Continuar`, `Upload`, `Guardar`, `Generate`). Excepções legítimas: nomes próprios, marcas, termos técnicos, conteúdo exportado para outro destino.

## 50. USER-GENERATED CONTENT

O layout deve sobreviver a: títulos curtos/longos, nomes compostos, textos extremamente longos, traduções, números grandes, emojis, caracteres especiais, nomes de artistas, usernames, conteúdo desconhecido. Nunca assumir limites artificiais como `title.length < 20` sem regra de produto.

## 51. RESPONSIVE UX

Não avaliar apenas "não existe horizontal overflow". Avaliar mudança de comportamento entre breakpoints: navigation, layout, density, tables, filters, actions, dialogs, forms, sticky elements, drag/drop. Responsive design é comportamento, não apenas largura.

## 52. MOBILE

Verificar: touch targets, spacing, keyboard, safe areas, sticky actions, bottom sheets, scrolling, long text, viewport, input zoom, overflow. Na documentação da Vercel, mobile é tratado com targets maiores e atenção especial ao comportamento touch.

## 53. ICONS

Todo ícone deve ter: significado correcto, consistência, accessible name quando interactivo. Nunca usar `X` como único conteúdo sem nome acessível. Nunca usar um ícone cujo significado contradiz a acção.

## 54. VISUAL HIERARCHY

Verificar: primary, secondary, tertiary, heading hierarchy, spacing, density, grouping, emphasis. Se tudo tem destaque, nada tem destaque.

## 55. MOTION

Motion deve possuir propósito. Usar para: feedback, continuidade, orientação, hierarquia. Evitar: delays artificiais, animações infinitas desnecessárias, motion decorativo excessivo, motion que dificulta a tarefa. Respeitar `prefers-reduced-motion`.

## 56. PERFORMANCE PERCEPTUAL

Avaliar: feedback após clique, time to response, progressive loading, skeleton, layout stability, large images, expensive rendering, long operations. O utilizador deve perceber imediatamente que a acção foi recebida.

## 57. AI UX

Quando existe IA: `idle → preparing → processing → partial → result → review → error → retry`. Nunca apresentar sugestão de IA como verdade garantida quando existe incerteza. O utilizador deve saber, quando relevante: o que a IA fez, o que foi sugerido, o que foi confirmado, o que pode editar, quanto custa, quais limites existem.

## 58. PERMISSIONS

Distinguir: unauthenticated, unauthorized, not configured, not available, expired, temporarily unavailable. Nunca transformar tudo em `Something went wrong`.

## 59. NETWORK + BILLING SAFETY

Para operações pagas: `pre-check → authorize → charge → process → deliver → confirm`. Definir comportamento em cada falha. Nunca cobrar novamente simplesmente porque o utilizador fez retry.

## 60. CROSS-FEATURE CONSISTENCY

Comparar a feature nova com features existentes em: upload, save, delete, export, search, filter, billing, settings, onboarding. O comportamento deve parecer pertencer ao mesmo produto.

## 61. DESIGN SYSTEM INTEGRITY

Não alterar globalmente tokens, spacing, typography, radius, colour ou component behaviour apenas para satisfazer uma feature individual. Quando uma feature precisa de nova capacidade, preferir `variant → composition → local override` antes de mudar o sistema inteiro.

## 62. ZERO FAKE AFFORDANCES

Nunca deixar que algo pareça botão mas não seja; pareça link mas não seja; pareça drag zone mas não aceite drop; pareça editável mas seja readonly; pareça concluído mas esteja em processamento. Visual affordance deve corresponder à capacidade real.

## 63. EDGE CASE MATRIX

Para cada fluxo relevante:

| Estado | Resultado esperado |
|---|---|
| Happy path | sucesso |
| Empty | estado vazio |
| Invalid input | erro accionável |
| Network error | recuperação |
| Slow network | feedback |
| Duplicate action | idempotência |
| Session expired | recuperação |
| Permission denied | explicação |
| Stale data | estado explícito |
| Reload | recuperação |
| Browser close | recuperação adequada |
| Mobile | comportamento correcto |
| Keyboard | navegação |
| Long content | layout resiliente |
| Destructive action | confirmação/undo |

Adicionar edge cases específicos do domínio.

## 64. AUDITORIA MECÂNICA

Pesquisar quando aplicável (grep): `duplicate CTA labels, duplicate handlers, setBlockMsg, generic error, animate-spin, toISOString, new Date(, can: true, blob:, URL.createObjectURL, onClick, disabled, aria-label, role=, tabIndex, TODO, console.error, catch (, Promise, setTimeout, polling, retry`.

Estas pesquisas detectam padrões suspeitos. Não constituem prova isolada. Sempre validar semanticamente.

## 65. ANÁLISE DE DEPENDÊNCIAS

Antes de alterar shared components, stores, validators, hooks, APIs ou schemas, avaliar: Who uses this? What breaks if changed? Is behaviour backwards compatible? Can the change be scoped locally?

## 66. REGRA ANTI-BLIND FIX

Nunca corrigir apenas o sintoma se houver indícios de problema sistémico. Exemplo: encontrou um CTA duplicado — pesquisar outras instâncias, componente responsável, handlers, outros steps e fluxos semelhantes. Corrigir a classe do problema quando isso for seguro.

## 67. REGRA DE DIFF MÍNIMO

Durante FIX: alterar o mínimo necessário; preservar API pública; não refactorizar unrelated code; não mudar shared components sem necessidade; não introduzir dependências desnecessárias. Quanto maior a superfície alterada → maior o risco de regressão.

## 68. SCAN

Durante SCAN: mapear o fluxo; identificar componentes, estados, dados, acções, validações, dependências e riscos. Registar: `file, line, component, state, evidence, severity`.

## 69. REPORT

Formato: `ID | Categoria | Regra | Localização | Evidência | Severidade | Recomendação`

Severidades:

- **P0 — Critical:** dano, corrupção, cobrança incorrecta, perda de dados, risco grave.
- **P1 — Major:** bloqueia ou degrada significativamente a tarefa.
- **P2 — Moderate:** confusão, esforço adicional ou inconsistência.
- **P3 — Minor:** polish e refinamentos.

## 70. FIX

Ordem recomendada: `P0 → dead ends → data integrity → duplicate actions → state honesty → validation/gates → accessibility → network/resilience → responsive behaviour → content → visual polish`. Depois dos fixes, repetir o SCAN.

## 71. DESIGN_AND_IMPLEMENT PROCEDURE

- **PHASE 0 — DISCOVER:** Ler o projecto. Não editar.
- **PHASE 1 — UNDERSTAND:** Definir user goal, business goal, mental model, primary action, data dependencies, risks.
- **PHASE 2 — MODEL:** Definir states, validation, gates, errors, recovery, async behaviour, persistence, responsive behaviour, accessibility.
- **PHASE 3 — DESIGN:** Definir information architecture, component hierarchy, interaction model, copy, states, responsive model.
- **PHASE 4 — IMPLEMENT:** Implementar respeitando o design system existente.
- **PHASE 5 — AUDIT:** Executar as lentes relevantes.
- **PHASE 6 — VERIFY:** Executar lint, typecheck, build, tests, manual walkthrough, error walkthrough, responsive walkthrough, keyboard walkthrough. Quando ferramentas visuais estiverem disponíveis: visual inspection.
- **PHASE 7 — RE-AUDIT:** Repetir pesquisas mecânicas, estados, regressões, consistência, acessibilidade.

## 72. CHECKLIST FINAL

Uma feature NÃO deve ser declarada pronta até avaliar:

- [ ] User goal clear
- [ ] Primary action clear
- [ ] Information architecture coherent
- [ ] Existing components reused
- [ ] No unnecessary new patterns
- [ ] All relevant states defined
- [ ] Loading honest
- [ ] Success honest
- [ ] Errors actionable
- [ ] Dead ends eliminated
- [ ] Gates reflect validation
- [ ] Validation consistent
- [ ] Persistence verified
- [ ] Volatile dependencies handled
- [ ] Async operations safe
- [ ] Duplicate actions prevented
- [ ] Network failure handled
- [ ] Permissions handled
- [ ] Destructive actions safe
- [ ] Content consistent
- [ ] Locale handled
- [ ] Long content handled
- [ ] Mobile verified
- [ ] Responsive behaviour verified
- [ ] Keyboard verified
- [ ] Focus verified
- [ ] Screen reader semantics verified
- [ ] Contrast verified
- [ ] Targets verified
- [ ] Drag alternatives verified
- [ ] Motion reviewed
- [ ] Visual hierarchy verified
- [ ] No fake affordances
- [ ] No ghost state
- [ ] Visual QA completed
- [ ] Lint passed
- [ ] Typecheck passed
- [ ] Build passed
- [ ] Tests passed
- [ ] Re-audit completed

## 73. ANTI-HALLUCINATION

Nunca afirmar "o componente existe", "a API suporta", "o backend valida", "o ficheiro está persistido", "a operação foi concluída", "a feature já funciona" sem verificar. Quando não souber: `UNKNOWN — NEEDS VERIFICATION`.

## 74. DECISION LOG

Para decisões relevantes, registar brevemente: Decision, Reason, Constraint, Alternative rejected, Risk. Isto evita que o agent volte a desfazer uma decisão correcta noutra etapa.

## 75. UX LAWS — USAR COMO LENTES, NÃO COMO DOGMAS

Podem ser consideradas: Hick's Law, Fitts's Law, Jakob's Law, Doherty Threshold, Peak-End Rule, Von Restorff Effect, Tesler's Law, Zeigarnik Effect, Nielsen's Heuristics, Gestalt principles.

**REGRA:** Nunca aplicar uma "lei de UX" mecanicamente. Perguntar: esta lei é realmente relevante neste contexto? Uma heurística deve ajudar a raciocinar, não substituir julgamento.

## 76. PADRÕES DE REFERÊNCIA

- **Nielsen Norman Group:** usabilidade, consistência, prevenção de erros, recuperação, interação.
- **W3C WCAG 2.2:** acessibilidade normativa.
- **Vercel Web Interface Guidelines:** interação web moderna, keyboard, focus, semantics, responsive behaviour e detalhes de UI.
- **Design System do próprio produto:** sempre tem prioridade sobre inventar outro sistema visual.

## 77. PRINCÍPIO FINAL

O agent não deve pensar "Como escrevo este componente?". Deve pensar:

> Qual é a intenção humana, qual é o estado real do sistema, qual é a menor interface capaz de resolver o problema, como impedimos erros, como comunicamos cada estado e como provamos que a experiência funciona em condições normais e adversas?

Uma interface de elite deve ser: clara, previsível, consistente, acessível, resiliente, honesta, responsiva, eficiente, recuperável e nativa do produto.

Não optimizar para impressionar o developer. Optimizar para reduzir esforço, erro e incerteza para o utilizador.

## Output

**DESIGN_AND_IMPLEMENT:** 1. User Goal 2. Existing Patterns 3. UX Model 4. Interaction Decisions 5. States 6. Accessibility 7. Responsive Behaviour 8. Architecture 9. Implementation 10. Verification 11. Remaining Risks

**AUDIT_AND_FIX:** 1. Executive Summary 2. Critical Issues 3. Major Issues 4. Moderate Issues 5. Minor Issues 6. Fixes Applied 7. Verification 8. Remaining Risks

**AUDIT_ONLY:** 1. Executive Summary 2. Findings 3. Severity 4. Evidence 5. Recommendations 6. Verification Plan

Nunca incluir no output final informação sobre a meta-skill quando o utilizador pediu apenas a auditoria da feature.
