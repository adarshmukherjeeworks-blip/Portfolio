// Adarsh Mukherjee portfolio: nav state, the living name, marquee, index peek, process moment, viewers.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Nav: paper behind it once the page moves, and the current section underlined */
  const nav = document.querySelector('[data-nav]');
  const links = [...document.querySelectorAll('.nav-links a')];
  const targets = links.map(a => document.querySelector(a.getAttribute('href')));
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', scrollY > 12);
    const y = scrollY + innerHeight * 0.35;
    let cur = -1, best = -Infinity;
    targets.forEach((t, i) => { if (t && t.offsetTop <= y && t.offsetTop > best) { best = t.offsetTop; cur = i; } });
    links.forEach((a, i) => { if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* The name: letters near the pointer go light and narrow, the rest stay heavy */
  const name = document.querySelector('[data-name]');
  if (name && finePointer && !reduce) {
    const chars = [...name.querySelectorAll('.ch')];
    const state = chars.map(() => ({ w: 800, wd: 100 }));
    let px = -9999, py = -9999, raf = 0, active = false;
    const hero = name.closest('.hero');
    const tick = () => {
      raf = 0;
      let moving = false;
      // read every letter's box first, then write, so the page lays out once per frame
      const boxes = chars.map(c => c.getBoundingClientRect());
      const targets = boxes.map(r => {
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        const k = active ? Math.max(0, 1 - d / (r.height * 1.1)) : 0;
        return [800 - k * 560, 100 - k * 25];
      });
      chars.forEach((c, i) => {
        const [tw, twd] = targets[i];
        const s = state[i];
        s.w += (tw - s.w) * 0.18; s.wd += (twd - s.wd) * 0.18;
        if (Math.abs(tw - s.w) > 0.5 || Math.abs(twd - s.wd) > 0.2) moving = true;
        c.style.setProperty('--w', s.w.toFixed(1));
        c.style.setProperty('--wd', s.wd.toFixed(1));
      });
      if (moving) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    hero.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; active = true; kick(); }, { passive: true });
    hero.addEventListener('pointerleave', () => { active = false; kick(); });
  }

  /* Dark mode switch: follows the system until the visitor picks, then remembers the pick */
  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const sysDark = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : sysDark.matches;
  const sync = () => {
    const dark = isDark();
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.querySelector('.tt-label').textContent = dark ? 'Light' : 'Dark';
    if (themeMeta) themeMeta.setAttribute('content', getComputedStyle(document.body).backgroundColor);
  };
  if (toggle) {
    const apply = next => {
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      sync();
    };
    toggle.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      if (reduce) { apply(next); return; }
      // The new theme spreads out from the switch like ink, over the old page
      if (document.startViewTransition) {
        const r = toggle.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        const vt = document.startViewTransition(() => apply(next));
        vt.ready.then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
            { duration: 900, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' }
          );
        }).catch(() => {});
        return;
      }
      // Browsers without view transitions: colours fade across instead of snapping
      root.classList.add('theme-fading');
      apply(next);
      setTimeout(() => root.classList.remove('theme-fading'), 650);
    });
    sysDark.addEventListener('change', sync);
    sync();
  }

  /* Marquee pause control */
  document.querySelectorAll('[data-mq]').forEach(mq => {
    const btn = mq.querySelector('[data-mq-toggle]');
    const label = btn.querySelector('.mq-toggle-label');
    btn.addEventListener('click', () => {
      const paused = mq.classList.toggle('is-paused');
      btn.setAttribute('aria-pressed', String(paused));
      label.textContent = paused ? 'Play' : 'Pause';
    });
  });

  /* Work index: a print of each project follows the pointer */
  const peek = document.querySelector('.peek');
  if (peek && finePointer && !reduce) {
    const img = peek.querySelector('img');
    let x = 0, y = 0, tx = 0, ty = 0, vx = 0, raf = 0, on = false;
    const loop = () => {
      const nx = x + (tx - x) * 0.2, ny = y + (ty - y) * 0.2;
      vx = nx - x; x = nx; y = ny;
      const rot = Math.max(-12, Math.min(12, vx * 0.6));
      peek.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rot}deg) scale(${on ? 1 : 0.6})`;
      raf = (on || Math.abs(tx - x) > 0.5) ? requestAnimationFrame(loop) : 0;
    };
    document.querySelectorAll('.row[data-preview]').forEach(row => {
      row.addEventListener('pointerenter', e => {
        img.src = row.dataset.preview;
        if (!on) { x = tx = e.clientX + 120; y = ty = e.clientY; }
        on = true; peek.classList.add('is-on');
        if (!raf) raf = requestAnimationFrame(loop);
      });
      row.addEventListener('pointermove', e => { tx = e.clientX + 120; ty = e.clientY; });
      row.addEventListener('pointerleave', () => { on = false; peek.classList.remove('is-on'); });
    });
  }

  /* Process: each word fills as it reaches the upper part of the screen */
  const steps = document.querySelectorAll('[data-step]');
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => en.target.classList.toggle('is-on', en.isIntersecting || en.boundingClientRect.top < 0));
    }, { rootMargin: '0px 0px -42% 0px', threshold: 0 });
    steps.forEach(s => io.observe(s));
  } else {
    steps.forEach(s => s.classList.add('is-on'));
  }

  /* Lightbox, grouped by case */
  const box = document.querySelector('.lightbox');
  if (box && typeof box.showModal === 'function') {
    const img = new Image();
    box.querySelector('figure').prepend(img);
    const cap = box.querySelector('.lb-cap');
    let group = [], idx = 0;
    const show = i => {
      idx = (i + group.length) % group.length;
      const b = group[idx];
      img.src = b.dataset.full; img.width = b.dataset.w; img.height = b.dataset.h; img.alt = b.dataset.caption;
      cap.textContent = `${b.dataset.caption}, ${idx + 1} of ${group.length}`;
    };
    document.querySelectorAll('.zoom').forEach(btn => btn.addEventListener('click', () => {
      group = [...(btn.closest('.case') || document).querySelectorAll('.zoom')];
      show(group.indexOf(btn)); box.showModal();
    }));
    box.querySelector('.lb-close').addEventListener('click', () => box.close());
    box.querySelector('.lb-prev').addEventListener('click', () => show(idx - 1));
    box.querySelector('.lb-next').addEventListener('click', () => show(idx + 1));
    box.addEventListener('click', e => { if (e.target === box) box.close(); });
    box.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
    box.addEventListener('close', () => img.removeAttribute('src'));
    let x0 = null;
    box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); x0 = null; });
  }

  /* Reels and film: muted loops play while on screen; a click opens the full cut with sound */
  const clips = [...document.querySelectorAll('video.clip')];
  if (clips.length && !reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { en.isIntersecting ? en.target.play().catch(() => {}) : en.target.pause(); });
    }, { threshold: 0.35 });
    clips.forEach(v => io.observe(v));
  }
  const player = document.querySelector('.player');
  if (player && typeof player.showModal === 'function') {
    const full = player.querySelector('video');
    document.querySelectorAll('.clip-open').forEach(btn => btn.addEventListener('click', () => {
      const v = btn.querySelector('video.clip');
      full.src = v.dataset.full; full.poster = v.poster;
      player.querySelector('.lb-cap').textContent = btn.dataset.caption || '';
      player.showModal(); full.play().catch(() => {});
    }));
    player.querySelector('.lb-close').addEventListener('click', () => player.close());
    player.addEventListener('click', e => { if (e.target === player) player.close(); });
    player.addEventListener('close', () => { full.pause(); full.removeAttribute('src'); full.load(); });
  }
})();
