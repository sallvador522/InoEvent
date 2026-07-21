const fs = require('fs');
const path = require('path');

// 1. Patch LandingPage.tsx
const landingPath = path.join(process.cwd(), 'features', 'landing', 'LandingPage.tsx');
if (fs.existsSync(landingPath)) {
  let code = fs.readFileSync(landingPath, 'utf8');

  // Update imports to include all needed lucide icons
  code = code.replace(
    /import \{ X, Copy, MessageSquare, Star, ArrowRight, Crown, Image, CheckCircle2, Music, Sparkles \} from 'lucide-react';/,
    "import { X, Copy, MessageSquare, Star, ArrowRight, Crown, Image, CheckCircle2, Music, Sparkles, Heart, Gift, Baby, Briefcase } from 'lucide-react';"
  );

  // Replace stars rating block
  code = code.replace(
    /<span className="material-symbols-outlined text-sm font-bold">star<\/span>[\s\S]*?<span className="material-symbols-outlined text-sm font-bold">star<\/span>[\s\S]*?<span className="material-symbols-outlined text-sm font-bold">star<\/span>[\s\S]*?<span className="material-symbols-outlined text-sm font-bold">star<\/span>[\s\S]*?<span className="material-symbols-outlined text-sm font-bold">star<\/span>/g,
    `<Star className="w-3.5 h-3.5 fill-current" />
                     <Star className="w-3.5 h-3.5 fill-current" />
                     <Star className="w-3.5 h-3.5 fill-current" />
                     <Star className="w-3.5 h-3.5 fill-current" />
                     <Star className="w-3.5 h-3.5 fill-current" />`
  );

  // Replace arrow_forward group
  code = code.replace(
    /<span className="material-symbols-outlined text-\[15px\] sm:text-\[18px\] group-hover:translate-x-0\.5 transition-transform shrink-0">arrow_forward<\/span>/g,
    "<ArrowRight className=\"w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0\" />"
  );

  // Replace workspace_premium
  code = code.replace(
    /<span className="material-symbols-outlined text-\[15px\] sm:text-\[18px\] text-white shrink-0">workspace_premium<\/span>/g,
    "<Crown className=\"w-4 h-4 text-white shrink-0\" />"
  );

  // Replace collections
  code = code.replace(
    /<span className="material-symbols-outlined text-\[15px\] sm:text-\[16px\] text-\[#1B365D\]">collections<\/span>/g,
    "<Image className=\"w-4 h-4 text-[#1B365D]\" />"
  );

  // Replace check_circle generic
  code = code.replace(
    /<span className="material-symbols-outlined">check_circle<\/span>/g,
    "<CheckCircle2 className=\"w-5 h-5 text-emerald-500 shrink-0\" />"
  );

  // Replace check_circle text-[18px] text-emerald-500
  code = code.replace(
    /<span className="material-symbols-outlined text-\[18px\] text-emerald-500">check_circle<\/span>/g,
    "<CheckCircle2 className=\"w-4.5 h-4.5 text-emerald-500 shrink-0\" />"
  );

  // Replace check_circle text-[18px] text-[#DFB135]
  code = code.replace(
    /<span className="material-symbols-outlined text-\[18px\] text-\[#DFB135\]">check_circle<\/span>/g,
    "<CheckCircle2 className=\"w-4.5 h-4.5 text-amber-500 shrink-0\" />"
  );

  // Replace diamond
  code = code.replace(
    /<span className="material-symbols-outlined text-\[150px\] text-white">diamond<\/span>/g,
    "<Sparkles className=\"w-24 h-24 text-white\/20 absolute -right-6 -bottom-6\" />"
  );

  // Replace domain
  code = code.replace(
    /<span className="material-symbols-outlined text-\[18px\] text-\[#DFB135\]">domain<\/span>/g,
    "<Crown className=\"w-4 h-4 text-[#DFB135] shrink-0\" />"
  );

  // Replace public
  code = code.replace(
    /<span className="material-symbols-outlined text-\[20px\]">public<\/span>/g,
    "<Sparkles className=\"w-5 h-5 text-amber-400\" />"
  );

  // Replace close block
  code = code.replace(
    /<span className="material-symbols-outlined text-\[20px\] block">close<\/span>/g,
    "<X className=\"w-5 h-5 text-slate-500\" />"
  );

  // Replace celebration
  code = code.replace(
    /<span className="material-symbols-outlined text-\[28px\]">celebration<\/span>/g,
    "<Sparkles className=\"w-8 h-8 text-[#DFB135]\" />"
  );

  // Replace arrow_forward under categories label
  code = code.replace(
    /<span className="material-symbols-outlined text-\[16px\] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">arrow_forward<\/span>/g,
    "<ArrowRight className=\"w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all\" />"
  );

  // Replace dynamic category icon
  code = code.replace(
    /<span className="material-symbols-outlined text-\[24px\]">\{item\.icon\}<\/span>/g,
    `{item.id === 'wedding' && <Heart className="w-5 h-5" />}
                      {item.id === 'bridal' && <Gift className="w-5 h-5" />}
                      {item.id === 'birthday' && <Sparkles className="w-5 h-5" />}
                      {item.id === 'baby' && <Baby className="w-5 h-5" />}
                      {item.id === 'corporate' && <Briefcase className="w-5 h-5" />}`
  );

  fs.writeFileSync(landingPath, code);
  console.log('Successfully patched LandingPage.tsx icons!');
} else {
  console.error('LandingPage.tsx not found!');
}

// 2. Patch mockData.ts to replace unreliable in.limintso.com URLs with reliable unsplash equivalents
const mockDataPath = path.join(process.cwd(), 'mockData.ts');
if (fs.existsSync(mockDataPath)) {
  let mockData = fs.readFileSync(mockDataPath, 'utf8');

  mockData = mockData.replace(
    /https:\/\/in\.limintso\.com\/wp-content\/uploads\/2025\/08\/cav33\.jpg/g,
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop"
  );

  mockData = mockData.replace(
    /https:\/\/in\.limintso\.com\/wp-content\/uploads\/2025\/08\/marrr11\.jpg/g,
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop"
  );

  mockData = mockData.replace(
    /https:\/\/in\.limintso\.com\/wp-content\/uploads\/2025\/08\/mar\.jpg/g,
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop"
  );

  mockData = mockData.replace(
    /https:\/\/in\.limintso\.com\/wp-content\/uploads\/2025\/08\/mar23\.jpg/g,
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop"
  );

  mockData = mockData.replace(
    /https:\/\/in\.limintso\.com\/wp-content\/uploads\/2025\/08\/marb2222\.jpg/g,
    "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=1200&auto=format&fit=crop"
  );

  fs.writeFileSync(mockDataPath, mockData);
  console.log('Successfully patched mockData.ts images!');
} else {
  console.error('mockData.ts not found!');
}
