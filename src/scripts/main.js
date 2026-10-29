/* NIDA, Nigerians in Diaspora Awards. Progressive enhancement only:
   every page is fully readable without this script. */
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  /* ---------- Mobile menu ---------- */
  var toggle = $('[data-menu-toggle]');
  var menu = $('[data-mobile-menu]');
  if (toggle && menu) {
    var label = $('[data-menu-label]', toggle);
    var setMenu = function (open) {
      root.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Close menu' : 'Open menu';
      if (open) { menu.removeAttribute('inert'); var first = $('a', menu); if (first) first.focus({ preventScroll: true }); }
      else { menu.setAttribute('inert', ''); }
    };
    toggle.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    doc.addEventListener('keydown', function (e) {
      if (!root.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { setMenu(false); toggle.focus(); }
      if (e.key === 'Tab') {
        var items = [toggle].concat($$('a', menu));
        var i = items.indexOf(doc.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    window.matchMedia('(min-width: 1081px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- Scroll reveals ---------- */
  var revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Wall of honour: pause control ---------- */
  var wall = $('[data-wall]');
  var wallBtn = $('[data-wall-toggle]');
  if (wall && wallBtn) {
    var pauseIcon = '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" fill="currentColor"/><rect x="7.4" y="1.5" width="2.6" height="9" fill="currentColor"/></svg>';
    var playIcon = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.5v9l8-4.5z" fill="currentColor"/></svg>';
    wallBtn.addEventListener('click', function () {
      var paused = wall.classList.toggle('is-paused');
      wallBtn.setAttribute('aria-pressed', String(paused));
      $('[data-wall-label]', wallBtn).textContent = paused ? 'Play motion' : 'Pause motion';
      $('[data-wall-icon]', wallBtn).innerHTML = paused ? playIcon : pauseIcon;
    });
    // Save battery: stop animating while the hero is off screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        wall.style.setProperty('--play', en[0].isIntersecting ? 'running' : 'paused');
        $$('.honour-wall__track', wall).forEach(function (t) { if (!wall.classList.contains('is-paused')) t.style.animationPlayState = en[0].isIntersecting ? '' : 'paused'; });
      }).observe(wall);
    }
  }

  /* ---------- Tabs helper (roving tabindex + arrow keys) ---------- */
  function setupTabs(tabs, onSelect, vertical) {
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        var fwd = vertical ? 'ArrowDown' : 'ArrowRight';
        var back = vertical ? 'ArrowUp' : 'ArrowLeft';
        if (e.key === fwd) next = (i + 1) % tabs.length;
        if (e.key === back) next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        t.setAttribute('aria-selected', String(i === j));
        t.tabIndex = i === j ? 0 : -1;
      });
      if (focus) tabs[i].focus();
      onSelect(i);
    }
  }

  /* Featured 2025 honourees */
  var feature = $('[data-feature]');
  if (feature) {
    var ftabs = $$('[data-feature-tab]', feature);
    var fimgs = $$('[data-feature-img]', feature);
    setupTabs(ftabs, function (i) {
      var t = ftabs[i];
      fimgs.forEach(function (im, j) { im.classList.toggle('is-active', i === j); });
      $('[data-feature-award]', feature).textContent = t.getAttribute('data-award');
      $('[data-feature-name]', feature).textContent = t.getAttribute('data-name');
      $('[data-feature-excerpt]', feature).textContent = t.getAttribute('data-excerpt');
      $('[data-feature-link]', feature).href = t.getAttribute('data-href');
    }, true);
    ftabs.forEach(function (t) { t.setAttribute('aria-controls', 'feature-stage'); });
    var stage = $('.feature__stage', feature); if (stage) stage.id = 'feature-stage';
  }

  /* Editions */
  $$('[data-tabs]').forEach(function (wrap) {
    var tabs = $$('[role="tab"]', wrap);
    var panels = $$('[role="tabpanel"]', wrap);
    setupTabs(tabs, function (i) {
      panels.forEach(function (p, j) {
        p.hidden = i !== j;
        if (i === j) {
          p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering');
          $$('[data-reveal]', p).forEach(function (el) { el.classList.add('is-in'); });
        }
      });
    }, false);
  });

  /* ---------- Lightbox ---------- */
  var lb = null, lbItems = [], lbIndex = 0, lbReturn = null;
  function buildLightbox() {
    lb = doc.createElement('dialog');
    lb.className = 'lightbox';
    lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML =
      '<div class="lightbox__bar"><span data-lb-count></span><button class="icon-btn" type="button" data-lb-close aria-label="Close photo viewer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="lightbox__stage"><button class="icon-btn lightbox__prev" type="button" data-lb-prev aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6"/></svg></button><img alt="" data-lb-img><button class="icon-btn lightbox__next" type="button" data-lb-next aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button></div>' +
      '<p class="lightbox__caption" data-lb-caption></p>';
    doc.body.appendChild(lb);
    $('[data-lb-close]', lb).addEventListener('click', function () { lb.close(); });
    $('[data-lb-prev]', lb).addEventListener('click', function () { showLb(lbIndex - 1); });
    $('[data-lb-next]', lb).addEventListener('click', function () { showLb(lbIndex + 1); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
      if (e.key === 'ArrowRight') showLb(lbIndex + 1);
    });
    lb.addEventListener('close', function () { root.style.overflow = ''; if (lbReturn) lbReturn.focus(); });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }
  function showLb(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    var item = lbItems[lbIndex];
    var img = $('[data-lb-img]', lb);
    var fresh = img.cloneNode();
    fresh.src = item.getAttribute('data-lightbox');
    fresh.alt = (item.querySelector('img') || {}).alt || '';
    img.replaceWith(fresh);
    $('[data-lb-caption]', lb).textContent = item.getAttribute('data-caption') || '';
    $('[data-lb-count]', lb).textContent = (lbIndex + 1) + ' / ' + lbItems.length;
  }
  doc.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-lightbox]');
    if (!trigger) return;
    if (!lb) buildLightbox();
    var group = trigger.closest('[data-lightbox-group]') || doc;
    lbItems = $$('[data-lightbox]', group).filter(function (el) { return !el.closest('[hidden]'); });
    lbReturn = trigger;
    showLb(lbItems.indexOf(trigger));
    root.style.overflow = 'hidden';
    lb.showModal();
  });

  /* ---------- Awardees archive ---------- */
  var grid = $('[data-awardee-grid]');
  if (grid) {
    var cards = $$('.awardee-card', grid);
    var yearBtns = $$('[data-year-filter]');
    var groupSel = $('[data-group-filter]');
    var search = $('[data-search]');
    var countEl = $('[data-count]');
    var empty = $('[data-empty]');
    var state = { year: 'all', group: 'all', q: '' };
    var params = new URLSearchParams(location.search);
    if (params.get('year')) state.year = params.get('year');
    if (params.get('category')) state.group = params.get('category');
    groupSel.value = state.group;
    if (groupSel.value !== state.group) state.group = groupSel.value = 'all';

    var apply = function (push) {
      var shown = 0;
      cards.forEach(function (c) {
        var ok = (state.year === 'all' || c.getAttribute('data-year') === state.year) &&
          (state.group === 'all' || c.getAttribute('data-group') === state.group) &&
          (!state.q || c.getAttribute('data-search').indexOf(state.q) !== -1);
        c.hidden = !ok;
        if (ok) shown++;
      });
      yearBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-year-filter') === state.year)); });
      countEl.textContent = shown === cards.length ? 'Showing all ' + shown + ' awardees' : 'Showing ' + shown + ' of ' + cards.length + ' awardees';
      empty.hidden = shown !== 0;
      if (push) {
        var p = new URLSearchParams();
        if (state.year !== 'all') p.set('year', state.year);
        if (state.group !== 'all') p.set('category', state.group);
        history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '') + location.hash);
      }
    };
    yearBtns.forEach(function (b) { b.addEventListener('click', function () { state.year = b.getAttribute('data-year-filter'); apply(true); }); });
    groupSel.addEventListener('change', function () { state.group = groupSel.value; apply(true); });
    search.addEventListener('input', function () { state.q = search.value.trim().toLowerCase(); apply(false); });
    $('[data-reset]').addEventListener('click', function () { state = { year: 'all', group: 'all', q: '' }; groupSel.value = 'all'; search.value = ''; apply(true); });
    apply(false);

    // Old links used #slug on this page; send them to the honouree's own page
    if (location.hash.length > 1) {
      var old = doc.getElementById(decodeURIComponent(location.hash.slice(1)));
      var link = old && $('a', old);
      if (link) location.replace(link.href);
    }
  }

  /* ---------- Gallery filter ---------- */
  var gal = $('[data-gallery]');
  if (gal) {
    var gBtns = $$('[data-gallery-filter]');
    var gItems = $$('.gallery-item', gal);
    var setYear;
    gBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var y = b.getAttribute('data-gallery-filter');
        setYear(y);
        history.replaceState(null, '', location.pathname + (y === 'all' ? '' : '?year=' + y));
      });
    });
    // Show the photos in batches so long galleries stay manageable on phones
    var batch = window.matchMedia('(max-width: 760px)').matches ? 12 : 24;
    var moreBtn = $('[data-gallery-more]');
    var shownCount = batch;
    var applyBatch = function () {
      var visible = gItems.filter(function (it) { return !it.hasAttribute('data-filtered'); });
      visible.forEach(function (it, i) { it.hidden = i >= shownCount; if (!it.hidden) it.classList.add('is-in'); });
      gItems.forEach(function (it) { if (it.hasAttribute('data-filtered')) it.hidden = true; });
      if (moreBtn) {
        var left = visible.length - shownCount;
        moreBtn.hidden = left <= 0;
        $('[data-gallery-left]', moreBtn).textContent = left > 0 ? String(left) : '';
      }
    };
    setYear = function (y) {
      gBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-gallery-filter') === y)); });
      gItems.forEach(function (it) { if (y === 'all' || it.getAttribute('data-year') === y) it.removeAttribute('data-filtered'); else it.setAttribute('data-filtered', ''); });
      shownCount = batch;
      applyBatch();
    };
    if (moreBtn) moreBtn.addEventListener('click', function () {
      var firstNew = gItems.filter(function (it) { return !it.hasAttribute('data-filtered'); })[shownCount];
      shownCount += batch; applyBatch();
      var btn = firstNew && $('button', firstNew); if (btn) btn.focus();
    });
    setYear('all');
    var gy = new URLSearchParams(location.search).get('year');
    if (gy && gBtns.some(function (b) { return b.getAttribute('data-gallery-filter') === gy; })) setYear(gy);
  }

  /* ---------- Editions page: highlight current year ---------- */
  var spies = $$('[data-spy]');
  if (spies.length) {
    // Watch a thin line at 40% of the screen; the edition crossing it is current (the first one by default)
    var setCurrent = function (id) { spies.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('data-spy') === id); }); };
    setCurrent(spies[0].getAttribute('data-spy'));
    if ('IntersectionObserver' in window) {
      var spyIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) setCurrent(en.target.id); });
      }, { rootMargin: '-40% 0px -59% 0px' });
      spies.forEach(function (a) { var t = doc.getElementById(a.getAttribute('data-spy')); if (t) spyIO.observe(t); });
    }
  }

  /* ---------- Forms ---------- */
  function validate(form) {
    var firstBad = null;
    $$('input, select, textarea', form).forEach(function (f) {
      if (f.name === '_gotcha') return;
      var err = f.parentElement.querySelector('[data-error]');
      var msg = '';
      if (f.required && !f.value.trim()) msg = 'This field is required.';
      else if (f.type === 'email' && f.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value)) msg = 'Please enter a valid email address.';
      f.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      if (msg && !firstBad) firstBad = f;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  $$('form[data-ajax-form], form[data-mailto-form]').forEach(function (form) {
    var status = $('[data-form-status]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = ''; status.removeAttribute('data-state');
      if (!validate(form)) return;
      var hp = form.querySelector('[name="_gotcha"]');
      if (hp && hp.value) return; // spam trap

      if (form.hasAttribute('data-mailto-form')) {
        var to = form.getAttribute('data-mailto-form');
        var name = (form.elements.name && form.elements.name.value.trim()) || '';
        var from = form.elements.email.value.trim();
        var subject = 'Website enquiry' + (name ? ' from ' + name : '');
        var bodyText = form.elements.message.value.trim() + '\n\n— ' + (name ? name + ' · ' : '') + from;
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyText);
        status.textContent = 'Your email app should now open with your message to ' + to + '. If nothing happened, please email us directly at that address.';
        return;
      }

      var btn = form.querySelector('[type="submit"]');
      btn.setAttribute('aria-disabled', 'true');
      status.textContent = 'Sending…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); })
        .then(function () { form.reset(); status.textContent = form.getAttribute('data-success'); })
        .catch(function () {
          status.setAttribute('data-state', 'error');
          status.textContent = 'Sorry, your submission could not be sent. Please try again, or email nida@friendsofnigeria.net.';
        })
        .then(function () { btn.removeAttribute('aria-disabled'); });
    });
  });
  /* ---------- Mailing list ("Save the date") ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
  $$('form[data-newsletter]').forEach(function (form) {
    var input = form.elements.email;
    var err = $('[data-error]', form);
    var status = $('[data-form-status]', form);
    var btn = $('[type="submit"]', form);
    var mode = form.getAttribute('data-newsletter');
    var setError = function (msg) {
      err.textContent = msg;
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };
    var done = function (msg, isError) {
      status.textContent = msg;
      if (isError) status.setAttribute('data-state', 'error'); else status.removeAttribute('data-state');
    };
    input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true' && EMAIL_RE.test(input.value.trim())) setError(''); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      done('', false);
      var email = input.value.trim();
      if (!email) { setError('Please enter your email address.'); input.focus(); return; }
      if (!EMAIL_RE.test(email)) { setError('Please enter a valid email address, for example name@example.com.'); input.focus(); return; }
      setError('');
      var hp = form.querySelector('[name="_gotcha"]');
      if (hp && hp.value) return; // spam trap
      var edition = form.getAttribute('data-edition');

      if (mode === 'mailto') {
        var to = form.getAttribute('data-to');
        var subject = 'Subscribe me to NIDA ' + edition + ' updates';
        var body = 'Hello NIDA team,\n\nPlease add ' + email + ' to the NIDA mailing list so I hear about NIDA ' + edition + ' (date, nominations and tickets) when they are announced.\n\nThank you.';
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        done('Almost done: your email app should now be open with a subscription request to ' + to + '. Please press send. If nothing opened, email ' + to + ' with the subject “' + subject + '”.', false);
        return;
      }

      btn.setAttribute('aria-disabled', 'true');
      done('Subscribing…', false);
      var ok = function () { form.reset(); done('Thank you. ' + email + ' is on the list for NIDA ' + edition + ' news.', false); };
      var fail = function (msg) { done(msg || 'Sorry, we could not subscribe you just now. Please try again in a moment, or email ' + form.getAttribute('data-to') + '.', true); };
      var finish = function () { btn.removeAttribute('aria-disabled'); };

      if (mode === 'mailchimp') {
        // Mailchimp embedded forms answer JSONP on the post-json endpoint
        var cb = 'nidaMc' + Date.now();
        var url = form.action.replace('/post?', '/post-json?') + '&EMAIL=' + encodeURIComponent(email) + '&c=' + cb;
        var s = doc.createElement('script');
        var timer = setTimeout(function () { cleanup(); fail(); finish(); }, 12000);
        var cleanup = function () { clearTimeout(timer); try { delete window[cb]; } catch (x) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); };
        window[cb] = function (r) {
          cleanup();
          if (r && r.result === 'success') ok();
          else if (r && /already subscribed/i.test(r.msg || '')) { form.reset(); done('You are already on the list. Thank you!', false); }
          else fail();
          finish();
        };
        s.onerror = function () { cleanup(); fail(); finish(); };
        s.src = url;
        doc.body.appendChild(s);
        return;
      }

      var data = new FormData(form);
      fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); ok(); })
        .catch(function () { fail(); })
        .then(finish);
    });
  });

  /* ---------- Share links (honouree pages) ---------- */
  $$('[data-share]').forEach(function (box) {
    var url = box.getAttribute('data-url');
    var status = $('[data-share-status]', box);
    var copyBtn = $('[data-copy-link]', box);
    var nativeLi = $('.share__native', box);
    var say = function (msg) { status.textContent = msg; setTimeout(function () { if (status.textContent === msg) status.textContent = ''; }, 4000); };
    copyBtn.addEventListener('click', function () {
      var fallback = function () {
        var t = doc.createElement('textarea'); t.value = url; t.setAttribute('readonly', ''); t.style.position = 'absolute'; t.style.left = '-9999px';
        doc.body.appendChild(t); t.select();
        var okCopy = false; try { okCopy = doc.execCommand('copy'); } catch (x) {}
        doc.body.removeChild(t);
        say(okCopy ? 'Link copied.' : 'Copy this link: ' + url);
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(function () { say('Link copied.'); }, fallback);
      else fallback();
    });
    if (navigator.share && nativeLi) {
      nativeLi.hidden = false;
      $('[data-native-share]', box).addEventListener('click', function () {
        navigator.share({ title: box.getAttribute('data-title'), text: box.getAttribute('data-text'), url: url }).catch(function () {});
      });
    }
  });
})();

// Loaded as a module by src/components/ClientScripts.tsx after hydration.
export {};
