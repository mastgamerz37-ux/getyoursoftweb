/**
 * Vercel Serverless Function: /api/telegram-webhook
 * Handles Telegram Bot inline button callbacks (Approve / Reject)
 */

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Telegram Webhook Ready');
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN || '8858503234:AAEmc0Zw-fziNwxjcuw_3hGpEPfa55X4vQU';
  if (!botToken) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not configured' });
  }

  try {
    const update = req.body;
    const callbackQuery = update.callback_query;

    if (!callbackQuery) {
      // Normal message or ping
      return res.status(200).json({ ok: true });
    }

    const callbackId = callbackQuery.id;
    const data = callbackQuery.data || ''; // format: 'approve:UTR:EMAIL:PLAN' or 'reject:UTR:EMAIL'
    const messageId = callbackQuery.message.message_id;
    const chatId = callbackQuery.message.chat.id;

    const parts = data.split(':');
    const action = parts[0];
    const utr = parts[1];
    const email = parts[2];
    const plan = parts[3] || 'lifetime';

    if (action === 'approve') {
      // 1. Generate Product Key
      const key = generateKey();

      // 2. Dispatch Email via Resend if configured
      try {
        const emailEndpoint = (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000') + '/api/send-email';
        await fetch(emailEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toEmail: email, productKey: key, plan: plan, utr: utr })
        });
      } catch (mailErr) {
        console.warn('Email dispatch failed:', mailErr);
      }

      // 3. Answer Telegram Callback
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackId,
          text: `✅ Payment Approved! Key ${key} generated & sent.`,
          show_alert: true
        })
      });

      // 4. Edit Telegram Message
      const updatedText = `✅ *APPROVED & DELIVERED*\n\n` +
        `📦 *Plan:* ${plan.toUpperCase()}\n` +
        `🔢 *UTR:* \`${utr}\`\n` +
        `📧 *Customer:* \`${email}\`\n` +
        `🔑 *Product Key:* \`${key}\`\n\n` +
        `_Activation instructions emailed via Resend\\._`;

      await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: 'MarkdownV2',
          reply_markup: { inline_keyboard: [] }
        })
      });

    } else if (action === 'reject') {
      // 1. Answer Callback
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackId,
          text: `❌ Payment claim for UTR ${utr} has been rejected.`,
          show_alert: true
        })
      });

      // 2. Edit Message
      const updatedText = `❌ *PAYMENT CLAIM REJECTED*\n\n` +
        `🔢 *UTR:* \`${utr}\`\n` +
        `📧 *User:* \`${email}\`\n\n` +
        `_UTR was rejected after manual audit\\._`;

      await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: 'MarkdownV2',
          reply_markup: { inline_keyboard: [] }
        })
      });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Telegram webhook handler error:', err);
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
