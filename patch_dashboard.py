import re

with open('features/dashboard/Dashboard.tsx', 'r') as f:
    content = f.read()

chart_widget = """
                                {/* Access Tracking Area Chart */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-2">Visitas & Acessos</h4>
                                        <p className="text-xs text-slate-400 mb-6 font-medium">Quantidade de acessos à página do convite por dia.</p>
                                    </div>
                                    <div className="h-64 relative">
                                        {event?.dailyAccesses && Object.keys(event.dailyAccesses).length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={Object.entries(event.dailyAccesses || {})
                                                    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                                                    .map(([date, count]) => ({
                                                        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                                                        visitas: count
                                                    }))
                                                }>
                                                    <defs>
                                                        <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Area type="monotone" dataKey="visitas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVisitas)" strokeWidth={3} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl p-4 text-center">
                                                <span>Ainda não há dados de acessos para exibir.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
"""

# Find where to insert it. The last chart in that grid seems to be "Guest Type Bar Chart" maybe? Let's find </AreaChart> and the next div block. Let's see what is after AreaChart.
import sys
# Just insert it at the end of the <div className="grid md:grid-cols-2 gap-6"> block.

