import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

layouts = ["ClassicLayout", "ModernLayout", "LuxuryLayout", "LimintsoGoldLayout", "LimintsoMeLayout", "GardenLayout", "RusticLayout", "IndustrialLayout", "BridalShowerLayout", "BabyShowerLayout"]

for layout in layouts:
    pattern = r'(const ' + layout + r': React\.FC<\{.*?\}> = \(\{.*?\}\) => \{)'
    replacement = r'\1\n  const isPremium = event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate");'
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Since the parameters are multi-line, DOTALL should catch them, but wait, `\{.*?\}` matches everything up to the first `}`, which works for the generic typing `<{...}>`, but then `= \(\{.*?\}\) => \{` matches the props destructuring. Let's see if it works.

# Let's just find `}) => {` after the component name.
for layout in layouts:
    # find the component declaration
    idx = content.find(f"const {layout}: React.FC")
    if idx != -1:
        # find the next `}) => {`
        end_idx = content.find("}) => {", idx)
        if end_idx != -1:
            insertion = '\n  const isPremium = event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate");'
            content = content[:end_idx + 7] + insertion + content[end_idx + 7:]

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)

