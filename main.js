(function () {
  'use strict';

  // 1. Mobile Menu Toggle
  var burgerBtn = document.getElementById('burger-btn');
  var mobileOverlay = document.getElementById('mobile-overlay');
  var mobileMenu = document.getElementById('mobile-menu');
  var body = document.body;

  function toggleMenu() {
    var isOpen = body.classList.toggle('menu-open');
    if (burgerBtn) {
      burgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      burgerBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    }
  }

  function closeMenu() {
    if (body.classList.contains('menu-open')) {
      body.classList.remove('menu-open');
      if (burgerBtn) {
        burgerBtn.setAttribute('aria-expanded', 'false');
        burgerBtn.setAttribute('aria-label', 'Open menu');
      }
    }
  }

  if (burgerBtn) {
    burgerBtn.addEventListener('click', toggleMenu);
  }
  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeMenu);
  }

  // Close on mobile link clicks
  if (mobileMenu) {
    var mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  // Close on Escape key
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      closeMenu();
    }
  });

  // Close on resize > 720px
  window.addEventListener('resize', function () {
    if (window.innerWidth > 720) {
      closeMenu();
    }
  });

  // 2. Count-Up Stats with easeOutCubic & IntersectionObserver
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  var statElements = document.querySelectorAll('.stat-item');
  var animated = false;

  function animateCounters() {
    if (animated) return;
    animated = true;

    statElements.forEach(function (el, index) {
      var valEl = el.querySelector('.stat-value');
      if (!valEl) return;

      var target = parseFloat(el.getAttribute('data-target') || '0');
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var suffix = el.getAttribute('data-suffix') || '';
      
      var duration = 1500 + index * 80;
      var delay = 480 + index * 90;

      setTimeout(function () {
        var startTime = performance.now();

        function update(currentTime) {
          var elapsed = currentTime - startTime;
          var progress = Math.min(elapsed / duration, 1);
          var easedProgress = easeOutCubic(progress);
          var currentVal = easedProgress * target;

          var formatted = decimals > 0 
            ? currentVal.toFixed(decimals) 
            : Math.floor(currentVal).toString();

          valEl.textContent = formatted + suffix;

          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            valEl.textContent = (decimals > 0 ? target.toFixed(decimals) : target.toString()) + suffix;
          }
        }

        requestAnimationFrame(update);
      }, delay);
    });
  }

  if ('IntersectionObserver' in window) {
    var statsContainer = document.querySelector('.stats-footer');
    if (statsContainer) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            animateCounters();
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25 });
      observer.observe(statsContainer);
    }
  } else {
    animateCounters();
  }

})();
