import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
initializeApp({ projectId: firebaseConfig.projectId });
const db = getFirestore();
async function test() {
  await db.collection('events').doc('test-event-123').set({
    title: 'Test Event 123',
    type: 'WEDDING',
    heroImage: 'http://example.com/image.jpg'
  });
  console.log('Test event created');
}
test();
