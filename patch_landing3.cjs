const fs = require('fs');
const file = 'features/landing/LandingPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update imports
content = content.replace(
  "import { X, Copy, MessageSquare, QrCode, LayoutDashboard, Gift, Globe, UtensilsCrossed, BookOpen, BarChart3, Bot, ArrowRight } from 'lucide-react';",
  "import { X, Copy, MessageSquare, QrCode, LayoutDashboard, Gift, Globe, UtensilsCrossed, BookOpen, BarChart3, Bot, ArrowRight, Star, Award, Image as ImageIcon, CheckCircle2, Gem, Sparkles, PartyPopper } from 'lucide-react';"
);

// Replacements
content = content.replace(/<span className="material-symbols-outlined text-sm font-bold">star<\/span>/g, '<Star size={14} className="fill-current" />');
content = content.replace(/<span className="material-symbols-outlined text-\[15px\] sm:text-\[18px\] group-hover:translate-x-0\.5 transition-transform shrink-0">arrow_forward<\/span>/g, '<ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform shrink-0" />');
content = content.replace(/<span className="material-symbols-outlined text-\[15px\] sm:text-\[18px\] text-white shrink-0">workspace_premium<\/span>/g, '<Award size={18} className="text-white shrink-0" />');
content = content.replace(/<span className="material-symbols-outlined text-\[15px\] sm:text-\[16px\] text-\[#1B365D\]">collections<\/span>/g, '<ImageIcon size={16} className="text-[#1B365D]" />');
content = content.replace(/<span className="material-symbols-outlined">check_circle<\/span>/g, '<CheckCircle2 size={24} />');
content = content.replace(/<span className="material-symbols-outlined text-\[18px\] text-emerald-500">check_circle<\/span>/g, '<CheckCircle2 size={18} className="text-emerald-500" />');
content = content.replace(/<span className="material-symbols-outlined text-\[18px\] text-\[#DFB135\]">check_circle<\/span>/g, '<CheckCircle2 size={18} className="text-[#DFB135]" />');
content = content.replace(/<span className="material-symbols-outlined text-\[150px\] text-white">diamond<\/span>/g, '<Gem size={150} className="text-white" />');
content = content.replace(/<span className="material-symbols-outlined text-\[18px\] text-\[#DFB135\]">domain<\/span>/g, '<Globe size={18} className="text-[#DFB135]" />');
content = content.replace(/<span className="material-symbols-outlined text-brand-blue text-2xl" style=\{\{display: 'none'\}\}>auto_awesome<\/span>/g, '<Sparkles size={24} className="text-brand-blue" style={{display: "none"}} />');
content = content.replace(/<span className="material-symbols-outlined text-\[20px\]">public<\/span>/g, '<Globe size={20} />');
content = content.replace(/<span className="material-symbols-outlined text-\[20px\] block">close<\/span>/g, '<X size={20} className="block" />');
content = content.replace(/<span className="material-symbols-outlined text-\[28px\]">celebration<\/span>/g, '<PartyPopper size={28} />');
content = content.replace(/<span className="material-symbols-outlined text-\[16px\] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">arrow_forward<\/span>/g, '<ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />');

// MobileMenu uses items with `icon` strings
// We will replace those with lucide elements directly in the navItems definition later if needed, but let's see.

fs.writeFileSync(file, content);
console.log('LandingPage icons patched!');
