import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

initializeApp({ projectId: 'ai-studio-013fbaea-ce15-4876-a758-077c12fae9cd' });

async function test() {
    try {
        const db = getFirestore();
        const id = 'evt_dtoo3leoz';
        const eventRef = db.collection('events').doc(id);
        const eventDoc = await eventRef.get();
        console.log("Event exists:", eventDoc.exists);
    } catch (e) {
        console.error("ERROR", e);
    }
}
test();
