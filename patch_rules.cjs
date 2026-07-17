const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf8');

const regex = /\/\/ \-\-\- Guests Subcollection \-\-\-[\s\S]*?match \/guests\/\{guestId\} \{[\s\S]*?allow delete: if isSignedIn\(\) && get\(\/databases\/\$\(database\)\/documents\/events\/\$\(eventId\)\)\.data\.ownerId == request\.auth\.uid;\s*\}/;

const newGuestsRule = `// --- Guests Subcollection ---
      match /guests/{guestId} {
        // Prevent Data Leak: Public can only GET by specific guestId (for check-in scanner). Public cannot LIST all guests.
        allow get: if true;
        allow list: if (isSignedIn() && get(/databases/$(database)/documents/events/$(eventId)).data.ownerId == request.auth.uid) || isAdmin();
        
        // Creating guests is now handled by the secure backend API for unauthenticated users.
        allow create: if (isSignedIn() && get(/databases/$(database)/documents/events/$(eventId)).data.ownerId == request.auth.uid) || isAdmin();
        
        allow update: if isValidId(guestId) && (
            (isSignedIn() && get(/databases/$(database)/documents/events/$(eventId)).data.ownerId == request.auth.uid) ||
            isAdmin() ||
            (existing().get('phone', 'none') == incoming().get('phone', 'none')) ||
            (incoming().get('clientToken', 'invalid') == get(/databases/$(database)/documents/events/$(eventId)).data.clientToken)
        );
        allow delete: if (isSignedIn() && get(/databases/$(database)/documents/events/$(eventId)).data.ownerId == request.auth.uid) || isAdmin();
      }`;

content = content.replace(regex, newGuestsRule);
fs.writeFileSync('firestore.rules', content);
