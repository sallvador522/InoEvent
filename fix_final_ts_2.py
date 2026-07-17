import re

with open('features/invitation/EventCreator.tsx', 'r') as f:
    content = f.read()

content = content.replace("'ESSENTIAL'", "'CLASSIC' as any")
content = content.replace("{ id: 'CLASSIC' as any,", "{ id: 'CLASSIC',")

with open('features/invitation/EventCreator.tsx', 'w') as f:
    f.write(content)

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# Fix layoutMode
content = content.replace("setLocalEvent(draft as any);", "setLocalEvent(draft as unknown as EventDetails);")
content = content.replace("setLocalEvent(staticEv);", "setLocalEvent(staticEv as unknown as EventDetails);")
content = content.replace("setLocalEvent((staticEv as any) as any);", "setLocalEvent(staticEv as unknown as EventDetails);")
content = content.replace("setLocalEvent((draft as any) as any);", "setLocalEvent(draft as unknown as EventDetails);")
content = content.replace("setEvent((staticEv as any) as any);", "setEvent(staticEv as unknown as EventDetails);")
content = content.replace("setEvent((draft as any) as any);", "setEvent(draft as unknown as EventDetails);")
content = content.replace("setEvent(staticEvent as any);", "setEvent(staticEvent as unknown as EventDetails);")
content = content.replace("setEvent(staticEv);", "setEvent(staticEv as unknown as EventDetails);")

# Fix Joyride properties
content = content.replace("showProgress={true}", "")

# Fix GiftItem fallback
gift_item_match = re.compile(r'\{\s*title:\s*item\.title,\s*value:\s*item\.value,\s*description:\s*item\.description,\s*\}')
content = gift_item_match.sub('{ type: "IBAN", title: item.title, value: item.value, description: item.description }', content)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)

print("Fixed")
