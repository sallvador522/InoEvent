const fs = require('fs');

let file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// Guarantee that we log how the key is processed during initialization
if (!content.includes('Processing FIREBASE_PRIVATE_KEY for Vercel/Env:')) {
    content = content.replace(
      'privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\\\n/g, \'\\n\'),',
      `privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\\\n/g, '\\n'),`
    );
    fs.writeFileSync(file, content);
}
