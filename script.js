(function () {
  const scene = document.getElementById('scene');
  const player = document.getElementById('player');
  const overlay = document.getElementById('panel-overlay');
  const panelTitle = document.getElementById('panel-title');
  const panelContent = document.getElementById('panel-content');
  const panelClose = document.getElementById('panel-close');

  const SPEED = 180; // px per second
  const KEY_MAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  let pos = { x: 0, y: 0 }; // relative to scene center
  let pressed = new Set();
  let lastTs = 0;
  let lastClosedAt = 0; // cooldown timestamp after close
  let lastOverlapHotspot = null; // last hotspot that triggered overlap open
  let requireSeparation = false; // must leave hotspot before re-open

  const PROFILE = {
    name: '정태연',
    interests: ['모바일', '멀티플랫폼 프로그래밍', 'AI'],
    email: 'email@xodus.lol',
    github: 'https://github.com/jtaeyeon05',
    githubUser: 'jtaeyeon05'
  };

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function getBounds() {
    const rect = scene.getBoundingClientRect();
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    // player is 36x36, keep fully inside
    const padW = halfW - 18;
    const padH = halfH - 18;
    return { minX: -padW, maxX: padW, minY: -padH, maxY: padH };
  }

  function applyPos() {
    player.style.transform = `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`;
  }

  function step(ts) {
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    if (overlay.hidden === false) {
      requestAnimationFrame(step);
      return;
    }

    if (pressed.size) {
      let dx = 0, dy = 0;
      if (pressed.has('left')) dx -= 1;
      if (pressed.has('right')) dx += 1;
      if (pressed.has('up')) dy -= 1;
      if (pressed.has('down')) dy += 1;
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy) || 1;
        dx /= len; dy /= len;
        pos.x += dx * SPEED * dt;
        pos.y += dy * SPEED * dt;
        const b = getBounds();
        pos.x = clamp(pos.x, b.minX, b.maxX);
        pos.y = clamp(pos.y, b.minY, b.maxY);
        applyPos();
      }
    }
    // Auto-open when overlapping a hotspot
    maybeAutoOpenOnOverlap();
    requestAnimationFrame(step);
  }

  function getNearestHotspot() {
    const hotspots = Array.from(document.querySelectorAll('.hotspot'));
    if (!hotspots.length) return { el: null, dist: Infinity };
    const playerRect = player.getBoundingClientRect();
    const px = playerRect.left + playerRect.width / 2;
    const py = playerRect.top + playerRect.height / 2;
    let best = null; let bestDist = Infinity;
    hotspots.forEach(h => {
      const r = h.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(cx - px, cy - py);
      if (d < bestDist) { bestDist = d; best = h; }
    });
    return { el: best, dist: bestDist };
  }

  async function openPanel(kind) {
    const contentByKind = {
      about: () => ({
        title: 'About',
        html: `<h3>${PROFILE.name}</h3>
          <p>관심사: ${PROFILE.interests.join(', ')}</p>
          <p>이 포트폴리오는 캐릭터로 탐험하는 인터랙티브 사이트입니다.</p>`
      }),
      projects: async () => {
        const repos = await fetchRepos(PROFILE.githubUser);
        const list = repos.map(r => `<li><a href="${r.html_url}" target="_blank" rel="noopener">${r.name}</a>${r.description ? ` — ${escapeHtml(r.description)}` : ''}</li>`).join('') || '<li>표시할 저장소가 없습니다.</li>';
        return {
          title: 'Projects',
          html: `<h3>GitHub 프로젝트</h3><ul>${list}</ul><p style="margin-top:8px"><a href="${PROFILE.github}" target="_blank" rel="noopener">GitHub 전체 보기</a></p>`
        };
      },
      contact: () => ({
        title: 'Contact',
        html: `<h3>연락처</h3>
          <p>이메일: <a href="mailto:${PROFILE.email}">${PROFILE.email}</a></p>
          <p>GitHub: <a href="${PROFILE.github}" target="_blank" rel="noopener">${PROFILE.github.replace('https://', '')}</a></p>`
      })
    };

    const entry = contentByKind[kind];
    if (!entry) return;

    // resolve content (sync or async)
    const data = typeof entry === 'function' ? await entry() : entry;
    panelTitle.textContent = data.title;
    panelContent.innerHTML = data.html;
    // show with animations
    overlay.hidden = false;
    overlay.classList.remove('fade-out', 'is-closing');
    overlay.classList.add('fade-in');
    const panelEl = overlay.querySelector('.panel');
    panelEl.classList.remove('pop-out');
    void panelEl.offsetWidth;
    panelEl.classList.add('pop-in');
  }

  function closePanel() {
    const panelEl = overlay.querySelector('.panel');
    overlay.classList.remove('fade-in');
    overlay.classList.add('fade-out', 'is-closing');
    panelEl.classList.remove('pop-in');
    void panelEl.offsetWidth;
    panelEl.classList.add('pop-out');
    const finish = () => {
      overlay.hidden = true;
      overlay.classList.remove('fade-out', 'is-closing');
      panelEl.classList.remove('pop-out');
      player.focus();
    };
    const onEnd = (e) => {
      if (e.animationName === 'fadeOut') {
        overlay.removeEventListener('animationend', onEnd);
        finish();
      }
    };
    overlay.addEventListener('animationend', onEnd);
    lastClosedAt = lastTs;
    // If still overlapping the last hotspot, keep separation requirement
    if (lastOverlapHotspot) {
      const playerRect = player.getBoundingClientRect();
      const r = lastOverlapHotspot.getBoundingClientRect();
      if (rectsOverlap(playerRect, r)) {
        requireSeparation = true;
      }
    }
  }

  async function fetchRepos(user) {
    try {
      const res = await fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=12`);
      if (!res.ok) throw new Error('GitHub API 오류');
      const data = await res.json();
      // simple mapping
      return data.map(r => ({ name: r.name, html_url: r.html_url, description: r.description || '' }));
    } catch (e) {
      return [];
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.code in KEY_MAP) {
      e.preventDefault();
      pressed.add(KEY_MAP[e.code]);
    } else if ((e.code === 'Space' || e.code === 'Enter')) {
      e.preventDefault();
      // If near a hotspot, open
      tryOpenNearest();
    } else if (e.code === 'Escape') {
      e.preventDefault();
      if (!overlay.hidden) closePanel();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code in KEY_MAP) pressed.delete(KEY_MAP[e.code]);
  });

  // Buttons
  document.querySelectorAll('.btn.dir').forEach(btn => {
    const dir = btn.getAttribute('data-dir');
    const down = () => pressed.add(dir);
    const up = () => pressed.delete(dir);
    btn.addEventListener('mousedown', down);
    btn.addEventListener('touchstart', (ev) => { ev.preventDefault(); down(); }, { passive: false });
    btn.addEventListener('mouseup', up);
    btn.addEventListener('mouseleave', up);
    btn.addEventListener('touchend', up);
    btn.addEventListener('touchcancel', up);
  });
  document.querySelector('.btn.action')?.addEventListener('click', tryOpenNearest);

  // Hotspots click
  document.querySelectorAll('.hotspot').forEach(h => {
    h.addEventListener('click', () => openPanel(h.dataset.panel));
  });

  panelClose.addEventListener('click', closePanel);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePanel(); });

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function maybeAutoOpenOnOverlap() {
    if (!overlay.hidden) return;
    if (lastTs - lastClosedAt < 500) return; // small cooldown to avoid instant reopen
    const playerRect = player.getBoundingClientRect();
    const hotspots = Array.from(document.querySelectorAll('.hotspot'));

    // if separation is required from the last overlapped hotspot, enforce it
    if (requireSeparation && lastOverlapHotspot) {
      const rPrev = lastOverlapHotspot.getBoundingClientRect();
      if (rectsOverlap(playerRect, rPrev)) {
        return; // still overlapping the same hotspot → do not reopen
      }
      requireSeparation = false; // separation achieved
    }

    for (const h of hotspots) {
      const r = h.getBoundingClientRect();
      if (rectsOverlap(playerRect, r)) {
        lastOverlapHotspot = h;
        requireSeparation = true; // must leave before opening again
        openPanel(h.dataset.panel);
        break;
      }
    }
  }

  function tryOpenNearest() {
    if (!overlay.hidden) return;
    // small cooldown after closing to avoid instant reopen
    if (lastTs - lastClosedAt < 500) return;
    const { el, dist } = getNearestHotspot();
    if (el && dist < 170) openPanel(el.dataset.panel);
  }

  // Initialize
  function init() {
    const b = getBounds();
    pos.x = 0; pos.y = 0;
    applyPos();
    player.setAttribute('tabindex', '0');
    player.focus();
    overlay.hidden = true;
    requestAnimationFrame((ts) => { lastTs = ts; requestAnimationFrame(step); });
  }

  window.addEventListener('resize', () => applyPos());
  document.addEventListener('DOMContentLoaded', init);
})();


