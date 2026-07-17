import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# 1. Update layout interfaces
layouts = ["ClassicLayout", "ModernLayout", "LuxuryLayout", "LimintsoGoldLayout", "LimintsoMeLayout", "GardenLayout", "RusticLayout", "IndustrialLayout", "BridalShowerLayout", "BabyShowerLayout"]

for layout in layouts:
    pattern = r'onRSVP: \(\) => void;'
    replacement = r'onRSVP: () => void;\n  onCheckStatus?: () => void;'
    content = re.sub(pattern, replacement, content, count=1) # only in the interface

# 2. Add button in ClassicLayout (just one layout for testing, but I should probably add it in the layouts)
# For Classic:
classic_btn = r'<button\s*onClick=\{onRSVP\}\s*className="bg-\[\#dcb349\] hover:bg-\[\#b49232\] text-white font-serif font-bold tracking-widest uppercase py-4 px-12 rounded-full transition-colors shadow-xl text-sm w-full sm:w-auto">\s*\{getRSVPText\(event\.type\)\}\s*</button>'
classic_replacement = r'<button onClick={onRSVP} className="bg-[#dcb349] hover:bg-[#b49232] text-white font-serif font-bold tracking-widest uppercase py-4 px-12 rounded-full transition-colors shadow-xl text-sm w-full sm:w-auto">{getRSVPText(event.type)}</button>\n          {onCheckStatus && <button onClick={onCheckStatus} className="text-[#b49232] border border-[#b49232] hover:bg-[#b49232]/10 font-serif font-bold tracking-widest uppercase py-4 px-12 rounded-full transition-colors text-sm w-full sm:w-auto ml-0 sm:ml-4 mt-4 sm:mt-0">Meu Convite</button>}'
content = re.sub(classic_btn, classic_replacement, content)

# 3. Add to the props destructuring
for layout in layouts:
    pattern = r'onRSVP,'
    replacement = r'onRSVP, onCheckStatus,'
    content = re.sub(pattern, replacement, content, count=1)

# 4. Pass it from the main component
pattern = r'onRSVP: \(\) => setRSVPOpen\(true\),'
replacement = r'onRSVP: () => setRSVPOpen(true),\n    onCheckStatus: () => setCheckStatusOpen(true),'
content = re.sub(pattern, replacement, content)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)
