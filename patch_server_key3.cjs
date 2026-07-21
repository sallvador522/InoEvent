const fs = require('fs');
let file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, "").replace(/\\\\\\\\n/g, "\\\\n")')) {
    content = content.replace(
      /privateKey: process\.env\.FIREBASE_PRIVATE_KEY\.replace\(\/\^"\|"\$\/g, ''\)\.replace\(\/\\\\n\/g, '\\n'\),/,
      `privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, "").replace(/\\\\\\\\n/g, "\\\\n").replace(/\\\\n/g, "\\n"),`
    );
    fs.writeFileSync(file, content);
}
