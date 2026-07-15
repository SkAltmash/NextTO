import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const envPath = './.env';
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const payload = {
  app_id: '3867fc82-fa3e-4a1a-b476-04a1d747d81b',
  headings: { en: 'Test Title' },
  contents: { en: 'Test Body' },
  filters: [{ field: 'tag', key: 'restaurantId', relation: '=', value: 'test' }]
};

async function testWithPrefix(prefix, key) {
  const authHeader = `${prefix} ${key}`;
  try {
    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log(`Prefix [${prefix}] -> Status: ${res.status}, Response: ${text.trim()}`);
  } catch (err) {
    console.log(`Prefix [${prefix}] -> Fetch failed:`, err.message);
  }
}

async function run() {
  const snap = await getDoc(doc(db, 'config', 'onesignal'));
  if (snap.exists()) {
    const data = snap.data();
    const key = data.restApiKey;
    console.log('Testing OneSignal API with key starting with:', key.substring(0, 15));
    
    await testWithPrefix('Key', key);
    await testWithPrefix('Basic', key);
    await testWithPrefix('Bearer', key);
  } else {
    console.log('Firestore document not found!');
  }
}

run().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
