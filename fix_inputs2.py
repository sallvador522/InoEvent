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

start_str = '<div className="flex flex-col gap-1.5 mt-2">\n                                        <label className="text-xs text-slate-500 font-medium">Título da Mensagem de Bloqueio (Opcional)</label>'
end_str = '</textarea>\n                                    </div>'

start_idx = content.find(start_str)
if start_idx != -1:
    end_idx = content.find(end_str, start_idx)
    if end_idx != -1:
        content = content[:start_idx] + replacement.strip() + content[end_idx + len(end_str):]
        with open('features/dashboard/Dashboard.tsx', 'w') as f:
            f.write(content)
        print("Success")
    else:
        print("End not found")
else:
    print("Start not found")

