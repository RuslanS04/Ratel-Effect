/* ============================================
   RatelEffect — Main JavaScript
   ============================================ */

// ═══════════════════════════════════════════════
// CONFIGURATION — Tüm parametreleri buradan değiştir
// ═══════════════════════════════════════════════
const CONFIG = {
  // ─── OpenSea API ───
  OPENSEA: {
    API_KEY: '793414f9632a492fab5836bf53ff43d1',                    // OpenSea API Key (gerekirse buraya ekle)
    COLLECTION_SLUG: 'rateleffect', // Koleksiyon slug'ı
    CHAIN: 'ethereum',              // 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | 'zora' | 'blast'
    REFRESH_INTERVAL_MS: 30000,     // İstatistikleri kaç ms'de bir yenile (30sn)
  },

  // ─── Mint Zamanlaması ───
  MINT: {
    // Mint başlangıç tarihi: YYYY, MM(1-12), DD, HH(0-23), MM, SS
    START_DATE: new Date(2026, 6, 24, 14, 0, 0), // 1 Temmuz 2025, 14:00
    END_DATE: null,                 // null = bitiş yok | new Date(2025,6,15,14,0,0)
    TOTAL_SUPPLY: 4999,             // Toplam arz
    PRICE_ETH: 0.000077,            // Mint fiyatı (ETH)
    MAX_PER_TX: 100,                // Tek işlemde max mint
    CONTRACT_ADDRESS: '',           // Smart contract adresi (0x...)
  },

  // ─── UI Metinleri ───
  TEXT: {
    STATUS_PENDING: 'Pending',
    STATUS_LIVE: 'Live',
    STATUS_ENDED: 'Ended',
    PHASE_LABEL: 'Phase 4 — Public Mint',
  }
};

// ═══════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════
let state = {
  mintedCount: 0,
  uniqueHolders: 0,
  totalSales: 0,
  totalVolume: 0,
  floorPrice: 0,
  ethUsdRate: 0,
  walletConnected: false,
  walletAddress: null,
  qty: 1,
};

/* ============================================
   OPENSEA API INTEGRATION
   ============================================ */

/**
 * OpenSea API'den koleksiyon istatistiklerini çeker
 * Endpoint: /api/v2/collections/{collection_slug}/stats
 */
async function fetchOpenSeaStats() {
  const { COLLECTION_SLUG, API_KEY, CHAIN } = CONFIG.OPENSEA;

  try {
    const headers = {
      'Accept': 'application/json',
    };
    if (API_KEY) {
      headers['X-API-KEY'] = API_KEY;
    }

    // OpenSea v2 API — koleksiyon stats
    const response = await fetch(
      `https://api.opensea.io/api/v2/collections/${COLLECTION_SLUG}/stats`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`OpenSea API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('OpenSea stats fetch failed:', error.message);
    return null;
  }
}

/**
 * OpenSea API'den koleksiyon detaylarını çeker (holder sayısı için)
 * Endpoint: /api/v2/collections/{collection_slug}
 */
async function fetchOpenSeaCollection() {
  const { COLLECTION_SLUG, API_KEY } = CONFIG.OPENSEA;

  try {
    const headers = {
      'Accept': 'application/json',
    };
    if (API_KEY) {
      headers['X-API-KEY'] = API_KEY;
    }

    const response = await fetch(
      `https://api.opensea.io/api/v2/collections/${COLLECTION_SLUG}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`OpenSea API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('OpenSea collection fetch failed:', error.message);
    return null;
  }
}

/**
 * ETH/USD kurunu çeker (CoinGecko API)
 */
async function fetchEthUsdRate() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    const data = await response.json();
    return data.ethereum.usd;
  } catch (error) {
    console.warn('ETH/USD fetch failed:', error.message);
    return 3500; // fallback
  }
}

/**
 * Tüm istatistikleri günceller ve DOM'a yansıtır
 */
async function updateStats() {
  // Paralel fetch
  const [statsData, collectionData, ethRate] = await Promise.all([
    fetchOpenSeaStats(),
    fetchOpenSeaCollection(),
    fetchEthUsdRate(),
  ]);

  state.ethUsdRate = ethRate;

  if (statsData && statsData.total) {
    const s = statsData.total;
    state.totalVolume = parseFloat(s.volume || 0);
    state.totalSales = parseInt(s.num_owners || 0); // OpenSea'de num_owners = unique holders
    state.floorPrice = parseFloat(s.floor_price || 0);
    state.mintedCount = parseInt(s.total_supply || 0);
  }

  // Eğer collection API'den farklı holder verisi gelirse onu kullan
  if (collectionData && collectionData.owner_count) {
    state.uniqueHolders = collectionData.owner_count;
  } else {
    state.uniqueHolders = state.totalSales; // fallback
  }

  // DOM güncelle
  renderStats();
  renderMintPrice();
  renderProgress();
}

