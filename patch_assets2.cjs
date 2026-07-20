const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    `app.use(express.static(path.join(process.cwd(), 'public')));`,
    `app.use(express.static(path.join(process.cwd(), 'dist')));`
);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts fallback');
