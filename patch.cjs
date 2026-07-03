const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
`    const htmlPath = isProd 
      ? path.join(process.cwd(), 'dist/index.html')
      : path.join(process.cwd(), 'index.html');
      
    if (!fs.existsSync(htmlPath)) {
      return next();
    }
    
    let html = fs.readFileSync(htmlPath, 'utf8');`,
`    let html = "";
    const possiblePaths = [
      path.join(process.cwd(), 'dist/index.html'),
      path.join(process.cwd(), 'index.html'),
      path.join(__dirname, 'dist/index.html'),
      path.join(__dirname, 'index.html')
    ];
    let foundPath = possiblePaths.find(p => fs.existsSync(p));
    
    if (foundPath) {
      html = fs.readFileSync(foundPath, 'utf8');
    } else {
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
    }`
);
fs.writeFileSync('server.ts', code);
