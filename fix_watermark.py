import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# Replace watermark in footers
content = content.replace('<p>© 2025 {event.title} • Criado com InoEvents</p>', '{!isPremium ? <p>© 2025 {event.title} • Criado com InoEvents</p> : <p>© 2025 {event.title}</p>}')

# Replace watermark in the editor brand foot credit
old_brand = """        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <span className="text-xs text-slate-400">Criado com</span>
          <span className="text-xs font-semibold bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent tracking-wider">
            InoEvents
          </span>
        </div>"""
new_brand = """        {!isPremium && <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <span className="text-xs text-slate-400">Criado com</span>
          <span className="text-xs font-semibold bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent tracking-wider">
            InoEvents
          </span>
        </div>}"""
content = content.replace(old_brand, new_brand)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)
