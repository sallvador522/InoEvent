const fs = require('fs');
let file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<meta property="og:image" content="https://www.inoevent.online/inoOG.jpg" />',
  '<meta property="og:image" content="https://www.inoevent.online/logo-192.png" />'
);

content = content.replace(
  '<meta name="twitter:image" content="https://www.inoevent.online/inoOG.jpg" />',
  '<meta name="twitter:image" content="https://www.inoevent.online/logo-192.png" />'
);

fs.writeFileSync(file, content);
