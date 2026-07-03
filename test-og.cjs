const fs = require('fs');
let html = fs.readFileSync('dist/index.html', 'utf8');
const eventTitle = "Test Event";
html = html.replace(/<title>[^<]*<\/title>/g, `<title>${eventTitle} | InoEvents</title>`);
html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/g, `<meta property="og:title" content="${eventTitle.replace(/"/g, '&quot;')}" />`);
console.log(html.match(/og:title/));
