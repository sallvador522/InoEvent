const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `// Initialize Firebase Admin
try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: firebaseConfig ? firebaseConfig.projectId : process.env.GOOGLE_CLOUD_PROJECT || 'dummy-project',
    });
  }`;

const replacement = `// Initialize Firebase Admin
try {
  if (admin.apps.length === 0) {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || (firebaseConfig ? firebaseConfig.projectId : 'dummy-project');
    
    let credential;
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      credential = admin.credential.cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\\\n/g, '\\n'),
      });
      logger.info('Firebase Admin inicializado com credenciais de Service Account.', { category: 'SYSTEM' });
    } else {
      credential = admin.credential.applicationDefault();
      logger.warn('Firebase Admin inicializado sem Service Account (usando Application Default).', { category: 'SYSTEM' });
    }

    admin.initializeApp({
      projectId,
      credential
    });
  }`;

content = content.replace(target, replacement);
fs.writeFileSync('server.ts', content);
