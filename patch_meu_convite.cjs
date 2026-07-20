const fs = require('fs');
let code = fs.readFileSync('features/invitation/InvitationView.tsx', 'utf8');

code = code.replaceAll(
    'className="mt-4 sm:mt-0 sm:ml-4 bg-transparent border border-current opacity-70 hover:opacity-100 py-4 px-12 rounded-full font-bold uppercase tracking-widest text-sm transition-colors w-full sm:w-auto"',
    'className="mt-4 sm:mt-0 sm:ml-4 bg-white text-slate-900 border border-slate-200 shadow-lg hover:bg-slate-50 py-4 px-12 rounded-full font-bold uppercase tracking-widest text-sm transition-all w-full sm:w-auto"'
);

fs.writeFileSync('features/invitation/InvitationView.tsx', code);
console.log('Patched Meu Convite button');
