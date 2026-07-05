const fs = require('fs');

let rules = fs.readFileSync('firestore.rules', 'utf8');

const teamRules = `
      // --- Team Subcollection ---
      match /team/{memberId} {
        allow read: if true;
        allow create, update, delete: if isSignedIn() && get(/databases/$(database)/documents/events/$(eventId)).data.ownerId == request.auth.uid;
      }
`;

rules = rules.replace(
  "// --- Tables Subcollection ---",
  teamRules + "\n      // --- Tables Subcollection ---"
);

fs.writeFileSync('firestore.rules', rules);
console.log("Patched firestore rules for team");
