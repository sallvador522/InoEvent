const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
`app.get('/invite/:id', async (req, res, next) => {
  const { id } = req.params;`,
`app.get('/invite/:id', async (req, res, next) => {
  const { id } = req.params;
  console.log("HIT ROUTE /invite/:id with id =", id);`
);
fs.writeFileSync('server.ts', code);
