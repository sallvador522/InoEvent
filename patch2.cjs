const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
`    } else {
      // Hardcoded fallback for Vercel serverless environments where static files aren't bundled
      html = \`<!DOCTYPE html>
<html lang="pt-AO">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>InoEvents</title>
    <meta property="og:title" content="InoEvents" />
    <meta property="og:description" content="Convite Digital" />
    <meta property="og:image" content="https://www.inoevent.online/inoOG.png" />
    <meta property="og:url" content="https://www.inoevent.online" />
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
    <script>window.location.reload();</script>
</body>
</html>\`;
    }`,
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
    }`
);
fs.writeFileSync('server.ts', code);
