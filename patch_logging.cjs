const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
`    const eventData = await getEventDetails(id);`,
`    const eventData = await getEventDetails(id);
    console.log("eventData for", id, ":", !!eventData);`
);
fs.writeFileSync('server.ts', code);
