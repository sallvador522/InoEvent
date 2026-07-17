import re

with open('features/dashboard/OnboardingWizard.tsx', 'r') as f:
    content = f.read()
content = content.replace("=== 'BABY_SHOWER'", "=== 'BABY_SHOWER'")
# Wait, let's fix the Joyride styles first
with open('features/invitation/InvitationView.tsx', 'r') as f:
    content2 = f.read()

content2 = content2.replace('styles={{', 'styles={{\n            options: {\n              primaryColor: "#3B82F6",\n              textColor: "#334155",\n              zIndex: 10000,\n            },\n')
# Wait I already have options there. Let's just use `as any`.
content2 = re.sub(r'styles={{([^}]*)}}', r'styles={{\1} as any}', content2)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content2)

