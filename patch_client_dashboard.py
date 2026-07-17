import re

with open('features/dashboard/ClientDashboard.tsx', 'r') as f:
    content = f.read()

# Add missing recharts imports
if 'LineChart' not in content:
    content = content.replace("import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';", "import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';")

# Let's find a place to put the accesses widget.
# Currently the grid is:
# <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
# Let's change grid-cols-3 to grid-cols-4 ? Or maybe grid-cols-1 lg:grid-cols-4 ? Or maybe add it as a new row?

# Let's see the widget area
grid_start = '<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">'
grid_end = '                {/* Filters & Search */}'

import sys

if grid_start not in content:
    print("Grid start not found")
    sys.exit()

# We can append it at the end of the grid if it's grid-cols-3, but changing to grid-cols-1 md:grid-cols-2 xl:grid-cols-4 is better.
content = content.replace(grid_start, '<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">')

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
                                        data={Object.entries(event.dailyAccesses || {}).map(([date, count]) => ({
                                            date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                                            acessos: count
                                        }))}
                                    >
                                        <XAxis dataKey="date" hide />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ color: '#64748b', fontSize: '12px' }}
                                            itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}
                                        />
                                        <Line type="monotone" dataKey="acessos" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
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

# Find where to insert
widget_end_target = "Recus. ({declinedCount})</span>\n                        </div>\n                    </div>"
if widget_end_target in content:
    content = content.replace(widget_end_target, widget_end_target + chart_widget)
    with open('features/dashboard/ClientDashboard.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Widget end target not found")

