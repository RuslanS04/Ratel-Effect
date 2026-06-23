/* ============================================
   RatelEffect — Main JavaScript
   ============================================ */

// ╔══════════════════════════════════════════════════════════════╗
// ║  CONFIG — All project parameters centralized here           ║
// ║  Edit these values to configure the entire site             ║
// ╚══════════════════════════════════════════════════════════════╝
const CONFIG = {
  // ── Collection ──────────────────────────────────────────────
  COLLECTION_NAME:          'RatelEffect',
  TOTAL_SUPPLY:             4999,
  CURRENT_MINTED:           0,

  // ── Links ──────────────────────────────────────────────────
  OPENSEA_URL:              'https://opensea.io/collection/ratel-effect',
  TWITTER_URL:              '',
  WEBSITE_URL:              'https://rateleffect.art',

  // ── Smart Contract (Base Mainnet) ──────────────────────────
  NFT_CONTRACT_ADDRESS:     '0xe23e98e719964e304d91f4464d3ed508c685b8fd',
  SEADROP_CONTRACT_ADDRESS: '0x00005EA00Ac477B1030CE78506496e8C2dE24bf5',
  FEE_RECIPIENT:            '0x5571e5fbEEc0C36ee810F8f01298DF461090c2de',
  CHAIN_ID:                 8453,       // Base Mainnet
  CHAIN_NAME:               'Base Mainnet',
  CHAIN_RPC:                'https://mainnet.base.org',
  CHAIN_EXPLORER:           'https://basescan.org',

  // ── Mint Parameters ────────────────────────────────────────
  MINT_PRICE:               0.0009,   // ETH 0.000573
  MAX_PER_TX:               100,

  // ── Timer / Countdown ──────────────────────────────────────
  COUNTDOWN_TARGET:         '2026-06-23T21:00:00+04:00',

  // ── OpenSea API ────────────────────────────────────────────
  OPENSEA_COLLECTION_SLUG:  'ratel-effect',
  OPENSEA_API_KEY:          '793414f9632a492fab5836bf53ff43d1',

  // ── Mint Phases ────────────────────────────────────────────
  PHASES: [
    { name: 'Phase 1 — Team',   price: 'Free',         limit: '100 NFT', platform: 'OpenSea' },
    { name: 'Phase 2 — GTD',    price: 'Free',         limit: '2 NFT',  platform: 'OpenSea' },
    { name: 'Phase 3 — FCFS',   price: 'Free',         limit: '1 NFT',  platform: 'OpenSea' },
    { name: 'Phase 4 — Public', price: '0.000077 ETH', limit: '10',      platform: 'OpenSea + Site', active: true },
  ],
};

// ╔══════════════════════════════════════════════════════════════╗
// ║  GLOBAL STATE                                               ║
// ╚══════════════════════════════════════════════════════════════╝
let currentQty = 1;
let walletAddress = null;

// ╔══════════════════════════════════════════════════════════════╗
// ║  BLOCKCHAIN HELPERS                                         ║
// ╚══════════════════════════════════════════════════════════════╝
function parseEther(ethStr) {
  const [intPart, decPart = ''] = String(ethStr).split('.');
  const dec18 = (decPart + '000000000000000000').slice(0, 18);
  return BigInt(intPart) * BigInt('1000000000000000000') + BigInt(dec18);
}

function toHex(n) {
  return '0x' + BigInt(n).toString(16);
}

function padLeft32(hexStr) {
  return hexStr.replace('0x', '').padStart(64, '0');
}

function encodeMintPublic(nftContract, feeRecipient, minterAddr, quantity) {
  const selector = '0x161ac21f';
  const enc = (addr) => padLeft32(addr.toLowerCase().replace('0x', ''));
  const encUint = (n) => BigInt(n).toString(16).padStart(64, '0');
  return selector + enc(nftContract) + enc(feeRecipient) + enc(minterAddr) + encUint(quantity);
}

