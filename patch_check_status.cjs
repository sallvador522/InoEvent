const fs = require('fs');
let content = fs.readFileSync('features/invitation/CheckStatusModal.tsx', 'utf8');

const regex = /const normalizedPhone = phone\.trim\(\)\.replace\(\/\[\\s\\-\(\)\]\/g, ""\);\s*const guestsCollection = collection\(db, "events", event\.id, "guests"\);\s*const q = query\(guestsCollection, where\("phone", "==", normalizedPhone\)\);\s*const snap = await getDocs\(q\);\s*if \(snap\.empty\) \{\s*toast\.error\("Nenhuma confirmação encontrada para este número\."\);\s*setLoading\(false\);\s*return;\s*\}\s*const guestDoc = snap\.docs\[0\];\s*const guestData = \{ id: guestDoc\.id, \.\.\.guestDoc\.data\(\) \} as any;\s*setResult\(guestData\);\s*if \(guestData\.tableId\) \{\s*const tableRef = doc\(db, `events\/\$\{event\.id\}\/tables`, guestData\.tableId\);\s*const tableSnap = await getDoc\(tableRef\);\s*if \(tableSnap\.exists\(\)\) \{\s*setTableName\(tableSnap\.data\(\)\.name\);\s*\}\s*\}/;

const newCode = `const normalizedPhone = phone.trim().replace(/[\\s\\-()]/g, "");
      const res = await fetch(\`/api/events/\${event.id}/rsvp-status?phone=\${encodeURIComponent(normalizedPhone)}\`);
      
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

content = content.replace(regex, newCode);
fs.writeFileSync('features/invitation/CheckStatusModal.tsx', content);
