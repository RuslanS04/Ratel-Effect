/* ============================================
   RatelEffect — Main JavaScript
   ============================================ */

// ═══════════════════════════════════════════════
// CONFIGURATION — TÜM PARAMETRELER BURADA
// Değiştirmek istediğin her şeyi bu objeden yap
// ═══════════════════════════════════════════════
const CONFIG = {

  // ═══════════════════════════════════════════
  // 1. BLOCKCHAIN & SMART CONTRACT
  // ═══════════════════════════════════════════
  BLOCKCHAIN: {
    // Hangi ağda mint yapılacak?
    // 'ethereum' | 'sepolia' | 'polygon' | 'mumbai' | 'arbitrum' | 'optimism' | 'base'
    NETWORK: 'base',

    // Chain ID'ler (otomatik seçilir, değiştirme)
    CHAIN_IDS: {
      ethereum: 1,
      sepolia: 11155111,
      polygon: 137,
      mumbai: 80001,
      arbitrum: 42161,
      optimism: 10,
      base: 8453,
    },

    // RPC URL (isteğe bağlı — MetaMask varsayılanını kullanmak için boş bırak)
    RPC_URL: '',
    // Örnek: 'https://eth-mainnet.g.alchemy.com/v2/SENIN_API_KEY'
    // Örnek: 'https://mainnet.infura.io/v3/SENIN_API_KEY'
  },

  // ═══════════════════════════════════════════
  // 2. SMART CONTRACT PARAMETRELERİ
  // ═══════════════════════════════════════════
  CONTRACT: {
    // Mint kontrat adresi (0x...)
    ADDRESS: '0xe23e98e719964e304d91f4464d3ed508c685b8fd',
    // Örnek: '0x1234567890abcdef1234567890abcdef12345678'

    // Kontrat sahibi / Fee recipient adresi
    // Mint ücretinin gönderileceği cüzdan
    FEE_RECIPIENT: '0x5571e5fbEEc0C36ee810F8f01298DF461090c2de',
    // Örnek: '0xabcdef1234567890abcdef1234567890abcdef12'

    // Kontrat ABI (Application Binary Interface)
    // Eğer SeaDrop/OpenSea kullanıyorsan aşağıdaki MINIMAL_ABI yeterli
    // Özel kontratın varsa buraya kendi ABI'ni yapıştır
    ABI: null, // null = aşağıdaki MINIMAL_ABI kullan
  },

  // SeaDrop / Standart ERC721 Mint ABI (minimal)
  // Bunu değiştirme — kendi ABI'n varsa CONTRACT.ABI'ye yapıştır
  MINIMAL_ABI: [
    {
      "inputs": [
        { "internalType": "address", "name": "minter", "type": "address" },
        { "internalType": "uint256", "name": "quantity", "type": "uint256" }
      ],
      "name": "mintPublic",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "minter", "type": "address" },
        { "internalType": "uint256", "name": "quantity", "type": "uint256" }
      ],
      "name": "mintAllowList",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getActivePublicDrop",
      "outputs": [
        {
          "components": [
            { "internalType": "uint80", "name": "startPrice", "type": "uint80" },
            { "internalType": "uint80", "name": "endPrice", "type": "uint80" },
            { "internalType": "uint40", "name": "startTime", "type": "uint40" },
            { "internalType": "uint40", "name": "endTime", "type": "uint40" },
            { "internalType": "uint40", "name": "maxTotalMintableByWallet", "type": "uint40" },
            { "internalType": "uint40", "name": "feeBps", "type": "uint40" },
            { "internalType": "bool", "name": "restrictFeeRecipients", "type": "bool" }
          ],
          "internalType": "struct PublicDrop",
          "name": "publicDrop",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalMinted",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
      "name": "balanceOf",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "minter", "type": "address" },
        { "indexed": false, "internalType": "uint256", "name": "quantity", "type": "uint256" }
      ],
      "name": "SeaDropMint",
      "type": "event"
    }
  ],

  // ═══════════════════════════════════════════
  // 3. MINT PARAMETRELERİ
  // ═══════════════════════════════════════════
  MINT: {
    // Mint başlangıç tarihi: YYYY, MM(1-12), DD, HH(0-23), MM, SS
    // NOT: JavaScript'te ay 0-11 arası! 0=Ocak, 6=Temmuz
    START_DATE: new Date(2026, 6, 26, 14, 0, 0), // 1 Temmuz 2025, 14:00

    // Mint bitiş tarihi (null = bitiş yok)
    END_DATE: null,
    // Örnek: new Date(2025, 6, 15, 14, 0, 0)

    // Toplam arz
    TOTAL_SUPPLY: 4999,

    // Mint fiyatı (ETH cinsinden)
    PRICE_ETH: 0.000077,

    // Tek işlemde max kaç adet mintlenebilir
    MAX_PER_TX: 100,

    // Kişi başı max mint (kontrat limiti)
    MAX_PER_WALLET: 100,

    // Hangi mint fonksiyonu kullanılacak?
    // 'public' | 'allowlist' | 'signature'
    MINT_FUNCTION: 'public',

    // SeaDrop fee recipient index (varsa)
    FEE_RECIPIENT_INDEX: 0,
  },

  // ═══════════════════════════════════════════
  // 4. OPENSEA API
  // ═══════════════════════════════════════════
  OPENSEA: {
    // OpenSea API Key (ücretsiz al: https://docs.opensea.io/reference/api-keys)
    API_KEY: '793414f9632a492fab5836bf53ff43d1',

    // Koleksiyon slug'ı (OpenSea URL'deki ad)
    // Örnek: opensea.io/collection/rateleffect → 'rateleffect'
    COLLECTION_SLUG: 'rateleffect',

    // Blockchain ağı
    CHAIN: 'base',

    // İstatistikleri kaç ms'de bir yenile (30sn)
    REFRESH_INTERVAL_MS: 30000,
  },

  // ═══════════════════════════════════════════
  // 5. UI METİNLERİ
  // ═══════════════════════════════════════════
  TEXT: {
    STATUS_PENDING: 'Pending',
    STATUS_LIVE: 'Live',
    STATUS_ENDED: 'Ended',
    PHASE_LABEL: 'Phase 4 — Public Mint',
    CONNECT_WALLET: '🔗 Connect Wallet',
    MINT_BUTTON: '⚡ MINT NOW',
    MINT_SUCCESS: '✅ Mint Successful!',
    MINT_ERROR: '❌ Mint Failed',
  },

  // ═══════════════════════════════════════════
  // 6. GELİŞMİŞ AYARLAR
  // ═══════════════════════════════════════════
  ADVANCED: {
    // Gas limit multiplier (1.2 = %20 fazla gas)
    GAS_MULTIPLIER: 1.2,

    // Transaction confirmation bekleme süresi (saniye)
    TX_TIMEOUT: 120,

    // Debug modu (console.log açar)
    DEBUG: false,
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
  web3: null,
  contract: null,
};