/**
 * İstatistik kartlarını DOM'a basar
 */
function renderStats() {
  // Mevcut hero-stats'ın altına veya mint card'ın üstüne dinamik stats ekle
  let statsContainer = document.getElementById('opensea-stats');

  if (!statsContainer) {
    // İlk oluşturma — Mint card'ın hemen üstüne ekle
    const mintSection = document.querySelector('.mint-container');
    if (!mintSection) return;

    statsContainer = document.createElement('div');
    statsContainer.id = 'opensea-stats';
    statsContainer.className = 'opensea-stats-grid';
    mintSection.parentNode.insertBefore(statsContainer, mintSection);
  }

  const volEth = state.totalVolume.toFixed(3);
  const volUsd = (state.totalVolume * state.ethUsdRate).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  statsContainer.innerHTML = `
    <div class="os-stat-card">
      <div class="os-stat-icon">👥</div>
      <div class="os-stat-value" id="stat-holders">${state.uniqueHolders.toLocaleString()}</div>
      <div class="os-stat-label">Unique Holders</div>
    </div>
    <div class="os-stat-card">
      <div class="os-stat-icon">🖼️</div>
      <div class="os-stat-value" id="stat-minted">${state.mintedCount.toLocaleString()}</div>
      <div class="os-stat-label">Total Minted</div>
    </div>
    <div class="os-stat-card">
      <div class="os-stat-icon">💰</div>
      <div class="os-stat-value" id="stat-volume">${volEth} ETH</div>
      <div class="os-stat-label">Total Volume</div>
      <div class="os-stat-sub">${volUsd}</div>
    </div>
    <div class="os-stat-card">
      <div class="os-stat-icon">📈</div>
      <div class="os-stat-value" id="stat-sales">${state.totalSales.toLocaleString()}</div>
      <div class="os-stat-label">Total Sales</div>
    </div>
    <div class="os-stat-card">
      <div class="os-stat-icon">🏷️</div>
      <div class="os-stat-value" id="stat-floor">${state.floorPrice > 0 ? state.floorPrice.toFixed(4) : '—'} ETH</div>
      <div class="os-stat-label">Floor Price</div>
    </div>
  `;
}

/**
 * Mint fiyatını USD olarak göster
 */
function renderMintPrice() {
  const usdEl = document.getElementById('mint-price-usd');
  if (usdEl && state.ethUsdRate > 0) {
    const usd = (CONFIG.MINT.PRICE_ETH * state.ethUsdRate).toFixed(2);
    usdEl.textContent = `≈ $${usd} USD`;
  }
}

/**
 * Progress bar'ı güncelle
 */
function renderProgress() {
  const fill = document.getElementById('mint-progress-fill');
  const text = document.getElementById('mint-progress-text');
  if (!fill || !text) return;

  const pct = Math.min((state.mintedCount / CONFIG.MINT.TOTAL_SUPPLY) * 100, 100);
  fill.style.width = pct + '%';
  text.textContent = `${state.mintedCount.toLocaleString()} / ${CONFIG.MINT.TOTAL_SUPPLY.toLocaleString()}`;
}

/* ============================================
   MINT TIMER / COUNTDOWN
   ============================================ */

