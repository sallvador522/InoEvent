/**
 * SEO Routes — Dynamic Open Graph meta tag injection for crawlers.
 * 
 * Routes:
 *   GET /plans      — Inject pricing SEO tags for plans page
 *   GET /invite/:id — Inject dynamic OG tags per invitation
 * 
 * IMPORTANT: In development, these routes bypass SEO injection and call next()
 * to let Vite handle the HTML. This prevents the white-screen bug documented
 * in AGENTS.md (Vite HMR requires its own HTML transformation pipeline).
 */
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { getEventDetails } from '../lib/firebase-admin.js';
import { logger } from '../../lib/logger.js';

const router = Router();

// --- Plans Page SEO ---
router.get('/plans', async (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  try {
    let html = "";
    const possiblePaths = [
      path.join(process.cwd(), 'dist/index.html'),
      path.join(process.cwd(), 'index.html')
    ];
    let foundPath = possiblePaths.find(p => fs.existsSync(p));
    
    if (foundPath) {
      html = await fs.promises.readFile(foundPath, 'utf8');
    } else {
      return next();
    }
    
    const plansTitle = "Planos e Preços de Convites Digitais Premium | InoEvents";
    const plansDesc = "Conheça os preços do InoEvents. Essencial 7.500 Kz, Premium 15.000 Kz, VIP 25.000 Kz e Business 39.900 Kz/mês. Concierge +10.000 Kz. RSVP, QR, check-in e gestão de convidados em Angola.";
    
    html = html.replace(/<title>[^<]*<\/title>/g, `<title>${plansTitle}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/g, `<meta name="description" content="${plansDesc}" />`);
    
    // Inject hidden text block for AI crawlers (like GPTBot, Perplexity) — §14 fonte central config/plans.ts
    const hiddenAIText = `
      <div style="display:none;" id="ai-pricing-context">
        <h1>Preços e Planos do InoEvents Angola</h1>
        <h2>Plano Essencial</h2>
        <p>Preço: 7.500 Kz (Pagamento único por evento). Validade 90 dias. Até 100 convidados. Inclui: RSVP, Código QR Exclusivo, Galeria Básica, Localização, Countdown.</p>
        <h2>Plano Premium</h2>
        <p>Preço: 15.000 Kz (Pagamento único por evento). Validade 180 dias. Até 300 convidados. Inclui: tudo do Essencial + convidados individualizados, galeria premium, música, livro de assinaturas, mapa das mesas, temas premium, remoção da marca, analytics básicos.</p>
        <h2>Plano VIP</h2>
        <p>Preço: 25.000 Kz (Pagamento único por evento). Validade 365 dias. Até 700 convidados. Inclui: tudo do Premium + QR individual, check-in, gestão +1, mesas avançadas, lembretes, analytics avançados, personalização avançada, suporte prioritário, domínio personalizado.</p>
        <h2>Concierge (Add-on)</h2>
        <p>Preço: +10.000 Kz por evento. A equipa InoEvent configura o evento por si.</p>
        <h2>Plano Business (B2B)</h2>
        <p>Preço: 39.900 Kz por mês (subscrição). Eventos ilimitados para agências e cerimonialistas, white-label, painel de gestão, check-in, equipa.</p>
      </div>
    `;
    
    html = html.replace('<div id="root"></div>', `${hiddenAIText}\n    <div id="root"></div>`);
    
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    logger.error('Erro na rota SEO de planos (/plans):', { category: 'SEO', data: err });
    return next();
  }
});

// --- Invitation SEO ---
router.get('/invite/:id', async (req, res, next) => {
  // In development, skip SEO injection and let Vite handle the HTML to prevent white screens
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const id = req.params.id as string;

  // Basic security and length check for ID
  if (!id || id.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return next();
  }

  try {
    // Fetch event from Firestore
    const eventData = await getEventDetails(id);

    // Read index.html
    let html = "";
    const possiblePaths = [
      path.join(process.cwd(), 'dist/index.html'),
      path.join(process.cwd(), 'index.html')
    ];
    let foundPath = possiblePaths.find(p => fs.existsSync(p));
    
    if (foundPath) {
      html = await fs.promises.readFile(foundPath, 'utf8');
    } else {
      try {
        const isLocal = req.headers.host && req.headers.host.includes('localhost');
        const protocol = req.headers['x-forwarded-proto'] || (isLocal ? 'http' : 'https');
        const host = req.headers.host || 'www.inoevent.online';
        const fetchRes = await fetch(`${protocol}://${host}/`);
        if (fetchRes.ok) {
           html = await fetchRes.text();
        } else {
           return next();
        }
      } catch(e) {
         logger.error('Falha no fallback de busca HTML na rota SEO do convite:', { category: 'SEO', data: e });
         return next();
      }
    }
    
    if (eventData) {
      const eventTitle = eventData.title || 'Convite Especial';
      
      // Determine elegant localized invitation message
      let eventDesc = 'Você está a ser convidado para este grande evento. Confirme sua presença e confira todos os detalhes!';
      if (eventData.type === 'BRIDAL_SHOWER') {
        const bride = eventData.brideName || eventData.title;
        eventDesc = `Você está a ser convidado para o Chá de Panela de ${bride}. Confirme sua presença e confira todos os detalhes!`;
      } else if (eventData.type === 'BABY_SHOWER') {
        eventDesc = `Você está a ser convidado para o Chá de Bebê de ${eventData.title}. Confirme sua presença e confira todos os detalhes!`;
      } else if (eventData.type === 'WEDDING') {
        const couple = (eventData.brideName && eventData.groomName) ? `${eventData.brideName} & ${eventData.groomName}` : eventData.title;
        eventDesc = `Você está a ser convidado para o Casamento de ${couple}. Confirme sua presença e confira todos os detalhes!`;
      } else {
        eventDesc = `Você está a ser convidado para o evento "${eventData.title}". Confirme sua presença e confira todos os detalhes!`;
      }
      
      // Determine the image to display
      let eventImage = 'https://www.inoevent.online/inoOG.jpg';
      
      const eventUrl = `https://www.inoevent.online/invite/${id}`;
      
      // Replace titles and descriptions in index.html to ensure crawlers get unique tags
      html = html.replace(/<title>[^<]*<\/title>/g, `<title>${eventTitle} | InoEvents</title>`);
      html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/g, `<meta name="description" content="${eventDesc.replace(/"/g, '&quot;')}" />`);
      
      // Replace Open Graph / Facebook tags
      html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/g, `<meta property="og:title" content="${eventTitle.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?>/g, `<meta property="og:description" content="${eventDesc.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?>/g, `<meta property="og:image" content="${eventImage}" />`);
      html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/?>/g, `<meta property="og:url" content="${eventUrl}" />`);
      
      // Replace Twitter tags
      html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/g, `<meta name="twitter:title" content="${eventTitle.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/g, `<meta name="twitter:description" content="${eventDesc.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/?>/g, `<meta name="twitter:image" content="${eventImage}" />`);
    }
    
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err: any) {
    logger.error('Erro na rota serveInvitationWithSEO:', { category: 'SEO', data: err });
    return next();
  }
});

export default router;
