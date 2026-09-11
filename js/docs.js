/**
 * GetYourSoft / ANSH AI — Documentation & User Guide Controller
 * GitBook/Stripe-Style Sidebar Navigation + Instant Search + Code Copy
 */

(function () {
  'use strict';

  // 1. Sidebar Scrollspy
  var sidebarLinks = document.querySelectorAll('.docs-nav-link');
  var chapters = document.querySelectorAll('.docs-chapter');

  function updateActiveChapter() {
    var scrollPos = window.scrollY + 140;

    chapters.forEach(function (chapter) {
      var top = chapter.offsetTop;
      var height = chapter.offsetHeight;
      var id = chapter.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        sidebarLinks.forEach(function (link) {
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveChapter, { passive: true });

  // 2. Real-Time Docs Search Filter
  var searchInput = document.getElementById('docs-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      var query = this.value.toLowerCase().trim();

      chapters.forEach(function (ch) {
        var text = ch.innerText.toLowerCase();
        var id = ch.getAttribute('id');
        var link = document.querySelector('.docs-nav-link[href="#' + id + '"]');

        if (!query || text.includes(query)) {
          ch.style.display = 'block';
          if (link) link.style.display = 'block';
        } else {
          ch.style.display = 'none';
          if (link) link.style.display = 'none';
        }
      });
    });
  }

  // 3. Code Block Copy Buttons
  var codeBlocks = document.querySelectorAll('pre');
  codeBlocks.forEach(function (pre) {
    var copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    copyBtn.title = 'Copy code';

    copyBtn.addEventListener('click', function () {
      var code = pre.querySelector('code');
      var text = code ? code.innerText : pre.innerText;
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color:#10b981;"></i>';
        setTimeout(function () {
          copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        }, 2000);
      });
    });

    pre.style.position = 'relative';
    pre.appendChild(copyBtn);
  });

  // 4. FAQ Accordion Toggle
  var faqItems = document.querySelectorAll('.faq-accordion-header');
  faqItems.forEach(function (header) {
    header.addEventListener('click', function () {
      var item = this.parentElement;
      var isOpen = item.classList.contains('active');
      
      document.querySelectorAll('.faq-accordion-item').forEach(function (el) {
        el.classList.remove('active');
      });

      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });

})();
