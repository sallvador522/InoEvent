const fs = require('fs');

let lp = fs.readFileSync('features/landing/LandingPage.tsx', 'utf8');

// Remove WhatsApp feature card
lp = lp.replace(
  '            <FeatureCard \n              icon="send_to_mobile" \n              title="Envio via WhatsApp"\n              desc="Dispare os convites e lembretes diretamente pelo WhatsApp dos seus convidados de forma automática."\n            />\n',
  ''
);

fs.writeFileSync('features/landing/LandingPage.tsx', lp);

let pp = fs.readFileSync('features/plans/PlansPage.tsx', 'utf8');
// Remove from Premium plan
pp = pp.replace(
  '      "Envio Automático via WhatsApp",\n',
  ''
);
fs.writeFileSync('features/plans/PlansPage.tsx', pp);

let seo = fs.readFileSync('components/SEO.tsx', 'utf8');
seo = seo.replace(
  'envio automático convites WhatsApp Angola, ',
  ''
);
fs.writeFileSync('components/SEO.tsx', seo);

console.log("Removed WhatsApp mentions");
