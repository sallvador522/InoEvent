import fs from 'fs';
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
async function getEventDetails(eventId) {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents/events/${eventId}`;
    const res = await fetch(url);
    if (!res.ok) {
        return null;
    }
    const data = await res.json();
    if (data.fields) {
        // Need to parse Firestore REST format to simple JS object
        const parseValue = (val) => {
            if (val.stringValue !== undefined) return val.stringValue;
            if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
            if (val.booleanValue !== undefined) return val.booleanValue;
            if (val.arrayValue !== undefined) {
               return (val.arrayValue.values || []).map(parseValue);
            }
            if (val.mapValue !== undefined) {
               const map = {};
               for (const key in val.mapValue.fields) {
                   map[key] = parseValue(val.mapValue.fields[key]);
               }
               return map;
            }
            return null;
        };
        const parsedData = {};
        for (const key in data.fields) {
            parsedData[key] = parseValue(data.fields[key]);
        }
        return parsedData;
    }
  } catch (error) {
    console.error(`Error fetching event details for ID ${eventId}:`, error);
  }
  return null;
}
getEventDetails('evt_dtoo3leoz').then(data => console.log(data));
