import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

content = content.replace("event.isTemplate", "(event as any).isTemplate")
content = content.replace("callback={handleJoyrideCallback}", "")
content = content.replace("const handleJoyrideCallback = (data: any) => {", "const handleJoyrideCallback = (data: any) => { //")

gift_item_match = re.compile(r'\{\s*title:\s*item\.title,\s*value:\s*item\.value,\s*description:\s*item\.description,\s*\}')
content = gift_item_match.sub('{ type: "IBAN", title: item.title, value: item.value, description: item.description }', content)

# I have to find the remaining gift item fallbacks manually maybe with regex
gift_item_match2 = re.compile(r'\{\s*title:\s*(.*?),\s*value:\s*(.*?),\s*description:\s*(.*?),\s*\}', re.DOTALL)
content = gift_item_match2.sub(r'{ type: "IBAN", title: \1, value: \2, description: \3, }', content)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)

print("Fixed")
