/**
 * GetYourSoft / ANSH AI — Firebase Authentication & User Dashboard Controller
 * Multi-Provider: Google, GitHub, Microsoft, Apple, Email/Password
 */

(function () {
  'use strict';

  var cfg = window.ANSH_CONFIG ? window.ANSH_CONFIG.FIREBASE : {};
  var isConfigured = false;

  // Initialize Firebase Client SDK if available
  if (window.firebase && cfg.apiKey && !cfg.apiKey.includes('YOUR-FIREBASE-API-KEY')) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(cfg);
      }
      isConfigured = true;
      console.log('[ANSH Auth] Firebase initialized successfully.');
    } catch (err) {
      console.warn('[ANSH Auth] Firebase initialization notice:', err);
    }
  }

  // DOM Elements
  var authForm = document.getElementById('auth-form');
  var authTabSignIn = document.getElementById('tab-signin');
  var authTabSignUp = document.getElementById('tab-signup');
  var emailInput = document.getElementById('auth-email');
  var passwordInput = document.getElementById('auth-password');
  var confirmPasswordGroup = document.getElementById('auth-confirm-group');
  var confirmPasswordInput = document.getElementById('auth-confirm-password');
  var submitBtn = document.getElementById('auth-submit-btn');
  var authStatusMsg = document.getElementById('auth-status-msg');
  var togglePasswordBtn = document.getElementById('toggle-password-btn');
  var forgotPasswordBtn = document.getElementById('forgot-password-btn');

  var unloggedContainer = document.getElementById('auth-unlogged-container');
  var loggedContainer = document.getElementById('auth-logged-container');
  var userAvatar = document.getElementById('dash-user-avatar');
  var userName = document.getElementById('dash-user-name');
  var userEmail = document.getElementById('dash-user-email');
  var userRoleBadge = document.getElementById('dash-user-role');
  var licenseBadge = document.getElementById('dash-license-badge');
  var licenseKeyDisplay = document.getElementById('dash-license-key');
  var copyKeyBtn = document.getElementById('dash-copy-key-btn');
  var signOutBtn = document.getElementById('dash-signout-btn');
  var deleteAccountBtn = document.getElementById('dash-delete-account-btn');

  var isSignUpMode = false;

  // 1. Tab Switching (Sign In ⟷ Sign Up)
  if (authTabSignIn && authTabSignUp) {
    authTabSignIn.addEventListener('click', function () {
      isSignUpMode = false;
      authTabSignIn.classList.add('active');
      authTabSignUp.classList.remove('active');
      if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'none';
      if (submitBtn) submitBtn.textContent = 'Sign In to Dashboard';
      clearStatus();
    });

    authTabSignUp.addEventListener('click', function () {
      isSignUpMode = true;
      authTabSignUp.classList.add('active');
      authTabSignIn.classList.remove('active');
      if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'block';
      if (submitBtn) submitBtn.textContent = 'Create New Account';
      clearStatus();
    });
  }

  // 2. Toggle Password Visibility
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', function () {
      var isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      togglePasswordBtn.innerHTML = isPassword 
        ? '<i class="fa-regular fa-eye-slash"></i>' 
        : '<i class="fa-regular fa-eye"></i>';
    });
  }

  function showStatus(message, isError) {
    if (!authStatusMsg) return;
    authStatusMsg.textContent = message;
    authStatusMsg.className = 'auth-status ' + (isError ? 'status-error' : 'status-success');
    authStatusMsg.style.display = 'block';
  }

  function clearStatus() {
    if (!authStatusMsg) return;
    authStatusMsg.textContent = '';
    authStatusMsg.style.display = 'none';
  }

  // 3. Render Logged-In User Dashboard
  function renderDashboard(user) {
    if (!unloggedContainer || !loggedContainer) return;

    unloggedContainer.style.display = 'none';
    loggedContainer.style.display = 'block';

    if (userName) userName.textContent = user.displayName || user.email.split('@')[0] || 'Ansh AI User';
    if (userEmail) userEmail.textContent = user.email || 'user@example.com';
    if (userAvatar && user.photoURL) userAvatar.src = user.photoURL;

    // License & Key Info
    var savedLicense = localStorage.getItem('ansh_license') || user.licenseKey;
    var savedPlan = localStorage.getItem('ansh_plan') || user.plan || 'Free 72-Hr Evaluation Trial';

    if (licenseBadge) {
      licenseBadge.textContent = savedPlan;
      licenseBadge.className = 'license-badge ' + (savedLicense ? 'badge-active' : 'badge-trial');
    }

    if (licenseKeyDisplay) {
      licenseKeyDisplay.textContent = savedLicense || 'ANSH-DEMO-TRIAL-KEY';
    }

    if (userRoleBadge) {
      userRoleBadge.textContent = (user.role === 'admin') ? 'Admin' : 'Operator';
    }

    // Save session in local storage
    localStorage.setItem('ansh_user_session', JSON.stringify({
      uid: user.uid || 'usr_' + Date.now(),
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: user.role || 'user',
      plan: savedPlan,
      licenseKey: savedLicense
    }));
  }

  function renderLoggedOut() {
    if (!unloggedContainer || !loggedContainer) return;
    unloggedContainer.style.display = 'block';
    loggedContainer.style.display = 'none';
    localStorage.removeItem('ansh_user_session');
  }

  // 4. Copy License Key Handler
  if (copyKeyBtn && licenseKeyDisplay) {
    copyKeyBtn.addEventListener('click', function () {
      var key = licenseKeyDisplay.textContent.trim();
      if (!key) return;
      navigator.clipboard.writeText(key).then(function () {
        var orig = copyKeyBtn.innerHTML;
        copyKeyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(function () { copyKeyBtn.innerHTML = orig; }, 2000);
      });
    });
  }

  // 5. Sign Out Handler
  if (signOutBtn) {
    signOutBtn.addEventListener('click', function () {
      if (isConfigured && firebase.auth) {
        firebase.auth().signOut().then(renderLoggedOut).catch(renderLoggedOut);
      } else {
        renderLoggedOut();
      }
    });
  }

  // 6. Delete Account Handler
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', function () {
      if (confirm('Are you sure you want to delete your ANSH AI account? This cannot be undone.')) {
        if (isConfigured && firebase.auth && firebase.auth().currentUser) {
          firebase.auth().currentUser.delete().then(renderLoggedOut).catch(function (err) {
            alert('Re-authentication required before deleting account: ' + err.message);
          });
        } else {
          renderLoggedOut();
        }
      }
    });
  }

  // 7. Forgot Password
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', function () {
      var email = emailInput ? emailInput.value.trim() : '';
      if (!email) {
        showStatus('Please enter your email address above to receive a reset link.', true);
        return;
      }
      if (isConfigured && firebase.auth) {
        firebase.auth().sendPasswordResetEmail(email).then(function () {
          showStatus('Password reset link sent to ' + email + '. Check your inbox.', false);
        }).catch(function (err) {
          showStatus(err.message, true);
        });
      } else {
        showStatus('Demo Mode: Password reset link simulated for ' + email, false);
      }
    });
  }

  // 8. Form Submission (Email / Password)
  if (authForm) {
    authForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearStatus();

      var email = emailInput ? emailInput.value.trim() : '';
      var password = passwordInput ? passwordInput.value : '';

      if (!email || !password) {
        showStatus('Please enter both email and password.', true);
        return;
      }

      if (isSignUpMode) {
        var confirmPass = confirmPasswordInput ? confirmPasswordInput.value : '';
        if (password !== confirmPass) {
          showStatus('Passwords do not match.', true);
          return;
        }
        if (password.length < 6) {
          showStatus('Password must be at least 6 characters.', true);
          return;
        }

        if (isConfigured && firebase.auth) {
          firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(function (res) {
              syncFirestoreUser(res.user, 'password');
              renderDashboard(res.user);
            })
            .catch(function (err) {
              showStatus(err.message, true);
            });
        } else {
          // Demo fallback
          renderDashboard({
            email: email,
            displayName: email.split('@')[0],
            photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&auto=format&fit=crop&q=80',
            plan: 'Trial (Evaluation)',
            licenseKey: 'ANSH-TRIAL-DEMO-0001'
          });
        }
      } else {
        // Sign In
        if (isConfigured && firebase.auth) {
          firebase.auth().signInWithEmailAndPassword(email, password)
            .then(function (res) {
              renderDashboard(res.user);
            })
            .catch(function (err) {
              showStatus(err.message, true);
            });
        } else {
          renderDashboard({
            email: email,
            displayName: email.split('@')[0],
            photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&auto=format&fit=crop&q=80',
            plan: 'Free Trial',
            licenseKey: 'ANSH-FREE-TRIAL-KEY'
          });
        }
      }
    });
  }

  // 9. Sync User to Firestore on Registration
  function syncFirestoreUser(user, providerId) {
    if (!window.firebase || !firebase.firestore) return;
    try {
      var db = firebase.firestore();
      db.collection('users').doc(user.uid).set({
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '',
        provider: providerId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        role: 'user',
        licenseKey: null,
        trialStartedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[ANSH Firestore] User sync warning:', e);
    }
  }

  // 10. OAuth Provider Handlers
  function handleOAuth(providerName) {
    clearStatus();
    if (!isConfigured || !firebase.auth) {
      // Offline / Demo simulation for immediate UX test
      renderDashboard({
        email: 'developer.' + providerName + '@example.com',
        displayName: 'Ansh Pilot (' + providerName.toUpperCase() + ')',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
        plan: 'Lifetime (Demo)',
        licenseKey: 'ANSH-PROD-9999-DEMO'
      });
      return;
    }

    var provider;
    if (providerName === 'google') provider = new firebase.auth.GoogleAuthProvider();
    else if (providerName === 'github') provider = new firebase.auth.GithubAuthProvider();
    else if (providerName === 'microsoft') provider = new firebase.auth.OAuthProvider('microsoft.com');
    else if (providerName === 'apple') provider = new firebase.auth.OAuthProvider('apple.com');

    if (!provider) return;

    // Try popup, fallback to redirect if popup closed or on mobile
    firebase.auth().signInWithPopup(provider)
      .then(function (result) {
        syncFirestoreUser(result.user, providerName);
        renderDashboard(result.user);
      })
      .catch(function (error) {
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
          showStatus('Sign in was cancelled.', true);
        } else if (error.code === 'auth/popup-blocked') {
          firebase.auth().signInWithRedirect(provider);
        } else {
          showStatus(error.message, true);
        }
      });
  }

  // Bind OAuth buttons
  ['google', 'github', 'microsoft', 'apple'].forEach(function (p) {
    var btn = document.getElementById('oauth-' + p + '-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        handleOAuth(p);
      });
    }
  });

  // 11. Persistent Auth Listener & Saved Local Session
  var savedSession = localStorage.getItem('ansh_user_session');
  if (savedSession) {
    try {
      renderDashboard(JSON.parse(savedSession));
    } catch (e) {}
  }

  if (isConfigured && firebase.auth) {
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        renderDashboard(user);
      }
    });
  }

})();
