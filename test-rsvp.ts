import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';

// The dev server is running, but let's test the specific RSVP function manually to see the error.
async function test() {
    try {
        const id = 'evt_dtoo3leoz';
        
        const res = await fetch(`http://localhost:3000/api/events/${id}/rsvp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: "999999999", guestData: { name: "Test", phone: "999999999", status: "CONFIRMED", adults: 1, children: 0, message: "", dietaryRestrictions: "", checkedIn: false } })
        });
        
        console.log(await res.text());
    } catch (e) {
        console.error(e);
    }
}
test();
