const fs = require('fs');

let file = 'components/Navbar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<span className="material-symbols-outlined text-brand-gold text-2xl md:text-3xl drop-shadow-md group-hover:rotate-12 transition-transform duration-300">auto_awesome</span>',
  '<img src="/inoOG.jpg" alt="InoEvents" className="w-8 h-8 md:w-9 md:h-9 rounded-xl object-cover shadow-md group-hover:scale-105 transition-all duration-300" referrerPolicy="no-referrer" />'
);

content = content.replace(
  '<span className="material-symbols-outlined text-brand-blue text-2xl drop-shadow-md">auto_awesome</span>',
  '<img src="/inoOG.jpg" alt="InoEvents Logo" className="w-8 h-8 rounded-xl object-cover shadow-sm" referrerPolicy="no-referrer" />'
);

fs.writeFileSync(file, content);
