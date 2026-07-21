const fs = require('fs');
const file = 'features/landing/LandingPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update imports
content = content.replace(
  "import { X, Copy, MessageSquare } from 'lucide-react';",
  "import { X, Copy, MessageSquare, QrCode, LayoutDashboard, Gift, Globe, UtensilsCrossed, BookOpen, BarChart3, Bot, ArrowRight } from 'lucide-react';"
);

// 2. Update FeatureCard component
content = content.replace(
  "const FeatureCard: React.FC<{ icon: string, title: string, desc: string }> = ({ icon, title, desc }) => (",
  "const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => ("
);
content = content.replace(
  /<span className="material-symbols-outlined text-\[32px\]">\{icon\}<\/span>/,
  "{icon}"
);

// 3. Update FeatureCard usages
content = content.replace(/icon="qr_code_scanner"/g, 'icon={<QrCode size={32} strokeWidth={1.5} />}');
content = content.replace(/icon="dashboard"/g, 'icon={<LayoutDashboard size={32} strokeWidth={1.5} />}');
content = content.replace(/icon="redeem"/g, 'icon={<Gift size={32} strokeWidth={1.5} />}');
content = content.replace(/icon="language"/g, 'icon={<Globe size={32} strokeWidth={1.5} />}');
content = content.replace(/icon="table_restaurant"/g, 'icon={<UtensilsCrossed size={32} strokeWidth={1.5} />}');
content = content.replace(/icon="menu_book"/g, 'icon={<BookOpen size={32} strokeWidth={1.5} />}');
content = content.replace(/icon="bar_chart"/g, 'icon={<BarChart3 size={32} strokeWidth={1.5} />}');
content = content.replace(/icon="smart_toy"/g, 'icon={<Bot size={32} strokeWidth={1.5} />}');

// 4. Update the images in the hero section
// <img src={EVENTS[0]?.heroImage || "/bridal-templates/templateCha1.png"} ... />
// We'll replace `{EVENTS[X]?.heroImage || ... }` with the hardcoded string
content = content.replace(/src=\{EVENTS\[0\]\?\.heroImage \|\| "\/bridal-templates\/templateCha1\.png"\}/g, 'src="/bridal-templates/templateCha1.png"');
content = content.replace(/src=\{EVENTS\[1\]\?\.heroImage \|\| "\/bridal-templates\/templateCha3\.png"\}/g, 'src="/bridal-templates/templateCha3.png"');
content = content.replace(/src=\{EVENTS\[2\]\?\.heroImage \|\| "\/bridal-templates\/templateCha1\.png"\}/g, 'src="/bridal-templates/templateCha1.png"');
content = content.replace(/src=\{EVENTS\[3\]\?\.heroImage \|\| "\/bridal-templates\/templateCha2\.png"\}/g, 'src="/bridal-templates/templateCha2.png"');
content = content.replace(/src=\{EVENTS\[4\]\?\.heroImage \|\| "\/bridal-templates\/templateCha4\.png"\}/g, 'src="/bridal-templates/templateCha4.png"');
content = content.replace(/src=\{EVENTS\[5\]\?\.heroImage \|\| "\/bridal-templates\/templateCha2\.png"\}/g, 'src="/bridal-templates/templateCha2.png"');

// And for the main phone preview:
// <img src={EVENTS[3]?.heroImage || "/bridal-templates/templateCha4.png"} className="w-full h-full object-cover" alt="Phone Template Preview" ... />
content = content.replace(/src=\{EVENTS\[3\]\?\.heroImage \|\| "\/bridal-templates\/templateCha4\.png"\}/g, 'src="/bridal-templates/templateCha4.png"');

fs.writeFileSync(file, content);
console.log('LandingPage patched!');
