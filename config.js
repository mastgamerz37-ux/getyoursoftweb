/**
 * GetYourSoft / ANSH AI — Global Frontend Configuration
 * Configured for InfinityFree (Frontend) + Vercel (Serverless Backend)
 */

const ANSH_CONFIG = {
  // 1. Vercel Backend URL (Update this with your deployed Vercel domain)
  // Example: 'https://ansh-ai-backend.vercel.app'
  API_BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://ansh-ai-backend.vercel.app',

  // 2. Production Domain & Developer Identity
  SITE_DOMAIN: 'getyoursoft.page.gd',
  SITE_NAME: 'GetYourSoft — ANSH AI',
  DEVELOPER_NAME: 'Anshu Dubey',
  DEVELOPER_LOCATION: 'Barnahal, India',
  CONTACT_EMAIL: 'mastgamerz37@gmail.com',

  // 3. Payment & FamPay Details
  PAYMENT: {
    UPI_ID: '7037048415@fam',
    MERCHANT_NAME: 'GetYourSoft',
    MONTHLY_PRICE: 199,
    LIFETIME_PRICE: 999,
    CURRENCY: 'INR',
    CURRENCY_SYMBOL: '₹'
  },

  // 4. Live Firebase Configuration (Provided by Anshu Dubey)
  FIREBASE: {
    apiKey: "AIzaSyAvyHL9TaeoWJB7YT8k5ABZIOWoH6oPAiQ",
    authDomain: "intelligent-ansh.firebaseapp.com",
    projectId: "intelligent-ansh",
    storageBucket: "intelligent-ansh.firebasestorage.app",
    messagingSenderId: "232047507688",
    appId: "1:232047507688:web:a1f7635ec588a28155f15d",
    measurementId: "G-FR643S6NGM"
  },

  // 5. Telegram Bot Details
  TELEGRAM: {
    BOT_USERNAME: 'AnshAIBot',
    ADMIN_ALERT_CHANNEL: '@AnshAdminAlerts'
  },

  // 6. Application Download
  DOWNLOADS: {
    WINDOWS_INSTALLER: 'https://github.com/anshu-dubey/ansh-ai/releases/latest/download/AnshAI-Setup-v1.0.0.exe',
    VERSION: 'v1.0.0',
    RELEASE_DATE: 'September 2026',
    FILE_SIZE: '142 MB',
    MIN_WINDOWS: 'Windows 10 / 11 (64-bit)'
  }
};

// Expose globally for browser usage
window.ANSH_CONFIG = ANSH_CONFIG;
