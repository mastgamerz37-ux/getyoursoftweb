/**
 * Vercel Serverless Function: /api/send-email
 * Uses Resend API to dispatch branded product key and activation instructions
 */

const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { toEmail, productKey, plan, utr } = req.body || {};

    if (!toEmail || !productKey) {
      return res.status(400).json({ error: 'Missing required recipient email or product key.' });
    }

    // Configured Resend API Key from environment
    const apiKey = process.env.RESEND_API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ error: 'RESEND_API_KEY environment variable is missing.' });
    }
    const resend = new Resend(apiKey);
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'ANSH AI <onboarding@resend.dev>';
    const downloadUrl = process.env.DOWNLOAD_URL || 'https://github.com/anshu-dubey/ansh-ai/releases/latest/download/AnshAI-Setup-v1.0.0.exe';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f9fafb; margin: 0; padding: 30px 15px; }
    .email-card { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 36px 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .logo { text-align: center; margin-bottom: 24px; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #38bdf8; }
    .logo span { color: #f9fafb; }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; text-align: center; margin-bottom: 12px; }
    p { font-size: 15px; line-height: 1.6; color: #94a3b8; }
    .key-box { background: #020617; border: 2px dashed #38bdf8; border-radius: 12px; padding: 22px; text-align: center; margin: 26px 0; box-shadow: 0 0 25px rgba(56, 189, 248, 0.2); }
    .key-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #38bdf8; font-weight: 700; margin-bottom: 6px; }
    .key-code { font-family: monospace; font-size: 26px; font-weight: 800; color: #38bdf8; letter-spacing: 2px; }
    .btn { display: block; width: fit-content; margin: 24px auto; background: linear-gradient(135deg, #38bdf8, #3b82f6); color: #020617 !important; font-weight: 800; font-size: 16px; padding: 14px 32px; border-radius: 50px; text-decoration: none; text-align: center; }
    .steps-box { background: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .steps-box h3 { margin-top: 0; font-size: 15px; color: #f1f5f9; }
    .step-item { display: flex; margin-bottom: 12px; font-size: 14px; color: #cbd5e1; }
    .step-num { background: #38bdf8; color: #020617; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; margin-right: 12px; flex-shrink: 0; }
    .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="email-card">
    <div class="logo">GetYourSoft <span>/ ANSH AI</span></div>
    <h1>🎉 Your ANSH AI Product Key is Ready!</h1>
    <p>Thank you for purchasing <strong>ANSH AI — Your Own AI Friend (${plan === 'monthly' ? 'Monthly Plan' : 'Lifetime Commercial Plan'})</strong>. Your payment via UPI (UTR: <code>${utr || 'Verified'}</code>) has been approved by our team!</p>
    
    <div class="key-box">
      <div class="key-label">Your Commercial Product Key</div>
      <div class="key-code">${productKey}</div>
    </div>

    <a href="${downloadUrl}" class="btn">⬇️ Download ANSH AI for Windows</a>

    <div class="steps-box">
      <h3>🚀 3-Step Quick Activation Guide:</h3>
      <div class="step-item">
        <div class="step-num">1</div>
        <div>Download and run the installer (<code>AnshAI-Setup-v1.0.0.exe</code>) on Windows 10 or 11 (64-bit).</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div>Launch ANSH AI from your Desktop or Start Menu.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div>When prompted, paste your key <strong>${productKey}</strong> to unlock full neural access!</div>
      </div>
    </div>

    <p style="font-size: 13px;">If you ever need support or have questions, reach out to founder <strong>Anshu Dubey</strong> directly at <a href="mailto:mastgamerz37@gmail.com" style="color: #38bdf8;">mastgamerz37@gmail.com</a>.</p>

    <div class="footer">
      GetYourSoft &bull; Built by Anshu Dubey, Barnahal, India<br>
      © 2026 GetYourSoft. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: '🎉 Your ANSH AI Product Key is Here! (' + productKey + ')',
      html: htmlContent
    });

    if (error) {
      console.error('Resend delivery error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, messageId: data.id });

  } catch (err) {
    console.error('Send email error:', err);
    return res.status(500).json({ error: err.message });
  }
};
