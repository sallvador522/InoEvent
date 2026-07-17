import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# Fix 1: Remove !isPremium from PremiumLoader
old_loader_brand = """        {!isPremium && <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <span className="text-xs text-slate-400">Criado com</span>
          <span className="text-xs font-semibold bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent tracking-wider">
            InoEvents
          </span>
        </div>}"""
new_loader_brand = """        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <span className="text-xs text-slate-400">Criado com</span>
          <span className="text-xs font-semibold bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent tracking-wider">
            InoEvents
          </span>
        </div>"""
content = content.replace(old_loader_brand, new_loader_brand)

# Fix 2: Define isPremium inside all layouts
layouts = ["ClassicLayout", "ModernLayout", "LuxuryLayout", "LimintsoGoldLayout", "LimintsoMeLayout", "GardenLayout", "RusticLayout", "IndustrialLayout", "BridalShowerLayout", "BabyShowerLayout"]

for layout in layouts:
    pattern = r'(const ' + layout + r': React\.FC<\{.*?\}> = \(\{.*?\}\) => \{)'
    replacement = r'\1\n  const isPremium = event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate");'
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)
