import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

content = content.replace("event?.isTemplate", "(event as any)?.isTemplate")

content = content.replace('{ title: "Lista de Presentes",', '{ type: "IBAN", title: "Lista de Presentes",')

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)
