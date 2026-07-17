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

  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Clean the phone number (keep only digits)
  // E.g. +91 98765 43210 -> 919876543210
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  const apiKey = process.env.TWO_FACTOR_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'TWO_FACTOR_API_KEY is not configured on the server' });
  }

  try {
    // 2Factor AUTOGEN endpoint generates and sends a random 6-digit OTP
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${cleanPhone}/AUTOGEN/OTP_TEMPLATE_1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Status === 'Success') {
      return res.status(200).json({
        success: true,
        sessionId: data.Details, // This is the Session ID needed to verify the OTP later
      });
    } else {
      return res.status(400).json({
        success: false,
        error: data.Details || 'Failed to send OTP via 2Factor',
      });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ success: false, error: 'Internal server error: ' + error.message });
  }
}
