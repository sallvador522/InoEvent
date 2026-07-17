import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# Just replace all `onClick={onRSVP}` buttons or near them
# Actually, the user asked "A questão das mesas como funciona..." 
# I will implement the button in ClassicLayout and ModernLayout for now, or just use a generic approach.

# Let's search for `{getRSVPText(event.type)}`
parts = content.split('{getRSVPText(event.type)}')
for i in range(1, len(parts)):
    # Find the closing </button> after this
    btn_close_idx = parts[i].find('</button>')
    if btn_close_idx != -1:
        insertion = '\n          {onCheckStatus && <button onClick={onCheckStatus} className="mt-4 sm:mt-0 sm:ml-4 bg-transparent border border-current opacity-70 hover:opacity-100 py-4 px-12 rounded-full font-bold uppercase tracking-widest text-sm transition-colors w-full sm:w-auto">Meu Convite</button>}'
        parts[i] = parts[i][:btn_close_idx + 9] + insertion + parts[i][btn_close_idx + 9:]

content = '{getRSVPText(event.type)}'.join(parts)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)

