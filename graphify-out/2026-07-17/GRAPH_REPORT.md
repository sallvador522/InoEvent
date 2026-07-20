# Graph Report - .  (2026-07-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 602 nodes · 809 edges · 130 communities (61 shown, 69 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- FirebaseProvider.tsx
- InvitationView.tsx
- App.tsx
- server.ts
- devDependencies
- manifest.json
- compilerOptions
- InlineEdit.tsx
- types.ts
- ClientDashboard.tsx
- package.json
- dependencies
- QRScanner.tsx
- remove_whatsapp.cjs
- GalleryLightbox.tsx
- FAQSection.tsx
- usePlanVerification.ts
- test_db.js
- test_fetch.js
- add_galleries.cjs
- add_table_tab.cjs
- react
- fix.cjs
- fix2.cjs
- fix_dashboard_whatsapp.cjs
- fix_invitation.cjs
- fix_landing_images.cjs
- fix_props.cjs
- fix_table_manager.cjs
- fix_tabs_visibility.cjs
- fix_tabs_visibility_2.cjs
- fix_tabs_visibility_3.cjs
- fix_tabs_visibility_4.cjs
- fix_team_manager.cjs
- fix_team_manager_2.cjs
- patch.cjs
- patch2.cjs
- patch_check_status.cjs
- patch_checkin_token.cjs
- patch_cleanup.cjs
- patch_client_dashboard.cjs
- patch_cors.cjs
- patch_fallback.cjs
- patch_features.cjs
- patch_get_event.cjs
- patch_invitation.cjs
- patch_logging.cjs
- patch_logging2.cjs
- patch_logging3.cjs
- patch_rules.cjs
- patch_rules_guest.cjs
- patch_team_rules.cjs
- test_fetch2.js
- test-og.cjs
- test_rest.js
- test_rest2.js
- update_checkin.cjs
- crypto
- dotenv
- express
- express-rate-limit
- firebase
- firebase-admin
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
- test_env.js
- test_prod_server.js
- test_regex.js
- update_checkin_full.cjs
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `useFirebase()` - 31 edges
2. `db` - 24 edges
3. `copyToClipboard()` - 23 edges
4. `handleFirestoreError()` - 19 edges
5. `EVENTS` - 17 edges
6. `compilerOptions` - 16 edges
7. `Navbar()` - 13 edges
8. `getImageUrl()` - 13 edges
9. `OperationType` - 11 edges
10. `getRSVPText()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `EventCreator()` --calls--> `useFirebase()`  [EXTRACTED]
  features/invitation/EventCreator.tsx → components/FirebaseProvider.tsx
- `CreateBusiness()` --calls--> `useFirebase()`  [EXTRACTED]
  features/business/CreateBusiness.tsx → components/FirebaseProvider.tsx
- `InvitationView()` --calls--> `useFirebase()`  [EXTRACTED]
  features/invitation/InvitationView.tsx → components/FirebaseProvider.tsx
- `AboutPage()` --calls--> `useFirebase()`  [EXTRACTED]
  features/landing/AboutPage.tsx → components/FirebaseProvider.tsx
- `Navbar()` --references--> `react`  [EXTRACTED]
  components/Navbar.tsx → package.json

## Import Cycles
- None detected.

## Communities (130 total, 69 thin omitted)

### Community 0 - "FirebaseProvider.tsx"
Cohesion: 0.06
Nodes (48): app, auth, db, FirebaseContext, FirebaseContextType, FirebaseProvider(), FirestoreErrorInfo, getCachedProfile() (+40 more)

### Community 1 - "InvitationView.tsx"
Cohesion: 0.08
Nodes (39): TocaPlayer(), TocaPlayerProps, BottomSheet(), BottomSheetProps, Guestbook(), BabyShowerLayout(), BridalShowerLayout(), ClassicLayout() (+31 more)

### Community 2 - "App.tsx"
Cohesion: 0.07
Nodes (26): AboutPage, AdminDashboard, AuthPage, BusinessDashboard, CheckinScanner, ClientDashboard, CreateBusiness, Dashboard (+18 more)

### Community 3 - "server.ts"
Cohesion: 0.07
Nodes (17): ErrorBoundary, Props, State, CATEGORY_COLORS, COLORS, LogCategory, logger, LogLevel (+9 more)

### Community 4 - "devDependencies"
Cohesion: 0.06
Nodes (31): esbuild, eslint, @eslint/js, eslint-plugin-react-hooks, firebase-tools, devDependencies, esbuild, eslint (+23 more)

### Community 5 - "manifest.json"
Cohesion: 0.09
Nodes (21): background_color, categories, description, dir, display, display_override, icons, id (+13 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, node, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+12 more)

### Community 7 - "InlineEdit.tsx"
Cohesion: 0.15
Nodes (13): DateTimePickerModal(), DateTimePickerModalProps, monthsPtFull, parseToDateInputVal(), parseToTimeInputVal(), weekdaysPt, formatDisplayDateForTemplate(), formatDisplayTime() (+5 more)

### Community 8 - "types.ts"
Cohesion: 0.14
Nodes (14): Table, TableManager(), CheckStatusModal(), CheckStatusModalProps, EventCreator(), GiftItem, TimelineItem, DressCode (+6 more)

### Community 9 - "ClientDashboard.tsx"
Cohesion: 0.16
Nodes (6): ExecutiveReportModal(), ExecutiveReportModalProps, GuestDetailsModal(), Guest, GuestsProgressBar(), GuestsProgressBarProps

### Community 10 - "package.json"
Cohesion: 0.14
Nodes (13): name, overrides, @opentelemetry/core, uuid, private, scripts, build, dev (+5 more)

### Community 11 - "dependencies"
Cohesion: 0.22
Nodes (9): cors, framer-motion, html-to-image, lucide-react, dependencies, cors, framer-motion, html-to-image (+1 more)

### Community 12 - "QRScanner.tsx"
Cohesion: 0.40
Nodes (4): QRScanner(), QRScannerProps, html5-qrcode, html5-qrcode

### Community 13 - "remove_whatsapp.cjs"
Cohesion: 0.40
Nodes (4): fs, lp, pp, seo

### Community 15 - "FAQSection.tsx"
Cohesion: 0.67
Nodes (3): FAQ_ITEMS, FAQItem, FAQSection()

### Community 21 - "react"
Cohesion: 0.67
Nodes (3): PremiumLoader(), react, react

## Knowledge Gaps
- **260 isolated node(s):** `LandingPage`, `TemplateGalleryPage`, `TermsPage`, `PrivacyPage`, `AboutPage` (+255 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`, `QRScanner.tsx`, `react`, `crypto`, `dotenv`, `express`, `express-rate-limit`, `firebase`, `firebase-admin`, `@google/genai`, `helmet`, `html2canvas`, `leaflet`, `motion`, `qrcode.react`, `react-dom`, `react-helmet-async`, `react-hot-toast`, `react-is`, `react-joyride`, `react-leaflet`, `react-router-dom`, `recharts`, `@vis.gl/react-google-maps`, `@yudiel/react-qr-scanner`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `FirebaseProvider.tsx`, `dependencies`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `Navbar()` connect `FirebaseProvider.tsx` to `InvitationView.tsx`, `react`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **What connects `LandingPage`, `TemplateGalleryPage`, `TermsPage` to the rest of the system?**
  _260 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `FirebaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06406112253893623 - nodes in this community are weakly interconnected._
- **Should `InvitationView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07542087542087542 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06507936507936508 - nodes in this community are weakly interconnected._