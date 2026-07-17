with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

layouts = ["ClassicLayout", "ModernLayout", "LuxuryLayout", "LimintsoGoldLayout", "LimintsoMeLayout", "GardenLayout", "RusticLayout", "IndustrialLayout", "BridalShowerLayout", "BabyShowerLayout"]

for layout in layouts:
    idx = content.find(f"const {layout}: React.FC")
    if idx != -1:
        # find the exact arrow function start
        end_idx = content.find(") => {", idx)
        if end_idx != -1:
            insertion = '\n  const isPremium = event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate");'
            content = content[:end_idx + 6] + insertion + content[end_idx + 6:]

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)
