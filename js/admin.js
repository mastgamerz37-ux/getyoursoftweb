/**
 * GetYourSoft / ANSH AI — Admin Panel Controller
 * Role-Protected Dashboard for Operations, Keys, UTR Verifications, and Logs
 */

(function () {
  'use strict';

  var cfg = window.ANSH_CONFIG || {};

  // Verify Admin Access
  var session = JSON.parse(localStorage.getItem('ansh_user_session') || '{}');
  var isAdmin = session.role === 'admin' || session.email === 'mastgamerz37@gmail.com' || localStorage.getItem('ansh_admin_override') === 'true';

  var adminAuthGate = document.getElementById('admin-auth-gate');
  var adminMainLayout = document.getElementById('admin-main-layout');
  var adminPassInput = document.getElementById('admin-passkey-input');
  var adminUnlockBtn = document.getElementById('admin-unlock-btn');

  function unlockAdmin() {
    if (adminAuthGate) adminAuthGate.style.display = 'none';
    if (adminMainLayout) adminMainLayout.style.display = 'grid';
    localStorage.setItem('ansh_admin_override', 'true');
    initAdminData();
  }

  if (isAdmin) {
    unlockAdmin();
  } else {
    if (adminUnlockBtn) {
      adminUnlockBtn.addEventListener('click', function () {
        var val = adminPassInput ? adminPassInput.value.trim() : '';
        if (val === 'ansh2026' || val === 'admin') {
          unlockAdmin();
        } else {
          alert('Invalid admin passkey. Please enter authorized credentials.');
        }
      });
    }
  }

  // 1. Navigation Between Admin Sections
  var navLinks = document.querySelectorAll('.admin-nav-item');
  var sections = document.querySelectorAll('.admin-section-panel');

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var target = this.getAttribute('data-section');
      navLinks.forEach(function (l) { l.classList.remove('active'); });
      sections.forEach(function (s) { s.classList.remove('active'); });

      this.classList.add('active');
      var panel = document.getElementById('section-' + target);
      if (panel) panel.classList.add('active');
    });
  });

  // 2. Initial Data & Mock State
  var transactions = [
    { id: 'TXN-9021', email: 'rahul.sharma@techcorp.in', upiId: 'rahul@okhdfcbank', utr: '425518291034', plan: 'Lifetime', amount: 999, status: 'pending', date: '10 mins ago' },
    { id: 'TXN-9020', email: 'priya.patel@startup.io', upiId: 'priya@fam', utr: '425518118942', plan: 'Monthly', amount: 199, status: 'approved', date: '1 hour ago', key: 'ANSH-K79W-2MNA-90XP' },
    { id: 'TXN-9019', email: 'vikram.singh@gmail.com', upiId: 'vikram@paytm', utr: '425517904512', plan: 'Lifetime', amount: 999, status: 'approved', date: '3 hours ago', key: 'ANSH-4L9P-8VXQ-11ZQ' },
    { id: 'TXN-9018', email: 'fake.payment@test.com', upiId: 'fraud@upi', utr: '111111111111', plan: 'Lifetime', amount: 999, status: 'rejected', date: '5 hours ago' }
  ];

  var users = [
    { name: 'Anshu Dubey', email: 'anshu.dubey@getyoursoft.page.gd', role: 'admin', plan: 'Lifetime (Founder)', status: 'Active' },
    { name: 'Rahul Sharma', email: 'rahul.sharma@techcorp.in', role: 'user', plan: 'Pending Verification', status: 'Pending' },
    { name: 'Priya Patel', email: 'priya.patel@startup.io', role: 'user', plan: 'Monthly Subscriber', status: 'Active' },
    { name: 'Vikram Singh', email: 'vikram.singh@gmail.com', role: 'user', plan: 'Lifetime License', status: 'Active' },
    { name: 'Amit Kumar', email: 'amit.k@delhi.edu', role: 'user', plan: 'Free 72-Hr Trial', status: 'Trial' }
  ];

  var licenses = [
    { key: 'ANSH-K79W-2MNA-90XP', plan: 'Monthly', user: 'priya.patel@startup.io', status: 'active', issued: 'Sep 11, 2026' },
    { key: 'ANSH-4L9P-8VXQ-11ZQ', plan: 'Lifetime', user: 'vikram.singh@gmail.com', status: 'active', issued: 'Sep 11, 2026' },
    { key: 'ANSH-90BB-11KL-44RT', plan: 'Lifetime', user: 'Unassigned', status: 'unused', issued: 'Sep 10, 2026' },
    { key: 'ANSH-77XA-33DF-99PO', plan: 'Lifetime', user: 'revoked.user@domain.com', status: 'revoked', issued: 'Sep 09, 2026' }
  ];

  var refunds = [
    { id: 'REF-001', name: 'Kavita Roy', email: 'kavita@domain.com', key: 'ANSH-77XA-33DF-99PO', amount: 999, reason: 'Unsupported GPU acceleration on old laptop', status: 'Approved' }
  ];

  var messages = [
    { name: 'Deepak Joshi', email: 'deepak@tech.com', subject: 'Enterprise team deployment', status: 'New', time: '2 hrs ago' },
    { name: 'Sneha Rao', email: 'sneha@studio.org', subject: 'Microphone permission issue on Windows 11', status: 'In Progress', time: '1 day ago' }
  ];

  var auditLogs = [
    { time: '19:05:12', action: 'Approved UTR 425518118942', admin: 'Telegram Bot (Webhook)' },
    { time: '18:42:01', action: 'Bulk generated 5 Lifetime Product Keys', admin: 'Anshu Dubey' },
    { time: '17:15:33', action: 'Revoked Key ANSH-77XA-33DF-99PO (Refund Processed)', admin: 'Anshu Dubey' }
  ];

  function initAdminData() {
    renderVerifications();
    renderUsers();
    renderLicenses();
    renderRefunds();
    renderMessages();
    renderAuditLogs();
  }

  // 3. Render Verifications Queue
  function renderVerifications() {
    var tbody = document.getElementById('table-verifications-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    transactions.forEach(function (tx, index) {
      var tr = document.createElement('tr');
      var badgeClass = tx.status === 'approved' ? 'badge-success' : tx.status === 'rejected' ? 'badge-danger' : 'badge-warning';

      tr.innerHTML = 
        '<td><strong>' + tx.id + '</strong></td>' +
        '<td>' + tx.email + '</td>' +
        '<td><code>' + tx.utr + '</code></td>' +
        '<td>' + tx.upiId + '</td>' +
        '<td>' + tx.plan + ' (₹' + tx.amount + ')</td>' +
        '<td><span class="status-pill ' + badgeClass + '">' + tx.status.toUpperCase() + '</span></td>' +
        '<td>' +
          (tx.status === 'pending'
            ? '<button class="btn-sm btn-approve" data-idx="' + index + '"><i class="fa-solid fa-check"></i> Approve</button> ' +
              '<button class="btn-sm btn-reject" data-idx="' + index + '"><i class="fa-solid fa-xmark"></i> Reject</button>'
            : '<span style="color:var(--muted); font-size:12px;">' + (tx.key || 'Completed') + '</span>') +
        '</td>';
      tbody.appendChild(tr);
    });

    // Wire approve / reject buttons
    tbody.querySelectorAll('.btn-approve').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        var tx = transactions[idx];
        var newKey = generateKey();
        tx.status = 'approved';
        tx.key = newKey;

        // Add to licenses
        licenses.unshift({ key: newKey, plan: tx.plan, user: tx.email, status: 'active', issued: 'Just now' });

        // Add audit
        auditLogs.unshift({ time: new Date().toLocaleTimeString(), action: 'Manually Approved UTR ' + tx.utr + ' (Key: ' + newKey + ')', admin: 'Anshu Dubey (Admin Panel)' });

        initAdminData();
        alert('Transaction ' + tx.id + ' Approved!\nLicense Key: ' + newKey + ' has been assigned to ' + tx.email);
      });
    });

    tbody.querySelectorAll('.btn-reject').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        var tx = transactions[idx];
        tx.status = 'rejected';

        auditLogs.unshift({ time: new Date().toLocaleTimeString(), action: 'Manually Rejected UTR ' + tx.utr, admin: 'Anshu Dubey (Admin Panel)' });

        initAdminData();
      });
    });
  }

  // 4. Render Users Table
  function renderUsers() {
    var tbody = document.getElementById('table-users-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    users.forEach(function (u) {
      var tr = document.createElement('tr');
      tr.innerHTML = 
        '<td><strong>' + u.name + '</strong></td>' +
        '<td>' + u.email + '</td>' +
        '<td><span class="role-badge ' + (u.role === 'admin' ? 'badge-admin' : '') + '">' + u.role + '</span></td>' +
        '<td>' + u.plan + '</td>' +
        '<td>' + u.status + '</td>' +
        '<td>' +
          '<button class="btn-sm" onclick="alert(\'User details for ' + u.email + '\')">Inspect</button>' +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  // 5. Render Licenses Table
  function renderLicenses() {
    var tbody = document.getElementById('table-licenses-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    licenses.forEach(function (lic, idx) {
      var tr = document.createElement('tr');
      tr.innerHTML = 
        '<td><code>' + lic.key + '</code></td>' +
        '<td>' + lic.plan + '</td>' +
        '<td>' + lic.user + '</td>' +
        '<td><span class="status-pill ' + (lic.status === 'active' ? 'badge-success' : lic.status === 'unused' ? 'badge-warning' : 'badge-danger') + '">' + lic.status + '</span></td>' +
        '<td>' + lic.issued + '</td>' +
        '<td>' +
          (lic.status === 'active'
            ? '<button class="btn-sm btn-revoke" data-idx="' + idx + '">Revoke</button>'
            : '-') +
        '</td>';
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-revoke').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        if (confirm('Revoke license ' + licenses[idx].key + '?')) {
          licenses[idx].status = 'revoked';
          auditLogs.unshift({ time: new Date().toLocaleTimeString(), action: 'Revoked Key ' + licenses[idx].key, admin: 'Anshu Dubey' });
          renderLicenses();
          renderAuditLogs();
        }
      });
    });
  }

  // 6. Bulk Key Generator
  var bulkCountInput = document.getElementById('bulk-key-count');
  var bulkPlanSelect = document.getElementById('bulk-key-plan');
  var bulkGenBtn = document.getElementById('bulk-gen-btn');

  if (bulkGenBtn) {
    bulkGenBtn.addEventListener('click', function () {
      var count = parseInt(bulkCountInput ? bulkCountInput.value : '5', 10) || 5;
      var plan = bulkPlanSelect ? bulkPlanSelect.value : 'Lifetime';
      for (var i = 0; i < count; i++) {
        licenses.unshift({
          key: generateKey(),
          plan: plan,
          user: 'Unassigned',
          status: 'unused',
          issued: 'Just now'
        });
      }
      auditLogs.unshift({ time: new Date().toLocaleTimeString(), action: 'Bulk generated ' + count + ' ' + plan + ' keys', admin: 'Anshu Dubey' });
      renderLicenses();
      renderAuditLogs();
      alert('Generated ' + count + ' new ' + plan + ' license keys.');
    });
  }

  function generateKey() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    function seg() {
      var s = '';
      for (var i = 0; i < 4; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
      return s;
    }
    return 'ANSH-' + seg() + '-' + seg() + '-' + seg();
  }

  // 7. Render Refunds
  function renderRefunds() {
    var tbody = document.getElementById('table-refunds-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    refunds.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.innerHTML = 
        '<td>' + r.id + '</td>' +
        '<td>' + r.name + ' (' + r.email + ')</td>' +
        '<td><code>' + r.key + '</code></td>' +
        '<td>₹' + r.amount + '</td>' +
        '<td>' + r.reason + '</td>' +
        '<td><span class="status-pill badge-success">' + r.status + '</span></td>';
      tbody.appendChild(tr);
    });
  }

  // 8. Render Messages
  function renderMessages() {
    var tbody = document.getElementById('table-messages-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    messages.forEach(function (m) {
      var tr = document.createElement('tr');
      tr.innerHTML = 
        '<td>' + m.name + '</td>' +
        '<td>' + m.email + '</td>' +
        '<td>' + m.subject + '</td>' +
        '<td><span class="status-pill badge-warning">' + m.status + '</span></td>' +
        '<td>' + m.time + '</td>';
      tbody.appendChild(tr);
    });
  }

  // 9. Render Audit Logs
  function renderAuditLogs() {
    var tbody = document.getElementById('table-audit-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    auditLogs.forEach(function (a) {
      var tr = document.createElement('tr');
      tr.innerHTML = 
        '<td><code>' + a.time + '</code></td>' +
        '<td>' + a.action + '</td>' +
        '<td><strong>' + a.admin + '</strong></td>';
      tbody.appendChild(tr);
    });
  }

})();
