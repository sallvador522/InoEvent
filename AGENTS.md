# InoEvents Architecture Guidelines

## RSVP Text Dynamics
The RSVP text strings (e.g., button text, modal titles) must be dynamic based on the Event Type (`event.type`).
- **WEDDING / Default:** Use "Confirmar Presença", "RSVP", "Sua Presença"
- **BRIDAL_SHOWER:** Use variations like "Confirmar Presença no Chá", "Vou no Chá!", "RSVP Chá de Panela" to make the text fit the occasion.
- Always check the `event.type` property when rendering Call-to-Action buttons for the RSVP form.

## General Design
- Follow Apple-level design (spatial UI, glassmorphism, responsive).
- Ensure animations and components match the mood of the selected layout/theme.

## Bridal Shower Form Logic
- **Conditional Fields:** When the user selects a template corresponding to a Bridal Shower (`event.type === 'BRIDAL_SHOWER'` or the layout mode starts with `BRIDAL_`), the system must strictly request only the data relevant to that occasion.
- **Hide Wedding Fields:** Specific fields such as "Nome do Noivo", "Recepção", "Dress Code", and "Timeline" are often unnecessary for a Bridal Shower and should be hidden or made explicitly optional/alternative to streamline the user experience when creating or editing an event.

## Backend / Vercel Environment (ESM)
- **NO `__dirname`:** Do not use `__dirname` or `__filename` anywhere in the server-side code (e.g. `server.ts`). The project runs in an ESM environment (Vercel Node.js Serverless), where these globals are undefined and will crash the app with `ReferenceError: __dirname is not defined`.
- **Use `process.cwd()`:** For file system paths, use `process.cwd()` to resolve paths dynamically from the project root instead.

## Vite Development Mode vs Production (SEO Routes)
- **White Screen Fix:** When intercepting routes like `/invite/:id` or `/plans` on the Express server to inject SEO tags, **you must bypass this interception in development mode** (`if (process.env.NODE_ENV !== 'production') return next();`). 
- **Why?** In development, Vite uses a middleware to inject HMR and client-side modules into `index.html`. If the Express route reads the raw `index.html` and sends it directly (via `fs.readFileSync` and `res.send`), it completely bypasses Vite's transformations, resulting in a white screen because the React scripts are never loaded.

- **Strict ESM Imports (ERR_MODULE_NOT_FOUND):** Because `package.json` specifies `"type": "module"`, any local relative imports in server-side TypeScript files (such as `server.ts` or `api/index.ts`) **must** include the `.js` extension, even if the file is physically a `.ts` file. Example: `import { logger } from './lib/logger.js';`. Failing to include `.js` will cause a 500 `FUNCTION_INVOCATION_FAILED` crash on Vercel.
