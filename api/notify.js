import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Initialize Firebase using serverless environment variables or falls back to system process.env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, cart } = req.body;
  if (!cart || !cart.length) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // 1. Group cart items by restaurantId
  const byRestaurant = cart.reduce((acc, item) => {
    if (!item.restaurantId) return acc;
    (acc[item.restaurantId] ??= []).push(item);
    return acc;
  }, {});

  // 2. Fetch OneSignal credentials from Firestore
  let appId = '3867fc82-fa3e-4a1a-b476-04a1d747d81b';
  let restApiKey = '';
  try {
    const snap = await getDoc(doc(db, 'config', 'onesignal'));
    if (snap.exists()) {
      const data = snap.data();
      if (data.appId) appId = data.appId;
      restApiKey = data.restApiKey || '';
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch Firestore config: ' + err.message });
  }

  if (!restApiKey) {
    return res.status(400).json({ error: 'OneSignal restApiKey not configured in config/onesignal' });
  }

  // 3. Trigger push notifications
  const results = [];
  for (const [rId, items] of Object.entries(byRestaurant)) {
    try {
      const itemLines = items.map((i) => `• ${i.name} × ${i.qty}`).join(', ');

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Basic ${restApiKey}`,
        },
        body: JSON.stringify({
          app_id: appId,
          headings: { en: 'New Order Received!' },
          contents: { en: `Order ID: ${orderId}\nItems: ${itemLines}` },
          filters: [
            { field: 'tag', key: 'restaurantId', relation: '=', value: rId }
          ],
          data: { screen: 'orders' }
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        results.push({ restaurantId: rId, success: false, error: errText });
      } else {
        results.push({ restaurantId: rId, success: true });
      }
    } catch (err) {
      results.push({ restaurantId: rId, success: false, error: err.message });
    }
  }

  return res.status(200).json({ results });
}
