(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Navigation scroll state ──
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  const scrollProgressBar = document.querySelector('.scroll-progress-bar');

  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // ── Scroll Progress Bar ──
  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (scrollProgressBar) {
      scrollProgressBar.style.width = progress + '%';
    }
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  // ── Mobile menu ──
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('active', open);
    navToggle.setAttribute('aria-expanded', open);
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // ── Copy IP functionality ──
  function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
  }

  function bindCopyButtons() {
    const copyTargets = document.querySelectorAll('[data-ip]');

    copyTargets.forEach((el) => {
      el.addEventListener('click', async () => {
        const ip = el.dataset.ip;
        try {
          await copyToClipboard(ip);
          showCopyFeedback(el);
        } catch {
          fallbackCopy(ip);
        }
      });
    });
  }

  function showCopyFeedback(el) {
    const feedback = document.getElementById('copy-feedback');
    if (feedback && el.id === 'copy-ip') {
      feedback.textContent = 'Copied to clipboard';
      setTimeout(() => { feedback.textContent = ''; }, 2000);
      return;
    }

    const copyLabel = el.querySelector('.step-ip-copy');
    if (copyLabel) {
      const original = copyLabel.textContent;
      copyLabel.textContent = 'Copied!';
      setTimeout(() => { copyLabel.textContent = original; }, 2000);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  bindCopyButtons();

  // ── Initialize local hero trailer video (autoplay muted, user can unmute) ──
  (function initLocalTrailer(){
    try {
      const video = document.getElementById('hero-video');
      const btn = document.getElementById('video-unmute');
      if (!video) return;

      // Ensure video is muted for autoplay policies and attempt to play
      video.muted = true;
      video.playsInline = true;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(function () {
          // autoplay blocked in some contexts — still fine, user can click unmute to start with sound
        });
      }

      if (!btn) return;

      btn.addEventListener('click', function () {
        const wasMuted = video.muted;
        // toggling muted is considered a user gesture and should allow audio to play
        video.muted = !wasMuted;
        btn.setAttribute('aria-pressed', String(!video.muted));
        btn.setAttribute('aria-label', video.muted ? 'Unmute trailer' : 'Mute trailer');
        // try to resume playback with audio if unmuted
        if (!video.muted) {
          video.play().catch(function () {});
        }
        // simple visual feedback: toggle class on button
        btn.classList.toggle('muted', video.muted);
      });

    } catch (e) {
      // ignore initialization errors
    }
  })();

  // ── Scroll reveal ──
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  // Hero elements visible on load
  requestAnimationFrame(() => {
    document.querySelectorAll('.hero .reveal').forEach((el) => {
      el.classList.add('visible');
    });
  });

  // ── Active Section Highlighting (nav + scene dots) ──
  const sections = document.querySelectorAll('.slide[id]');
  const navLinksAll = document.querySelectorAll('.nav-links a[data-nav-link]');
  const sceneDots = document.querySelectorAll('.scene-dot');

  function updateActiveSection() {
    const scrollPos = window.scrollY + window.innerHeight * 0.4;
    let currentId = 'hero';

    sections.forEach((section) => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) {
        currentId = section.id;
      }
    });

    // Update nav links
    navLinksAll.forEach((link) => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === currentId);
    });

    // Update scene dots
    sceneDots.forEach((dot) => {
      dot.classList.toggle('active', dot.dataset.target === currentId);
    });
  }

  window.addEventListener('scroll', updateActiveSection, { passive: true });
  updateActiveSection();

  // ── Scene Navigation Dots ──
  sceneDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const target = document.getElementById(dot.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });

  // ── Particle system ──
  const canvas = document.getElementById('particles');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createParticle() {
      const palette = [
        'rgba(74,154,58,0.9)', // grass/emerald
        'rgba(201,168,76,0.95)', // gold
        'rgba(212,86,138,0.95)', // lotus
        'rgba(60,60,60,0.9)'
      ];
      return {
        x: Math.floor(Math.random() * canvas.width),
        y: Math.floor(Math.random() * canvas.height),
        size: Math.floor(Math.random() * 6) + 4,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: -Math.random() * 0.6 - 0.2,
        color: palette[Math.floor(Math.random() * palette.length)],
      };
    }

    function initParticles() {
      const count = Math.min(80, Math.floor(window.innerWidth / 20));
      particles = Array.from({ length: count }, createParticle);
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // draw as pixelated blocks
      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < -20) {
          p.y = canvas.height + 20;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
      });

      animId = requestAnimationFrame(drawParticles);
    }

    resize();
    initParticles();
    drawParticles();

    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        drawParticles();
      }
    });
  }

  // ── Storm module: full-page cinematic rain + lightning ──
  (function initStorm() {
    const canvas = document.getElementById('storm');
    if (!canvas || prefersReducedMotion) return;

    const flashOverlay = document.getElementById('lightning-flash');
    const fogEl = document.querySelector('.hero-fog');
    const reflectEls = document.querySelectorAll('.lightning-reflect');

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = null;
    let running = false;
    let lastTime = 0;

    // ── Lightning state ──
    let lightningIntensity = 0;   // 0..1 current flash brightness
    let nextFlashAt = 0;          // timestamp (ms) of next flash
    let flashPhase = 0;           // 0 idle, 1 active
    let flashStart = 0;
    let flashDuration = 0;
    let flashPeak = 0;
    let flashStrong = false;
    let activeBolts = [];         // lightning bolts currently being drawn

    // ── Rain layers: [count, speed, len, width, alpha, wind] ──
    const layers = [
      { count: 160, speed: 0.45, len: 12, width: 0.8, alpha: 0.08, wind: 0.5 },
      { count: 120, speed: 0.70, len: 18, width: 1.1, alpha: 0.13, wind: 0.8 },
      { count: 70,  speed: 1.00, len: 26, width: 1.6, alpha: 0.20, wind: 1.1 },
      { count: 35,  speed: 1.45, len: 36, width: 2.2, alpha: 0.30, wind: 1.4 }
    ];

    let drops = [];
    let splashes = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initDrops();
    }

    function initDrops() {
      drops = [];
      splashes = [];
      const areaScale = (width / 1440) * (height / 900);
      layers.forEach((layer, li) => {
        const count = Math.max(20, Math.floor(layer.count * areaScale));
        for (let i = 0; i < count; i++) {
          drops.push({
            layer: li,
            x: Math.random() * width,
            y: Math.random() * height,
            len: layer.len * (0.7 + Math.random() * 0.6),
            speed: layer.speed * (0.8 + Math.random() * 0.4),
            wind: layer.wind * (0.9 + Math.random() * 0.2),
            alpha: layer.alpha * (0.6 + Math.random() * 0.8),
            jitter: (Math.random() - 0.5) * 0.05
          });
        }
      });
    }

    // ── Lightning bolt generation ──
    function generateBolt(startX, startY, endY, branches) {
      const points = [];
      let x = startX;
      let y = startY;
      const segLen = 18 + Math.random() * 14;
      const maxOffset = 46;

      while (y < endY) {
        points.push({ x: x, y: y });
        x += (Math.random() - 0.5) * maxOffset * 1.4;
        y += segLen * (0.8 + Math.random() * 0.5);
      }
      points.push({ x: x, y: Math.min(endY, y) });

      const bolt = {
        points: points,
        branches: [],
        born: performance.now(),
        life: 260 + Math.random() * 220,
        flicker: 0.7 + Math.random() * 0.3
      };

      // Add jagged sub-branches
      const branchCount = branches || 2 + Math.floor(Math.random() * 3);
      for (let b = 0; b < branchCount; b++) {
        const startIdx = Math.floor(Math.random() * (points.length - 3)) + 1;
        const sp = points[startIdx];
        const bp = [{ x: sp.x, y: sp.y }];
        let bx = sp.x;
        let by = sp.y;
        const bLen = 40 + Math.random() * 90;
        const bSeg = 12 + Math.random() * 8;
        const dir = Math.random() < 0.5 ? -1 : 1;
        while (by - sp.y < bLen) {
          bx += dir * (8 + Math.random() * 18);
          by += bSeg * (0.7 + Math.random() * 0.6);
          bp.push({ x: bx, y: by });
        }
        bolt.branches.push(bp);
      }

      return bolt;
    }

    function scheduleFlash() {
      // Random 8–22s between flashes
      nextFlashAt = performance.now() + (8000 + Math.random() * 14000);
    }

    function triggerFlash() {
      flashPhase = 1;
      flashStart = performance.now();
      flashStrong = Math.random() < 0.2;
      flashDuration = flashStrong ? 1500 : 1100;
      flashPeak = flashStrong ? 0.30 : 0.20;

      // Spawn 1–3 lightning bolts across the sky
      const boltCount = flashStrong ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < boltCount; i++) {
        const bx = width * (0.12 + Math.random() * 0.76);
        const by = -20 - Math.random() * 60;
        const endY = height * (0.35 + Math.random() * 0.45);
        activeBolts.push(generateBolt(bx, by, endY, 2 + Math.floor(Math.random() * 3)));
      }
    }

    function updateLightning(now) {
      if (now >= nextFlashAt) {
        triggerFlash();
        scheduleFlash();
      }

      if (flashPhase === 1) {
        const t = (now - flashStart) / flashDuration;
        if (t >= 1) {
          flashPhase = 0;
          lightningIntensity = 0;
          activeBolts = [];
          setReflect(false);
          return;
        }
        // Sequence: dark → faint → bright → dark (eased)
        let intensity;
        if (t < 0.10) {
          intensity = t / 0.10 * 0.30;                    // faint rise
        } else if (t < 0.28) {
          intensity = 0.30 + (t - 0.10) / 0.18 * 0.70;    // bright rise
        } else if (t < 0.52) {
          intensity = 1 - (t - 0.28) / 0.24 * 0.45;       // first decay
        } else if (t < 0.68) {
          intensity = 0.55 - (t - 0.52) / 0.16 * 0.30;    // second dip
        } else {
          intensity = 0.25 * (1 - (t - 0.68) / 0.32);     // final fade
        }
        lightningIntensity = Math.max(0, Math.min(1, intensity * flashPeak * 4));
        setReflect(lightningIntensity > 0.25);
      }
    }

    function setReflect(on) {
      reflectEls.forEach((el) => {
        el.classList.toggle('flash', on);
      });
      if (fogEl) fogEl.classList.toggle('flash', on);
    }

    // ── Draw lightning bolts ──
    function drawBolts(now) {
      activeBolts = activeBolts.filter((bolt) => now - bolt.born < bolt.life);

      activeBolts.forEach((bolt) => {
        const age = (now - bolt.born) / bolt.life;
        const fade = 1 - age;
        const flicker = 0.65 + Math.random() * 0.35;

        // Outer glow
        ctx.save();
        ctx.strokeStyle = 'rgba(190, 215, 255, ' + (0.10 * fade * flicker) + ')';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        bolt.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Mid glow
        ctx.strokeStyle = 'rgba(220, 235, 255, ' + (0.28 * fade * flicker) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        bolt.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Bright core
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.85 * fade * flicker) + ')';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        bolt.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Branches
        bolt.branches.forEach((branch) => {
          ctx.strokeStyle = 'rgba(220, 235, 255, ' + (0.22 * fade * flicker) + ')';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          branch.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.55 * fade * flicker) + ')';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          branch.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
        });

        ctx.restore();
      });
    }

    // ── Draw rain with depth + splashes ──
    function drawRain(dt) {
      ctx.clearRect(0, 0, width, height);

      // Rain brightens with lightning
      const lightBoost = 1 + lightningIntensity * 1.8;

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const layer = layers[d.layer];

        d.y += d.speed * dt * 60;
        d.x += d.wind * dt * 60 + d.jitter * dt * 60;

        // Seamless wrap
        if (d.y > height + d.len) {
          d.y = -d.len;
          d.x = Math.random() * width;
          // Spawn a small splash at the bottom
          if (layer.width >= 1.6 && Math.random() < 0.5) {
            splashes.push({
              x: d.x,
              y: height - 2,
              vx: (Math.random() - 0.5) * 1.6,
              vy: -Math.random() * 1.4 - 0.4,
              life: 1,
              decay: 0.04 + Math.random() * 0.04,
              size: 1 + Math.random() * 1.5
            });
          }
        }
        if (d.x > width + 20) d.x = -20;
        if (d.x < -20) d.x = width + 20;

        const alpha = Math.min(0.55, d.alpha * lightBoost);

        // Tapered drop: bright head, fading tail
        const grad = ctx.createLinearGradient(d.x, d.y, d.x + d.wind * 2, d.y + d.len);
        grad.addColorStop(0, 'rgba(205, 222, 245, ' + (alpha * 1.15) + ')');
        grad.addColorStop(1, 'rgba(205, 222, 245, ' + (alpha * 0.15) + ')');

        ctx.strokeStyle = grad;
        ctx.lineWidth = layer.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.wind * 2, d.y + d.len);
        ctx.stroke();
      }

      // Update + draw splashes
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.x += s.vx * dt * 60;
        s.y += s.vy * dt * 60;
        s.vy += 0.12 * dt * 60;
        s.life -= s.decay;

        if (s.life <= 0) {
          splashes.splice(i, 1);
          continue;
        }

        ctx.fillStyle = 'rgba(205, 222, 245, ' + (s.life * 0.35 * lightBoost) + ')';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
      lastTime = now;

      updateLightning(now);
      drawRain(dt);
      drawBolts(now);

      // Full-page lightning flash overlay
      if (flashOverlay) {
        flashOverlay.style.opacity = String(lightningIntensity * 0.55);
      }

      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      lastTime = performance.now();
      scheduleFlash();
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (flashOverlay) flashOverlay.style.opacity = '0';
      activeBolts = [];
      setReflect(false);
    }

    // Pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    window.addEventListener('resize', resize);
    resize();
    start();
  })();

  // ── Smooth anchor offset for fixed nav ──
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });

  // small pulse when copying IPs (visual feedback)
  document.querySelectorAll('[data-ip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.classList.add('block-bounce');
      setTimeout(() => btn.classList.remove('block-bounce'), 450);
    });
  });

  // ── Additional interactive animations: parallax, ripple, and card tilt ──
  if (!prefersReducedMotion) {
    // Parallax for world background
    const worldBg = document.querySelector('.world-bg-image');
    if (worldBg) {
      window.addEventListener('scroll', () => {
        const y = window.scrollY * 0.03; // subtle translate
        worldBg.style.transform = `scale(1.1) translateY(${y}px)`;
      }, { passive: true });
    }

    // Parallax for hero background
    const heroBg = document.querySelector('.hero-bg-image');
    if (heroBg) {
      window.addEventListener('scroll', () => {
        const y = window.scrollY * 0.05;
        heroBg.style.transform = `scale(1.08) translateY(${y}px)`;
      }, { passive: true });
    }

    // Ripple effect for clickable elements
    function createRipple(e) {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => { ripple.remove(); }, 650);
    }

    document.querySelectorAll('.btn, .status-ip-btn, .footer-link-btn, .hero-ip-value, .step-ip').forEach((el) => {
      el.addEventListener('click', createRipple);
    });

    // 3D tilt for feature cards
    document.querySelectorAll('.feature-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const rx = (-y) * 6; // rotateX
        const ry = x * 6; // rotateY
        card.style.transform = `translateY(-6px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ── Block bounce animation class ──
  const style = document.createElement('style');
  style.textContent = `
    .block-bounce {
      animation: blockBounce 0.45s cubic-bezier(.2,.9,.2,1);
    }
    @keyframes blockBounce {
      0% { transform: translateY(0) scaleY(1); }
      50% { transform: translateY(-6px) scaleY(1.02); }
      100% { transform: translateY(0) scaleY(1); }
    }
  `;
  document.head.appendChild(style);
})();