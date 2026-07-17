import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines from environment variable
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          : undefined,
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

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

  const { phoneNumber, sessionId, otp } = req.body;
  if (!phoneNumber || !sessionId || !otp) {
    return res.status(400).json({ error: 'phoneNumber, sessionId, and otp are required' });
  }

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const apiKey = process.env.TWO_FACTOR_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'TWO_FACTOR_API_KEY is not configured on the server' });
  }

  try {
    // ── Demo / Play Store test accounts ──────────────────────────────────────
    // If send-otp returned sessionId = "DEMO_SESSION", skip 2Factor and accept
    // the static demo OTP "123456" so Play Store reviewers can test the app.
    const DEMO_OTP = '123456';
    const isDemo = sessionId === 'DEMO_SESSION';

    if (isDemo) {
      if (otp !== DEMO_OTP) {
        return res.status(400).json({
          success: false,
          error: `Demo account: please use OTP ${DEMO_OTP}`,
        });
      }
      console.log(`[verify-otp] Demo OTP accepted for ${cleanPhone}`);
      // Fall through to Firebase user creation below
    } else {
      // 1. Verify OTP with 2Factor API
      const verifyUrl = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;
      const verifyResponse = await fetch(verifyUrl);
      const verifyData = await verifyResponse.json();

      if (verifyData.Status !== 'Success' || verifyData.Details !== 'OTP Matched') {
        return res.status(400).json({
          success: false,
          error: verifyData.Details || 'Invalid OTP code',
        });
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // OTP is valid!
    // 2. Provision / retrieve Firebase user
    const uid = `phone-${cleanPhone}`;
    let userRecord;
    let isNewUser = false;

    try {
      userRecord = await admin.auth().getUser(uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create user with phone number and uid
        userRecord = await admin.auth().createUser({
          uid,
          phoneNumber: `+${cleanPhone}`,
        });
        isNewUser = true;
      } else {
        throw error;
      }
    }

    // 3. Create Custom Token
    const customToken = await admin.auth().createCustomToken(uid);

    return res.status(200).json({
      success: true,
      token: customToken,
      uid: userRecord.uid,
      isNewUser,
    });
  } catch (error) {
    console.error('Error verifying OTP / creating token:', error);
    return res.status(500).json({ success: false, error: 'Internal server error: ' + error.message });
  }
}