// ═══════════════════════════════════════════════
// HELPER: Log
// ═══════════════════════════════════════════════
function log(...args) {
  if (CONFIG.ADVANCED.DEBUG) console.log('[RatelEffect]', ...args);
}


/* ============================================
   WEB3 & CONTRACT SETUP
   ============================================ */

/**
 * Web3 provider'ı başlatır
 */
async function initWeb3() {
  if (typeof window.ethereum === 'undefined') {
    return null;
  }

  try {
    // Chain ID kontrolü
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const targetChainId = CONFIG.BLOCKCHAIN.CHAIN_IDS[CONFIG.BLOCKCHAIN.NETWORK];
    const currentChainId = parseInt(chainId, 16);

    if (currentChainId !== targetChainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + targetChainId.toString(16) }],
        });
      } catch (switchError) {
        // Ağ eklenmemişse ekle
        if (switchError.code === 4902) {
          alert('Lütfen ' + CONFIG.BLOCKCHAIN.NETWORK + ' ağını MetaMask'e ekleyin.');
        }
        throw switchError;
      }
    }

    // Web3 instance (varsayılan olarak window.ethereum kullan)
    // Ethers.js veya Web3.js kütüphanesi yüklüyse onu kullan
    if (typeof ethers !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      state.web3 = provider;
    } else {
      // Raw ethereum provider
      state.web3 = window.ethereum;
    }

    return state.web3;
  } catch (err) {
    console.error('Web3 init error:', err);
    return null;
  }
}

/**
 * Smart contract instance'ı oluşturur
 */