function updateCountdown() {
  const now = new Date().getTime();
  const start = CONFIG.MINT.START_DATE.getTime();
  const end = CONFIG.MINT.END_DATE ? CONFIG.MINT.END_DATE.getTime() : null;

  const cdDays = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMinutes = document.getElementById('cd-minutes');
  const cdSeconds = document.getElementById('cd-seconds');
  const statusBadge = document.getElementById('mint-status-badge');
  const statusText = document.getElementById('mint-status-text');
  const btnWallet = document.getElementById('btn-connect-wallet');
  const btnMint = document.getElementById('btn-mint');
  const qtyWrapper = document.getElementById('qty-wrapper');
  const countdownWrapper = document.getElementById('countdown-wrapper');
  const cdTitle = countdownWrapper?.querySelector('.cd-title');

  let diff;
  let isLive = false;
  let isEnded = false;

  if (now < start) {
    // Henüz başlamadı
    diff = start - now;
    if (cdTitle) cdTitle.textContent = 'Public Mint Opens In';
  } else if (end && now > end) {
    // Bitti
    isEnded = true;
    diff = 0;
  } else {
    // Şu an live
    isLive = true;
    diff = end ? end - now : 0;
    if (cdTitle) cdTitle.textContent = 'Public Mint Ends In';
  }

  // Status badge güncelle
  if (statusBadge && statusText) {
    statusBadge.className = 'mint-status-badge';
    if (isEnded) {
      statusBadge.classList.add('ended');
      statusText.textContent = CONFIG.TEXT.STATUS_ENDED;
    } else if (isLive) {
      statusBadge.classList.add('live');
      statusText.textContent = CONFIG.TEXT.STATUS_LIVE;
    } else {
      statusBadge.classList.add('waiting');
      statusText.textContent = CONFIG.TEXT.STATUS_PENDING;
    }
  }

  // Butonları göster/gizle
  if (isLive && !isEnded) {
    if (btnWallet) btnWallet.style.display = 'flex';
    if (qtyWrapper) qtyWrapper.style.display = 'grid';
    if (countdownWrapper && diff === 0) countdownWrapper.style.display = 'none';
  } else if (isEnded) {
    if (btnWallet) btnWallet.style.display = 'none';
    if (btnMint) btnMint.style.display = 'none';
    if (qtyWrapper) qtyWrapper.style.display = 'none';
    if (countdownWrapper) countdownWrapper.style.display = 'none';
  } else {
    // Waiting
    if (btnWallet) btnWallet.style.display = 'none';
    if (btnMint) btnMint.style.display = 'none';
    if (qtyWrapper) qtyWrapper.style.display = 'none';
  }

  // Countdown değerleri
  if (cdDays) cdDays.textContent = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0');
  if (cdHours) cdHours.textContent = String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
  if (cdMinutes) cdMinutes.textContent = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
  if (cdSeconds) cdSeconds.textContent = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
}

/* ============================================
   WALLET & MINT FUNCTIONS
   ============================================ */

function connectWallet() {
  // MetaMask / WalletConnect entegrasyonu buraya
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(accounts => {
        state.walletConnected = true;
        state.walletAddress = accounts[0];
        const btn = document.getElementById('btn-connect-wallet');
        const mintBtn = document.getElementById('btn-mint');
        if (btn) {
          btn.textContent = '✅ ' + accounts[0].slice(0, 6) + '...' + accounts[0].slice(-4);
          btn.classList.add('connected');
        }
        if (mintBtn) {
          mintBtn.style.display = 'flex';
          mintBtn.disabled = false;
        }
      })
      .catch(err => {
        console.error('Wallet connection failed:', err);
        alert('Cüzdan bağlantısı reddedildi.');
      });
  } else {
    alert('Lütfen MetaMask yada başka bir Web3 cüzdanı yükleyin.');
  }
}

function mintNFT() {
  if (!state.walletConnected) {
    alert('Önce cüzdanınızı bağlayın.');
    return;
  }
  // Smart contract mint çağrısı buraya eklenecek
  console.log('Minting', state.qty, 'NFTs...');
}

function changeQty(delta) {
  const newQty = state.qty + delta;
  if (newQty >= 1 && newQty <= CONFIG.MINT.MAX_PER_TX) {
    state.qty = newQty;
    const input = document.getElementById('mint-qty-input');
    if (input) input.value = state.qty;
  }
}

function setQtyFromInput(val) {
  const num = parseInt(val, 10);
  if (!isNaN(num) && num >= 1 && num <= CONFIG.MINT.MAX_PER_TX) {
    state.qty = num;
  } else {
    const input = document.getElementById('mint-qty-input');
    if (input) input.value = state.qty;
  }
}

