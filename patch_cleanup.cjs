const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
`  console.log("HIT ROUTE /invite/:id with id =", id);`,
``
);
code = code.replace(
`    console.log("eventData for", id, ":", !!eventData);`,
``
);
code = code.replace(
`      console.log("Replacing tags for event:", eventTitle);`,
``
);
fs.writeFileSync('server.ts', code);
