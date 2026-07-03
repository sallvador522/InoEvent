const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
`      // Replace titles and descriptions in index.html to ensure crawlers get unique tags`,
`      console.log("Replacing tags for event:", eventTitle);
      // Replace titles and descriptions in index.html to ensure crawlers get unique tags`
);
fs.writeFileSync('server.ts', code);
