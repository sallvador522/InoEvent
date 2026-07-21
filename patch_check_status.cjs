const fs = require('fs');
const file = 'features/invitation/CheckStatusModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `      const res = await fetch(\`/api/events/\${event.id}/rsvp-status?phone=\${encodeURIComponent(normalizedPhone)}\`);
      
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
      }`;

const replacement = `      const guestsRef = collection(db, 'events', event.id, 'guests');
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
      }`;

content = content.replace(target, replacement);

const importTarget = `import { EventDetails } from "../../types";`;
if (!content.includes('import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";')) {
    content = content.replace(importTarget, importTarget + `\nimport { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";\nimport { db } from "../../components/FirebaseProvider";`);
}

fs.writeFileSync(file, content);
