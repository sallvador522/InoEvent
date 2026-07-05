const fs = require('fs');

let rules = fs.readFileSync('firestore.rules', 'utf8');

const tablesRules = `
      // --- Tables Subcollection ---
      match /tables/{tableId} {
        allow read: if true;
        allow create, update, delete: if isSignedIn() && get(/databases/$(database)/documents/events/$(eventId)).data.ownerId == request.auth.uid;
      }
`;

rules = rules.replace(
  "// --- Messages Subcollection ---",
  tablesRules + "\n      // --- Messages Subcollection ---"
);

fs.writeFileSync('firestore.rules', rules);
console.log("Patched firestore rules");
