const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));`,
`let firebaseConfig: any = null;
try {
  firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
} catch (e) {
  logger.error('Failed to load firebase-applet-config.json on boot', { category: 'SYSTEM', data: e });
}`
);

fs.writeFileSync('server.ts', code);
console.log('Done!');
