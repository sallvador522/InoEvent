const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
`    } else {
      try {
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers.host || 'www.inoevent.online';
        // Fetch the base HTML from the root domain, which Vercel/CloudRun serves statically
        const fetchRes = await fetch(\`\${protocol}://\${host}/\`);
        if (fetchRes.ok) {
           html = await fetchRes.text();
        } else {
           return next();
        }
      } catch(e) {
         console.error('Fallback fetch failed', e);
         return next();
      }
    }`,
`    } else {
      try {
        const isLocal = req.headers.host && req.headers.host.includes('localhost');
        const protocol = req.headers['x-forwarded-proto'] || (isLocal ? 'http' : 'https');
        const host = req.headers.host || 'www.inoevent.online';
        const fetchRes = await fetch(\`\${protocol}://\${host}/\`);
        if (fetchRes.ok) {
           html = await fetchRes.text();
        } else {
           return next();
        }
      } catch(e) {
         console.error('Fallback fetch failed', e);
         return next();
      }
    }`
);
fs.writeFileSync('server.ts', code);
