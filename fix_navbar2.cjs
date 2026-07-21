const fs = require('fs');

let file = 'components/Navbar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<img src="/inoOG.jpg" alt="InoEvents" className="w-8 h-8 md:w-9 md:h-9 rounded-xl object-cover shadow-md group-hover:scale-105 transition-all duration-300" referrerPolicy="no-referrer" />',
  '<img src="/logo-192.png" alt="InoEvents" className="w-8 h-8 md:w-9 md:h-9 object-contain group-hover:scale-105 transition-all duration-300" referrerPolicy="no-referrer" />'
);

content = content.replace(
  '<img src="/inoOG.jpg" alt="InoEvents Logo" className="w-8 h-8 rounded-xl object-cover shadow-sm" referrerPolicy="no-referrer" />',
  '<img src="/logo-192.png" alt="InoEvents Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />'
);

fs.writeFileSync(file, content);
