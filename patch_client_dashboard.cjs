const fs = require('fs');
let content = fs.readFileSync('features/dashboard/ClientDashboard.tsx', 'utf8');

// Replace the onSnapshot part with fetch and setInterval
const oldCode = `                // Listen to guests
                const guestsRef = collection(db, 'events', id, 'guests');
                const unsubscribeGuests = onSnapshot(guestsRef,
                    (snapshot) => {
                        const guestsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setGuests(guestsList);
                        setLoading(false);
                    },
                    (error) => {
                        console.error("Guest read error", error);
                        setLoading(false);
                    }
                );
                
                return () => {
                    unsubscribeGuests();
                };`;

const newCode = `                // Fetch guests securely via API
                const fetchGuests = async () => {
                    try {
                        const res = await fetch(\`/api/events/\${id}/guests?token=\${tokenParam}\`);
                        if (res.ok) {
                            const data = await res.json();
                            setGuests(data.guests || []);
                        }
                    } catch (err) {
                        console.error("Guest fetch error", err);
                    } finally {
                        setLoading(false);
                    }
                };
                
                fetchGuests();
                const interval = setInterval(fetchGuests, 15000); // Polling every 15s
                
                return () => {
                    clearInterval(interval);
                };`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('features/dashboard/ClientDashboard.tsx', content);
