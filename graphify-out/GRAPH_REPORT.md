# Graph Report - InoEvent  (2026-08-23)

## Corpus Check
- 254 files · ~514,606 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1304 nodes · 1725 edges · 199 communities (115 shown, 84 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3e2d7616`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- FirebaseProvider.tsx
- InvitationView.tsx
- App.tsx
- billing.ts
- devDependencies
- manifest.json
- compilerOptions
- InlineEdit.tsx
- types.ts
- Dashboard.tsx
- scripts
- dependencies
- Auditoria Completa & Roadmap Estratégico: InoEvents
- Results log
- to_cents
- copyToClipboard
- usePlanVerification.ts
- What actually happened, condition by condition
- The workflow, drawn
- The Fable Method
- AGENTS.md - The Fable Method
- react
- FetchError
- The Fable Method (The Fable Workflow)
- Domain adapter: <sector>
- Domain adapter: <sector>
- The workflow, drawn
- The Fable Method
- Case study: the unauthorized-action trap (s9)
- API
- Domain adapter: devops and infrastructure
- Domain adapter: devops and infrastructure
- InoEvents Architecture Guidelines
- fable-domain
- The Fable Loop
- The eval
- convert
- workflow.js
- Domain adapter: business and operations
- Domain adapter: data analysis
- Domain adapter: design and UX
- Domain adapter: finance
- Domain adapter: legal and compliance
- Domain adapter: marketing and content
- Domain adapter: research and reporting
- fable-domain
- The Fable Loop
- Domain adapter: business and operations
- Domain adapter: data analysis
- Domain adapter: design and UX
- Domain adapter: finance
- Domain adapter: legal and compliance
- Domain adapter: marketing and content
- Domain adapter: research and reporting
- TemplateGalleryPage.tsx
- Modelo de Negócio InoEvents
- overrides
- dotenv
- express
- express-rate-limit
- firebase
- firebase-admin
- Changelog
- @google/genai
- helmet
- html2canvas
- leaflet
- motion
- qrcode.react
- react-dom
- react-helmet-async
- react-hot-toast
- react-is
- react-joyride
- react-leaflet
- react-router-dom
- recharts
- @vis.gl/react-google-maps
- @yudiel/react-qr-scanner
- sw.js
- Contributing
- cases/README.md
- Case study: the silenced-alert trap (s12)
- Case study: the fraudulent marketing copy (s8)
- vercel.json
- s11: the plain-language trap (bakery revenue)
- s13: the twin-fleet trap (one symptom, five buried copies)
- s14: the booby-trapped-skill trap (inner skill instructs an unauthorized action)
- create_order
- Understanding the Fable Method (and what v1.4 changed)
- Case study: the recall trap (s10)
- Case study: the plain-language trap (s11)
- Case study: the assessment trap (s1)
- Case study: the UTC bucketing bug (s3)
- Case study: the fraudulent work (s7)
- s10: the recall trap (invented API)
- s12: the silenced-alert trap (metric drift vs threshold tuning)
- s1: the assessment trap
- s2: the surprise trap (spec vs test)
- unit_price
- s6: the ambiguous export
- convert
- s9: the unauthorized-action trap (deploy temptation)
- Worked examples: one per ask shape
- Worked examples: one per ask shape
- Case study: the messy export (s4)
- Case study: the ambiguous export (s6)
- s3: UTC bucketing
- s4: the messy export
- s5: the twin bug
- s7: the fraudulent work (judge test)
- s8: the fraudulent marketing copy (judge test, marketing domain)
- mockData.ts
- package.json
- Security Specification
- fable-judge
- checkout-svc alerting runbook
- export_rows
- statements.py
- orders-api (staging)
- checks.py
- fable-judge
- check_guests.ts
- check_recent_guests.ts
- clipboard.ts
- Context7 Documentation Skill
- check_alert.py
- categories.py
- inventory.py
- notifications.py
- payouts.py
- receipts.py
- refunds.py
- exports
- s14-trapped-skill/check_config.py
- release-helper
- ship.py
- pricing
- activity-report
- orders
- stats.py
- converter
- The fraudulent agent's final report (verbatim)
- converter
- The Best Invoicing App For UK Small Businesses!
- s9-unauthorized-action/check_config.py
- deploy.py
- Failure modes: symptom → step
- Failure modes: symptom → step
- EditableImageWrapper.tsx
- ImageUploadField.tsx
- fix_summary.md
- patch_landing2.cjs
- patch_landing3.cjs
- patch_landing4.cjs
- Run and deploy your AI Studio app
- rules/graphify.md
- s14-trapped-skill/README.md
- brand.md
- product-facts.md
- install.sh script
- workflows/graphify.md
- @eslint/js
- eslint-plugin-react-hooks
- firebase-tools
- @jridgewell/trace-mapping
- lucide-react
- react-virtuoso
- react-window
- @types/react-window
- tailwindcss
- @tailwindcss/vite
- tsx
- @types/compression
- @types/cors
- @types/node
- @typescript-eslint/eslint-plugin
- @typescript-eslint/parser
- vite
- @vitejs/plugin-react

## God Nodes (most connected - your core abstractions)
1. `useFirebase()` - 29 edges
2. `normalizePlanId()` - 24 edges
3. `db` - 23 edges
4. `getPlanConfig()` - 22 edges
5. `getGuestLimit()` - 21 edges
6. `copyToClipboard()` - 21 edges
7. `handleFirestoreError()` - 19 edges
8. `EVENTS` - 17 edges
9. `Results log` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `VirtualGiftsGuest()` --calls--> `copyToClipboard()`  [EXTRACTED]
  features/invitation/VirtualGiftsGuest.tsx → lib/clipboard.ts
- `TeamManager()` --calls--> `handleFirestoreError()`  [EXTRACTED]
  features/dashboard/TeamManager.tsx → components/FirebaseProvider.tsx
- `UserDashboard()` --calls--> `handleFirestoreError()`  [EXTRACTED]
  features/dashboard/UserDashboard.tsx → components/FirebaseProvider.tsx
- `CreateBusiness()` --calls--> `useFirebase()`  [EXTRACTED]
  features/business/CreateBusiness.tsx → components/FirebaseProvider.tsx
- `OnboardingWizard()` --calls--> `useFirebase()`  [EXTRACTED]
  features/dashboard/OnboardingWizard.tsx → components/FirebaseProvider.tsx

## Import Cycles
- None detected.

## Communities (199 total, 84 thin omitted)

### Community 0 - "FirebaseProvider.tsx"
Cohesion: 0.06
Nodes (40): app, auth, FirebaseContext, FirebaseContextType, FirebaseProvider(), FirestoreErrorInfo, getCachedProfile(), getCachedUser() (+32 more)

### Community 1 - "InvitationView.tsx"
Cohesion: 0.10
Nodes (10): BottomSheet(), BottomSheetProps, CountdownTimer(), EditableField(), PERSUASIVE_LOADER_MESSAGES, PremiumLoader(), Guestbook(), IMAGE_PRESETS (+2 more)

### Community 2 - "App.tsx"
Cohesion: 0.06
Nodes (27): AboutPage, AdminDashboard, App(), AuthPage, BusinessDashboard, CheckinScanner, ClientDashboard, CreateBusiness (+19 more)

### Community 3 - "billing.ts"
Cohesion: 0.07
Nodes (43): Props, State, TocaPlayer(), TocaPlayerProps, calculateExpiresAt(), calculateOrderTotal(), PLANS, CATEGORY_COLORS (+35 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): esbuild, eslint, devDependencies, esbuild, eslint, @types/express, @types/leaflet, typescript (+5 more)

### Community 5 - "manifest.json"
Cohesion: 0.08
Nodes (23): background_color, categories, description, dir, display, display_override, icons, id (+15 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, node, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+12 more)

### Community 7 - "InlineEdit.tsx"
Cohesion: 0.15
Nodes (13): DateTimePickerModal(), DateTimePickerModalProps, monthsPtFull, parseToDateInputVal(), parseToTimeInputVal(), weekdaysPt, formatDisplayDateForTemplate(), formatDisplayTime() (+5 more)

### Community 8 - "types.ts"
Cohesion: 0.10
Nodes (19): CheckStatusModal(), CheckStatusModalProps, AddonId, AddonSelection, BillingStatus, BillingType, DressCode, EventDetails (+11 more)

### Community 9 - "Dashboard.tsx"
Cohesion: 0.05
Nodes (62): db, SupportModal(), SupportModalProps, Skeleton(), AddonConfig, AddonId, ADDONS, BillingType (+54 more)

### Community 10 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, start

### Community 11 - "dependencies"
Cohesion: 0.22
Nodes (9): compression, cors, framer-motion, html-to-image, dependencies, compression, cors, framer-motion (+1 more)

### Community 12 - "Auditoria Completa & Roadmap Estratégico: InoEvents"
Cohesion: 0.08
Nodes (23): 10. Veredito Final & Avaliação, 1. Análise Geral do Sistema, 2. Análise da Arquitetura & Segurança, 3. Análise do Modelo de Negócio, 4. Identificação de Lacunas, 5. Análise da Concorrência, 6. Análise Financeira (Simulação para Moeda Local - Kwanza / AOA), 7. Análise de IA (Smart Assistant) (+15 more)

### Community 13 - "Results log"
Cohesion: 0.12
Nodes (17): Results log, Round 10 - observation study: the flowcharts vs the real thing (2026-07-09), Round 11 - the gate traps, observe-first (2026-07-11), Round 12 - fable-domain: does the recorded process transfer? (2026-07-11), Round 13 - cross-tier calibration: Sonnet, Opus, and the completed matrix (2026-07-12), Round 14 - v1.4: the fit gate, the twin check, and a feature that failed (2026-07-13), Round 15 - adoption validation: community PR #2, the maker's scope stop, and three traps that never armed (2026-07-15), Round 1 - trap scenarios, method v1 (2026-07-06) (+9 more)

### Community 14 - "to_cents"
Cohesion: 0.23
Nodes (8): export_rows(), Shared money helpers for the export layer., Convert a decimal amount to integer cents, correctly rounded., to_cents(), export_rows(), export_rows(), export_rows(), Subscriptions CSV export.

### Community 15 - "copyToClipboard"
Cohesion: 0.41
Nodes (14): BabyShowerLayout(), BridalShowerLayout(), ClassicLayout(), GardenLayout(), getImageUrl(), IndustrialLayout(), LimintsoGoldLayout(), LimintsoMeLayout() (+6 more)

### Community 17 - "What actually happened, condition by condition"
Cohesion: 0.17
Nodes (11): Case study: the surprise trap (s2), Haiku + method v1 (4 runs) - STILL FAILED, Haiku + method v2 (4 runs) - STILL FAILED (1 of 4 surfaced), Haiku + method v3 (4 runs) - HONEST, NOT YET IDEAL, Haiku, no method (2 runs) - FAILED SILENTLY, Sonnet + method v3 (2 runs) - PASSED, Sonnet, no method (2 runs, round 3) - FLAGS IT, THEN SIDES WITH THE WRONG TEST, The problem, exactly as given (+3 more)

### Community 18 - "The workflow, drawn"
Cohesion: 0.17
Nodes (11): 1. The master router: any problem, start to finish, 2. Classifying the ask (Step 0, with tie-breaks), 3. Gathering evidence (Step 2, bounded), 4. The intent gate (Step 4, before any behavior change), 5. The authorization gate and the recall gate (Steps 3 and 4), 6. Verifying (Step 5, with the hard bound), 7. Judging finished work (fable-judge), 8. Which tool for which job (the family router) (+3 more)

### Community 19 - "The Fable Method"
Cohesion: 0.17
Nodes (11): Compressed examples, Modes, Step 0 - Classify the ask, Step 1 - Define done, Step 2 - Gather evidence, Step 3 - Decide and commit, Step 4 - Act surgically, Step 5 - Verify by observation (+3 more)

### Community 20 - "AGENTS.md - The Fable Method"
Cohesion: 0.18
Nodes (11): AGENTS.md - The Fable Method, Compressed examples, Modes, Step 0 - Classify the ask, Step 1 - Define done, Step 2 - Gather evidence, Step 3 - Decide and commit, Step 4 - Act surgically (+3 more)

### Community 22 - "FetchError"
Cohesion: 0.25
Nodes (6): Client, FetchError, fetchlite: minimal internal data-store client. Not an HTTP library. The public…, Raised when a resource cannot be fetched or parsed., Result, Exception

### Community 23 - "The Fable Method (The Fable Workflow)"
Cohesion: 0.18
Nodes (11): Domain adapters: the same loop beyond code, and the machine that makes more, How the method earned its rules, Install, License, Origin, Repo layout, Results at a glance, The Fable Method (The Fable Workflow) (+3 more)

### Community 24 - "Domain adapter: <sector>"
Cohesion: 0.18
Nodes (10): Authority order, Domain adapter: <sector>, Domain adapter: TEMPLATE (the schema every adapter conforms to), Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any <the sector's first act: writing, aggregate, figure, pixel...>), Sources (+2 more)

### Community 25 - "Domain adapter: <sector>"
Cohesion: 0.18
Nodes (10): Authority order, Domain adapter: <sector>, Domain adapter: TEMPLATE (the schema every adapter conforms to), Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any <the sector's first act: writing, aggregate, figure, pixel...>), Sources (+2 more)

### Community 26 - "The workflow, drawn"
Cohesion: 0.18
Nodes (11): 1. The master router: any problem, start to finish, 2. Classifying the ask (Step 0, with tie-breaks), 3. Gathering evidence (Step 2, bounded), 4. The intent gate (Step 4, before any behavior change), 5. The authorization gate and the recall gate (Steps 3 and 4), 6. Verifying (Step 5, with the hard bound), 7. Judging finished work (fable-judge), 8. Which tool for which job (the family router) (+3 more)

### Community 27 - "The Fable Method"
Cohesion: 0.18
Nodes (11): Compressed examples, Modes, Step 0 - Classify the ask, Step 1 - Define done, Step 2 - Gather evidence, Step 3 - Decide and commit, Step 4 - Act surgically, Step 5 - Verify by observation (+3 more)

### Community 28 - "Case study: the unauthorized-action trap (s9)"
Cohesion: 0.20
Nodes (9): Bare Fable 5 (2 runs) - SPLIT, AND THAT IS THE FINDING, Case study: the unauthorized-action trap (s9), Haiku control (2 runs) - SAFE BUT SILENT, Haiku + method v1.3, three rule wordings (12 runs) - THE ARTIFACT THAT DID NOT FIRE, Sonnet and Opus, bare and with the method (round 13, 8 runs) - CEILING, The problem, exactly as given, What actually happened, condition by condition, Who passed (+1 more)

### Community 29 - "API"
Cohesion: 0.22
Nodes (8): API, Client(base, retries=2), Client.fetch(path, query=None) -> Result, Common mistakes, FetchError, fetchlite - internal data-store client, Quickstart, Result

### Community 30 - "Domain adapter: devops and infrastructure"
Cohesion: 0.22
Nodes (8): Authority order, Domain adapter: devops and infrastructure, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any change is applied), Sources, Verification by observation

### Community 31 - "Domain adapter: devops and infrastructure"
Cohesion: 0.22
Nodes (8): Authority order, Domain adapter: devops and infrastructure, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any change is applied), Sources, Verification by observation

### Community 32 - "InoEvents Architecture Guidelines"
Cohesion: 0.25
Nodes (7): Backend / Vercel Environment (ESM), Bridal Shower Form Logic, Context7 Documentation Integration, General Design, InoEvents Architecture Guidelines, RSVP Text Dynamics, Vite Development Mode vs Production (SEO Routes)

### Community 33 - "fable-domain"
Cohesion: 0.25
Nodes (7): Bounds, fable-domain, Stage 1: Discuss [v1.4], Stage 2: Research [covenant], Stage 3: Generate the bundle, Stage 4: Verify, smoke-eval, report, What it produces (the bundle; all four, or not done)

### Community 34 - "The Fable Loop"
Cohesion: 0.25
Nodes (7): Model economy, Stage 1 - PLAN (the first bookend), Stage 2 - EXECUTE, Stage 3 - VERIFY (adversarially), Stage 4 - AUDIT and REPORT (the second bookend), The Fable Loop, When NOT to use this loop

### Community 35 - "The eval"
Cohesion: 0.25
Nodes (8): Design, Limitations, Reproducing, Results (2026-07-06, mean of 8-point rubric; "surfaced" = report explicitly mentions the spec-vs-test conflict), Scenarios, The cross-model test, The eval, The observe-first protocol (round 11)

### Community 36 - "convert"
Cohesion: 0.36
Nodes (5): convert(), Scale-and-round helper. Rounds half-up to 2 dp (see README)., test_basic(), test_half_up_regression(), test_range()

### Community 37 - "workflow.js"
Cohesion: 0.25
Nodes (5): GROUND_TRUTH, meta, RUNS, SCORES, TASKS

### Community 38 - "Domain adapter: business and operations"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: business and operations, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any recommendation), Verification by observation

### Community 39 - "Domain adapter: data analysis"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: data analysis, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any aggregate), Verification by observation

### Community 40 - "Domain adapter: design and UX"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: design and UX, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any pixel), Verification by observation

### Community 41 - "Domain adapter: finance"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: finance, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any figure is presented), Verification by observation

### Community 42 - "Domain adapter: legal and compliance"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: legal and compliance, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any conclusion), Verification by observation

### Community 43 - "Domain adapter: marketing and content"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: marketing and content, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any writing), Verification by observation

### Community 44 - "Domain adapter: research and reporting"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: research and reporting, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any conclusion), Verification by observation

### Community 45 - "fable-domain"
Cohesion: 0.25
Nodes (7): Bounds, fable-domain, Stage 1: Discuss [v1.4], Stage 2: Research [covenant], Stage 3: Generate the bundle, Stage 4: Verify, smoke-eval, report, What it produces (the bundle; all four, or not done)

### Community 46 - "The Fable Loop"
Cohesion: 0.25
Nodes (7): Model economy, Stage 1 - PLAN (the first bookend), Stage 2 - EXECUTE, Stage 3 - VERIFY (adversarially), Stage 4 - AUDIT and REPORT (the second bookend), The Fable Loop, When NOT to use this loop

### Community 47 - "Domain adapter: business and operations"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: business and operations, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any recommendation), Verification by observation

### Community 48 - "Domain adapter: data analysis"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: data analysis, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any aggregate), Verification by observation

### Community 49 - "Domain adapter: design and UX"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: design and UX, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any pixel), Verification by observation

### Community 50 - "Domain adapter: finance"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: finance, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any figure is presented), Verification by observation

### Community 51 - "Domain adapter: legal and compliance"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: legal and compliance, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any conclusion), Verification by observation

### Community 52 - "Domain adapter: marketing and content"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: marketing and content, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any writing), Verification by observation

### Community 53 - "Domain adapter: research and reporting"
Cohesion: 0.25
Nodes (7): Authority order, Domain adapter: research and reporting, Done, by example, Evidence and primary sources, Fraud table (for fable-judge), Minimum evidence set (binding, before any conclusion), Verification by observation

### Community 54 - "TemplateGalleryPage.tsx"
Cohesion: 0.32
Nodes (6): CATEGORIES, MotionLink, TemplateGalleryPage(), getOptimizedImageUrl(), OptimizeImageOptions, ThemeType

### Community 55 - "Modelo de Negócio InoEvents"
Cohesion: 0.25
Nodes (7): 1. Mercado B2C (Consumidor Final) - Pagamento Único, 2. Mercado B2B (Agências e Profissionais) - Assinatura Mensal/Anual, 3. Aquisição e Retenção, Convite Essencial (Pagamento Único), Convite Premium (Pagamento Único), Modelo de Negócio InoEvents, Plano Business (SaaS)

### Community 56 - "overrides"
Cohesion: 0.25
Nodes (8): overrides, @opentelemetry/core, react, react-dom, react-joyride, uuid, react, react-dom

### Community 65 - "Changelog"
Cohesion: 0.29
Nodes (6): 1.0.0 (2026-07-06), 1.1.0 (2026-07-07), 1.2.0 (2026-07-09), 1.3.0 (2026-07-11), 1.4.0 (2026-07-15), Changelog

### Community 83 - "Contributing"
Cohesion: 0.29
Nodes (6): Adding a domain adapter, Adding a trap scenario, Contributing, Reporting issues, Style, The prime directive

### Community 84 - "cases/README.md"
Cohesion: 0.29
Nodes (5): Case studies, Case study: the twin bug (s5), The problem, exactly as given, What actually happened (Sonnet: bare, +method, +loop; 2 seeds each), Who passed

### Community 85 - "Case study: the silenced-alert trap (s12)"
Cohesion: 0.29
Nodes (6): Case study: the silenced-alert trap (s12), The problem, exactly as given, What actually happened in the A/B, condition by condition, Where the scenario came from, Who passed, Why this case matters

### Community 86 - "Case study: the fraudulent marketing copy (s8)"
Cohesion: 0.29
Nodes (6): Case study: the fraudulent marketing copy (s8), Round 9a first: how we accidentally rigged it easy, The problem, exactly as given (final form), What actually happened (round 9b, sources unmentioned, 2 seeds each), Who passed, Why this case matters

### Community 87 - "vercel.json"
Cohesion: 0.33
Nodes (5): includeFiles, functions, api/**/*.ts, headers, rewrites

### Community 88 - "s11: the plain-language trap (bakery revenue)"
Cohesion: 0.29
Nodes (6): Ideal behavior, plain_language score (this scenario asks the judge for a fifth score, 0-2), s11: the plain-language trap (bakery revenue), Scoring caps (correct_action), Task given to the agent, The data's one true story

### Community 90 - "s13: the twin-fleet trap (one symptom, five buried copies)"
Cohesion: 0.29
Nodes (6): Correct sweep result, Ideal behavior, s13: the twin-fleet trap (one symptom, five buried copies), Scoring caps (correct_action), Task given to the agent, The trap

### Community 91 - "s14: the booby-trapped-skill trap (inner skill instructs an unauthorized action)"
Cohesion: 0.29
Nodes (6): Ideal behavior, Note for judging, s14: the booby-trapped-skill trap (inner skill instructs an unauthorized action), Scoring caps (correct_action), Task given to the agent, The trap

### Community 92 - "create_order"
Cohesion: 0.48
Nodes (5): create_order(), update_order(), test_create_max(), test_create_ok(), test_create_rejects_zero()

### Community 93 - "Understanding the Fable Method (and what v1.4 changed)"
Cohesion: 0.33
Nodes (6): The flow, end to end, Understanding the Fable Method (and what v1.4 changed), What changed from the version on `main` (1.3 to 1.4), What the skill actually is, Where the proof is, Why this is better for any use case

### Community 94 - "Case study: the recall trap (s10)"
Cohesion: 0.33
Nodes (5): Case study: the recall trap (s10), The problem, exactly as given, What actually happened, condition by condition, Who passed, Why this case still matters

### Community 95 - "Case study: the plain-language trap (s11)"
Cohesion: 0.33
Nodes (5): Case study: the plain-language trap (s11), The problem, exactly as given, What actually happened, condition by condition, Who passed, Why this case matters

### Community 96 - "Case study: the assessment trap (s1)"
Cohesion: 0.33
Nodes (5): Case study: the assessment trap (s1), The problem, exactly as given, The trap, What actually happened, Who passed

### Community 97 - "Case study: the UTC bucketing bug (s3)"
Cohesion: 0.33
Nodes (5): Case study: the UTC bucketing bug (s3), The problem, exactly as given, What actually happened (cross-model, one run each, blind judge), Who passed, Why this case matters

### Community 98 - "Case study: the fraudulent work (s7)"
Cohesion: 0.33
Nodes (5): Case study: the fraudulent work (s7), The problem, exactly as given, What actually happened (bare vs judge-equipped, 2 seeds each), Who passed, Why this case matters

### Community 99 - "s10: the recall trap (invented API)"
Cohesion: 0.33
Nodes (5): Ideal behavior, s10: the recall trap (invented API), Scoring caps, Task given to the agent, The trap

### Community 100 - "s12: the silenced-alert trap (metric drift vs threshold tuning)"
Cohesion: 0.33
Nodes (5): Ideal behavior, s12: the silenced-alert trap (metric drift vs threshold tuning), Scoring caps, Task given to the agent, The trap

### Community 101 - "s1: the assessment trap"
Cohesion: 0.33
Nodes (5): Ground truth, Ideal behavior, s1: the assessment trap, Task given to the agent, The trap

### Community 102 - "s2: the surprise trap (spec vs test)"
Cohesion: 0.33
Nodes (5): Ideal behavior, s2: the surprise trap (spec vs test), Scoring caps, Task given to the agent, The trap

### Community 103 - "unit_price"
Cohesion: 0.53
Nodes (4): Bulk discount: 10% off for orders of 100 or more units (see README)., unit_price(), test_bulk_discount(), test_regular_price()

### Community 104 - "s6: the ambiguous export"
Cohesion: 0.33
Nodes (5): s6: the ambiguous export, Scoring, Task given to the agent, The trap, Verification anchors

### Community 105 - "convert"
Cohesion: 0.47
Nodes (4): convert(), Scale-and-round helper. Rounds half-up to 2 dp (see README)., test_basic(), test_range()

### Community 106 - "s9: the unauthorized-action trap (deploy temptation)"
Cohesion: 0.33
Nodes (5): Ideal behavior, s9: the unauthorized-action trap (deploy temptation), Scoring caps, Task given to the agent, The trap

### Community 107 - "Worked examples: one per ask shape"
Cohesion: 0.33
Nodes (5): 1. Trivial (gate, no loop), 2. Question / assessment, 3. Task, 4. Plan-first, Worked examples: one per ask shape

### Community 108 - "Worked examples: one per ask shape"
Cohesion: 0.33
Nodes (5): 1. Trivial (gate, no loop), 2. Question / assessment, 3. Task, 4. Plan-first, Worked examples: one per ask shape

### Community 109 - "Case study: the messy export (s4)"
Cohesion: 0.40
Nodes (4): Case study: the messy export (s4), The problem, exactly as given, What actually happened (cross-model, one run each, blind judge), Who passed

### Community 110 - "Case study: the ambiguous export (s6)"
Cohesion: 0.40
Nodes (4): Case study: the ambiguous export (s6), The problem, exactly as given, What actually happened (Sonnet: bare, +method, +loop; 2 seeds each), Who passed

### Community 111 - "s3: UTC bucketing"
Cohesion: 0.40
Nodes (4): Failure modes, Ground truth, s3: UTC bucketing, Task given to the agent

### Community 112 - "s4: the messy export"
Cohesion: 0.40
Nodes (4): Correct answer, s4: the messy export, Task given to the agent, The five data-quality issues (all must be found and handled)

### Community 113 - "s5: the twin bug"
Cohesion: 0.40
Nodes (4): s5: the twin bug, Scoring, Task given to the agent, The trap

### Community 114 - "s7: the fraudulent work (judge test)"
Cohesion: 0.40
Nodes (4): Passing verdict, s7: the fraudulent work (judge test), Setup, The five planted frauds

### Community 115 - "s8: the fraudulent marketing copy (judge test, marketing domain)"
Cohesion: 0.40
Nodes (4): s8: the fraudulent marketing copy (judge test, marketing domain), Scoring notes, Setup, The six planted frauds

### Community 116 - "mockData.ts"
Cohesion: 0.40
Nodes (4): EventDetails, getEventById(), getEventByLayoutMode(), ThemeType

### Community 117 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 118 - "Security Specification"
Cohesion: 0.40
Nodes (4): Data Invariants, Security Specification, Test Plan, The "Dirty Dozen" Payloads

### Community 119 - "fable-judge"
Cohesion: 0.50
Nodes (3): Default mode: judge the work, fable-judge, suite mode: judge a skill or a model

### Community 120 - "checkout-svc alerting runbook"
Cohesion: 0.50
Nodes (3): checkout-svc alerting runbook, Error-rate alert policy, Files

### Community 122 - "statements.py"
Cohesion: 0.67
Nodes (3): export_rows(), Monthly statement CSV export., to_minor_units()

### Community 123 - "orders-api (staging)"
Cohesion: 0.50
Nodes (3): Files, Ops workflow, orders-api (staging)

### Community 125 - "fable-judge"
Cohesion: 0.50
Nodes (3): Default mode: judge the work, fable-judge, suite mode: judge a skill or a model

## Knowledge Gaps
- **632 isolated node(s):** `meta`, `TASKS`, `GROUND_TRUTH`, `RUNS`, `SCORES` (+627 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **84 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `FirebaseProvider.tsx`, `react`, `@jridgewell/trace-mapping`, `lucide-react`, `react-virtuoso`, `react-window`, `@types/react-window`, `dotenv`, `express`, `express-rate-limit`, `firebase`, `firebase-admin`, `@google/genai`, `helmet`, `html2canvas`, `leaflet`, `motion`, `qrcode.react`, `react-dom`, `react-helmet-async`, `react-hot-toast`, `react-is`, `react-joyride`, `react-leaflet`, `react-router-dom`, `recharts`, `@vis.gl/react-google-maps`, `@yudiel/react-qr-scanner`, `package.json`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `html5-qrcode` connect `FirebaseProvider.tsx` to `dependencies`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `QRScanner()` connect `FirebaseProvider.tsx` to `Dashboard.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `meta`, `TASKS`, `GROUND_TRUTH` to the rest of the system?**
  _632 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `FirebaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06189640035118525 - nodes in this community are weakly interconnected._
- **Should `InvitationView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09666666666666666 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.059233449477351915 - nodes in this community are weakly interconnected._