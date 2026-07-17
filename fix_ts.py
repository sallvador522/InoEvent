import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# Fix layoutMode
content = content.replace('layoutMode: templateParam,', 'layoutMode: templateParam as any,')
content = content.replace('...staticEvent,', '...(staticEvent as any),')
content = content.replace('...baseTpl,', '...(baseTpl as any),')
content = content.replace('setEvent(draft);', 'setEvent(draft as any);')
content = content.replace('setLocalEvent(draft);', 'setLocalEvent(draft as any);')
content = content.replace('setEvent(staticEv);', 'setEvent(staticEv as any);')
content = content.replace('return customEvt as any;', 'return customEvt as any;') # if not already
content = content.replace('return customEvt.draftData || customEvt;', 'return (customEvt as any).draftData || customEvt as any;')
content = content.replace('return customEvt;', 'return customEvt as any;')

# Fix Type missing in GiftItem fallback creations
gift_fallback = """
                        list[0] = {
                          title: "Presente",
                          description: newVal,
                          value: "",
                        };
"""
fixed_gift_fallback = """
                        list[0] = {
                          type: "IBAN",
                          title: "Presente",
                          description: newVal,
                          value: "",
                        };
"""
content = content.replace(gift_fallback, fixed_gift_fallback)

# Some fallback might have different fields
gift_fallback_val = """
                        list[0] = {
                          title: "Banco",
                          value: newVal,
                          description: "",
                        };
"""
fixed_gift_fallback_val = """
                        list[0] = {
                          type: "IBAN",
                          title: "Banco",
                          value: newVal,
                          description: "",
                        };
"""
content = content.replace(gift_fallback_val, fixed_gift_fallback_val)

# One more fallback:
gift_fallback_title = """
                        list[0] = {
                          title: newVal,
                          value: "",
                          description: "",
                        };
"""
fixed_gift_fallback_title = """
                        list[0] = {
                          type: "IBAN",
                          title: newVal,
                          value: "",
                          description: "",
                        };
"""
content = content.replace(gift_fallback_title, fixed_gift_fallback_title)

# url inside typeof url === 'string' ? url : url.url
content = re.sub(r'typeof url === \'string\' \? url : url\.url', "typeof url === 'string' ? url : (url as any).url", content)
content = re.sub(r'typeof img === \'string\' \? img : img\.url', "typeof img === 'string' ? img : (img as any).url", content)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)

print("TS fixes applied")
