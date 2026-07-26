import admin from 'firebase-admin';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

const sa = {
  "type": "service_account",
  "project_id": "phonic-axle-463023-c2",
  "private_key_id": "fbee02285f575e4a07aa2d8ab2f06fb88db19712",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD9QH7wRkMfR/ls\nbcLn5M3kQdRD4w2Bu47OiO3lFLpnjCtcLRSOz/DtiikBvSF7PC5TPLd9yKr81BHN\nb6GkGr1MEaNXe42bVhXz5Fti/WxinJ+C0/Ix8feLEcq4Tx+1jMDl5MQrILtz6hqL\ntBWsSspxddL4ZL7er4reI3c+s4SLleGxV+lKC5QrzsjuuPagwBedUIt0e7XkNeeM\n27tz1jhRtQcLVCynDwbXCduYE1OUjueqV0XNDV4/FEqmL3ZvHa+st3wL9G8KUG2z\nApDIQNB+tWCautljSXARDiO0QPwajnnmvw/kq62Kt+Pf4/aMwocYMCnKGksZKI4/\nQrVvYqqjAgMBAAECggEABdrhCcFjbuHf8Ij5xG5j8N7cFJ+3Ybmfhm3gViIBt0Ak\nhn0yUvpCvzMpBIsbWY6IIaYvNdTBreu3PPvTjbLij9N+kRi1qug1b2M8VlBhRPG1\ntwrFuDA4bA+CviUc02Uy1n3Qp+XvVNw44I75dfdwBmnWG/u0SqYIp18ZiX+7/5Vx\nPCcMABhlTQXwAMZODbgeHScC6tSpiaKmf32jwEAg203gEatCDHw/SI+ql5ElHCzd\nUnB48QoIItKkQF8dylJNFspeiFeq+rQzwc6yfDtQIfW9vVAc5MX9fkSeSE71wu94\niEmDI/nUC3ampaWGfcXZQUqW/t5dbxM7NONT4HBJBQKBgQD/AGAOnfuO7Sd9LeUl\nB1Orka8MX1qERCw0UfZXJ7TAgLplvThBSvV4j/FGahqtrjJdCIYwrgVGRuD5r5qb\neSvT9et/dIEuP11au5Z+w+uTzv+hltBATgS+OM9LUa3BjdJsrbFaZz2I98E7svxn\nZetkfmCzZGud0yTfht7JPr08PQKBgQD+Pl3oRwPRFBeQdIwKXX+2JPQTvHgsXYVi\nGzFwQXNPayR3/MG3FRZbQatwHDDL+VhuQIgOatBdNe+blZC+q7NGOg5qzRa44zFJ\nFn1zqJ9njj/V/AdJNpKfuPgn5G9XZyiOdeYvVszllnqCncu+A/MJZwIhMWKYMSX2\nK2OKO9OQXwKBgEFGT1BukF5dxqX8gZOg9IIOoMiCACGrccVS1cQpndNJIG26qhPM\npFlgP1rO/lVHKg02iWMcqKz8p8pCcUkrE1UGtmnB4O99uN/o9PUuIbeMXVN3z4cm\ncYBf+nBFUD0jmKHJNIT3uIC/Ku+lOYceR8tJrmc9ZW7ZBa9STuUk8jvhAoGBAIcH\nqqpt5RoLOMSxEZuDswuTLsq4o360oN3NIYHEUTDR78mGRYAuQ/RtuVbOsh/zK0NL\nJLe7hTSsK7kPQ5Pw70MSHIwepr3FdGyj9DcUTK0cQM0ukNQSlucbvzi4u2XJVSHs\nfjeQOzyIokJy+j3OLStGOTxV1U6Nc+L9gl1tjtyzAoGAMPJsKARkUlJaHHExElim\nzB8AC5BW3CpvZ34wUi4DOP4bjcbo5z1FqjxbLLjrAOcmzLLf6lMoM2r6MvtdYFTh\nTQs8lKkG+XZLXLrNTZVYtOPIC108xe3YPXa2xrcK4qqc3YWZxU9lrV6ORnsQnm+t\n701Q15tC2gK6xFHprhGJyW4=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@phonic-axle-463023-c2.iam.gserviceaccount.com",
};

admin.initializeApp({
  credential: admin.credential.cert(sa as any),
  projectId: firebaseConfig.projectId
});

async function run() {
  try {
    const db = admin.firestore();
    db.settings({ databaseId: firebaseConfig.firestoreDatabaseId });
    const snap = await db.collection('events').doc('evt_dtoo3leoz').collection('guests').get();
    console.log(`Found ${snap.size} guests for evt_dtoo3leoz`);
    snap.forEach(doc => console.log(doc.id, doc.data()));
  } catch (e) {
    console.error(e);
  }
}
run();
