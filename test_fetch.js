import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
initializeApp({ projectId: firebaseConfig.projectId });
const db = getFirestore();
async function test() {
  const doc = await db.collection('events').doc('evt_dtoo3leoz').get();
  console.log(doc.exists ? doc.data() : "Not found");
}
test();
