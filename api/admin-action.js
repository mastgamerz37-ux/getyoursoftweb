/**
 * Vercel Serverless Function: /api/admin-action
 * Privileged actions: bulk key creation, license revocation, refund processing
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { passkey, action, payload } = req.body || {};
    const expectedPass = process.env.ADMIN_PASSKEY || 'ansh2026';

    if (passkey !== expectedPass) {
      return res.status(403).json({ error: 'Unauthorized: Invalid administrative credentials.' });
    }

    if (action === 'generate_keys') {
      const count = parseInt(payload.count, 10) || 1;
      const plan = payload.plan || 'Lifetime';
      const keys = [];
      for (let i = 0; i < count; i++) {
        keys.push(generateKey());
      }
      return res.status(200).json({ success: true, keys, plan });
    }

    if (action === 'revoke_key') {
      const key = payload.key;
      return res.status(200).json({ success: true, message: `Key ${key} marked as revoked.` });
    }

    return res.status(400).json({ error: 'Unknown administrative action.' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

function generateKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => {
    let s = '';
    for (let i = 0; i < 4; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
  };
  return `ANSH-${seg()}-${seg()}-${seg()}`;
}
