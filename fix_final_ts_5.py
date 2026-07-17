import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# Fix GiftItem where type is missing (lines 5632, etc.)
gift_item_match = re.compile(r'\{\s*title:\s*"Presente",\s*description:\s*newVal,\s*value:\s*"",\s*\}')
content = gift_item_match.sub('{ type: "IBAN", title: "Presente", description: newVal, value: "" }', content)

gift_item_match2 = re.compile(r'\{\s*title:\s*"Banco",\s*value:\s*newVal,\s*description:\s*"",\s*\}')
content = gift_item_match2.sub('{ type: "IBAN", title: "Banco", value: newVal, description: "" }', content)

gift_item_match3 = re.compile(r'\{\s*title:\s*newVal,\s*value:\s*"",\s*description:\s*"",\s*\}')
content = gift_item_match3.sub('{ type: "IBAN", title: newVal, value: "", description: "" }', content)

# I have to find the actual ones reported: 5632, 5161, 5213, 5280
# 5632: 
content = content.replace('{ title: "Presente", description: newVal, value: "" }', '{ type: "IBAN", title: "Presente", description: newVal, value: "" }')
content = content.replace('{ title: "Banco", value: newVal, description: "" }', '{ type: "IBAN", title: "Banco", value: newVal, description: "" }')
content = content.replace('{ title: newVal, value: "", description: "" }', '{ type: "IBAN", title: newVal, value: "", description: "" }')

# My previous replace: r'{ type: "IBAN", title: \1, value: \2, description: \3, }' caused some `{ type: "IBAN", title: string; }` ??
content = content.replace('{ type: "IBAN", type: "IBAN",', '{ type: "IBAN",')

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)
