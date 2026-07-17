import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

replacement = """
          <h2 className="text-2xl font-bold mb-4">{activeEvent.blockedTitle || "Convite Indisponível"}</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            {activeEvent.blockedMessage || "Este convite encontra-se temporariamente bloqueado ou expirou. Por favor, contacte os anfitriões para mais informações."}
          </p>
"""

content = re.sub(
    r'<h2 className="text-2xl font-bold mb-4">Convite Indisponível</h2>\s*<p className="text-slate-500 mb-8 leading-relaxed">\s*Este convite encontra-se temporariamente bloqueado ou expirou\. Por favor, contacte os anfitriões para mais informações\.\s*</p>',
    replacement.strip(),
    content
)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)
