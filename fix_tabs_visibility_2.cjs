const fs = require('fs');

let dashboard = fs.readFileSync('features/dashboard/Dashboard.tsx', 'utf8');

// The tables button
const tablesRegex = /                    <button \n                        onClick=\{\(\) => setActiveTab\('tables'\)\}\n                        className=\{\`flex-1 md:flex-none justify-center px-4 md:px-6 py-2\.5 rounded-xl lg:rounded-full font-bold text-sm transition-all flex items-center gap-2 \$\{activeTab === 'tables' \? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'\}\`\}\n                    >\n                        <span className="material-symbols-outlined text-\[18px\]">table_restaurant<\/span> Mapa das Mesas\n                    <\/button>/;

const guardedTables = `                    {(event?.plan === 'Business' || event?.plan === 'Corporate' || event?.plan === 'Premium') && (
                        <button 
                            onClick={() => setActiveTab('tables')}
                            className={\`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 rounded-xl lg:rounded-full font-bold text-sm transition-all flex items-center gap-2 \${activeTab === 'tables' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'}\`}
                        >
                            <span className="material-symbols-outlined text-[18px]">table_restaurant</span> Mapa das Mesas
                        </button>
                    )}`;

dashboard = dashboard.replace(tablesRegex, guardedTables);


// The messages button
const messagesRegex = /                    <button \n                        onClick=\{\(\) => setActiveTab\('messages'\)\}\n                        className=\{\`flex-1 md:flex-none justify-center px-4 md:px-6 py-2\.5 rounded-xl lg:rounded-full font-bold text-sm transition-all flex items-center gap-2 \$\{activeTab === 'messages' \? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'\}\`\}\n                    >\n                        <MessageSquare size=\{16\} className=\{activeTab === 'messages' \? 'text-brand-blue' : 'text-slate-400'\} \/> Livro de Assinaturas\n                    <\/button>/;

const guardedMessages = `                    {(event?.plan === 'Business' || event?.plan === 'Corporate' || event?.plan === 'Premium') && (
                        <button 
                            onClick={() => setActiveTab('messages')}
                            className={\`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 rounded-xl lg:rounded-full font-bold text-sm transition-all flex items-center gap-2 \${activeTab === 'messages' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'}\`}
                        >
                            <MessageSquare size={16} className={activeTab === 'messages' ? 'text-brand-blue' : 'text-slate-400'} /> Livro de Assinaturas
                        </button>
                    )}`;

dashboard = dashboard.replace(messagesRegex, guardedMessages);

fs.writeFileSync('features/dashboard/Dashboard.tsx', dashboard);
console.log("Updated Tabs visibility 2");
