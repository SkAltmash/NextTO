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

      const authHeader = restApiKey.startsWith('os_v2_') ? `Key ${restApiKey}` : `Basic ${restApiKey}`;
      const response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          app_id: appId,
          headings: { en: 'New Order Received!' },
          contents: { en: `Order ID: ${orderId}\nItems: ${itemLines}` },
          filters: [
            { field: 'tag', key: 'restaurantId', relation: '=', value: rId }
          ],
          data: { screen: 'orders' },
          priority: 10,

          // 🔔 CUSTOM NOTIFICATION SOUND & CHANNEL FIXES
          android_channel_id: 'edcff667-74cf-4691-b5f0-afcd81636cc6',
          android_sound: 'new_order',
          ios_sound: 'new_order.mp3',

          small_icon: 'ic_stat_onesignal_default',
          android_visibility: 1,
        }),
      });

      const data = await response.json().catch(() => ({}));
      const hasErrors = data.errors && data.errors.length > 0;
      const noRecipients = data.recipients === 0;

      if (!response.ok || hasErrors || noRecipients || !data.id) {
        const errorMsg = hasErrors
          ? data.errors.join(', ')
          : (noRecipients ? 'No subscribed restaurant devices found' : `HTTP status ${response.status}`);
        results.push({
          restaurantId: rId,
          success: false,
          error: errorMsg,
          debugAuthHeader: authHeader ? `${authHeader.substring(0, 15)}...` : 'EMPTY',
          details: data
        });
      } else {
        results.push({ restaurantId: rId, success: true, notificationId: data.id, recipients: data.recipients });
      }
    } catch (err) {
      results.push({ restaurantId: rId, success: false, error: err.message });
    }
  }

  const allSuccessful = results.length > 0 && results.every((r) => r.success);
  return res.status(allSuccessful ? 200 : 207).json({ success: allSuccessful, results });
}

