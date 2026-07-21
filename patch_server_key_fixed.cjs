const fs = require('fs');
let file = 'server.ts';

if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');

  // Let's replace the regex parsing for the private key to make it 100% robust
  content = content.replace(
    /privateKey: process\.env\.FIREBASE_PRIVATE_KEY\..*,/g,
    'privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, "").replace(/\\\\\\\\n/g, "\\n").replace(/\\\\n/g, "\\n").replace(/\\n/g, "\\n"),'
  );
  
  fs.writeFileSync(file, content);
  console.log("Patched server.ts private key format.");
} else {
  console.log("server.ts not found in current directory!");
}
