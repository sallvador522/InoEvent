const fs = require('fs');
const file = 'features/invitation/InvitationView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `      const res = await fetch(\`/api/events/\${event.id}/rsvp\`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, guestData }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Erro ao confirmar presença.", { id: toastId });
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      const guestId = data.guestId;`;

const replacement = `      const guestsRef = collection(db, 'events', event.id, 'guests');
      const plan = event?.plan || 'Essencial';
      const limit = plan === 'Essencial' ? 100 : Infinity;

      // Count guests
      const countSnap = await getCountFromServer(guestsRef);
      if (countSnap.data().count >= limit) {
        toast.error("O limite de convidados para este evento foi atingido.", { id: toastId });
        setLoading(false);
        return;
      }

      // Check duplicate
      const phoneQuery = query(guestsRef, where('phone', '==', normalizedPhone));
      const snap = await getDocs(phoneQuery);
      if (!snap.empty) {
        toast.error("Este número de WhatsApp já confirmou presença neste evento.", { id: toastId });
        setLoading(false);
        return;
      }

      const docRef = await addDoc(guestsRef, {
        ...guestData,
        createdAt: serverTimestamp()
      });

      const guestId = docRef.id;`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
