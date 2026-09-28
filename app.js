(function () {
  'use strict';

  var C = window.ESFCCC_CONTENT;
  var app = document.getElementById('app');
  var STORE_KEY = 'esfccc-member-v1';
  var installPrompt = null;

  // ── Saved progress (kept only on this phone/computer) ──
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  var state = load();
  state.done = state.done || {};
  state.goals = state.goals || [];
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ext(href, text, cls) {
    return '<a class="btn ' + (cls || '') + '" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
  }

  // ── Pages ──
  function home() {
    var total = C.gettingStarted.length;
    var done = C.gettingStarted.filter(function (s) { return state.done[s.id]; }).length;
    var pct = Math.round((done / total) * 100);

    var coachAction = C.coach.bookingLink
      ? '<a href="' + esc(C.coach.bookingLink) + '" target="_blank" rel="noopener noreferrer"><span class="qi">🗓️</span>Book coaching<small>Pick a time</small></a>'
      : '<a href="#coaching"><span class="qi">🎯</span>My goals<small>Coaching plan</small></a>';

    return '' +
      '<section class="hero">' +
        '<h1>Welcome, member! 👋</h1>' +
        '<p>Everything you get from the Collaborative, all in one place.</p>' +
        '<div class="progress">' +
          '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="progress-label">' + done + ' of ' + total + ' getting-started steps done</div>' +
        '</div>' +
      '</section>' +
      installBanner() +
      '<div class="quick">' +
        '<a href="' + esc(C.council.phoneLink) + '"><span class="qi">📞</span>Call the Council<small>' + esc(C.council.phone) + '</small></a>' +
        coachAction +
        '<a href="#benefits"><span class="qi">⭐</span>My benefits<small>What\'s included</small></a>' +
        '<a href="#events"><span class="qi">📅</span>Events<small>Webinars &amp; workshops</small></a>' +
      '</div>' +
      '<h2 class="section-h">Getting started checklist</h2>' +
      '<div class="card">' +
        C.gettingStarted.map(function (s) {
          return '<label class="check">' +
            '<input type="checkbox" data-step="' + esc(s.id) + '"' + (state.done[s.id] ? ' checked' : '') + ' />' +
            '<span class="box" aria-hidden="true"></span>' +
            '<div><strong>' + esc(s.title) + '</strong><p>' + esc(s.detail) + '</p></div>' +
          '</label>';
        }).join('') +
        '<p class="note">Your checkmarks are saved on this device only.</p>' +
      '</div>';
  }

  function installBanner() {
    if (!installPrompt) return '';
    return '<div class="card install"><span style="font-size:1.6rem">📲</span>' +
      '<p><strong>Add to your home screen</strong><br/>Open the app with one tap, like any other app.</p>' +
      '<button class="btn" data-action="install">Add</button></div>';
  }

  function benefits() {
    return '' +
      '<h1 class="page-title">Your Benefits</h1>' +
      '<p class="page-lead">All free with your membership. Tap a benefit to see who it\'s for and how to use it.</p>' +
      C.benefits.map(function (b) {
        return '<details class="card benefit ' + esc(b.color) + '">' +
          '<summary><span class="b-icon" aria-hidden="true">' + b.icon + '</span>' +
            '<span><span class="b-title">' + esc(b.title) + '</span><span class="b-tag">' + esc(b.tag) + '</span></span></summary>' +
          '<dl class="b-body">' +
            '<dt>Who it\'s for</dt><dd>' + esc(b.who) + '</dd>' +
            '<dt>What you get</dt><dd>' + esc(b.what) + '</dd>' +
            (b.tips && b.tips.length ? '<dt>Good to know</dt><dd><ul>' + b.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></dd>' : '') +
          '</dl>' +
          (b.link ? ext(b.link, esc(b.linkText || 'Learn more') + ' →', 'sky') : '') +
        '</details>';
      }).join('') +
      '<p class="note">Questions about a benefit? Check the Help tab or call ' + esc(C.council.phone) + '.</p>';
  }

  function coaching() {
    var contactBtns = '';
    if (C.coach.bookingLink) contactBtns += ext(C.coach.bookingLink, '🗓️ Book a session');
    if (C.coach.email) contactBtns += '<a class="btn sky" href="mailto:' + esc(C.coach.email) + '?subject=' + encodeURIComponent('ESFCCC coaching') + '">✉️ Email</a>';
    contactBtns += '<a class="btn ghost" href="' + esc(C.council.phoneLink) + '">📞 Call</a>';

    var goals = state.goals.length
      ? state.goals.map(function (g, i) {
          return '<label class="check">' +
            '<input type="checkbox" data-goal="' + i + '"' + (g.done ? ' checked' : '') + ' />' +
            '<span class="box" aria-hidden="true"></span>' +
            '<div><strong>' + esc(g.text) + '</strong></div>' +
            '<button class="goal-del" data-del="' + i + '" aria-label="Remove goal">✕</button>' +
          '</label>';
        }).join('')
      : '<p class="empty">No goals yet. Add one from your last coaching session!</p>';

    return '' +
      '<h1 class="page-title">Business Coaching</h1>' +
      '<p class="page-lead">One-on-one help to grow a stronger, more profitable program.</p>' +
      '<div class="card">' +
        '<div class="contact-row"><div class="ci coach">🎯</div><div><strong>' + esc(C.coach.name) + '</strong><br/><span class="meta">' + esc(C.coach.title) + '</span></div></div>' +
        '<div class="btn-row">' + contactBtns + '</div>' +
      '</div>' +
      '<h2 class="section-h">My business goals</h2>' +
      '<div class="card">' +
        '<form class="goal-form" data-form="goal">' +
          '<input name="goal" maxlength="140" placeholder="e.g. Raise my weekly rate by $10" aria-label="New goal" autocomplete="off" />' +
          '<button class="btn" type="submit">Add</button>' +
        '</form>' +
        '<div style="margin-top:8px">' + goals + '</div>' +
        '<p class="note">Goals are saved on this device only. Bring them to your next session!</p>' +
      '</div>' +
      '<h2 class="section-h">Things we can work on together</h2>' +
      '<div class="chips">' + C.coachingTopics.map(function (t) {
        return '<span class="chip">' + t.icon + ' ' + esc(t.title) + '</span>';
      }).join('') + '</div>';
  }

  function events() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var list = C.events
      .filter(function (e) { return !e.date || parseDate(e.date) >= today; })
      .sort(function (a, b) {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return parseDate(a.date) - parseDate(b.date);
      });

    var body = list.length ? list.map(function (e) {
      var badge;
      if (e.date) {
        var d = parseDate(e.date);
        badge = '<div class="date-badge"><div class="m">' + d.toLocaleString('en-US', { month: 'short' }) + '</div><div class="d">' + d.getDate() + '</div></div>';
      } else {
        badge = '<div class="date-badge tbd">Date<br/>coming<br/>soon</div>';
      }
      var meta = [e.date ? parseDate(e.date).toLocaleDateString('en-US', { weekday: 'long' }) : '', e.time, e.where].filter(Boolean).join(' · ');
      return '<div class="card event">' + badge + '<div>' +
        '<h3>' + esc(e.title) + '</h3>' +
        (meta ? '<div class="meta">' + esc(meta) + '</div>' : '') +
        '<p>' + esc(e.detail) + '</p>' +
        (e.link ? ext(e.link, 'Register →') : '') +
      '</div></div>';
    }).join('') : '<div class="card"><p class="empty">No events posted right now — check back soon!</p></div>';

    return '' +
      '<h1 class="page-title">Events</h1>' +
      '<p class="page-lead">Free webinars and workshops for members and their staff.</p>' +
      body;
  }

  function parseDate(s) {
    var p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function help() {
    return '' +
      '<h1 class="page-title">Help &amp; FAQ</h1>' +
      '<p class="page-lead">Answers to the questions members ask most.</p>' +
      '<input class="faq-search" type="search" placeholder="🔍 Search questions…" aria-label="Search questions" data-search />' +
      '<div class="faq">' + C.faq.map(function (f) {
        return '<details data-q="' + esc((f.q + ' ' + f.a).toLowerCase()) + '"><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>';
      }).join('') + '<p class="empty" data-noresults hidden>No matches. Give us a call and we\'ll help!</p></div>' +
      '<h2 class="section-h">Contact us</h2>' +
      '<div class="card">' +
        '<a class="contact-row" href="' + esc(C.council.phoneLink) + '" style="text-decoration:none;color:inherit"><div class="ci phone">📞</div><div><strong>' + esc(C.council.phone) + '</strong><br/><span class="meta">Call the Council</span></div></a>' +
        '<a class="contact-row" href="' + esc(C.council.mapLink) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit"><div class="ci loc">📍</div><div><strong>' + esc(C.council.address) + '</strong><br/><span class="meta">Get directions</span></div></a>' +
      '</div>' +
      '<div class="card" style="text-align:center">' +
        '<strong>Know a provider who should join?</strong><p class="meta">Membership is free for family and group family child care providers.</p>' +
        ext(C.council.applyLink, 'Share the application →') +
      '</div>' +
      '<div class="logos"><img src="assets/esfccc-logo.png" alt="Empire State Family Child Care Collaborative" /><img src="assets/cccoc-logo.png" alt="Child Care Council of Orange County" /></div>' +
      '<p class="footer-note">Empire State Family Child Care Collaborative<br/>' + esc(C.council.name) + ' · In partnership with the Early Care &amp; Learning Council</p>';
  }

  var pages = { home: home, benefits: benefits, coaching: coaching, events: events, help: help };

  // ── Router ──
  function render(focus) {
    var tab = (location.hash || '#home').slice(1);
    if (!pages[tab]) tab = 'home';
    app.innerHTML = pages[tab]();
    document.querySelectorAll('.tabbar a').forEach(function (a) {
      if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (focus) { window.scrollTo(0, 0); app.focus({ preventScroll: true }); }
  }

  window.addEventListener('hashchange', function () { render(true); });

  // ── Interactions ──
  app.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.step) {
      state.done[t.dataset.step] = t.checked; save();
      var y = window.scrollY; render(false); window.scrollTo(0, y);
    } else if (t.dataset.goal) {
      state.goals[+t.dataset.goal].done = t.checked; save();
    }
  });

  app.addEventListener('click', function (e) {
    var del = e.target.closest('[data-del]');
    if (del) {
      e.preventDefault();
      state.goals.splice(+del.dataset.del, 1); save(); render(false);
      return;
    }
    if (e.target.closest('[data-action="install"]') && installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.finally(function () { installPrompt = null; render(false); });
    }
  });

  app.addEventListener('submit', function (e) {
    if (e.target.dataset.form !== 'goal') return;
    e.preventDefault();
    var input = e.target.elements.goal;
    var text = input.value.trim();
    if (!text) return;
    state.goals.push({ text: text, done: false }); save();
    render(false);
    var again = app.querySelector('.goal-form input');
    if (again) again.focus();
  });

  app.addEventListener('input', function (e) {
    if (!e.target.hasAttribute('data-search')) return;
    var q = e.target.value.trim().toLowerCase();
    var shown = 0;
    app.querySelectorAll('.faq details').forEach(function (d) {
      var hit = !q || d.dataset.q.indexOf(q) !== -1;
      d.hidden = !hit; if (hit) shown++;
    });
    app.querySelector('[data-noresults]').hidden = shown > 0;
  });

  // ── Installable app ──
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); installPrompt = e;
    if ((location.hash || '#home') === '#home') render(false);
  });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  render(false);
})();
