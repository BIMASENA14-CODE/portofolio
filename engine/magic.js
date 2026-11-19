/* ==========================================================================
   Magic layer — Hogwarts-inspired effects. Original code, no external assets.
   - wand-tip light + sparkle trail that follows the pointer
   - spell streaks and incantation words that rush toward the viewer on scroll
   - a spell bolt + incantation cast as each chapter is reached
   - floating candles in the hero (Great Hall ceiling feel)
   Never touches the existing scroll engine; it only reads scroll position.
   ========================================================================== */
(function () {
  'use strict';
  var doc = document, win = window, root = doc.documentElement;
  var reduce = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var isSmall = win.innerWidth < 720;
  var STORE = 'bima-magic';
  var enabled = !reduce;
  try { if (win.localStorage.getItem(STORE) === 'off') enabled = false; } catch (e) {}
  if (!enabled) root.classList.add('hp-off');

  var darkWorld = doc.getElementById('dark-world');
  var heroScene = doc.querySelector('.hero-scene');
  var heroTrack = doc.getElementById('home');
  var castle = doc.getElementById('hp-castle');

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var rand = function (a, b) { return a + Math.random() * (b - a); };

  /* ---------- sprites ---------- */
  function sprite(r, g, b, core) {
    var s = 64, c = doc.createElement('canvas'); c.width = c.height = s;
    var x = c.getContext('2d'); if (!x) return c;
    var h = s / 2, gr = x.createRadialGradient(h, h, 0, h, h, h);
    gr.addColorStop(0, core);
    gr.addColorStop(0.18, 'rgba(' + r + ',' + g + ',' + b + ',0.95)');
    gr.addColorStop(0.5, 'rgba(' + r + ',' + g + ',' + b + ',0.28)');
    gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, s, s);
    return c;
  }
  var S_GOLD = sprite(255, 196, 92, 'rgba(255,255,255,1)');
  var S_BLUE = sprite(140, 200, 255, 'rgba(255,255,255,1)');
  var S_AMBER = sprite(226, 140, 14, 'rgba(255,226,150,1)');
  var S_BLUE_L = sprite(60, 120, 220, 'rgba(170,205,255,1)');
  var S_FLAME = sprite(255, 170, 60, 'rgba(255,240,190,1)');

  /* ---------- floating candles (hero) ---------- */
  function initCandles() {
    if (!heroScene) return;
    var dataCv = doc.getElementById('hero-data-canvas');
    var c = doc.createElement('canvas');
    c.id = 'hp-candles'; c.setAttribute('aria-hidden', 'true');
    heroScene.insertBefore(c, dataCv ? dataCv.nextSibling : heroScene.firstChild);
    var x = c.getContext('2d'); if (!x) return;
    var w = 0, h = 0, list = [], visible = true;

    function build() {
      list = [];
      var n = w < 720 ? 10 : 24, tries = 0;
      while (list.length < n && tries++ < 500) {
        var px = Math.random(), py = rand(0.04, 0.74);
        if (px > 0.24 && px < 0.76 && py > 0.26 && py < 0.76) continue; // keep the headline clear
        var d = Math.random();
        list.push({
          x: px * w, y: py * h, d: d,
          ph: rand(0, 6.28), sp: rand(0.5, 1.2), amp: 3 + d * 6, fl: rand(0, 6.28),
          len: (16 + d * 26) * (w < 720 ? 0.8 : 1), wd: 4 + d * 5
        });
      }
      list.sort(function (a, b) { return a.d - b.d; });
    }
    function layout() {
      var r = heroScene.getBoundingClientRect();
      w = r.width; h = r.height;
      var dpr = Math.min(win.devicePixelRatio || 1, 2);
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      build(); draw(0);
    }
    function draw(t) {
      x.clearRect(0, 0, w, h);
      for (var i = 0; i < list.length; i++) {
        var k = list[i];
        var by = k.y + Math.sin(t * 0.0008 * k.sp + k.ph) * k.amp;
        var bx = k.x + Math.sin(t * 0.0005 * k.sp + k.ph * 2) * k.amp * 0.35;
        var a = 0.35 + k.d * 0.6;
        var fl = 0.82 + 0.18 * Math.sin(t * 0.012 + k.fl) + 0.08 * Math.sin(t * 0.031 + k.fl * 2);
        var gs = (34 + k.d * 34) * fl;
        x.globalCompositeOperation = 'lighter';
        x.globalAlpha = a * 0.9;
        x.drawImage(S_FLAME, bx - gs / 2, by - 7 - gs / 2, gs, gs);
        x.globalCompositeOperation = 'source-over';
        x.globalAlpha = a;
        x.fillStyle = '#EFE3C2'; x.fillRect(bx - k.wd / 2, by, k.wd, k.len);
        x.fillStyle = 'rgba(120,100,70,0.55)'; x.fillRect(bx + k.wd * 0.1, by, k.wd * 0.4, k.len);
        x.fillStyle = '#FFEBA8';
        x.beginPath(); x.ellipse(bx, by - 4, k.wd * 0.26, k.wd * 0.75 * fl, 0, 0, 6.2832); x.fill();
      }
      x.globalAlpha = 1;
    }
    win.addEventListener('resize', layout);
    layout();
    if (reduce) return;
    if ('IntersectionObserver' in win) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(heroScene);
    }
    (function loop(t) { if (visible && !doc.hidden) draw(t); win.requestAnimationFrame(loop); })(0);
  }

  /* ---------- FX canvas ---------- */
  var SPELLS = {
    about:    { w: 'Revelio',          s: 'Mengungkap siapa di balik data' },
    journey:  { w: 'Prior Incantato',  s: 'Menelusuri jejak perjalanan' },
    projects: { w: 'Alohomora',        s: 'Membuka pintu proyek' },
    skills:   { w: 'Expecto Patronum', s: 'Memanggil kekuatan keahlian' },
    contact:  { w: 'Accio',            s: 'Mari berkolaborasi' }
  };
  var WORDS = ['Lumos', 'Revelio', 'Accio', 'Alohomora', 'Nox', 'Aguamenti', 'Reparo', 'Lumos Maxima', 'Prior Incantato', 'Wingardium Leviosa', 'Expecto Patronum'];

  function initFx() {
    var cv = doc.createElement('canvas');
    cv.id = 'hp-fx'; cv.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(cv);
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var W = 0, H = 0;
    function resize() {
      var dpr = Math.min(win.devicePixelRatio || 1, 2);
      W = win.innerWidth; H = win.innerHeight; isSmall = W < 720;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize(); win.addEventListener('resize', resize);

    var sparks = [], streaks = [], words = [], rings = [], bolt = null;
    var mx = -999, my = -999, tx = -999, ty = -999, seen = false, lastMove = 0;
    var darkTop = 0, darkBottom = 0;
    var lastY = win.pageYOffset || 0, vel = 0, dir = 0, nextWord = 0;
    var casting = false, pending = null, ready = false;

    // overlay for the incantation text
    var ov = doc.createElement('div');
    ov.className = 'hp-spell'; ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = '<div class="hp-spell-inner"><div class="hp-spell-word"></div><div class="hp-spell-sub"></div></div>';
    doc.body.appendChild(ov);
    var ovWord = ov.querySelector('.hp-spell-word'), ovSub = ov.querySelector('.hp-spell-sub');

    function isDark(y) { return y > darkTop && y < darkBottom; }
    function spark(x, y, vx, vy, life, size, kind) {
      if (sparks.length > 420) return;
      sparks.push({ x: x, y: y, vx: vx, vy: vy, age: 0, life: life, size: size, kind: kind, sd: Math.random() * 6 });
    }
    function put(kind, dark, x, y, size, alpha) {
      var s = dark ? (kind ? S_BLUE : S_GOLD) : (kind ? S_BLUE_L : S_AMBER);
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.drawImage(s, x - size / 2, y - size / 2, size, size);
    }
    function burst(x, y, n, speed) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.2832, v = rand(0.4, 1) * speed;
        spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(520, 1100), rand(8, 22), Math.random() < 0.25 ? 1 : 0);
      }
    }

    win.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      tx = e.clientX; ty = e.clientY;
      if (!seen) { mx = tx; my = ty; seen = true; }
      lastMove = performance.now();
    }, { passive: true });
    win.addEventListener('pointerdown', function (e) {
      if (!enabled || reduce) return;
      burst(e.clientX, e.clientY, 14, 3.2);
    }, { passive: true });

    function showSpell(d) {
      ovWord.textContent = d.w; ovSub.textContent = d.s;
      ov.classList.remove('go'); void ov.offsetWidth; ov.classList.add('go');
      setTimeout(function () { ov.classList.remove('go'); casting = false; }, 2650);
    }
    function cast(id) {
      var d = SPELLS[id]; if (!d || !enabled || reduce) return;
      casting = true;
      bolt = {
        t0: performance.now(), dur: 640, d: d,
        from: { x: isSmall ? W * 0.5 : W * 0.9, y: H + 30 },
        ctrl: { x: isSmall ? W * 0.12 : W * 0.6, y: H * 0.96 },
        to: { x: W / 2, y: H * 0.48 }
      };
    }

    // chapters: cast once per section when it reaches the middle of the screen
    var done = {}, armed = false;
    if ('IntersectionObserver' in win) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting || done[e.target.id]) return;
          done[e.target.id] = true;
          if (armed && dir >= 0) pending = e.target.id;
        });
      }, { rootMargin: '0px 0px -50% 0px', threshold: 0 });
      Object.keys(SPELLS).forEach(function (id) { var el = doc.getElementById(id); if (el) io.observe(el); });
      setTimeout(function () { armed = true; }, 900);
    }

    var last = performance.now();
    function frame(now) {
      win.requestAnimationFrame(frame);
      var dt = Math.min(50, now - last) / 16.667; last = now;
      if (!enabled || doc.hidden) return;

      if (darkWorld) { var r = darkWorld.getBoundingClientRect(); darkTop = r.top; darkBottom = r.bottom; }
      var y = win.pageYOffset || 0, dy = (y - lastY) / dt; lastY = y;
      if (dy > 0.5) dir = 1; else if (dy < -0.5) dir = -1;
      vel += (dy - vel) * 0.2;
      var sp = Math.abs(vel), cx = W / 2, cy = H * 0.52, maxR = Math.hypot(W, H) / 2 * 1.05;

      if (!casting && pending && !bolt) { var id = pending; pending = null; cast(id); }

      // wand tip trail
      if (seen) {
        var ox = mx, oy = my;
        mx += (tx - mx) * 0.4; my += (ty - my) * 0.4;
        var dist = Math.hypot(mx - ox, my - oy);
        if (dist > 0.6 && now - lastMove < 300) {
          var n = Math.min(5, Math.ceil(dist / 7));
          for (var i = 0; i < n; i++) {
            var u = i / n;
            spark(ox + (mx - ox) * u + rand(-3, 3), oy + (my - oy) * u + rand(-3, 3),
              rand(-0.25, 0.25), rand(-0.15, 0.35), rand(480, 950), rand(6, 15), Math.random() < 0.16 ? 1 : 0);
          }
        }
      }

      // scroll: streaks and words rushing toward the viewer
      if (dir > 0 && sp > 1.8 && !reduce) {
        var cnt = Math.min(5, Math.floor(sp / 5) + 1) * (isSmall ? 0.6 : 1);
        for (var s = 0; s < cnt; s++) {
          if (streaks.length > 140) break;
          streaks.push({ a: Math.random() * 6.2832, r: rand(20, 90), v: rand(2, 5), kind: Math.random() < 0.2 ? 1 : 0 });
        }
        if (sp > 9 && words.length < 2 && now > nextWord) {
          nextWord = now + rand(900, 2100);
          words.push({ t: WORDS[Math.floor(Math.random() * WORDS.length)], a: rand(0, 6.2832), r: 30, v: 3.4 });
        }
      }

      ctx.clearRect(0, 0, W, H);

      // streaks
      var cd = isDark(cy);
      for (var i2 = streaks.length - 1; i2 >= 0; i2--) {
        var st = streaks[i2];
        st.r += st.v * (1 + sp * 0.12) * dt; st.v *= Math.pow(1.012, dt);
        if (st.r > maxR) { streaks.splice(i2, 1); continue; }
        var p = st.r / maxR, al = Math.min(1, p * 4) * Math.pow(1 - p, 0.6) * clamp(sp / 18, 0.25, 1);
        var ca = Math.cos(st.a), sa = Math.sin(st.a);
        ctx.globalCompositeOperation = cd ? 'lighter' : 'source-over';
        ctx.globalAlpha = al * (cd ? 0.9 : 0.55);
        ctx.strokeStyle = cd ? (st.kind ? 'rgb(170,210,255)' : 'rgb(255,214,130)') : (st.kind ? 'rgb(60,120,220)' : 'rgb(214,130,10)');
        ctx.lineWidth = 0.6 + p * 2.4;
        ctx.beginPath();
        ctx.moveTo(cx + ca * st.r * 0.8, cy + sa * st.r * 0.8);
        ctx.lineTo(cx + ca * st.r, cy + sa * st.r);
        ctx.stroke();
      }

      // shock rings
      for (var i3 = rings.length - 1; i3 >= 0; i3--) {
        var rg = rings[i3]; rg.t += dt * 16.667;
        var q = rg.t / 900; if (q >= 1) { rings.splice(i3, 1); continue; }
        var e = 1 - Math.pow(1 - q, 3), rd = isDark(rg.y);
        ctx.globalCompositeOperation = rd ? 'lighter' : 'source-over';
        ctx.globalAlpha = (1 - q) * 0.7;
        ctx.strokeStyle = rd ? 'rgb(255,214,130)' : 'rgb(214,130,10)';
        ctx.lineWidth = 1 + (1 - q) * 3;
        ctx.beginPath(); ctx.arc(rg.x, rg.y, e * rg.max, 0, 6.2832); ctx.stroke();
      }

      // sparks
      for (var i4 = sparks.length - 1; i4 >= 0; i4--) {
        var k = sparks[i4];
        k.age += dt * 16.667;
        if (k.age >= k.life) { sparks.splice(i4, 1); continue; }
        k.x += k.vx * dt; k.y += k.vy * dt; k.vx *= Math.pow(0.985, dt); k.vy = k.vy * Math.pow(0.985, dt) + 0.012 * dt;
        var f = 1 - k.age / k.life;
        put(k.kind, isDark(k.y), k.x, k.y, k.size * (0.4 + f * 0.7), Math.pow(f, 1.4) * (0.75 + 0.25 * Math.sin(k.age * 0.05 + k.sd)));
      }

      // incantation words flying toward the screen
      if (words.length) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (var i5 = words.length - 1; i5 >= 0; i5--) {
          var wd = words[i5];
          wd.r += wd.v * (1 + sp * 0.05) * dt; wd.v *= Math.pow(1.015, dt);
          var pw = wd.r / (maxR * 0.9);
          if (pw >= 1) { words.splice(i5, 1); continue; }
          var wx = cx + Math.cos(wd.a) * wd.r * 0.95, wy = cy + Math.sin(wd.a) * wd.r * 0.6;
          var dk = isDark(wy), sc = 0.25 + pw * 3;
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = Math.pow(Math.sin(Math.PI * clamp(pw, 0, 1)), 0.8) * (dk ? 0.85 : 0.7);
          ctx.font = '600 ' + Math.round(13 * sc) + 'px Cinzel, Georgia, serif';
          ctx.shadowColor = dk ? 'rgba(255,196,90,0.9)' : 'rgba(120,70,0,0.5)'; ctx.shadowBlur = 12;
          ctx.fillStyle = dk ? '#FFE3A0' : '#B9740A';
          ctx.fillText(wd.t, wx, wy);
          ctx.shadowBlur = 0;
        }
      }

      // spell bolt
      if (bolt) {
        var u2 = clamp((now - bolt.t0) / bolt.dur, 0, 1), e2 = u2 * u2 * (3 - 2 * u2), iu = 1 - e2;
        var bx = iu * iu * bolt.from.x + 2 * iu * e2 * bolt.ctrl.x + e2 * e2 * bolt.to.x;
        var by = iu * iu * bolt.from.y + 2 * iu * e2 * bolt.ctrl.y + e2 * e2 * bolt.to.y;
        for (var t2 = 0; t2 < 4; t2++) spark(bx + rand(-4, 4), by + rand(-4, 4), rand(-0.5, 0.5), rand(-0.5, 0.5), rand(350, 700), rand(10, 22), Math.random() < 0.3 ? 1 : 0);
        var bd = isDark(by);
        put(1, bd, bx, by, 120, 0.55); put(0, bd, bx, by, 80, 1);
        if (u2 >= 1) {
          rings.push({ x: bolt.to.x, y: bolt.to.y, t: 0, max: Math.hypot(W, H) * 0.42 });
          burst(bolt.to.x, bolt.to.y, isSmall ? 40 : 70, 8);
          var dd = bolt.d; bolt = null; showSpell(dd);
        }
      }

      // wand-tip light
      if (seen && now - lastMove < 2000) {
        var fade = clamp(1 - (now - lastMove - 1200) / 800, 0, 1), od = isDark(my);
        put(0, od, mx, my, 52 + 6 * Math.sin(now * 0.006), 0.5 * fade);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    win.requestAnimationFrame(frame);
    ready = true;

    // toggle
    if (!reduce) {
      var btn = doc.createElement('button');
      btn.type = 'button'; btn.className = 'hp-toggle';
      btn.setAttribute('aria-label', 'Efek sihir'); btn.title = 'Efek sihir';
      btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20 15 9"/><path d="m15 3 .9 2.1L18 6l-2.1.9L15 9l-.9-2.1L12 6l2.1-.9z" fill="currentColor"/><path d="M19 12l.5 1.2 1.2.5-1.2.5L19 15.4l-.5-1.2-1.2-.5 1.2-.5z" fill="currentColor" stroke="none"/><path class="hp-slash" d="M3 3l18 18"/></svg>';
      btn.addEventListener('click', function () {
        enabled = !enabled;
        btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        root.classList.toggle('hp-off', !enabled);
        try { win.localStorage.setItem(STORE, enabled ? 'on' : 'off'); } catch (e) {}
        if (!enabled) { sparks.length = streaks.length = words.length = rings.length = 0; bolt = null; pending = null; casting = false; ov.classList.remove('go'); ctx.clearRect(0, 0, W, H); }
      });
      doc.body.appendChild(btn);
    }
  }

  /* ---------- castle parallax ---------- */
  function initCastle() {
    if (!castle || !heroTrack || reduce) return;
    var ticking = false;
    function upd() {
      ticking = false;
      var p = clamp((win.pageYOffset || 0) / Math.max(1, heroTrack.offsetHeight), 0, 1);
      castle.style.transform = 'translate3d(0,' + (p * 28).toFixed(1) + 'px,0)';
    }
    win.addEventListener('scroll', function () { if (!ticking) { ticking = true; win.requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  function start() {
    initCandles(); initCastle();
    if (!reduce) initFx();
  }
  if (doc.fonts && doc.fonts.load) { doc.fonts.load('600 40px Cinzel').catch(function () {}); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})();
