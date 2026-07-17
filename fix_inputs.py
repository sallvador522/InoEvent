import re

with open('features/dashboard/Dashboard.tsx', 'r') as f:
    content = f.read()

replacement = """
                                    <div className="flex flex-col gap-1.5 mt-2">
                                        <label className="text-xs text-slate-500 font-medium">Título da Mensagem de Bloqueio (Opcional)</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ex: Convite Indisponível"
                                            value={event?.blockedTitle || ''}
                                            onChange={(e) => setEvent({...event, blockedTitle: e.target.value})}
                                            onBlur={async (e) => {
                                                try {
                                                    await updateDoc(doc(db, 'events', event.id), { blockedTitle: e.target.value });
                                                } catch(err) {
                                                    toast.error("Erro ao salvar o título.");
                                                }
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-blue"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5 mt-2">
                                        <label className="text-xs text-slate-500 font-medium">Mensagem de Bloqueio (Opcional)</label>
                                        <textarea 
                                            placeholder="Ex: Este convite expirou..."
                                            value={event?.blockedMessage || ''}
                                            rows={2}
                                            onChange={(e) => setEvent({...event, blockedMessage: e.target.value})}
                                            onBlur={async (e) => {
                                                try {
                                                    await updateDoc(doc(db, 'events', event.id), { blockedMessage: e.target.value });
                                                } catch(err) {
                                                    toast.error("Erro ao salvar a mensagem.");
                                                }
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-blue resize-none"
                                        />
                                    </div>
"""

# Let's replace the whole block we just added
import re
target = re.compile(r'<div className="flex flex-col gap-1\.5 mt-2">\s*<label className="text-xs text-slate-500 font-medium">Título da Mensagem de Bloqueio \(Opcional\)</label>.*?</textarea>\s*</div>', re.DOTALL)

content = re.sub(target, replacement.strip(), content)

with open('features/dashboard/Dashboard.tsx', 'w') as f:
    f.write(content)
