const fs = require('fs');
const file = 'features/landing/LandingPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update imports
content = content.replace(
  "import { X, Copy, MessageSquare, QrCode, LayoutDashboard, Gift, Globe, UtensilsCrossed, BookOpen, BarChart3, Bot, ArrowRight, Star, Award, Image as ImageIcon, CheckCircle2, Gem, Sparkles, PartyPopper } from 'lucide-react';",
  "import { X, Copy, MessageSquare, QrCode, LayoutDashboard, Gift, Globe, UtensilsCrossed, BookOpen, BarChart3, Bot, ArrowRight, Star, Award, Image as ImageIcon, CheckCircle2, Gem, Sparkles, PartyPopper, Utensils, Cake, Baby, Briefcase } from 'lucide-react';"
);

// Replace the array
content = content.replace(
  /{ id: 'wedding', label: 'Casamento', desc: 'União de almas, RSVP detalhado, lista de presentes e IBAN.', icon: 'diamond', color: 'from-amber-500\/10 to-amber-600\/10 text-amber-600' }/g,
  "{ id: 'wedding', label: 'Casamento', desc: 'União de almas, RSVP detalhado, lista de presentes e IBAN.', icon: <Gem size={24} />, color: 'from-amber-500/10 to-amber-600/10 text-amber-600' }"
);
content = content.replace(
  /{ id: 'bridal', label: 'Chá de Panela', desc: 'Chá de cozinha, presentes práticos e brincadeiras animadas.', icon: 'kitchen', color: 'from-pink-500\/10 to-rose-600\/10 text-pink-600' }/g,
  "{ id: 'bridal', label: 'Chá de Panela', desc: 'Chá de cozinha, presentes práticos e brincadeiras animadas.', icon: <Utensils size={24} />, color: 'from-pink-500/10 to-rose-600/10 text-pink-600' }"
);
content = content.replace(
  /{ id: 'birthday', label: 'Aniversário', desc: 'Comemoração, contagem regressiva e confirmação de presença rápida.', icon: 'cake', color: 'from-purple-500\/10 to-indigo-600\/10 text-purple-600' }/g,
  "{ id: 'birthday', label: 'Aniversário', desc: 'Comemoração, contagem regressiva e confirmação de presença rápida.', icon: <Cake size={24} />, color: 'from-purple-500/10 to-indigo-600/10 text-purple-600' }"
);
content = content.replace(
  /{ id: 'baby', label: 'Chá de Bebê', desc: 'Boas-vindas calorosas ao novo membro especial da família.', icon: 'child_care', color: 'from-cyan-500\/10 to-blue-600\/10 text-cyan-600' }/g,
  "{ id: 'baby', label: 'Chá de Bebê', desc: 'Boas-vindas calorosas ao novo membro especial da família.', icon: <Baby size={24} />, color: 'from-cyan-500/10 to-blue-600/10 text-cyan-600' }"
);
content = content.replace(
  /{ id: 'corporate', label: 'Evento Corporativo', desc: 'Palestras, conferências, lançamentos e credenciamento ágil.', icon: 'business_center', color: 'from-slate-700\/10 to-slate-950\/10 text-slate-800' }/g,
  "{ id: 'corporate', label: 'Evento Corporativo', desc: 'Palestras, conferências, lançamentos e credenciamento ágil.', icon: <Briefcase size={24} />, color: 'from-slate-700/10 to-slate-950/10 text-slate-800' }"
);

// Replace the span
content = content.replace(
  /<span className="material-symbols-outlined text-\[24px\]">\{item\.icon\}<\/span>/g,
  "{item.icon}"
);

fs.writeFileSync(file, content);
console.log('LandingPage TypeModal patched!');
