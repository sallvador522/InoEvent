const fs = require('fs');
const file = 'features/invitation/InvitationView.tsx';
let content = fs.readFileSync(file, 'utf8');

// The messed up lines look like: <div className="flex justify-between items-center mb-1"><div className="flex justify-between items-center mb-1"><div className="flex justify-between items-center mb-1"><span className="">Link do Mapa (URL)</span>...
content = content.replace(/<div className="flex justify-between items-center mb-1"><div className="flex justify-between items-center mb-1"><div className="flex justify-between items-center mb-1"><span className="">Link do Mapa \(URL\)<\/span>.*?Procurar no Maps<\/a><\/div>/g, 
  '<div className="flex justify-between items-center mb-1"><span className="text-xs text-slate-500">Link do Mapa (URL)</span><button type="button" onClick={(e) => { e.preventDefault(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address || event.locationName || \'Local\')}`, \'_blank\'); }} className="text-[10px] bg-slate-100 text-blue-600 px-2 py-0.5 rounded shadow-sm hover:bg-white transition-colors flex items-center gap-1 font-sans border border-slate-200"><span className="material-symbols-outlined text-[12px]">search</span> Pesquisar no Maps</button></div>'
);

fs.writeFileSync(file, content);
console.log('Fixed broken links!');
