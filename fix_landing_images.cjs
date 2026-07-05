const fs = require('fs');
let code = fs.readFileSync('features/landing/LandingPage.tsx', 'utf8');

code = code.replace(
  '<img src="/bridal-templates/templateCha1.png"',
  '<img src={EVENTS[0]?.heroImage || "/bridal-templates/templateCha1.png"}'
);
code = code.replace(
  '<img src="/bridal-templates/templateCha3.png"',
  '<img src={EVENTS[1]?.heroImage || "/bridal-templates/templateCha3.png"}'
);
code = code.replace(
  '<img src="/bridal-templates/templateCha1.png"',
  '<img src={EVENTS[2]?.heroImage || "/bridal-templates/templateCha1.png"}'
);
code = code.replace(
  '<img src="/bridal-templates/templateCha2.png"',
  '<img src={EVENTS[3]?.heroImage || "/bridal-templates/templateCha2.png"}'
);
code = code.replace(
  '<img src="/bridal-templates/templateCha4.png"',
  '<img src={EVENTS[4]?.heroImage || "/bridal-templates/templateCha4.png"}'
);
code = code.replace(
  '<img src="/bridal-templates/templateCha2.png"',
  '<img src={EVENTS[5]?.heroImage || "/bridal-templates/templateCha2.png"}'
);

fs.writeFileSync('features/landing/LandingPage.tsx', code);
console.log('Fixed landing page images.');
