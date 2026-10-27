// Portfolio interactions: scroll reveal, active nav, timecode marks, image lightbox.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  }

  // Top bar border + active nav link
  const bar = document.querySelector('.topbar');
  const links = [...document.querySelectorAll('.topbar nav a')];
  const targets = links.map(a => document.querySelector(a.getAttribute('href')));
  const onScroll = () => {
    bar.classList.toggle('scrolled', scrollY > 10);
    const y = scrollY + innerHeight * 0.35;
    let current = -1, best = -1;
    targets.forEach((t, i) => { if (t && t.offsetTop <= y && t.offsetTop > best) { best = t.offsetTop; current = i; } });
    links.forEach((a, i) => a.classList.toggle('active', i === current));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Timecode stamp per project (the video motif): position in the page as HH:MM:SS:FF
  document.querySelectorAll('[data-tc]').forEach(el => {
    const top = el.closest('.project').offsetTop;
    const s = Math.round(top / 40);
    const pad = n => String(n).padStart(2, '0');
    el.textContent = `TC ${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(top % 25)}`;
  });

  // Lightbox, grouped by project
  const box = document.querySelector('.lightbox');
  if (!box || typeof box.showModal !== 'function') return;
  const img = box.querySelector('img');
  const cap = box.querySelector('figcaption');
  let group = [], idx = 0;
  const show = i => {
    idx = (i + group.length) % group.length;
    const b = group[idx];
    img.src = b.dataset.full;
    img.width = b.dataset.w; img.height = b.dataset.h;
    img.alt = b.dataset.caption;
    cap.textContent = `${b.dataset.caption}   ${idx + 1} / ${group.length}`;
  };
  document.querySelectorAll('.zoom').forEach(btn => {
    btn.addEventListener('click', () => {
      const scope = btn.closest('.project') || document;
      group = [...scope.querySelectorAll('.zoom')];
      show(group.indexOf(btn));
      box.showModal();
    });
  });
  box.querySelector('.lb-close').addEventListener('click', () => box.close());
  box.querySelector('.lb-prev').addEventListener('click', () => show(idx - 1));
  box.querySelector('.lb-next').addEventListener('click', () => show(idx + 1));
  box.addEventListener('click', e => { if (e.target === box) box.close(); });
  box.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  box.addEventListener('close', () => { img.removeAttribute('src'); });
  // swipe on phones
  let x0 = null;
  box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();

// Motion & video: muted clips play while on screen; click opens with sound and controls.
(() => {
  const clips = [...document.querySelectorAll('video.clip')];
  if (!clips.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { en.isIntersecting ? en.target.play().catch(() => {}) : en.target.pause(); });
    }, { threshold: 0.35 });
    clips.forEach(v => io.observe(v));
  }
  const box = document.querySelector('.player');
  if (!box || typeof box.showModal !== 'function') return;
  const full = box.querySelector('video');
  document.querySelectorAll('.clip-open').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.querySelector('video.clip');
      full.src = v.dataset.full || v.currentSrc;
      full.poster = v.poster;
      box.querySelector('figcaption').textContent = btn.dataset.caption || '';
      box.showModal();
      full.play().catch(() => {});
    });
  });
  const close = () => box.close();
  box.querySelector('.lb-close').addEventListener('click', close);
  box.addEventListener('click', e => { if (e.target === box) close(); });
  box.addEventListener('close', () => { full.pause(); full.removeAttribute('src'); full.load(); });
})();
