const fs = require('fs');

let dashboard = fs.readFileSync('features/dashboard/Dashboard.tsx', 'utf8');

// Replace subheading
dashboard = dashboard.replace(
  '<p className="text-slate-500 text-sm">Gerencie o seu domínio personalizado e envie convites automáticos por WhatsApp.</p>',
  '<p className="text-slate-500 text-sm">Gerencie o seu domínio personalizado para ter um link exclusivo.</p>'
);

// Remove WhatsApp block
const regex = /\{\/\* WhatsApp Feature \*\/\}[\s\S]*?<\/div>\n\n                            \{\/\* Custom Domain Feature \*\/\}/m;
dashboard = dashboard.replace(regex, '{/* Custom Domain Feature */}');

fs.writeFileSync('features/dashboard/Dashboard.tsx', dashboard);
console.log("Removed WhatsApp from dashboard");
