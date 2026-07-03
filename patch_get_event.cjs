const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
`// Helper to fetch event details safely
async function getEventDetails(eventId: string) {
  if (!dbAdmin) return null;
  try {
    const docRef = dbAdmin.collection('events').doc(eventId);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return docSnap.data();
    }
  } catch (error) {
    console.error(\`Error fetching event details for ID \${eventId}:\`, error);
  }
  return null;
}`,
`// Helper to fetch event details safely
async function getEventDetails(eventId: string) {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const url = \`https://firestore.googleapis.com/v1/projects/\${firebaseConfig.projectId}/databases/\${dbId}/documents/events/\${eventId}\`;
    const res = await fetch(url);
    if (!res.ok) {
        return null;
    }
    const data = await res.json();
    if (data.fields) {
        // Need to parse Firestore REST format to simple JS object
        const parseValue = (val: any): any => {
            if (val.stringValue !== undefined) return val.stringValue;
            if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
            if (val.booleanValue !== undefined) return val.booleanValue;
            if (val.arrayValue !== undefined) {
               return (val.arrayValue.values || []).map(parseValue);
            }
            if (val.mapValue !== undefined) {
               const map: any = {};
               for (const key in val.mapValue.fields) {
                   map[key] = parseValue(val.mapValue.fields[key]);
               }
               return map;
            }
            return null;
        };
        const parsedData: any = {};
        for (const key in data.fields) {
            parsedData[key] = parseValue(data.fields[key]);
        }
        return parsedData;
    }
  } catch (error) {
    console.error(\`Error fetching event details for ID \${eventId}:\`, error);
  }
  return null;
}`
);
fs.writeFileSync('server.ts', code);
