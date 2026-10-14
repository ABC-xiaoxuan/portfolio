(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);

  /* ---------- 签名时刻 1：标题以 token 流式生成 ---------- */
  // 手工切分；hit = 强调的 token
  const TOKENS = [['把'], ['大模型'], ['能力'], ['，'], null, ['落进'], ['真实', 1], ['业务', 1], ['里'], ['。']];
  const host = $('#hero-toks');
  if (host) {
    const els = TOKENS.map(t => {
      const el = document.createElement('span');
      if (!t) { el.className = 't br'; return el; }
      el.className = 't' + (t[1] ? ' hit' : '');
      el.textContent = t[0];
      return el;
    });
    // 最后一个 token、句号与光标不拆行
    const tail = document.createElement('span');
    tail.className = 'nw';
    els.forEach((el, i) => (i >= els.length - 2 ? tail : host).appendChild(el));
    host.appendChild(tail);
    const caret = document.createElement('span');
    caret.className = 'caret';
    tail.appendChild(caret);

    const words = els.filter(el => !el.classList.contains('br'));
    const total = $('#m-total'), ms = $('#m-hit'), fill = $('#m-fill');
    const finish = () => setTimeout(() => words.forEach(el => el.classList.add('settled')), reduce ? 0 : 900);

    if (reduce) {
      words.forEach(el => el.classList.add('on'));
      total.textContent = words.length; ms.textContent = '—'; fill.style.transform = 'scaleX(1)';
      finish();
    } else {
      const t0 = performance.now();
      words.forEach((el, i) => setTimeout(() => {
        el.classList.add('on');
        total.textContent = i + 1;
        ms.textContent = Math.round(performance.now() - t0) + ' ms';
        fill.style.transform = `scaleX(${(i + 1) / words.length})`;
        if (i === words.length - 1) finish();
      }, 350 + i * 120));
    }
  }

  /* ---------- 签名时刻 2：缓存复用演示 ---------- */
  const demo = $('#demo'), body = $('#demo-body');
  if (demo && body) {
    const SIZES = [16, 22, 28, 34];  // 每轮上下文随历史增长
    const STATS = {
      before: { rate: '≈ 20%', rebuild: '74 次', good: false, hit: .2, rest: 'miss' },
      after:  { rate: '50–60%', rebuild: '≈ 20 次', good: true, hit: .56, rest: 'new' },
    };
    const btns = demo.querySelectorAll('.seg-ctl button');
    let timers = [];

    const render = mode => {
      timers.forEach(clearTimeout); timers = [];
      const s = STATS[mode];
      btns.forEach(b => b.setAttribute('aria-checked', String(b.dataset.mode === mode)));
      body.innerHTML = SIZES.map((n, i) => {
        const hit = i === 0 ? 0 : Math.round(n * s.hit);
        const cls = Array.from({ length: n }, (_, j) => j < hit ? 'hit' : (i === 0 ? 'new' : s.rest));
        return `<div class="turn"><span class="turn-k">T${i + 1}</span><span class="chips">${cls.map((c, j) => `<i class="c ${c}" style="width:${8 + (i * 13 + j * 7) % 15}px"></i>`).join('')}</span></div>`;
      }).join('');
      const rate = $('#d-rate'), rb = $('#d-rebuild');
      rate.textContent = s.rate; rb.textContent = s.rebuild;
      rate.classList.toggle('good', s.good); rb.classList.toggle('good', s.good);
      const chips = body.querySelectorAll('.c');
      if (reduce) chips.forEach(c => c.classList.add('on'));
      else chips.forEach((c, k) => timers.push(setTimeout(() => c.classList.add('on'), k * 9)));
    };

    let touched = false;
    btns.forEach(b => b.addEventListener('click', () => { touched = true; render(b.dataset.mode); }));
    render('before');
    if (!reduce) {
      timers.forEach(clearTimeout);
      body.querySelectorAll('.c').forEach(c => c.classList.remove('on'));
      new IntersectionObserver((es, o) => es.forEach(e => {
        if (!e.isIntersecting) return;
        o.disconnect();
        render('before');
        setTimeout(() => { if (!touched) render('after'); }, 2600);
      }), { threshold: .45 }).observe(demo);
    }
  }

  /* ---------- 数字递增 ---------- */
  document.querySelectorAll('[data-count]').forEach(el => {
    const to = +el.dataset.count;
    if (reduce) return;
    new IntersectionObserver((es, o) => es.forEach(e => {
      if (!e.isIntersecting) return;
      o.disconnect();
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / 1100, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: .6 }).observe(el);
  });

  /* ---------- 页脚：粗估本页 token 数（CJK 按字，西文按词） ---------- */
  const pt = $('#page-toks');
  if (pt) {
    const txt = $('main').textContent;
    const cjk = (txt.match(/[㐀-鿿]/g) || []).length;
    const lat = (txt.replace(/[㐀-鿿]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
    pt.textContent = '≈ ' + (cjk + Math.round(lat * 1.3)).toLocaleString('en-US');
  }

  /* ---------- 顶栏分隔线 ---------- */
  const bar = $('.topbar');
  const onScroll = () => bar.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 入场 ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    const els = document.querySelectorAll('.sec-head, .feature, .card, .timeline li, .sk, .num, .contact-card');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => { el.classList.add('reveal'); io.observe(el); });
  }
})();
