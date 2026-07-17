import re

with open('features/dashboard/ClientDashboard.tsx', 'r') as f:
    content = f.read()

# Add missing recharts imports
if 'LineChart' not in content:
    content = content.replace("import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';", "import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';")

grid_start = '<div className="grid md:grid-cols-3 gap-6 mb-8">'
content = content.replace(grid_start, '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">')

chart_widget = """
                    {/* Access Chart Widget */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Acessos & Visitas</span>
                            <h4 className="font-bold text-slate-800 text-sm">Visualizações ao longo dos dias</h4>
                        </div>
                        <div className="h-28 relative flex items-center justify-center my-2 w-full">
                            {event?.dailyAccesses && Object.keys(event.dailyAccesses).length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={Object.entries(event.dailyAccesses || {})
                                            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                                            .map(([date, count]) => ({
                                            date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                                            acessos: count
                                        }))}
                                    >
                                        <XAxis dataKey="date" hide />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                                            itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}
                                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                                        />
                                        <Line type="monotone" dataKey="acessos" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <span className="text-xs text-slate-400 font-bold">Ainda sem visitas</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 w-full px-2">
                            <span>Total de Acessos:</span>
                            <span className="text-blue-600 text-sm">{event?.accessCount || 0}</span>
                        </div>
                    </div>
"""

widget_end_target = "Recus. ({declinedCount})</span>\n                        </div>\n                    </div>"
if widget_end_target in content:
    content = content.replace(widget_end_target, widget_end_target + chart_widget)
    with open('features/dashboard/ClientDashboard.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Widget end target not found")