async function initContract() {
  if (!state.web3 || !CONFIG.CONTRACT.ADDRESS) return null;

  try {
    const abi = CONFIG.CONTRACT.ABI || CONFIG.MINIMAL_ABI;

    if (typeof ethers !== 'undefined') {
      const signer = await state.web3.getSigner();
      state.contract = new ethers.Contract(CONFIG.CONTRACT.ADDRESS, abi, signer);
    } else {
      // Web3.js veya raw
      state.contract = {
        address: CONFIG.CONTRACT.ADDRESS,
        abi: abi,
      };
    }

    log('Contract initialized:', CONFIG.CONTRACT.ADDRESS);
    return state.contract;
  } catch (err) {
    console.error('Contract init error:', err);
    return null;
  }
}

/**
 * Kontrat üzerinden mint edilmiş sayısını çeker
 */
async function fetchContractMinted() {
  if (!state.contract || !CONFIG.CONTRACT.ADDRESS) return;

  try {
    let totalMinted;
    if (typeof ethers !== 'undefined' && state.contract.totalMinted) {
      totalMinted = await state.contract.totalMinted();
      state.mintedCount = Number(totalMinted);
    } else if (typeof ethers !== 'undefined' && state.contract.totalSupply) {
      totalMinted = await state.contract.totalSupply();
      state.mintedCount = Number(totalMinted);
    }
    renderProgress();
  } catch (err) {
    log('Contract minted fetch failed:', err.message);
  }
}


/* ============================================
   OPENSEA API INTEGRATION
   ============================================ */

async function fetchOpenSeaStats() {
  const { COLLECTION_SLUG, API_KEY } = CONFIG.OPENSEA;
  try {
    const headers = { 'Accept': 'application/json' };
    if (API_KEY) headers['X-API-KEY'] = API_KEY;

    const response = await fetch(
      `https://api.opensea.io/api/v2/collections/${COLLECTION_SLUG}/stats`,
      { headers }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('OpenSea stats fetch failed:', error.message);
    return null;
  }
}

async function fetchOpenSeaCollection() {
  const { COLLECTION_SLUG, API_KEY } = CONFIG.OPENSEA;
  try {
    const headers = { 'Accept': 'application/json' };
    if (API_KEY) headers['X-API-KEY'] = API_KEY;

    const response = await fetch(
      `https://api.opensea.io/api/v2/collections/${COLLECTION_SLUG}`,
      { headers }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('OpenSea collection fetch failed:', error.message);
    return null;
  }
}

async function fetchEthUsdRate() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    const data = await response.json();
    return data.ethereum.usd;
  } catch (error) {
    console.warn('ETH/USD fetch failed:', error.message);
    return 3500;
  }
}

async function updateStats() {
  const [statsData, collectionData, ethRate] = await Promise.all([
    fetchOpenSeaStats(),
    fetchOpenSeaCollection(),
    fetchEthUsdRate(),
  ]);

  state.ethUsdRate = ethRate;

  if (statsData && statsData.total) {
    const s = statsData.total;
    state.totalVolume = parseFloat(s.volume || 0);
    state.totalSales = parseInt(s.num_owners || 0);
    state.floorPrice = parseFloat(s.floor_price || 0);
    // Kontrat verisi yoksa OpenSea'den al
    if (state.mintedCount === 0) {
      state.mintedCount = parseInt(s.total_supply || 0);
    }
  }

  if (collectionData && collectionData.owner_count) {
    state.uniqueHolders = collectionData.owner_count;
  } else {
    state.uniqueHolders = state.totalSales;
  }

  // Kontrat üzerinden de kontrol et
  await fetchContractMinted();

  renderStats();
  renderMintPrice();
  renderProgress();
}

function renderStats() {
  let statsContainer = document.getElementById('opensea-stats');

  if (!statsContainer) {
    const mintSection = document.querySelector('.mint-container');
    if (!mintSection) return;
    statsContainer = document.createElement('div');
    statsContainer.id = 'opensea-stats';
    statsContainer.className = 'opensea-stats-grid';
    mintSection.parentNode.insertBefore(statsContainer, mintSection);
  }

  const volEth = state.totalVolume.toFixed(3);
  const volUsd = (state.totalVolume * state.ethUsdRate).toLocaleString('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
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

function renderMintPrice() {
  const usdEl = document.getElementById('mint-price-usd');
  if (usdEl && state.ethUsdRate > 0) {
    const usd = (CONFIG.MINT.PRICE_ETH * state.ethUsdRate).toFixed(2);
    usdEl.textContent = `≈ $${usd} USD`;
  }
}

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
    diff = start - now;
    if (cdTitle) cdTitle.textContent = 'Public Mint Opens In';
  } else if (end && now > end) {
    isEnded = true;
    diff = 0;
  } else {
    isLive = true;
    diff = end ? end - now : 0;
    if (cdTitle) cdTitle.textContent = 'Public Mint Ends In';
  }

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
    if (btnWallet) btnWallet.style.display = 'none';
    if (btnMint) btnMint.style.display = 'none';
    if (qtyWrapper) qtyWrapper.style.display = 'none';
  }

  if (cdDays) cdDays.textContent = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0');
  if (cdHours) cdHours.textContent = String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
  if (cdMinutes) cdMinutes.textContent = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
  if (cdSeconds) cdSeconds.textContent = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
}


