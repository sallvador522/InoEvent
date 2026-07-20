const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`    const url = \`https://firestore.googleapis.com/v1/projects/\${firebaseConfig.projectId}/databases/\${dbId}/documents/events/\${eventId}\`;`,
`    const projectId = (firebaseConfig && firebaseConfig.projectId) ? firebaseConfig.projectId : process.env.GOOGLE_CLOUD_PROJECT || 'dummy-project';
    const url = \`https://firestore.googleapis.com/v1/projects/\${projectId}/databases/\${dbId}/documents/events/\${eventId}\`;`
);

fs.writeFileSync('server.ts', code);
console.log('Done!');
