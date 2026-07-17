import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

content = content.replace("event?.isTemplate", "(event as any)?.isTemplate")

content = content.replace("type: \"IBAN\", title: item.title, value: item.value, description: item.description", "title: item.title, value: item.value, description: item.description")
# Let me just restore the file completely and fix ONLY what's needed. Wait, git checkout? No.
