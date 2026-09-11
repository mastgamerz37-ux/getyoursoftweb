/**
 * GetYourSoft / ANSH AI — Checkout & Payment Verification Controller
 * FamPay QR (7037048415@fam) + 12-Digit UTR Verification + Real-Time Key Delivery
 */

(function () {
  'use strict';

  var cfg = window.ANSH_CONFIG || {};
  var paymentCfg = cfg.PAYMENT || {
    UPI_ID: '7037048415@fam',
    MERCHANT_NAME: 'GetYourSoft',
    MONTHLY_PRICE: 199,
    LIFETIME_PRICE: 999
  };

  // State
  var currentPlan = 'lifetime'; // default best value
  var currentAmount = paymentCfg.LIFETIME_PRICE;
  var currentTxnId = null;
  var firestoreUnsubscribe = null;

  // DOM elements
  var planMonthlyRadio = document.getElementById('plan-monthly');
  var planLifetimeRadio = document.getElementById('plan-lifetime');
  var displayAmount = document.getElementById('checkout-display-amount');
  var displayPlanTitle = document.getElementById('checkout-plan-title');
  var qrImage = document.getElementById('fampay-qr-image');
  var upiDeepLinkBtn = document.getElementById('upi-deeplink-btn');

  var upiInput = document.getElementById('payer-upi-id');
  var utrInput = document.getElementById('payer-utr-number');
  var submitBtn = document.getElementById('submit-payment-btn');
  var checkoutError = document.getElementById('checkout-error-msg');

  var checkoutFormCard = document.getElementById('checkout-form-card');
  var checkoutPendingCard = document.getElementById('checkout-pending-card');
  var checkoutSuccessCard = document.getElementById('checkout-success-card');
  var deliveredKeySpan = document.getElementById('delivered-product-key');
  var copyDeliveredKeyBtn = document.getElementById('copy-delivered-key-btn');
  var downloadInstallerBtn = document.getElementById('download-installer-btn');

  // Pre-select plan from URL query param (?plan=monthly or ?plan=lifetime)
  var urlParams = new URLSearchParams(window.location.search);
  var planParam = urlParams.get('plan');
  if (planParam === 'monthly') {
    currentPlan = 'monthly';
    currentAmount = paymentCfg.MONTHLY_PRICE;
    if (planMonthlyRadio) planMonthlyRadio.checked = true;
  } else {
    currentPlan = 'lifetime';
    currentAmount = paymentCfg.LIFETIME_PRICE;
    if (planLifetimeRadio) planLifetimeRadio.checked = true;
  }

  // Update QR and Deep Links
  function updateCheckoutUI() {
    if (displayAmount) displayAmount.textContent = '₹' + currentAmount;
    if (displayPlanTitle) {
      displayPlanTitle.textContent = currentPlan === 'lifetime' 
        ? 'Lifetime Access (Pay Once, Forever)' 
        : 'Monthly Subscription (Cancel Anytime)';
    }

    // Dynamic UPI Intent URL
    var upiUri = 'upi://pay?pa=' + encodeURIComponent(paymentCfg.UPI_ID) +
                 '&pn=' + encodeURIComponent(paymentCfg.MERCHANT_NAME) +
                 '&am=' + currentAmount +
                 '&cu=INR&tn=' + encodeURIComponent('ANSH AI ' + currentPlan.toUpperCase() + ' Plan');

    if (upiDeepLinkBtn) {
      upiDeepLinkBtn.setAttribute('href', upiUri);
    }

    // QR Code generation via reliable QR API
    if (qrImage) {
      var qrData = encodeURIComponent(upiUri);
      qrImage.src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=' + qrData;
    }
  }

  // Plan Radio Event Listeners
  if (planMonthlyRadio) {
    planMonthlyRadio.addEventListener('change', function () {
      if (this.checked) {
        currentPlan = 'monthly';
        currentAmount = paymentCfg.MONTHLY_PRICE;
        updateCheckoutUI();
      }
    });
  }

  if (planLifetimeRadio) {
    planLifetimeRadio.addEventListener('change', function () {
      if (this.checked) {
        currentPlan = 'lifetime';
        currentAmount = paymentCfg.LIFETIME_PRICE;
        updateCheckoutUI();
      }
    });
  }

  updateCheckoutUI();

  // UTR Form Validation
  function showError(msg) {
    if (!checkoutError) return;
    checkoutError.textContent = msg;
    checkoutError.style.display = 'block';
  }

  function clearError() {
    if (!checkoutError) return;
    checkoutError.textContent = '';
    checkoutError.style.display = 'none';
  }

  // Submit Payment Claim
  if (submitBtn) {
    submitBtn.addEventListener('click', function (e) {
      e.preventDefault();
      clearError();

      var upiVal = upiInput ? upiInput.value.trim() : '';
      var utrVal = utrInput ? utrInput.value.trim() : '';

      if (!upiVal || !upiVal.includes('@')) {
        showError('Please enter a valid UPI ID (e.g., yourname@okhdfcbank or 7037048415@fam)');
        if (upiInput) upiInput.focus();
        return;
      }

      // 12-Digit UTR Check
      if (!/^\d{12}$/.test(utrVal)) {
        showError('Please enter a valid 12-digit numeric UPI Reference Number (UTR). Found: ' + utrVal.length + ' digits.');
        if (utrInput) utrInput.focus();
        return;
      }

      // Check local duplicate cache
      var usedUtrs = JSON.parse(localStorage.getItem('ansh_submitted_utrs') || '[]');
      if (usedUtrs.includes(utrVal)) {
        showError('This UTR (' + utrVal + ') has already been submitted. Please check your email or contact support.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Claim...';

      // Auto-capture user email from session
      var session = JSON.parse(localStorage.getItem('ansh_user_session') || '{}');
      var userEmail = session.email || 'guest.' + Date.now() + '@getyoursoft.page.gd';
      var userUid = session.uid || 'guest_' + Date.now();

      var txnPayload = {
        uid: userUid,
        email: userEmail,
        upiId: upiVal,
        utr: utrVal,
        plan: currentPlan,
        amount: currentAmount,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      currentTxnId = 'TXN_' + utrVal;
      usedUtrs.push(utrVal);
      localStorage.setItem('ansh_submitted_utrs', JSON.stringify(usedUtrs));

      // Attempt to post to Vercel Serverless Backend / Telegram
      var apiUrl = (cfg.API_BASE_URL || '') + '/api/verify-payment';
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txnPayload)
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        console.log('[ANSH Payment] Verification response:', data);
      })
      .catch(function (err) {
        console.warn('[ANSH Payment] Serverless endpoint offline or not configured yet:', err);
      })
      .finally(function () {
        enterPendingState(txnPayload);
      });
    });
  }

  // Switch to Real-Time Pending State
  function enterPendingState(txn) {
    if (checkoutFormCard) checkoutFormCard.style.display = 'none';
    if (checkoutPendingCard) checkoutPendingCard.style.display = 'block';

    // Store in localStorage pending queue
    localStorage.setItem('ansh_active_txn', JSON.stringify(txn));

    // Listen via Firestore if initialized
    if (window.firebase && firebase.firestore && !cfg.FIREBASE.apiKey.includes('YOUR-FIREBASE-API-KEY')) {
      try {
        var db = firebase.firestore();
        firestoreUnsubscribe = db.collection('transactions').doc(txn.utr)
          .onSnapshot(function (doc) {
            if (doc.exists) {
              var data = doc.data();
              if (data.status === 'approved') {
                revealProductKey(data.assignedKey || generateMockKey());
              } else if (data.status === 'rejected') {
                showError('Your payment claim was reviewed and rejected. Please double-check your UTR or contact support.');
                if (checkoutPendingCard) checkoutPendingCard.style.display = 'none';
                if (checkoutFormCard) checkoutFormCard.style.display = 'block';
                if (submitBtn) {
                  submitBtn.disabled = false;
                  submitBtn.textContent = 'Verify & Get Product Key';
                }
              }
            }
          });
      } catch (e) {
        console.warn('Firestore listener fallback mode:', e);
      }
    }

    // Friendly demo auto-approval for previewing full flow if testing locally / admin simulation button
    var demoApproveBtn = document.getElementById('demo-instant-approve-btn');
    if (demoApproveBtn) {
      demoApproveBtn.addEventListener('click', function () {
        revealProductKey(generateMockKey());
      });
    }
  }

  // Helper to generate format ANSH-XXXX-XXXX-XXXX
  function generateMockKey() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    function seg() {
      var s = '';
      for (var i = 0; i < 4; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
      return s;
    }
    return 'ANSH-' + seg() + '-' + seg() + '-' + seg();
  }

  // Reveal Product Key Screen Instantly
  function revealProductKey(key) {
    if (firestoreUnsubscribe) firestoreUnsubscribe();

    if (checkoutPendingCard) checkoutPendingCard.style.display = 'none';
    if (checkoutSuccessCard) checkoutSuccessCard.style.display = 'block';

    if (deliveredKeySpan) deliveredKeySpan.textContent = key;

    // Save key to local session
    localStorage.setItem('ansh_license', key);
    localStorage.setItem('ansh_plan', currentPlan === 'lifetime' ? 'Lifetime Commercial License' : 'Monthly License');

    // Confetti effect if canvas available
    try {
      if (window.confetti) window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch(e) {}
  }

  // Copy Key Handler
  if (copyDeliveredKeyBtn && deliveredKeySpan) {
    copyDeliveredKeyBtn.addEventListener('click', function () {
      var key = deliveredKeySpan.textContent.trim();
      navigator.clipboard.writeText(key).then(function () {
        var orig = copyDeliveredKeyBtn.innerHTML;
        copyDeliveredKeyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied to Clipboard!';
        setTimeout(function () { copyDeliveredKeyBtn.innerHTML = orig; }, 2500);
      });
    });
  }

  // Download Trigger
  if (downloadInstallerBtn) {
    downloadInstallerBtn.addEventListener('click', function (e) {
      var url = cfg.DOWNLOADS ? cfg.DOWNLOADS.WINDOWS_INSTALLER : 'https://github.com/anshu-dubey/ansh-ai/releases';
      window.open(url, '_blank');
    });
  }

  // UTR Help Accordion Tabs
  var utrGuideTabs = document.querySelectorAll('.utr-guide-tab');
  var utrGuidePanels = document.querySelectorAll('.utr-guide-panel');
  utrGuideTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = this.getAttribute('data-target');
      utrGuideTabs.forEach(function (t) { t.classList.remove('active'); });
      utrGuidePanels.forEach(function (p) { p.classList.remove('active'); });
      this.classList.add('active');
      var panel = document.getElementById(target);
      if (panel) panel.classList.add('active');
    });
  });

})();