/* ============================================
   DOM READY — Init
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // İlk veri çekimi
  updateStats();
  // Periyodik yenileme
  setInterval(updateStats, CONFIG.OPENSEA.REFRESH_INTERVAL_MS);

  // Countdown başlat
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Max per tx göster
  const maxDisplay = document.getElementById('max-mint-display');
  if (maxDisplay) maxDisplay.textContent = CONFIG.MINT.MAX_PER_TX;

  // ═══════════════════════════════════════════
  // AŞAĞISI ORİJİNAL KOD — DEĞİŞTİRİLMEDİ
  // ═══════════════════════════════════════════

  // ============ NAVBAR SCROLL EFFECT ============
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  });

  // ============ MOBILE NAV TOGGLE ============
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  // Close nav on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // ============ SMOOTH SCROLL FOR ANCHOR LINKS ============
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ============ SCROLL REVEAL ANIMATIONS ============
  const revealElements = document.querySelectorAll('.reveal, .stagger-children');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ============ FAQ ACCORDION ============
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // ============ LIGHTBOX ============
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxName = document.getElementById('lightboxName');
  const lightboxId = document.getElementById('lightboxId');
  const lightboxClose = document.getElementById('lightboxClose');
  const galleryItems = document.querySelectorAll('.gallery-item');

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const src = item.getAttribute('data-src');
      const info = item.querySelector('.gallery-item-info');
      const name = info ? info.querySelector('.gallery-item-name').textContent : 'RatelEffect';
      const id = info ? info.querySelector('.gallery-item-id').textContent : '';

      lightboxImg.src = src;
      lightboxName.textContent = name;
      lightboxId.textContent = id;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // ============ PARTICLE SYSTEM ============
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId;

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.4 + 0.1;
      this.fadeDirection = Math.random() > 0.5 ? 1 : -1;

      const colors = [
        { r: 0, g: 240, b: 255 },
        { r: 176, g: 38, b: 255 },
        { r: 255, g: 0, b: 229 },
        { r: 57, g: 255, b: 20 },
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.opacity += this.fadeDirection * 0.002;
      if (this.opacity >= 0.5) this.fadeDirection = -1;
      if (this.opacity <= 0.05) this.fadeDirection = 1;
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity * 0.1})`;
      ctx.fill();
    }
  }

  const particleCount = Math.min(60, Math.floor(window.innerWidth / 20));
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  const drawConnections = () => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 150) {
          const opacity = (1 - distance / 150) * 0.08;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  };

  const animateParticles = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    animationId = requestAnimationFrame(animateParticles);
  };

  animateParticles();

  // ============ COUNTER ANIMATION ============
  const animateCounter = (element, target, suffix = '') => {
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeOut);
      element.textContent = current.toLocaleString() + suffix;
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  };

  const heroStats = document.querySelectorAll('.hero-stat-value');
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent.trim();
        if (text === '4,999') {
          animateCounter(el, 4999);
        } else if (text === '150+') {
          animateCounter(el, 150, '+');
        } else if (text === '4') {
          animateCounter(el, 4);
        }
        statsObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  heroStats.forEach(stat => statsObserver.observe(stat));

  // ============ GLITCH EFFECT ON HERO IMAGES ============
  const heroNftPreviews = document.querySelectorAll('.hero-showcase-grid .nft-preview');

  const triggerGlitch = () => {
    const randomPreview = heroNftPreviews[Math.floor(Math.random() * heroNftPreviews.length)];
    const img = randomPreview.querySelector('img');
    img.style.transform = `translate(${(Math.random() - 0.5) * 4}px, ${(Math.random() - 0.5) * 4}px)`;
    img.style.filter = `hue-rotate(${Math.random() * 60}deg) saturate(${1 + Math.random()})`;
    setTimeout(() => {
      img.style.transform = '';
      img.style.filter = '';
    }, 100);
  };

  const glitchInterval = () => {
    triggerGlitch();
    setTimeout(glitchInterval, 3000 + Math.random() * 3000);
  };
  setTimeout(glitchInterval, 2000);

  // ============ TILT EFFECT ON GALLERY ITEMS ============
  const galleryCards = document.querySelectorAll('.gallery-item');

  galleryCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -5;
      const rotateY = (x - centerX) / centerX * 5;
      card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ============ ACTIVE NAV LINK HIGHLIGHTER ============
  const sections = document.querySelectorAll('section[id]');
  const navLinkElements = document.querySelectorAll('.nav-links a[href^="#"]');

  const highlightNav = () => {
    const scrollPosition = window.scrollY + 200;
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinkElements.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.style.color = 'var(--neon-cyan)';
          }
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNav);

  // ============ PAGE LOAD ANIMATION ============
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.8s ease';

  window.addEventListener('load', () => {
    document.body.style.opacity = '1';
  });

  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 100);

});
