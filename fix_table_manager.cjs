const fs = require('fs');
let content = fs.readFileSync('features/dashboard/TableManager.tsx', 'utf8');

content = content.replace(
    'return (\n        <div>',
    'return (\n        <div className="w-full min-w-0 overflow-hidden">'
);

content = content.replace(
    '<div className="flex flex-col xl:flex-row gap-6">',
    '<div className="flex flex-col xl:flex-row gap-6 w-full min-w-0">'
);

content = content.replace(
    '<div className="w-full xl:w-1/3 flex flex-col gap-4 shrink-0">',
    '<div className="w-full xl:w-1/3 flex flex-col gap-4 shrink-0 min-w-0">'
);

content = content.replace(
    '<div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col h-[600px]">',
    '<div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col min-h-[400px] max-h-[600px] overflow-hidden">'
);

content = content.replace(
    '<p className="text-sm font-medium text-slate-700 truncate">{guest.name}</p>',
    '<p className="text-sm font-medium text-slate-700 truncate w-full">{guest.name}</p>'
);

// Check if Tables empty state also needs min-w-0
content = content.replace(
    '<div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">',
    '<div className="col-span-full py-12 px-6 text-center border-2 border-dashed border-slate-200 rounded-3xl min-w-0 overflow-hidden">'
);

fs.writeFileSync('features/dashboard/TableManager.tsx', content);
console.log("Replaced");
