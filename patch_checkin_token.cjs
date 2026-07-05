const fs = require('fs');
let file = fs.readFileSync('features/checkin/CheckinScanner.tsx', 'utf8');

file = file.replace(/await updateDoc\(guestRef, \{([^}]+)checkedInAt: new Date\(\)\.toISOString\(\)([^}]+)\}\);/g, "await updateDoc(guestRef, {$1checkedInAt: new Date().toISOString(), clientToken: token || null$2});");

fs.writeFileSync('features/checkin/CheckinScanner.tsx', file);
console.log("CheckinScanner patched with clientToken!");
