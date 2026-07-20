const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const fallbackStatic = `
// Bulletproof fallback for Vercel static assets in case Output Directory is misconfigured
app.use('/assets', express.static(path.join(process.cwd(), 'dist/assets')));
app.use(express.static(path.join(process.cwd(), 'public')));
`;

if (!code.includes('Bulletproof fallback')) {
    code = code.replace(
        `const app = express();\napp.use(compression());`,
        `const app = express();\napp.use(compression());\n${fallbackStatic}`
    );
    fs.writeFileSync('server.ts', code);
    console.log('Patched server.ts with static fallback');
} else {
    console.log('Already patched');
}
