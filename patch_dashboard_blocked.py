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
                                            onChange={async (e) => {
                                                const val = e.target.value;
                                                try {
                                                    await updateDoc(doc(db, 'events', event.id), { blockedTitle: val });
                                                    setEvent({...event, blockedTitle: val});
                                                } catch(err) {
                                                    toast.error("Erro ao salvar o título.");
                                                }
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-blue"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-slate-500 font-medium">Mensagem de Bloqueio (Opcional)</label>
                                        <textarea 
                                            placeholder="Ex: Este convite expirou..."
                                            value={event?.blockedMessage || ''}
                                            rows={2}
                                            onChange={async (e) => {
                                                const val = e.target.value;
                                                try {
                                                    await updateDoc(doc(db, 'events', event.id), { blockedMessage: val });
                                                    setEvent({...event, blockedMessage: val});
                                                } catch(err) {
                                                    toast.error("Erro ao salvar a mensagem.");
                                                }
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-blue resize-none"
                                        />
                                    </div>
"""

# Let's target the exact string to replace
target = r'<input \s*type="datetime-local" \s*value=\{event\?\.scheduledBlockDate \|\| \'\'\}\s*onChange=\{async \(e\) => \{\s*const val = e\.target\.value;\s*try \{\s*await updateDoc\(doc\(db, \'events\', event\.id\), \{ scheduledBlockDate: val \}\);\s*toast\.success\("Data de bloqueio agendada!"\);\s*\} catch\(err\) \{\s*toast\.error\("Erro ao agendar bloqueio\."\);\s*\}\s*\}\}\s*className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-blue"\s*/>'

match = re.search(target, content)
if match:
    full_str = match.group(0) + '\n                                    </div>\n' + replacement
    content = content.replace(match.group(0) + '\n                                    </div>', full_str)
    with open('features/dashboard/Dashboard.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Failed to find target")
