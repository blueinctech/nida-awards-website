/* NIDA home page: dotted globe centred on Nigeria with honourees around it.
   Progressive enhancement: without this script the portraits, links and text
   are all visible, and a CSS globe stands in for the canvas. */
(function () {
  'use strict';
  var stage = document.querySelector('[data-globe]');
  if (!stage) return;

  var canvas = stage.querySelector('canvas');
  var ctx = canvas.getContext && canvas.getContext('2d');
  var people = Array.prototype.slice.call(stage.querySelectorAll('[data-person]'));
  var spot = stage.querySelector('[data-spot]');
  var toggle = stage.querySelector('[data-globe-toggle]');
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = reduceMQ.matches;

  // Brand colours (see AUDIT.md) as RGB
  var GREEN = '1,145,60', GOLD = '245,197,102', PINE = '24,79,34', FOREST = '8,59,30', INK = '4,23,26';
  var NIGERIA = { lon: 8.1, lat: 9.6 };
  var VIEW_LAT = 24 * Math.PI / 180;   // tilt so Europe and Nigeria are both on the visible face
  var VIEW_LON = 6;                    // centre longitude of the sway, degrees
  var SWAY = 26;                       // degrees either side
  var SWAY_PERIOD = 46000;             // ms for a full sway
  var CYCLE = 3800;                    // ms each honouree stays in the spotlight

  var W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R = 0;
  var pts = null, landFlag = null, ngFlag = null, coast = null;
  var anchors = [];                    // portrait centres and radii in canvas pixels
  var ready = false, active = 0, hoverLock = false, paused = false, visible = false, running = false;
  var started = 0, pausedAt = 0, offset = 0, lastSwitch = 0, glintStart = 0, raf = 0;

  /* ---------- Spotlight ---------- */
  function setActive(i, fromUser) {
    if (i === active && people[i].classList.contains('is-active')) return;
    people.forEach(function (p, k) { p.classList.toggle('is-active', k === i); });
    active = i;
    glintStart = performance.now();
    if (!spot) return;
    var p = people[i];
    var swap = function () {
      spot.querySelector('[data-spot-year]').textContent = 'NIDA ' + p.getAttribute('data-year');
      spot.querySelector('[data-spot-name]').textContent = p.getAttribute('data-name');
      spot.querySelector('[data-spot-award]').textContent = p.getAttribute('data-award');
      spot.classList.remove('is-swapping');
    };
    if (reduce || fromUser) { swap(); return; }
    spot.classList.add('is-swapping');
    setTimeout(swap, 300);
  }
  people.forEach(function (p, i) {
    var a = p.querySelector('a');
    var on = function () { hoverLock = true; setActive(i, true); if (ready && !running) draw(performance.now()); };
    var off = function () { hoverLock = false; lastSwitch = performance.now(); };
    a.addEventListener('mouseenter', on);
    a.addEventListener('focus', on);
    a.addEventListener('mouseleave', off);
    a.addEventListener('blur', off);
  });
  setActive(0, true);

  /* ---------- Data ---------- */
  function decode() {
    var d = window.NIDA_GLOBE, n = d.n, ga = Math.PI * (3 - Math.sqrt(5));
    var bin = atob(d.land);
    pts = new Float32Array(n * 3); landFlag = new Uint8Array(n); ngFlag = new Uint8Array(n);
    for (var i = 0; i < n; i++) {
      var y = 1 - (i + 0.5) / n * 2, r = Math.sqrt(1 - y * y), th = ga * i;
      pts[i * 3] = Math.cos(th) * r; pts[i * 3 + 1] = y; pts[i * 3 + 2] = Math.sin(th) * r;
      landFlag[i] = (bin.charCodeAt(i >> 3) >> (i & 7)) & 1;
    }
    d.nigeria.forEach(function (k) { ngFlag[k] = 1; });
    coast = d.coast.map(function (line) {
      var out = new Float32Array(line.length / 2 * 3);
      for (var j = 0, k = 0; j < line.length; j += 2, k += 3) {
        var lon = line[j] / 4 * Math.PI / 180, lat = line[j + 1] / 4 * Math.PI / 180;
        out[k] = Math.cos(lat) * Math.cos(lon); out[k + 1] = Math.sin(lat); out[k + 2] = Math.cos(lat) * Math.sin(lon);
      }
      return out;
    });
  }
  function load(cb) {
    if (window.NIDA_GLOBE) { cb(); return; }
    var s = document.createElement('script');
    s.src = stage.getAttribute('data-globe-src');
    s.onload = cb;
    document.head.appendChild(s);
  }

  /* ---------- Layout ---------- */
  function measure() {
    var r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(r.width * dpr); H = Math.round(r.height * dpr);
    canvas.width = W; canvas.height = H;
    cx = W * 0.5; cy = H * 0.46; R = Math.min(W, H) * 0.35;
    anchors = people.map(function (p) {
      var a = p.getBoundingClientRect();
      if (!a.width) return null; // hidden on small screens
      return { x: (a.left - r.left + a.width / 2) * dpr, y: (a.top - r.top + a.height / 2) * dpr, r: a.width / 2 * dpr };
    });
  }

  /* ---------- Drawing ---------- */
  var cosL, sinL, cosT = Math.cos(VIEW_LAT), sinT = Math.sin(VIEW_LAT);
  function project(x, y, z, out) {
    // rotate about the polar axis so the view longitude faces the viewer, then tilt
    var x1 = z * cosL - x * sinL;
    var z1 = x * cosL + z * sinL;
    out[0] = cx + x1 * R;
    out[1] = cy - (y * cosT - z1 * sinT) * R;
    out[2] = y * sinT + z1 * cosT;
  }
  var tmp = [0, 0, 0];
  var BUCKETS = 5;
  var oceanPaths = [], landPaths = [];

  function quad(p0, c, p1, t) {
    var u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]];
  }

  function draw(now) {
    var lon = VIEW_LON + (reduce ? 0 : SWAY * Math.sin((now - started - offset) / SWAY_PERIOD * Math.PI * 2));
    var L = lon * Math.PI / 180;
    cosL = Math.cos(L); sinL = Math.sin(L);

    ctx.clearRect(0, 0, W, H);

    // atmosphere and body
    var atm = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.22);
    atm.addColorStop(0, 'rgba(' + GREEN + ',.20)'); atm.addColorStop(1, 'rgba(' + GREEN + ',0)');
    ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2); ctx.fill();
    var body = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.32, R * 0.05, cx, cy, R);
    body.addColorStop(0, 'rgba(' + PINE + ',.95)'); body.addColorStop(0.55, 'rgba(' + FOREST + ',.85)'); body.addColorStop(1, 'rgba(' + INK + ',.98)');
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    // dots, batched by depth so each bucket is a single fill
    var i, n = landFlag.length, s1 = 1.15 * dpr, s2 = 1.9 * dpr, ng = [];
    for (i = 0; i < BUCKETS; i++) { oceanPaths[i] = new Path2D(); landPaths[i] = new Path2D(); }
    for (i = 0; i < n; i++) {
      project(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2], tmp);
      if (tmp[2] <= 0.02) continue;
      var b = Math.min(BUCKETS - 1, (tmp[2] * BUCKETS) | 0);
      if (ngFlag[i]) ng.push(tmp[0], tmp[1], tmp[2]);
      else if (landFlag[i]) landPaths[b].rect(tmp[0] - s2 / 2, tmp[1] - s2 / 2, s2, s2);
      else if (i % 2 === 0) oceanPaths[b].rect(tmp[0] - s1 / 2, tmp[1] - s1 / 2, s1, s1);
    }
    for (i = 0; i < BUCKETS; i++) {
      var depth = (i + 0.5) / BUCKETS;
      ctx.fillStyle = 'rgba(' + GREEN + ',' + (0.10 + 0.22 * depth).toFixed(3) + ')';
      ctx.fill(oceanPaths[i]);
      ctx.fillStyle = 'rgba(' + GREEN + ',' + (0.35 + 0.6 * depth).toFixed(3) + ')';
      ctx.fill(landPaths[i]);
    }

    // coastlines: a soft wide pass, then a crisp one
    var coastPath = new Path2D();
    coast.forEach(function (line) {
      var pen = false;
      for (var k = 0; k < line.length; k += 3) {
        project(line[k], line[k + 1], line[k + 2], tmp);
        if (tmp[2] > 0.03) { if (pen) coastPath.lineTo(tmp[0], tmp[1]); else coastPath.moveTo(tmp[0], tmp[1]); pen = true; }
        else pen = false;
      }
    });
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(' + GREEN + ',.28)'; ctx.lineWidth = 3.2 * dpr; ctx.stroke(coastPath);
    ctx.strokeStyle = 'rgba(' + GREEN + ',.95)'; ctx.lineWidth = 1 * dpr; ctx.stroke(coastPath);

    // rim light on the lower right, like a sunlit edge
    var rim = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    rim.addColorStop(0, 'rgba(' + GREEN + ',0)'); rim.addColorStop(0.55, 'rgba(' + GREEN + ',.15)'); rim.addColorStop(1, 'rgba(' + GREEN + ',.85)');
    ctx.strokeStyle = rim; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    // Nigeria in gold
    ctx.fillStyle = 'rgba(' + GOLD + ',.95)';
    for (i = 0; i < ng.length; i += 3) { var g = 2.3 * dpr; ctx.fillRect(ng[i] - g / 2, ng[i + 1] - g / 2, g, g); }
    var la = NIGERIA.lat * Math.PI / 180, lo = NIGERIA.lon * Math.PI / 180;
    project(Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo), tmp);
    var home = [tmp[0], tmp[1]];

    // threads from Nigeria to each honouree
    anchors.forEach(function (a, k) {
      if (!a) return;
      var dx = a.x - home[0], dy = a.y - home[1], dist = Math.sqrt(dx * dx + dy * dy);
      var mx = (a.x + home[0]) / 2, my = (a.y + home[1]) / 2;
      var ox = mx - cx, oy = my - cy, ol = Math.sqrt(ox * ox + oy * oy) || 1;
      var c = [mx + ox / ol * dist * 0.28, my + oy / ol * dist * 0.28];
      // stop the thread at the portrait edge
      var ex = a.x - c[0], ey = a.y - c[1], el = Math.sqrt(ex * ex + ey * ey) || 1;
      var end = [a.x - ex / el * (a.r + 6 * dpr), a.y - ey / el * (a.r + 6 * dpr)];
      var isA = k === active;
      ctx.beginPath(); ctx.moveTo(home[0], home[1]); ctx.quadraticCurveTo(c[0], c[1], end[0], end[1]);
      if (isA) {
        var lg = ctx.createLinearGradient(home[0], home[1], end[0], end[1]);
        lg.addColorStop(0, 'rgba(' + GOLD + ',.15)'); lg.addColorStop(1, 'rgba(' + GOLD + ',.9)');
        ctx.strokeStyle = lg; ctx.lineWidth = 1.4 * dpr;
      } else {
        ctx.strokeStyle = 'rgba(' + GOLD + ',.13)'; ctx.lineWidth = 1 * dpr;
      }
      ctx.stroke();
      if (isA && !reduce && !paused) {
        var t = Math.min(1, (now - glintStart) / 1400);
        t = 1 - Math.pow(1 - t, 3);
        if (t < 1) {
          for (var q = 0; q < 6; q++) {
            var tt = Math.max(0, t - q * 0.025), pq = quad(home, c, end, tt);
            ctx.fillStyle = 'rgba(' + GOLD + ',' + (0.9 - q * 0.15).toFixed(2) + ')';
            ctx.beginPath(); ctx.arc(pq[0], pq[1], (2.6 - q * 0.3) * dpr, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    });

    // home marker with a slow pulse
    var pulse = reduce || paused ? 0.35 : ((now - started) % 2600) / 2600;
    ctx.strokeStyle = 'rgba(' + GOLD + ',' + (0.7 * (1 - pulse)).toFixed(3) + ')';
    ctx.lineWidth = 1.2 * dpr;
    ctx.beginPath(); ctx.arc(home[0], home[1], (5 + 16 * pulse) * dpr, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(' + GOLD + ',1)';
    ctx.beginPath(); ctx.arc(home[0], home[1], 4 * dpr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(' + INK + ',.9)'; ctx.lineWidth = 1.5 * dpr; ctx.stroke();
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    if (!hoverLock && now - lastSwitch > CYCLE) { lastSwitch = now; setActive((active + 1) % people.length); }
    draw(now);
    raf = requestAnimationFrame(frame);
  }
  function setRunning() {
    var should = ready && visible && !paused && !reduce && !document.hidden;
    if (should === running) return;
    running = should;
    var now = performance.now();
    if (running) { offset += now - (pausedAt || now); lastSwitch = now; raf = requestAnimationFrame(frame); }
    else { pausedAt = now; if (raf) cancelAnimationFrame(raf); raf = 0; }
  }

  /* ---------- Start ---------- */
  function init() {
    if (!ctx || !window.NIDA_GLOBE) { stage.classList.add('is-in'); return; }
    decode();
    measure();
    started = performance.now(); pausedAt = started;
    draw(started);
    ready = true;
    stage.classList.add('is-live');
    if (toggle && !reduce) toggle.hidden = false;
    var ro = 'ResizeObserver' in window ? new ResizeObserver(function () { measure(); draw(running ? performance.now() : pausedAt); }) : null;
    if (ro) ro.observe(stage); else window.addEventListener('resize', function () { measure(); draw(performance.now()); });
    // portraits animate in; re-measure once they have settled
    setTimeout(function () { measure(); if (!running) draw(pausedAt); }, 1600);
    setRunning();
  }

  if (toggle) {
    var pauseIcon = toggle.querySelector('[data-globe-icon]').innerHTML;
    var playIcon = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.5v9l8-4.5z" fill="currentColor"/></svg>';
    toggle.addEventListener('click', function () {
      paused = !paused;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.querySelector('[data-globe-label]').textContent = paused ? 'Play motion' : 'Pause motion';
      toggle.querySelector('[data-globe-icon]').innerHTML = paused ? playIcon : pauseIcon;
      setRunning();
      if (paused && ready) draw(pausedAt);
    });
  }
  document.addEventListener('visibilitychange', setRunning);
  reduceMQ.addEventListener && reduceMQ.addEventListener('change', function (m) { reduce = m.matches; if (toggle) toggle.hidden = reduce || !ready; setRunning(); if (ready && !running) draw(performance.now()); });

  var loaded = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting && !loaded) { loaded = true; load(init); }
    }, { rootMargin: '400px 0px' }).observe(stage);
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) stage.classList.add('is-in');
      setRunning();
    }, { threshold: 0.15 }).observe(stage);
  } else {
    visible = true; load(init);
  }
})();

// Loaded as a module by src/components/ClientScripts.tsx after hydration.
export {};
