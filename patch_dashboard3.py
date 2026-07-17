import re

with open('features/dashboard/Dashboard.tsx', 'r') as f:
    content = f.read()

old_title = """
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Painel do Evento</span>
                        <h1 className="text-lg font-serif font-bold text-brand-blue leading-tight truncate max-w-[200px] md:max-w-md">{event.title}</h1>
                    </div>
"""
new_title = """
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Painel do Evento</span>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-serif font-bold text-brand-blue leading-tight truncate max-w-[200px] md:max-w-md">{event.title}</h1>
                            {event.isPublished === false ? (
                                <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-amber-200">Rascunho</span>
                            ) : (
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-emerald-200">Publicado</span>
                            )}
                        </div>
                    </div>
"""
content = content.replace(old_title, new_title)

with open('features/dashboard/Dashboard.tsx', 'w') as f:
    f.write(content)
print("Applied Python patches")
