import re

with open('features/invitation/EventCreator.tsx', 'r') as f:
    content = f.read()
content = content.replace('setLayoutMode("ESSENTIAL" as any);', 'setLayoutMode("CLASSIC" as any);')
with open('features/invitation/EventCreator.tsx', 'w') as f:
    f.write(content)

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# Fix layoutMode
content = content.replace('setEvent(staticEv as any);', 'setEvent((staticEv as any) as any);')
content = content.replace('setEvent(draft as any);', 'setEvent((draft as any) as any);')

# Fix showSkipButton on Joyride
content = content.replace('showSkipButton={true}', '')

# Fix GiftItem missing type
gift_item_match = re.compile(r'\{\s*title:\s*"Presente",\s*description:\s*newVal,\s*value:\s*"",\s*\}')
content = gift_item_match.sub('{ type: "IBAN", title: "Presente", description: newVal, value: "" }', content)

gift_item_match2 = re.compile(r'\{\s*title:\s*"Banco",\s*value:\s*newVal,\s*description:\s*"",\s*\}')
content = gift_item_match2.sub('{ type: "IBAN", title: "Banco", value: newVal, description: "" }', content)

gift_item_match3 = re.compile(r'\{\s*title:\s*newVal,\s*value:\s*"",\s*description:\s*"",\s*\}')
content = gift_item_match3.sub('{ type: "IBAN", title: newVal, value: "", description: "" }', content)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)

print("Fixed")
