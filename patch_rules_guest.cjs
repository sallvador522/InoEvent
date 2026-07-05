const fs = require('fs');

let rules = fs.readFileSync('firestore.rules', 'utf8');

const oldUpdate = `allow update: if isValidId(guestId) && (
            (isSignedIn() && get(/databases/$(database)/documents/events/$(eventId)).data.ownerId == request.auth.uid) ||
            (existing().phone == incoming().phone)
        );`;

const newUpdate = `allow update: if isValidId(guestId) && (
            (isSignedIn() && get(/databases/$(database)/documents/events/$(eventId)).data.ownerId == request.auth.uid) ||
            (existing().get('phone', 'none') == incoming().get('phone', 'none')) ||
            (incoming().get('clientToken', 'invalid') == get(/databases/$(database)/documents/events/$(eventId)).data.clientToken)
        );`;

if(rules.includes(oldUpdate)) {
    rules = rules.replace(oldUpdate, newUpdate);
    fs.writeFileSync('firestore.rules', rules);
    console.log("Rules patched successfully!");
} else {
    console.log("Old rule not found.");
}
