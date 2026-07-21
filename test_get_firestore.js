import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

try {
  const db = getFirestore(undefined, firebaseConfig.firestoreDatabaseId);
  console.log("Success! Database ID:", db.databaseId || db._databaseId);
} catch (e) {
  console.error("Failed:", e);
}
