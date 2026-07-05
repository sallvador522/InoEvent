const fs = require('fs');
let code = fs.readFileSync('mockData.ts', 'utf8');

if (code.indexOf('id: "wedding-essential"') !== -1 && code.indexOf('gallery:', code.indexOf('id: "wedding-essential"')) > code.indexOf('id: "wedding-ethereal"')) {
  // Add gallery to wedding-essential
  code = code.replace(
    'themeColor: "#4A4A4A",',
    'themeColor: "#4A4A4A",\n    gallery: [\n      "https://images.unsplash.com/photo-1519225421980-715cb02151ff?q=80&w=2670&auto=format&fit=crop",\n      "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop",\n      "https://images.unsplash.com/photo-1522413452208-996901845bb0?q=80&w=2670&auto=format&fit=crop"\n    ],'
  );
}

fs.writeFileSync('mockData.ts', code);
console.log("Added gallery to wedding-essential.");