async function waitForReceipt(txHash, maxAttempts = 60, intervalMs = 3000) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    const receipt = await window.ethereum.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash]
    });
    if (receipt && receipt.blockNumber) return receipt;
  }
  throw new Error('Transaction not confirmed');
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  LINK UPDATER — Apply CONFIG URLs to all links              ║
// ╚══════════════════════════════════════════════════════════════╝
function updateAllLinks() {
  const osUrl = CONFIG.OPENSEA_URL || '#';
  // Update all elements with data-link="opensea"
  document.querySelectorAll('[data-link="opensea"]').forEach(el => {
    el.href = osUrl;
  });
  // Direct class selectors as fallback
  const navOpensea = document.querySelector('.nav-opensea');
  if (navOpensea) navOpensea.href = osUrl;
  const footerOpensea = document.querySelector('.footer-opensea');
  if (footerOpensea) footerOpensea.href = osUrl;
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  OPENSEA API — Fetch live collection stats                  ║
// ╚══════════════════════════════════════════════════════════════╝
async function fetchOpenSeaStats() {
  const apiKey = CONFIG.OPENSEA_API_KEY;
  const slug = CONFIG.OPENSEA_COLLECTION_SLUG;
  if (!apiKey || !slug) return;

  const headers = { 'x-api-key': apiKey, 'accept': 'application/json' };

  // Fetch collection stats (floor, volume, owners)
  try {
    const statsRes = await fetch(
      `https://api.opensea.io/api/v2/collections/${slug}/stats`,
      { headers }
    );
    if (statsRes.ok) {
      const stats = await statsRes.json();

      // Floor Price
      const floor = stats?.total?.floor_price ?? null;
      const floorEl = document.getElementById('stat-floor');
      if (floorEl && floor !== null) {
        const floorVal = parseFloat(floor);
        floorEl.textContent = floorVal > 0 ? floorVal.toFixed(4) + ' ETH' : '—';
      }

      // Floor Price Change % (24h)
      const floorChangeEl = document.getElementById('stat-floor-change');
      if (floorChangeEl) {
        const intervals = stats?.intervals ?? [];
        const oneDay = intervals.find(i => i.interval === 'one_day');
        if (oneDay && oneDay.floor_price_diff !== undefined) {
          const pct = parseFloat(oneDay.floor_price_diff) * 100;
          const sign = pct >= 0 ? '+' : '';
          floorChangeEl.textContent = sign + pct.toFixed(1) + '%';
          floorChangeEl.classList.remove('stat-positive', 'stat-negative');
          floorChangeEl.classList.add(pct >= 0 ? 'stat-positive' : 'stat-negative');
        } else {
          floorChangeEl.textContent = '—';
        }
      }

      // Total Volume
      const volume = stats?.total?.volume ?? null;
      const volumeEl = document.getElementById('stat-volume');
      if (volumeEl && volume !== null) {
        const vol = parseFloat(volume);
        volumeEl.textContent = vol > 0 ? vol.toFixed(2) + ' ETH' : '—';
      }

      // Unique Owners
      const owners = stats?.total?.num_owners ?? null;
      const ownersEl = document.getElementById('stat-owners');
      if (ownersEl && owners !== null) {
        ownersEl.textContent = parseInt(owners).toLocaleString();
      }
    }
  } catch (e) {
    console.warn('OpenSea stats fetch failed:', e);
  }

  // Fetch collection info (total supply / minted count)
  try {
    const collRes = await fetch(
      `https://api.opensea.io/api/v2/collections/${slug}`,
      { headers }
    );
    if (collRes.ok) {
      const coll = await collRes.json();
      const minted = coll?.total_supply ?? null;
      if (minted !== null) {
        CONFIG.CURRENT_MINTED = parseInt(minted);
        updateMintProgress();
      }
    }
  } catch (e) {
    console.warn('OpenSea collection fetch failed:', e);
  }
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  ETH PRICE — CoinGecko feed for USD conversion             ║
// ╚══════════════════════════════════════════════════════════════╝
async function fetchEthPrice() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    if (res.ok) {
      const data = await res.json();
      const ethUsd = data?.ethereum?.usd;
      if (ethUsd) {
        const usdVal = (CONFIG.MINT_PRICE * ethUsd * currentQty).toFixed(2);
        const usdEl = document.getElementById('mint-price-usd');
        if (usdEl) usdEl.textContent = `≈ $${usdVal} USD`;
      }
    }
  } catch (e) { /* silent */ }
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  MINT PROGRESS — Update progress bar from CONFIG            ║
// ╚══════════════════════════════════════════════════════════════╝
function updateMintProgress() {
  const pct = Math.min(100, (CONFIG.CURRENT_MINTED / CONFIG.TOTAL_SUPPLY) * 100);
  const fill = document.getElementById('mint-progress-fill');
  const text = document.getElementById('mint-progress-text');
  if (fill) fill.style.width = pct.toFixed(2) + '%';
  if (text) text.textContent =
    CONFIG.CURRENT_MINTED.toLocaleString() + ' / ' + CONFIG.TOTAL_SUPPLY.toLocaleString();
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  COUNTDOWN — Timer until mint opens                         ║
// ╚══════════════════════════════════════════════════════════════╝
function updateCountdown() {
  const MINT_OPEN_TIME = new Date(CONFIG.COUNTDOWN_TARGET).getTime();
  const now = Date.now();
  const diff = MINT_OPEN_TIME - now;

  const badge      = document.getElementById('mint-status-badge');
  const statusText = document.getElementById('mint-status-text');
  const cdWrapper  = document.getElementById('countdown-wrapper');
  const qtyWrapper = document.getElementById('qty-wrapper');
  const connectBtn = document.getElementById('btn-connect-wallet');
  const mintBtn    = document.getElementById('btn-mint');
  const phasesTable = document.getElementById('mint-phases-table');
  const phaseLabel = document.getElementById('mint-phase-label');

  if (now >= MINT_OPEN_TIME) {
    // ── Mint is LIVE ──
    if (cdWrapper)  cdWrapper.style.display = 'none';
    if (badge) {
      badge.className = 'mint-status-badge live';
    }
    if (statusText) statusText.textContent = 'Public Mint Live';
    if (qtyWrapper) qtyWrapper.style.display = '';
    if (connectBtn) connectBtn.style.display = '';
    if (mintBtn)    mintBtn.style.display = '';
    if (phasesTable) phasesTable.style.display = 'none';
    if (phaseLabel)  phaseLabel.style.display = 'none';
    return; // Stop countdown
  }

  // ── Still counting down ──
  if (diff <= 0) {
    if (cdWrapper)  cdWrapper.style.display = 'none';
    if (badge)      badge.className = 'mint-status-badge waiting';
    if (statusText) statusText.textContent = 'Pending';
  } else {
    const days    = Math.floor(diff / 86400000);
    const hours   = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const pad = n => String(n).padStart(2, '0');

    const dEl = document.getElementById('cd-days');
    const hEl = document.getElementById('cd-hours');
    const mEl = document.getElementById('cd-minutes');
    const sEl = document.getElementById('cd-seconds');
    if (dEl) dEl.textContent = pad(days);
    if (hEl) hEl.textContent = pad(hours);
    if (mEl) mEl.textContent = pad(minutes);
    if (sEl) sEl.textContent = pad(seconds);
  }

  setTimeout(updateCountdown, 1000);
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  QUANTITY CONTROLS                                          ║
// ╚══════════════════════════════════════════════════════════════╝
function changeQty(delta) {
  currentQty = Math.max(1, Math.min(CONFIG.MAX_PER_TX, currentQty + delta));
  const input = document.getElementById('mint-qty-input');
  if (input) input.value = currentQty;
  fetchEthPrice();
}

function setQtyFromInput(val) {
  const n = parseInt(val);
  if (!isNaN(n) && n >= 1) {
    currentQty = Math.min(CONFIG.MAX_PER_TX, n);
    fetchEthPrice();
  }
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  CONNECT WALLET — MetaMask + Base chain switch              ║
// ╚══════════════════════════════════════════════════════════════╝
async function connectWallet() {
  if (!window.ethereum) {
    alert('MetaMask not found. Please install MetaMask and set it to ' + CONFIG.CHAIN_NAME + '.');
    return;
  }

  const btn = document.getElementById('btn-connect-wallet');
  btn.textContent = '⏳ Connecting...';
  btn.disabled = true;

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    walletAddress = accounts[0];

    // Check and switch chain
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    if (parseInt(chainIdHex, 16) !== CONFIG.CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: toHex(CONFIG.CHAIN_ID) }]
        });
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: toHex(CONFIG.CHAIN_ID),
              chainName: CONFIG.CHAIN_NAME,
              rpcUrls: [CONFIG.CHAIN_RPC],
              nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: [CONFIG.CHAIN_EXPLORER]
            }]
          });
        } else {
          throw switchErr;
        }
      }
    }

    const short = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
    btn.textContent = '✅ ' + short;
    btn.classList.add('connected');
    btn.disabled = false;
    document.getElementById('btn-mint').disabled = false;

  } catch (err) {
    console.error('connectWallet error:', err);
    btn.textContent = '🔗 Connect Wallet';
    btn.disabled = false;
    if (err.code !== 4001) alert('Wallet connection failed. Please try again.');
  }
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  MINT NFT — SeaDrop mintPublic call                         ║
// ╚══════════════════════════════════════════════════════════════╝
async function mintNFT() {
  if (!walletAddress) {
    alert('Please connect your wallet first.');
    return;
  }

  const mintBtn = document.getElementById('btn-mint');
  mintBtn.textContent = '⏳ MINTING...';
  mintBtn.disabled = true;

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) throw new Error('Wallet disconnected. Please reconnect.');
    const fromAddr = accounts[0];

    // Verify correct chain
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    if (parseInt(chainIdHex, 16) !== CONFIG.CHAIN_ID) {
      throw new Error('Wrong network. Please switch to ' + CONFIG.CHAIN_NAME + '.');
    }

    // Calculate cost
    const priceWei = parseEther(CONFIG.MINT_PRICE.toFixed(18));
    const totalCost = priceWei * BigInt(currentQty);
    const valueHex = toHex(totalCost);

    // Encode SeaDrop mintPublic calldata
    const data = encodeMintPublic(
      CONFIG.NFT_CONTRACT_ADDRESS,
      CONFIG.FEE_RECIPIENT,
      fromAddr,
      currentQty
    );

    // Estimate gas
    let gasEstimate;
    try {
      const gasHex = await window.ethereum.request({
        method: 'eth_estimateGas',
        params: [{ from: fromAddr, to: CONFIG.SEADROP_CONTRACT_ADDRESS, data, value: valueHex }]
      });
      gasEstimate = toHex(BigInt(gasHex) * 120n / 100n); // +20% buffer
    } catch (gasErr) {
      gasEstimate = toHex(BigInt(150000) * BigInt(currentQty)); // fallback
    }

    // Send transaction
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: fromAddr,
        to: CONFIG.SEADROP_CONTRACT_ADDRESS,
        data,
        value: valueHex,
        gas: gasEstimate
      }]
    });

    mintBtn.textContent = '⛏️ TX PENDING...';
    console.log('🚀 Tx sent:', txHash);
    console.log('🔗 ' + CONFIG.CHAIN_EXPLORER + '/tx/' + txHash);

    // Wait for confirmation
    const receipt = await waitForReceipt(txHash);
    if (receipt.status === '0x0') throw new Error('Transaction reverted on-chain.');

    mintBtn.textContent = '✅ MINTED!';
    CONFIG.CURRENT_MINTED += currentQty;
    updateMintProgress();

    setTimeout(() => {
      mintBtn.textContent = '⚡ MINT NOW';
      mintBtn.disabled = false;
    }, 4000);

  } catch (err) {
    console.error('Mint failed:', err);
    mintBtn.textContent = '⚡ MINT NOW';
    mintBtn.disabled = false;

    if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
      alert('Transaction rejected by user.');
    } else if (err.message?.includes('insufficient funds')) {
      alert('Insufficient funds! You need at least ' +
        (CONFIG.MINT_PRICE * currentQty).toFixed(6) + ' ETH + gas.');
    } else {
      alert('Mint failed: ' + (err.data?.message || err.message || 'Unknown error'));
    }
  }
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  MAIN INIT — DOM Content Loaded                             ║
// ╚══════════════════════════════════════════════════════════════╝
document.addEventListener('DOMContentLoaded', () => {

  // ── Apply CONFIG to UI elements ──
  updateAllLinks();

  // Set price display from CONFIG
  const priceEthEl = document.querySelector('.mint-price-box .eth');
  if (priceEthEl) priceEthEl.textContent = CONFIG.MINT_PRICE.toFixed(6);

  // Set max mint display from CONFIG
  const maxMintEl = document.getElementById('max-mint-display');
  if (maxMintEl) maxMintEl.textContent = CONFIG.MAX_PER_TX;

  // ── Fetch live data ──
  fetchEthPrice();
  updateMintProgress();
  updateCountdown();

  if (CONFIG.OPENSEA_COLLECTION_SLUG && CONFIG.OPENSEA_API_KEY) {
    fetchOpenSeaStats();
    setInterval(fetchOpenSeaStats, 120000); // Refresh every 2 min
  }

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
        // Once visible, stop observing
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

      // Close all others
      faqItems.forEach(i => i.classList.remove('active'));

      // Toggle current
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

      // Random neon color
      const colors = [
        { r: 0, g: 240, b: 255 },   // cyan
        { r: 176, g: 38, b: 255 },   // purple
        { r: 255, g: 0, b: 229 },    // magenta
        { r: 57, g: 255, b: 20 },    // green
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Fade in/out
      this.opacity += this.fadeDirection * 0.002;
      if (this.opacity >= 0.5) this.fadeDirection = -1;
      if (this.opacity <= 0.05) this.fadeDirection = 1;

      // Wrap around edges
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

      // Glow effect
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity * 0.1})`;
      ctx.fill();
    }
  }

  // Create particles
  const particleCount = Math.min(60, Math.floor(window.innerWidth / 20));
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  // Draw connections between close particles
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

    particles.forEach(p => {
      p.update();
      p.draw();
    });

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

      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeOut);

      element.textContent = current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  };

  // Observe hero stats for counter animation
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

  // Random glitch effect every 3-6 seconds
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

  // Fallback in case load event already fired
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 100);

});