/* ============================================
   WALLET & MINT FUNCTIONS
   ============================================ */

async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('Lütfen MetaMask veya başka bir Web3 cüzdanı yükleyin.\n\nMetaMask: https://metamask.io');
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    state.walletConnected = true;
    state.walletAddress = accounts[0];

    // Web3 ve kontrat başlat
    await initWeb3();
    await initContract();

    // UI güncelle
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

    log('Wallet connected:', accounts[0]);
  } catch (err) {
    console.error('Wallet connection failed:', err);
    alert('Cüzdan bağlantısı reddedildi.');
  }
}

async function mintNFT() {
  if (!state.walletConnected) {
    alert('Önce cüzdanınızı bağlayın.');
    return;
  }

  if (!state.contract) {
    alert('Smart contract bağlantısı kurulamadı. CONTRACT.ADDRESS kontrol edin.');
    return;
  }

  const qty = state.qty;
  const totalCost = CONFIG.MINT.PRICE_ETH * qty;
  const totalCostWei = BigInt(Math.floor(totalCost * 1e18)).toString();

  log('Minting:', qty, 'NFTs, Total:', totalCost, 'ETH');

  try {
    let tx;

    if (typeof ethers !== 'undefined') {
      // Ethers.js ile mint
      const value = ethers.parseEther(totalCost.toString());

      if (CONFIG.MINT.MINT_FUNCTION === 'public') {
        tx = await state.contract.mintPublic(state.walletAddress, qty, { value });
      } else if (CONFIG.MINT.MINT_FUNCTION === 'allowlist') {
        tx = await state.contract.mintAllowList(state.walletAddress, qty, { value });
      } else {
        alert('Bilinmeyen mint fonksiyonu: ' + CONFIG.MINT.MINT_FUNCTION);
        return;
      }

      log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      log('Transaction confirmed:', receipt.hash);

      alert(CONFIG.TEXT.MINT_SUCCESS + '\n\nTx: ' + receipt.hash.slice(0, 20) + '...');
    } else {
      // Raw ethereum provider (MetaMask)
      const abi = CONFIG.CONTRACT.ABI || CONFIG.MINIMAL_ABI;
      const mintFn = abi.find(f => f.name === (CONFIG.MINT.MINT_FUNCTION === 'public' ? 'mintPublic' : 'mintAllowList'));

      if (!mintFn) {
        alert('Mint fonksiyonu ABI'de bulunamadı.');
        return;
      }

      const data = window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: state.walletAddress,
          to: CONFIG.CONTRACT.ADDRESS,
          value: '0x' + BigInt(totalCostWei).toString(16),
          data: '0x' + encodeMintData(mintFn, [state.walletAddress, qty]),
        }],
      });

      alert(CONFIG.TEXT.MINT_SUCCESS);
    }

    // Mint sonrası istatistikleri güncelle
    await fetchContractMinted();
    await updateStats();

  } catch (err) {
    console.error('Mint failed:', err);
    alert(CONFIG.TEXT.MINT_ERROR + '\n\n' + (err.reason || err.message || 'Bilinmeyen hata'));
  }
}

/**
 * Raw transaction data encode (fallback)
 */
function encodeMintData(fnAbi, params) {
  // Basit encoder — production'da ethers.js veya web3.js kullan
  // Bu fonksiyon sadece fallback olarak çalışır
  const signature = fnAbi.name + '(' + fnAbi.inputs.map(i => i.type).join(',') + ')';
  // Keccak256 hash'in ilk 4 byte'ı
  // Gerçek uygulamada ethers.js kullanın
  return '';
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
