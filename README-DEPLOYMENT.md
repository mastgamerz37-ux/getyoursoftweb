# 🚀 GetYourSoft / ANSH AI — Deployment Guide

This project is specifically architected for:
- **Frontend**: Uploaded to **InfinityFree** (`htdocs/` static hosting with Apache `.htaccess`)
- **Backend**: Hosted on **Vercel** (Serverless Node.js endpoints for Telegram Bot & Resend Email)

---

## 📁 PART 1: Deploying the Frontend to InfinityFree

### Step 1: Prepare the Files
Upload the following files and folders directly to your InfinityFree **`htdocs/`** directory (via InfinityFree File Manager or FileZilla FTP):

```
htdocs/
├── index.html          # Homepage with 3D Orb & 16 Features
├── pricing.html        # Pricing matrix (Monthly ₹199 vs Lifetime ₹999)
├── checkout.html       # FamPay QR (7037048415@fam) & UTR Verification
├── signin.html         # Firebase Auth & User Dashboard
├── admin.html          # 8-Section Admin Management Panel
├── docs.html           # 11-Chapter User Guide & Technical Docs
├── privacy.html        # Privacy Policy (Biometric, Screen Peeler)
├── terms.html          # Terms & Conditions / EULA
├── refund.html         # Refund & Cancellation Policy
├── config.js           # Central configuration file
├── styles.css          # Master design system
├── .htaccess           # Apache Gzip compression, caching & clean URLs
├── robots.txt          # SEO crawlers configuration
├── sitemap.xml         # XML sitemap
├── js/
│   ├── orb3d.js        # Three.js 3D AI Orb with 6 reactive states
│   ├── auth.js         # Firebase Auth controller
│   ├── checkout.js     # UTR validation & real-time key delivery
│   ├── admin.js        # Admin dashboard operations
│   └── docs.js         # Docs search, scrollspy & code copying
└── assets/
    └── logo.svg
```

### Step 2: Configure `config.js`
Open `config.js` and set:
1. `API_BASE_URL`: Replace with your deployed Vercel URL (e.g., `https://ansh-backend.vercel.app`).
2. `FIREBASE`: Enter your Firebase project credentials from [Firebase Console](https://console.firebase.google.com).
3. `PAYMENT`: FamPay UPI ID `7037048415@fam` is already configured.

---

## ⚡ PART 2: Deploying the Backend to Vercel

### Step 1: Deploy to Vercel
You can deploy using GitHub or the Vercel CLI:
```bash
# Option A: With Vercel CLI
npm i -g vercel
cd "d:\ansh website"
vercel
```
Or push the repository to GitHub and import it on [vercel.com](https://vercel.com).

### Step 2: Set Environment Variables in Vercel
Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and add:

| Key | Configured Value | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | `your_telegram_bot_token` | Live Bot Token from `@BotFather` |
| `TELEGRAM_ADMIN_CHAT_ID` | `your_chat_id` | Your Telegram User/Chat ID (get it from `@userinfobot`) |
| `RESEND_API_KEY` | `your_resend_api_key` | Configured Live Resend Key |
| `RESEND_FROM_EMAIL` | `ANSH AI <onboarding@resend.dev>` | Verified sender email on Resend |
| `ADMIN_PASSKEY` | `ansh2026` | Admin passkey to unlock `/admin.html` |
| `DOWNLOAD_URL` | `https://github.com/anshu-dubey/ansh-ai/releases/latest/download/AnshAI-Setup-v2.5.0.exe` | Direct Windows installer download |

### Step 3: Register the Telegram Bot Webhook
Once you deploy to Vercel, open your browser and run this one-time URL (replace `<YOUR_BOT_TOKEN>` with your bot token and `<YOUR_VERCEL_DOMAIN>` with your actual Vercel URL, e.g. `ansh-ai-backend.vercel.app`):
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_VERCEL_DOMAIN>/api/telegram-webhook
```
When successful, Telegram will respond:
`{"ok":true,"result":true,"description":"Webhook was set"}`

---

## 🔄 PART 3: End-to-End Payment Approval Workflow

1. User visits `checkout.html` and selects **Lifetime (₹999)** or **Monthly (₹199)**.
2. Scans the FamPay QR code for `7037048415@fam` using PhonePe, Google Pay, Paytm, or FamPay.
3. Enters their 12-digit UTR and UPI ID, then clicks **"Verify & Get Product Key"**.
4. The system validates the 12-digit UTR format and prevents duplicate submissions.
5. Your Telegram Bot sends an instant notification with inline buttons:
   ```
   🔔 New Payment Claim Received!
   📦 Plan: Lifetime (₹999)
   🔢 UTR: 425518291034
   👤 UPI ID: user@okhdfcbank
   📧 User Email: user@gmail.com
   [✅ Approve]   [❌ Reject]
   ```
6. You check your FamPay app to verify the ₹999 credit, then tap **[✅ Approve]** inside Telegram!
7. The Telegram webhook triggers:
   - Generates a unique product key: `ANSH-XXXX-XXXX-XXXX`
   - Immediately dispatches a branded HTML email via Resend to the customer
   - Updates the live screen on `checkout.html` in real time, revealing their key and download button!
