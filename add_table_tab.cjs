const fs = require('fs');

let dashboard = fs.readFileSync('features/dashboard/Dashboard.tsx', 'utf8');

// 1. Update the type for activeTab
dashboard = dashboard.replace(
  "    const [activeTab, setActiveTab] = useState<'guests' | 'analytics' | 'assistant' | 'gifts' | 'messages' | 'team' | 'premium'>('guests');",
  "    const [activeTab, setActiveTab] = useState<'guests' | 'analytics' | 'assistant' | 'gifts' | 'messages' | 'team' | 'premium' | 'tables'>('guests');"
);

// 2. Add the Tab Button for 'tables'
const tablesTabBtn = `
                    <button 
                        onClick={() => setActiveTab('tables')}
                        className={\`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 rounded-xl lg:rounded-full font-bold text-sm transition-all flex items-center gap-2 \${activeTab === 'tables' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'}\`}
                    >
                        <span className="material-symbols-outlined text-[18px]">table_restaurant</span> Mesas
                    </button>
                    {(event?.plan === 'Business' || event?.plan === 'Corporate' || event?.plan === 'Premium') && (
`;

dashboard = dashboard.replace(
  "                    {(event?.plan === 'Business' || event?.plan === 'Corporate' || event?.plan === 'Premium') && (",
  tablesTabBtn
);

// 3. Import TableManager
if (!dashboard.includes("import { TableManager }")) {
    dashboard = dashboard.replace(
        "import { GuestbookManager } from './GuestbookManager';",
        "import { GuestbookManager } from './GuestbookManager';\nimport { TableManager } from './TableManager';"
    );
}

// 4. Add the tables tab content
const tablesTabContent = `
                    {activeTab === 'tables' && (
                        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
                            <TableManager event={event} guests={guests} />
                        </div>
                    )}
`;

dashboard = dashboard.replace(
  "                    {activeTab === 'gifts' && (",
  tablesTabContent + "\n                    {activeTab === 'gifts' && ("
);

// 5. Remove the placeholder from the premium tab
const placeholderRegex = /\{\/\* Seating Arrangement Feature \*\/\}[\s\S]*?<\/div>\n                            <\/div>/;
dashboard = dashboard.replace(placeholderRegex, "");

fs.writeFileSync('features/dashboard/Dashboard.tsx', dashboard);
console.log("Added tables tab to Dashboard");
