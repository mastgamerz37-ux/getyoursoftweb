/**
 * Vercel Serverless Function: /api/verify-payment
 * Receives payment claim from frontend, verifies 12-digit UTR, notifies Telegram Admin Bot
 */

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { uid, email, upiId, utr, plan, amount } = req.body || {};

    // 1. Validation
    if (!utr || !/^\d{12}$/.test(String(utr).trim())) {
      return res.status(400).json({ error: 'Invalid UTR. Must be exactly 12 numeric digits.' });
    }

    if (!upiId || !String(upiId).includes('@')) {
      return res.status(400).json({ error: 'Invalid UPI ID.' });
    }

    const cleanUtr = String(utr).trim();
    const cleanEmail = email || 'customer@getyoursoft.page.gd';
    const planName = plan === 'monthly' ? 'Monthly (₹199)' : 'Lifetime (₹999)';

    // 2. Notify Telegram Admin Bot if token is set
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8858503234:AAEmc0Zw-fziNwxjcuw_3hGpEPfa55X4vQU';
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    let telegramSent = false;
    if (botToken && chatId) {
      const text = `🔔 *New Payment Claim Received\\!*\n\n` +
        `📦 *Plan:* ${escapeMarkdown(planName)}\n` +
        `💰 *Amount:* ₹${amount || (plan === 'monthly' ? '199' : '999')}\n` +
        `🔢 *UTR:* \`${cleanUtr}\`\n` +
        `👤 *UPI ID:* \`${escapeMarkdown(upiId)}\`\n` +
        `📧 *User Email:* \`${escapeMarkdown(cleanEmail)}\`\n\n` +
        `_Please check your FamPay app to confirm receipt before approving\\._`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Approve', callback_data: `approve:${cleanUtr}:${cleanEmail}:${plan}` },
            { text: '❌ Reject', callback_data: `reject:${cleanUtr}:${cleanEmail}` }
          ]
        ]
      };

      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'MarkdownV2',
            reply_markup: keyboard
          })
        });
        const tgData = await tgRes.json();
        telegramSent = tgData.ok;
      } catch (err) {
        console.error('Telegram dispatch error:', err);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verification claim submitted successfully.',
      utr: cleanUtr,
      telegramNotified: telegramSent,
      status: 'pending'
    });

  } catch (error) {
    console.error('Verify payment handler error:', error);
    return res.status(500).json({ error: 'Internal server error processing claim.' });
  }
};

function escapeMarkdown(text) {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
