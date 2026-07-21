import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';

initializeApp();

async function test() {
    try {
        const db = getFirestore();
        const id = 'evt_dtoo3leoz';
        const eventRef = db.collection('events').doc(id);
        const eventDoc = await eventRef.get();
        console.log("Event exists:", eventDoc.exists);
        
        const guestsRef = eventRef.collection('guests');
        
        // Count guests
        console.log("counting...");
        const countSnap = await guestsRef.count().get();
        console.log("count:", countSnap.data().count);
        
        // Check duplicate
        const phone = "999999999";
        const normalizedPhone = phone.trim().replace(/[\s\-()]/g, "");
        const phoneQuery = await guestsRef.where('phone', '==', normalizedPhone).get();
        console.log("duplicate 1:", !phoneQuery.empty);
        
        const newGuestRef = guestsRef.doc();
        await newGuestRef.set({
            name: "Test",
            phone: normalizedPhone,
            createdAt: new Date().toISOString()
        });
        console.log("Success");
    } catch (e) {
        console.error("ERROR", e);
    }
}
test();
