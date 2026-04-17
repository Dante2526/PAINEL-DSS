const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkDoc() {
  try {
    const docId = 'B_2026-04-12';
    const doc = await db.collection('historico_dss').doc(docId).get();
    if (!doc.exists) {
      console.log('Document B_2026-04-12 not found!');
    } else {
      const data = doc.data();
      console.log('FIELDS:', Object.keys(data).join(', '));
      // Check if registros7H exists
      console.log('registros7H type:', typeof data.registros7H);
      if (Array.isArray(data.registros7H)) {
        console.log('registros7H content:', JSON.stringify(data.registros7H));
      }
    }
  } catch (e) {
    console.error(e);
  }
}

checkDoc();
