const fs = require('fs');

let file = 'components/Navbar.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  '<img src="/android-chrome-192x192.png" width="36" height="36" alt="InoEvents" className="w-8 h-8 md:w-9 md:h-9 rounded-xl object-contain border border-white/10 bg-white/5 p-1 shadow-md group-hover:scale-105 transition-all duration-300" referrerPolicy="no-referrer" loading="eager" />',
  '<span className="material-symbols-outlined text-brand-gold text-2xl md:text-3xl drop-shadow-md group-hover:rotate-12 transition-transform duration-300">auto_awesome</span>'
);

content = content.replace(
  '<img src="/android-chrome-192x192.png" width="32" height="32" alt="InoEvents Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" loading="lazy" />',
  '<span className="material-symbols-outlined text-brand-blue text-2xl drop-shadow-md">auto_awesome</span>'
);

fs.writeFileSync(file, content);
