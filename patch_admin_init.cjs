const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }`,
`  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: firebaseConfig ? firebaseConfig.projectId : process.env.GOOGLE_CLOUD_PROJECT || 'dummy-project',
    });
  }`
);

code = code.replace(
`  const dbId = firebaseConfig.firestoreDatabaseId;`,
`  const dbId = firebaseConfig ? firebaseConfig.firestoreDatabaseId : undefined;`
);

code = code.replace(
`    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';`,
`    const dbId = (firebaseConfig && firebaseConfig.firestoreDatabaseId) ? firebaseConfig.firestoreDatabaseId : '(default)';`
);

fs.writeFileSync('server.ts', code);
console.log('Done!');
