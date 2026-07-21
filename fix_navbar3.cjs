const fs = require('fs');

let file = 'components/Navbar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<img src="/logo-192.png" alt="InoEvents" className="w-8 h-8 md:w-9 md:h-9 object-contain group-hover:scale-105 transition-all duration-300" referrerPolicy="no-referrer" />',
  '<img src="/logo-192.png" alt="InoEvents" className="w-10 h-10 md:w-11 md:h-11 object-contain group-hover:scale-105 transition-all duration-300" referrerPolicy="no-referrer" />'
);

content = content.replace(
  '<img src="/logo-192.png" alt="InoEvents Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />',
  '<img src="/logo-192.png" alt="InoEvents Logo" className="w-9 h-9 object-contain" referrerPolicy="no-referrer" />'
);

fs.writeFileSync(file, content);
