const fs = require('fs');

let file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// Guarantee that we log how the key is processed during initialization
if (!content.includes('Processing FIREBASE_PRIVATE_KEY for Vercel/Env:')) {
    content = content.replace(
      '// For Vercel or local .env with actual newlines or escaped newlines\\n    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\\\n/g, \'\\n\');',
      `// For Vercel or local .env with actual newlines or escaped newlines
    console.log('[FIREBASE INIT] Processing FIREBASE_PRIVATE_KEY for Vercel/Env:');
    let rawKey = process.env.FIREBASE_PRIVATE_KEY;
    console.log('[FIREBASE INIT] Raw key length:', rawKey ? rawKey.length : 0);
    // Remove wrapping quotes if they were pasted by the user
    if (rawKey && rawKey.startsWith('"') && rawKey.endsWith('"')) {
        rawKey = rawKey.substring(1, rawKey.length - 1);
        console.log('[FIREBASE INIT] Stripped wrapping quotes from key');
    }
    const privateKey = rawKey.replace(/\\\\n/g, '\\n');`
    );
    fs.writeFileSync(file, content);
}
