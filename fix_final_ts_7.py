import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

content = content.replace('title: "Lista de Presentes",\n                          description: newVal,\n                          value: "",', 'type: "IBAN",\n                          title: "Lista de Presentes",\n                          description: newVal,\n                          value: "",')

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)
