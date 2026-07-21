const fs = require('fs');

// Revert CheckStatusModal
let file = 'features/invitation/CheckStatusModal.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(`      const guestsRef = collection(db, 'events', event.id, 'guests');
      const phoneQuery = query(guestsRef, where('phone', '==', normalizedPhone));
      const snap = await getDocs(phoneQuery);
      
      if (snap.empty) {
        toast.error("Nenhuma confirmação encontrada para este número.");
        setLoading(false);
        return;
      }

      const guestDoc = snap.docs[0];
      const guestData = { id: guestDoc.id, ...guestDoc.data() } as any;

      if (guestData.tableId) {
        const tableSnap = await getDoc(doc(db, 'events', event.id, 'tables', guestData.tableId));
        if (tableSnap.exists()) {
          guestData.tableName = tableSnap.data().name;
        }
      }
      
      setResult(guestData);

      if (guestData.tableName) {
        setTableName(guestData.tableName);
      }`, `      const res = await fetch(\`/api/events/\${event.id}/rsvp-status?phone=\${encodeURIComponent(normalizedPhone)}\`);
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Nenhuma confirmação encontrada para este número.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const guestData = data.guest;
      setResult(guestData);

      if (guestData.tableName) {
        setTableName(guestData.tableName);
      }`);
fs.writeFileSync(file, content);

// Revert InvitationView
file = 'features/invitation/InvitationView.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(`      const guestsRef = collection(db, 'events', event.id, 'guests');
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

      const guestId = docRef.id;`, `      const res = await fetch(\`/api/events/\${event.id}/rsvp\`, {
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
      const guestId = data.guestId;`);
fs.writeFileSync(file, content);
