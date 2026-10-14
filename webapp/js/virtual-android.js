/**
 * Virtual Android 12 OS Engine (Standalone WebOS)
 * Provides an authentic, interactive, responsive Android 12 experience
 * directly in any mobile, tablet, or desktop browser.
 */

class VirtualAndroidOS {
  constructor(containerEl, onModeChange) {
    this.container = containerEl;
    this.onModeChange = onModeChange;
    this.activeApp = null;
    this.runningApps = []; // Stack of open app ids for Recents
    this.isQuickSettingsOpen = false;
    this.isRecentsOpen = false;
    this.isAppDrawerOpen = false;
    
    // System Settings & State
    this.settings = {
      darkMode: true,
      wifi: true,
      bluetooth: true,
      autoRotate: true,
      flashlight: false,
      batterySaver: false,
      brightness: 100,
      volume: 80,
      airplaneMode: false
    };

    // Installed Apps List (persisted in localStorage)
    this.defaultApps = [
      { id: 'chrome', name: 'Chrome', icon: '🌐', color: '#ea4335', badge: 'Pelayar Web' },
      { id: 'playstore', name: 'Play Store', icon: '▶️', color: '#00875a', badge: 'Gedung Aplikasi' },
      { id: 'settings', name: 'Tetapan', icon: '⚙️', color: '#5f6368', badge: 'Sistem' },
      { id: 'ssatv', name: 'SSATV Plus', icon: '📺', color: '#e11d48', badge: 'IPTV & Media' },
      { id: 'soundsource', name: 'SoundSource', icon: '🔊', color: '#8b5cf6', badge: 'Audio & EQ' },
      { id: 'terminal', name: 'Terminal', icon: '💻', color: '#06b6d4', badge: 'ADB Shell' },
      { id: 'game', name: 'Retro 2048', icon: '🎮', color: '#f59e0b', badge: 'Permainan' },
      { id: 'calculator', name: 'Kalkulator', icon: '🔢', color: '#10b981', badge: 'Alat' },
      { id: 'files', name: 'Files', icon: '📁', color: '#3b82f6', badge: 'Pengurus Fail' },
      { id: 'gallery', name: 'Galeri', icon: '🖼️', color: '#ec4899', badge: 'Foto' }
    ];

    this.installedApps = this.loadInstalledApps();
    this.initDOM();
    this.bindEvents();
    this.startClock();
  }

  loadInstalledApps() {
    try {
      const saved = localStorage.getItem('mumu_virtual_apps');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [...this.defaultApps];
  }

  saveInstalledApps() {
    try {
      localStorage.setItem('mumu_virtual_apps', JSON.stringify(this.installedApps));
    } catch (e) {}
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="vos-root" id="vos-root">
        <!-- Android 12 Wallpaper -->
        <div class="vos-wallpaper" id="vos-wallpaper"></div>

        <!-- Android Status Bar -->
        <div class="vos-status-bar" id="vos-status-bar">
          <div class="vos-status-left">
            <span id="vos-time">12:00</span>
            <span class="vos-notification-icon" id="vos-notif-icon">🔔</span>
          </div>
          <div class="vos-status-right">
            <span class="vos-status-icon" id="vos-wifi-icon">📶</span>
            <span class="vos-status-icon" id="vos-bt-icon">ᛒ</span>
            <span class="vos-status-battery"><span id="vos-battery-pct">100%</span> 🔋</span>
          </div>
        </div>

        <!-- Quick Settings & Notification Pull-down Shade -->
        <div class="vos-shade" id="vos-shade">
          <div class="vos-shade-header">
            <div class="vos-shade-clock" id="vos-shade-clock">12:00</div>
            <div class="vos-shade-date" id="vos-shade-date">Rabu, 14 Oktober</div>
          </div>
          
          <div class="vos-toggles-grid">
            <button class="vos-toggle active" data-toggle="wifi">
              <span class="vos-toggle-icon">📶</span>
              <span class="vos-toggle-label">Internet</span>
            </button>
            <button class="vos-toggle active" data-toggle="bluetooth">
              <span class="vos-toggle-icon">ᛒ</span>
              <span class="vos-toggle-label">Bluetooth</span>
            </button>
            <button class="vos-toggle" data-toggle="flashlight">
              <span class="vos-toggle-icon">🔦</span>
              <span class="vos-toggle-label">Lampu Suluh</span>
            </button>
            <button class="vos-toggle active" data-toggle="autoRotate">
              <span class="vos-toggle-icon">🔄</span>
              <span class="vos-toggle-label">Auto-putar</span>
            </button>
            <button class="vos-toggle active" data-toggle="darkMode">
              <span class="vos-toggle-icon">🌙</span>
              <span class="vos-toggle-label">Mod Gelap</span>
            </button>
            <button class="vos-toggle" data-toggle="batterySaver">
              <span class="vos-toggle-icon">🔋</span>
              <span class="vos-toggle-label">Jimat Bateri</span>
            </button>
          </div>

          <div class="vos-slider-row">
            <span>☀️</span>
            <input type="range" id="vos-brightness-slider" min="20" max="100" value="100" class="vos-range">
          </div>

          <div class="vos-notifications-box">
            <div class="vos-notif-item">
              <div class="vos-notif-title">MuMuPlayer Pro Standalone WebOS</div>
              <div class="vos-notif-body">Enjin maya Android 12 aktif & responsif pada peranti mudah alih.</div>
            </div>
          </div>

          <div class="vos-shade-footer">
            <button class="vos-shade-btn" id="vos-close-shade-btn">Tutup Panel</button>
          </div>
        </div>

        <!-- Launcher Home Screen -->
        <div class="vos-home" id="vos-home">
          <!-- Clock & Date Widget -->
          <div class="vos-widget-clock">
            <div class="vos-big-clock" id="vos-big-clock">12:00</div>
            <div class="vos-sub-date" id="vos-sub-date">Rabu, 14 Oktober &bull; 28&deg;C Cerah</div>
          </div>

          <!-- Google Search Widget -->
          <div class="vos-google-search" id="vos-google-search">
            <span class="vos-google-g">G</span>
            <span class="vos-search-text">Cari atau taip URL...</span>
            <span class="vos-mic-icon">🎤</span>
          </div>

          <!-- Apps Grid -->
          <div class="vos-app-grid" id="vos-app-grid">
            <!-- Generated Dynamically -->
          </div>

          <!-- Bottom Favorites Dock -->
          <div class="vos-dock" id="vos-dock">
            <div class="vos-app-icon-item" data-app="chrome">
              <div class="vos-icon-badge" style="background: #ea4335;">🌐</div>
              <span class="vos-icon-label">Chrome</span>
            </div>
            <div class="vos-app-icon-item" data-app="playstore">
              <div class="vos-icon-badge" style="background: #00875a;">▶️</div>
              <span class="vos-icon-label">Play Store</span>
            </div>
            <div class="vos-app-icon-item" data-app="ssatv">
              <div class="vos-icon-badge" style="background: #e11d48;">📺</div>
              <span class="vos-icon-label">SSATV</span>
            </div>
            <div class="vos-app-icon-item" data-app="game">
              <div class="vos-icon-badge" style="background: #f59e0b;">🎮</div>
              <span class="vos-icon-label">Game</span>
            </div>
            <div class="vos-app-icon-item" data-app="settings">
              <div class="vos-icon-badge" style="background: #5f6368;">⚙️</div>
              <span class="vos-icon-label">Tetapan</span>
            </div>
          </div>
        </div>

        <!-- Active App Window Layer -->
        <div class="vos-app-window" id="vos-app-window">
          <div class="vos-window-header">
            <div class="vos-window-title" id="vos-window-title">Aplikasi</div>
            <div class="vos-window-actions">
              <button class="vos-win-btn" id="vos-win-minimize" title="Minimize">_</button>
              <button class="vos-win-btn" id="vos-win-close" title="Tutup">&times;</button>
            </div>
          </div>
          <div class="vos-window-body" id="vos-window-body">
            <!-- App Content Injected Here -->
          </div>
        </div>

        <!-- Recents (Multitasking App Switcher) -->
        <div class="vos-recents" id="vos-recents">
          <div class="vos-recents-header">
            <span>Aplikasi Terkini</span>
            <button class="vos-clear-all-btn" id="vos-clear-all-btn">Kosongkan Semua</button>
          </div>
          <div class="vos-recents-carousel" id="vos-recents-carousel">
            <!-- Rendered cards -->
          </div>
        </div>
      </div>
    `;

    this.renderAppGrid();
  }

  renderAppGrid() {
    const grid = document.getElementById('vos-app-grid');
    if (!grid) return;

    grid.innerHTML = this.installedApps.map(app => `
      <div class="vos-app-icon-item" data-app="${app.id}">
        <div class="vos-icon-badge" style="background: ${app.color};">
          <span>${app.icon}</span>
        </div>
        <span class="vos-icon-label">${app.name}</span>
      </div>
    `).join('');
  }

  bindEvents() {
    const root = document.getElementById('vos-root');
    if (!root) return;

    // Status bar click/tap -> toggle shade
    const statusBar = document.getElementById('vos-status-bar');
    statusBar.addEventListener('click', () => this.toggleShade());

    const closeShadeBtn = document.getElementById('vos-close-shade-btn');
    if (closeShadeBtn) closeShadeBtn.addEventListener('click', () => this.toggleShade(false));

    // App launch via icons
    root.addEventListener('click', (e) => {
      const item = e.target.closest('.vos-app-icon-item');
      if (item && item.dataset.app) {
        this.openApp(item.dataset.app);
      }
    });

    // Google search widget click
    const searchWidget = document.getElementById('vos-google-search');
    if (searchWidget) {
      searchWidget.addEventListener('click', () => this.openApp('chrome'));
    }

    // Window header buttons
    const closeBtn = document.getElementById('vos-win-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeCurrentApp());

    const minBtn = document.getElementById('vos-win-minimize');
    if (minBtn) minBtn.addEventListener('click', () => this.goHome());

    // Recents clear all
    const clearBtn = document.getElementById('vos-clear-all-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.runningApps = [];
        this.closeRecents();
        this.goHome();
      });
    }

    // Quick Settings toggles
    root.querySelectorAll('.vos-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const toggleName = btn.dataset.toggle;
        if (toggleName in this.settings) {
          this.settings[toggleName] = !this.settings[toggleName];
          btn.classList.toggle('active', this.settings[toggleName]);
          if (toggleName === 'darkMode') {
            document.body.classList.toggle('vos-light-mode', !this.settings.darkMode);
          }
        }
      });
    });

    // Brightness slider
    const bSlider = document.getElementById('vos-brightness-slider');
    if (bSlider) {
      bSlider.addEventListener('input', (e) => {
        root.style.filter = `brightness(${e.target.value}%)`;
      });
    }

    // Touch swipe down on top of screen for shade
    let touchStartY = 0;
    root.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    root.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      if (touchStartY < 50 && touchEndY - touchStartY > 60) {
        this.toggleShade(true);
      } else if (this.isQuickSettingsOpen && touchStartY - touchEndY > 60) {
        this.toggleShade(false);
      }
    }, { passive: true });
  }

  toggleShade(forceState) {
    const shade = document.getElementById('vos-shade');
    if (!shade) return;
    this.isQuickSettingsOpen = forceState !== undefined ? forceState : !this.isQuickSettingsOpen;
    shade.classList.toggle('open', this.isQuickSettingsOpen);
  }

  startClock() {
    const update = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hrs}:${mins}`;

      const tEl = document.getElementById('vos-time');
      const bEl = document.getElementById('vos-big-clock');
      const sEl = document.getElementById('vos-shade-clock');
      if (tEl) tEl.textContent = timeStr;
      if (bEl) bEl.textContent = timeStr;
      if (sEl) sEl.textContent = timeStr;
    };
    update();
    setInterval(update, 1000);
  }

  openApp(appId) {
    this.toggleShade(false);
    this.closeRecents();

    if (!this.runningApps.includes(appId)) {
      this.runningApps.push(appId);
    }

    this.activeApp = appId;
    const win = document.getElementById('vos-app-window');
    const titleEl = document.getElementById('vos-window-title');
    const bodyEl = document.getElementById('vos-window-body');
    const homeEl = document.getElementById('vos-home');

    const appMeta = this.installedApps.find(a => a.id === appId) || { name: appId, icon: '📱' };
    if (titleEl) titleEl.innerHTML = `<span>${appMeta.icon}</span> ${appMeta.name}`;
    
    if (bodyEl) {
      bodyEl.innerHTML = this.getAppContent(appId);
      this.bindAppInteractions(appId, bodyEl);
    }

    if (homeEl) homeEl.style.opacity = '0';
    if (win) {
      win.classList.add('open');
    }
  }

  closeCurrentApp() {
    const win = document.getElementById('vos-app-window');
    const homeEl = document.getElementById('vos-home');
    if (win) win.classList.remove('open');
    if (homeEl) homeEl.style.opacity = '1';
    this.activeApp = null;
  }

  goHome() {
    this.closeCurrentApp();
    this.closeRecents();
    this.toggleShade(false);
  }

  toggleRecents() {
    if (this.isRecentsOpen) {
      this.closeRecents();
    } else {
      this.openRecents();
    }
  }

  openRecents() {
    this.closeCurrentApp();
    this.toggleShade(false);
    this.isRecentsOpen = true;

    const recentsEl = document.getElementById('vos-recents');
    const carouselEl = document.getElementById('vos-recents-carousel');
    if (!recentsEl || !carouselEl) return;

    if (this.runningApps.length === 0) {
      carouselEl.innerHTML = '<div style="color: #94a3b8; text-align: center; margin-top: 60px;">Tiada aplikasi dibuka baru-baru ini.</div>';
    } else {
      carouselEl.innerHTML = this.runningApps.map(appId => {
        const appMeta = this.installedApps.find(a => a.id === appId) || { name: appId, icon: '📱' };
        return `
          <div class="vos-recent-card" data-app="${appId}">
            <div class="vos-recent-header">
              <span>${appMeta.icon} ${appMeta.name}</span>
              <button class="vos-recent-close" onclick="event.stopPropagation(); window.virtualOS.removeRecentApp('${appId}')">&times;</button>
            </div>
            <div class="vos-recent-preview">
              <div class="vos-recent-preview-icon">${appMeta.icon}</div>
              <span>Sentuh untuk buka</span>
            </div>
          </div>
        `;
      }).join('');

      carouselEl.querySelectorAll('.vos-recent-card').forEach(card => {
        card.addEventListener('click', () => {
          this.openApp(card.dataset.app);
        });
      });
    }

    recentsEl.classList.add('open');
  }

  removeRecentApp(appId) {
    this.runningApps = this.runningApps.filter(id => id !== appId);
    this.openRecents();
  }

  closeRecents() {
    const recentsEl = document.getElementById('vos-recents');
    if (recentsEl) recentsEl.classList.remove('open');
    this.isRecentsOpen = false;
  }

  handleBack() {
    if (this.isQuickSettingsOpen) {
      this.toggleShade(false);
    } else if (this.isRecentsOpen) {
      this.closeRecents();
    } else if (this.activeApp) {
      this.closeCurrentApp();
    }
  }

  getAppContent(appId) {
    switch (appId) {
      case 'chrome':
        return `
          <div class="vos-chrome">
            <div class="vos-chrome-bar">
              <button class="vos-chrome-btn" id="chrome-back">&larr;</button>
              <button class="vos-chrome-btn" id="chrome-forward">&rarr;</button>
              <button class="vos-chrome-btn" id="chrome-refresh">&#x21bb;</button>
              <input type="text" id="chrome-url-input" value="https://www.google.com" class="vos-chrome-input">
              <button class="vos-chrome-btn-go" id="chrome-go">Buka</button>
            </div>
            <div class="vos-chrome-viewport" id="chrome-viewport">
              <div class="vos-google-page">
                <div class="vos-google-logo">Google</div>
                <div class="vos-google-input-box">
                  <input type="text" id="google-query-input" placeholder="Cari di Google atau taip URL...">
                  <button id="google-search-btn">Cari</button>
                </div>
                <div class="vos-google-shortcuts">
                  <a href="#" onclick="window.virtualOS.chromeNavigate('https://wikipedia.org')">Wikipedia</a>
                  <a href="#" onclick="window.virtualOS.chromeNavigate('https://github.com')">GitHub</a>
                  <a href="#" onclick="window.virtualOS.chromeNavigate('https://news.ycombinator.com')">Hacker News</a>
                  <a href="#" onclick="window.virtualOS.chromeNavigate('https://archive.org')">Archive</a>
                </div>
              </div>
            </div>
          </div>
        `;

      case 'playstore':
        return `
          <div class="vos-playstore">
            <div class="vos-ps-header">
              <span class="vos-ps-logo">Google Play</span>
              <input type="text" placeholder="Cari aplikasi & permainan..." class="vos-ps-search">
            </div>
            <div class="vos-ps-tabs">
              <span class="active">Untuk Anda</span>
              <span>Paling Popular</span>
              <span>Kanak-kanak</span>
              <span>Kategori</span>
            </div>
            <div class="vos-ps-app-list">
              <div class="vos-ps-item">
                <div class="vos-ps-icon" style="background: #e11d48;">📺</div>
                <div class="vos-ps-info">
                  <div class="vos-ps-title">SSATV Plus 2026</div>
                  <div class="vos-ps-sub">Pemain Siaran TV & Filem HD &bull; 4.8 ★</div>
                </div>
                <button class="vos-ps-install-btn" onclick="window.virtualOS.installApp('ssatv', 'SSATV Plus', '📺', '#e11d48')">Pasang</button>
              </div>
              <div class="vos-ps-item">
                <div class="vos-ps-icon" style="background: #ff5722;">🔥</div>
                <div class="vos-ps-info">
                  <div class="vos-ps-title">Free Fire Max Mobile</div>
                  <div class="vos-ps-sub">Garena Battle Royale &bull; 4.6 ★</div>
                </div>
                <button class="vos-ps-install-btn" onclick="window.virtualOS.installApp('ffire', 'Free Fire Max', '🔥', '#ff5722')">Pasang</button>
              </div>
              <div class="vos-ps-item">
                <div class="vos-ps-icon" style="background: #25d366;">💬</div>
                <div class="vos-ps-info">
                  <div class="vos-ps-title">WhatsApp Messenger</div>
                  <div class="vos-ps-sub">Mesej & Panggilan Suara &bull; 4.4 ★</div>
                </div>
                <button class="vos-ps-install-btn" onclick="window.virtualOS.installApp('whatsapp', 'WhatsApp', '💬', '#25d366')">Pasang</button>
              </div>
              <div class="vos-ps-item">
                <div class="vos-ps-icon" style="background: #1da1f2;">🐦</div>
                <div class="vos-ps-info">
                  <div class="vos-ps-title">X / Twitter Mobile</div>
                  <div class="vos-ps-sub">Berita & Media Sosial &bull; 4.1 ★</div>
                </div>
                <button class="vos-ps-install-btn" onclick="window.virtualOS.installApp('twitter', 'X (Twitter)', '🐦', '#1da1f2')">Pasang</button>
              </div>
            </div>
          </div>
        `;

      case 'settings':
        return `
          <div class="vos-settings">
            <div class="vos-set-header">Tetapan Android 12</div>
            <div class="vos-set-list">
              <div class="vos-set-item">
                <span class="vos-set-icon">📶</span>
                <div class="vos-set-text">
                  <div class="vos-set-title">Rangkaian & Internet</div>
                  <div class="vos-set-desc">Wi-Fi (Disambungkan: MuMu-HighSpeed), Data Mudah Alih</div>
                </div>
              </div>
              <div class="vos-set-item">
                <span class="vos-set-icon">📱</span>
                <div class="vos-set-text">
                  <div class="vos-set-title">Paparan & Warna (Material You)</div>
                  <div class="vos-set-desc">Resolusi Adaptif, Kadar Segar 60 FPS, Tema Gelap</div>
                </div>
              </div>
              <div class="vos-set-item">
                <span class="vos-set-icon">🔊</span>
                <div class="vos-set-text">
                  <div class="vos-set-title">Bunyi & Getaran</div>
                  <div class="vos-set-desc">Kelantangan Media ${this.settings.volume}%, Haptik Aktif</div>
                </div>
              </div>
              <div class="vos-set-item">
                <span class="vos-set-icon">🔋</span>
                <div class="vos-set-text">
                  <div class="vos-set-title">Bateri</div>
                  <div class="vos-set-desc">100% - Prestasi Maksimum &bull; Tidak panas</div>
                </div>
              </div>
              <div class="vos-set-item">
                <span class="vos-set-icon">💾</span>
                <div class="vos-set-text">
                  <div class="vos-set-title">Storan Peranti</div>
                  <div class="vos-set-desc">24.2 GB digunakan daripada 128 GB</div>
                </div>
              </div>
              <div class="vos-set-item">
                <span class="vos-set-icon">ℹ️</span>
                <div class="vos-set-text">
                  <div class="vos-set-title">Mengenai Telefon (About Phone)</div>
                  <div class="vos-set-desc">Peranti: Google Pixel 8 Pro (ARM64 Apple Silicon) &bull; Android 12 (API 31) &bull; Kernel 5.15.78-android</div>
                </div>
              </div>
            </div>
          </div>
        `;

      case 'ssatv':
        return `
          <div class="vos-ssatv">
            <div class="vos-tv-header">
              <span style="font-weight: 700; color: #e11d48;">SSATV Plus Live</span>
              <span style="font-size: 11px; color: #00f0ff;">Kualiti: 1080p FHD 60FPS</span>
            </div>
            <div class="vos-tv-screen">
              <div class="vos-tv-mock-video">
                <div class="vos-tv-live-badge">🔴 SIARAN LANGSUNG</div>
                <div style="font-size: 48px; margin-bottom: 12px;">🎬</div>
                <div style="font-weight: 600; color: #fff;">Saluran Ria HD &bull; Siaran Hiburan Keluarga</div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Strim video digital beresolusi tinggi tanpa lag.</div>
              </div>
            </div>
            <div class="vos-tv-channels">
              <div class="vos-tv-chan active">101 &bull; TV1 HD</div>
              <div class="vos-tv-chan">102 &bull; TV2 HD</div>
              <div class="vos-tv-chan">103 &bull; TV3 HD</div>
              <div class="vos-tv-chan">104 &bull; Astro Ria HD</div>
              <div class="vos-tv-chan">105 &bull; Astro Warna HD</div>
              <div class="vos-tv-chan">106 &bull; Berita RTM</div>
            </div>
          </div>
        `;

      case 'soundsource':
        return `
          <div class="vos-soundsource">
            <div class="vos-ss-title">SoundSource Pro - Pengadun Audio Android</div>
            <div class="vos-slider-block">
              <label>Kelantangan Media</label>
              <input type="range" min="0" max="100" value="85" class="vos-range">
            </div>
            <div class="vos-slider-block">
              <label>Panggilan & Notifikasi</label>
              <input type="range" min="0" max="100" value="70" class="vos-range">
            </div>
            <div class="vos-slider-block">
              <label>Penggera (Alarm)</label>
              <input type="range" min="0" max="100" value="90" class="vos-range">
            </div>
            <div class="vos-eq-grid">
              <div class="vos-eq-card">Bass Boost: <strong>+6 dB</strong></div>
              <div class="vos-eq-card">Vocal Clarity: <strong>Aktif</strong></div>
              <div class="vos-eq-card">Surround 3D: <strong>Stereo</strong></div>
            </div>
          </div>
        `;

      case 'terminal':
        return `
          <div class="vos-terminal">
            <div class="vos-term-output" id="vos-term-output">MuMuPlayer Pro Standalone Android 12 Environment [ARM64 Apple Silicon]
Linux localhost 5.15.78-android12-9-g8a3b #1 SMP PREEMPT aarch64
Taip 'help' untuk senarai arahan tersedia.
</div>
            <div class="vos-term-bar">
              <span class="vos-term-prompt">mumu:/ $</span>
              <input type="text" id="vos-term-input" placeholder="arahan...">
            </div>
          </div>
        `;

      case 'game':
        return `
          <div class="vos-game-container">
            <div class="vos-game-header">
              <span>Permainan 2048 Touch</span>
              <span id="vos-game-score">Skor: 0</span>
              <button class="vos-game-restart" id="vos-game-restart">Mula Semula</button>
            </div>
            <div class="vos-game-board" id="vos-game-board">
              <!-- 4x4 Grid -->
            </div>
            <div class="vos-game-instructions">Gunakan leretan jari (swipe) atau anak panah papan kekunci.</div>
          </div>
        `;

      case 'calculator':
        return `
          <div class="vos-calc">
            <div class="vos-calc-display" id="calc-display">0</div>
            <div class="vos-calc-keys">
              <button class="calc-btn clear" onclick="window.virtualOS.calcInput('C')">C</button>
              <button class="calc-btn op" onclick="window.virtualOS.calcInput('/')">&divide;</button>
              <button class="calc-btn op" onclick="window.virtualOS.calcInput('*')">&times;</button>
              <button class="calc-btn op" onclick="window.virtualOS.calcInput('-')">&minus;</button>
              <button class="calc-btn" onclick="window.virtualOS.calcInput('7')">7</button>
              <button class="calc-btn" onclick="window.virtualOS.calcInput('8')">8</button>
              <button class="calc-btn" onclick="window.virtualOS.calcInput('9')">9</button>
              <button class="calc-btn op" onclick="window.virtualOS.calcInput('+')">+</button>
              <button class="calc-btn" onclick="window.virtualOS.calcInput('4')">4</button>
              <button class="calc-btn" onclick="window.virtualOS.calcInput('5')">5</button>
              <button class="calc-btn" onclick="window.virtualOS.calcInput('6')">6</button>
              <button class="calc-btn eq" onclick="window.virtualOS.calcInput('=')">=</button>
              <button class="calc-btn" onclick="window.virtualOS.calcInput('1')">1</button>
              <button class="calc-btn" onclick="window.virtualOS.calcInput('2')">2</button>
              <button class="calc-btn" onclick="window.virtualOS.calcInput('3')">3</button>
              <button class="calc-btn" onclick="window.virtualOS.calcInput('0')">0</button>
            </div>
          </div>
        `;

      case 'files':
        return `
          <div class="vos-files">
            <div class="vos-files-header">Pengurus Fail Android 12</div>
            <div class="vos-files-storage-bar">
              <div class="vos-fs-fill" style="width: 20%;"></div>
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 15px;">24.2 GB digunakan / 128 GB storan dalaman</div>
            <div class="vos-folders-grid">
              <div class="vos-folder-card">📁 Muat Turun (Downloads)</div>
              <div class="vos-folder-card">📁 Dokumen (Documents)</div>
              <div class="vos-folder-card">📁 Gambar (Images)</div>
              <div class="vos-folder-card">📁 Fail APK (Sideloads)</div>
              <div class="vos-folder-card">📁 Muzik & Audio</div>
              <div class="vos-folder-card">📁 Tangkapan Skrin</div>
            </div>
          </div>
        `;

      case 'gallery':
        return `
          <div class="vos-gallery">
            <div class="vos-gal-header">Foto & Galeri</div>
            <div class="vos-gal-grid">
              <div class="vos-gal-item" style="background: linear-gradient(135deg, #1e3a8a, #06b6d4);">🌌 Galaksi Android</div>
              <div class="vos-gal-item" style="background: linear-gradient(135deg, #b91c1c, #f59e0b);">🌅 Matahari Terbenam</div>
              <div class="vos-gal-item" style="background: linear-gradient(135deg, #047857, #10b981);">🌲 Hutan Alam</div>
              <div class="vos-gal-item" style="background: linear-gradient(135deg, #6d28d9, #ec4899);">🎮 Skrin Permainan</div>
            </div>
          </div>
        `;

      default:
        return `<div style="padding: 30px; text-align: center; color: #cbd5e1;">Aplikasi <strong>${appId}</strong> sedang berjalan secara normal di Android 12.</div>`;
    }
  }

  bindAppInteractions(appId, bodyEl) {
    if (appId === 'terminal') {
      const input = bodyEl.querySelector('#vos-term-input');
      const output = bodyEl.querySelector('#vos-term-output');
      if (input && output) {
        input.focus();
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const cmd = input.value.trim();
            input.value = '';
            if (!cmd) return;
            output.innerHTML += `
mumu:/ $ ${cmd}`;
            output.innerHTML += `
${this.executeVirtualShell(cmd)}`;
            output.scrollTop = output.scrollHeight;
          }
        });
      }
    } else if (appId === 'chrome') {
      const goBtn = bodyEl.querySelector('#chrome-go');
      const input = bodyEl.querySelector('#chrome-url-input');
      if (goBtn && input) {
        goBtn.addEventListener('click', () => {
          this.chromeNavigate(input.value);
        });
      }
      const searchBtn = bodyEl.querySelector('#google-search-btn');
      const queryInput = bodyEl.querySelector('#google-query-input');
      if (searchBtn && queryInput) {
        searchBtn.addEventListener('click', () => {
          if (queryInput.value) {
            this.chromeNavigate('https://www.google.com/search?q=' + encodeURIComponent(queryInput.value));
          }
        });
        queryInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && queryInput.value) {
            this.chromeNavigate('https://www.google.com/search?q=' + encodeURIComponent(queryInput.value));
          }
        });
      }
    } else if (appId === 'game') {
      this.init2048Game(bodyEl);
    }
  }

  chromeNavigate(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const input = document.getElementById('chrome-url-input');
    if (input) input.value = url;
    const vp = document.getElementById('chrome-viewport');
    if (vp) {
      vp.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #fff;">
          <div style="font-size: 36px; margin-bottom: 10px;">🌐</div>
          <div style="font-size: 14px; font-weight: 600;">Memuatkan ${url}...</div>
          <p style="font-size: 12px; color: #94a3b8; max-width: 380px; margin: 10px auto;">
            Pelayar maya bersedia. Anda boleh membuka pautan secara terus pada tab pelayar peranti:
          </p>
          <a href="${url}" target="_blank" rel="noopener" style="display: inline-block; padding: 8px 18px; background: #0070f3; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 12px; margin-top: 10px;">
            Buka Pautan Luar &rarr;
          </a>
        </div>
      `;
    }
  }

  installApp(id, name, icon, color) {
    if (!this.installedApps.some(a => a.id === id)) {
      this.installedApps.push({ id, name, icon, color, badge: 'Dipasang' });
      this.saveInstalledApps();
      this.renderAppGrid();
      if (window.showToast) window.showToast(`${name} berjaya dipasang ke skrin utama!`);
    } else {
      if (window.showToast) window.showToast(`${name} telah pun dipasang.`);
    }
  }

  calcInput(char) {
    const disp = document.getElementById('calc-display');
    if (!disp) return;
    if (char === 'C') {
      disp.textContent = '0';
    } else if (char === '=') {
      try {
        const sanitized = disp.textContent.replace(/[^0-9+\-*\/.]/g, '');
        disp.textContent = Function('"use strict"; return (' + sanitized + ')')();
      } catch (e) {
        disp.textContent = 'Ralat';
      }
    } else {
      if (disp.textContent === '0' || disp.textContent === 'Ralat') {
        disp.textContent = char;
      } else {
        disp.textContent += char;
      }
    }
  }

  executeVirtualShell(cmd) {
    const parts = cmd.trim().split(/\s+/);
    const main = parts[0].toLowerCase();
    switch (main) {
      case 'help':
        return 'Perintah shell tersedia: uname, getprop, ls, ps, cat, date, echo, free, clear, reboot, whoami';
      case 'uname':
        return 'Linux localhost 5.15.78-android12-9-g8a3b #1 SMP PREEMPT aarch64 Android';
      case 'getprop':
        return '[ro.product.model]: [Google Pixel 8 Pro]\n[ro.build.version.release]: [12]\n[ro.product.cpu.abilist]: [arm64-v8a]\n[ro.hardware]: [apple_silicon_metal]';
      case 'whoami':
        return 'root';
      case 'date':
        return new Date().toString();
      case 'ls':
        return 'data/  dev/  etc/  init.rc  mnt/  proc/  sdcard/  storage/  system/  vendor/';
      case 'free':
        return '              total        used        free      shared     buffers\nMem:        8192000     2412800     5779200           0       64500';
      case 'ps':
        return 'USER      PID  PPID  VSIZE   RSS   WCHAN            PC  NAME\nroot        1     0  12480  2800  0000000000  00408104  init\nsystem    642     1 154200 48200  0000000000  7fa89012  system_server\nu0_a84   1284   642  89400 32100  0000000000  7fa89012  com.google.android.apps.nexuslauncher';
      case 'reboot':
        setTimeout(() => this.goHome(), 1000);
        return 'Sistem dimulakan semula...';
      case 'echo':
        return parts.slice(1).join(' ');
      case 'clear':
        const o = document.getElementById('vos-term-output');
        if (o) o.innerHTML = '';
        return '';
      default:
        return `/system/bin/sh: ${main}: command not found`;
    }
  }

  init2048Game(container) {
    const boardEl = container.querySelector('#vos-game-board');
    const scoreEl = container.querySelector('#vos-game-score');
    const restartBtn = container.querySelector('#vos-game-restart');
    if (!boardEl) return;

    let grid = [
      [0, 0, 0, 0],
      [0, 2, 0, 0],
      [0, 0, 4, 0],
      [0, 0, 0, 0]
    ];
    let score = 0;

    const render = () => {
      boardEl.innerHTML = '';
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const val = grid[r][c];
          const tile = document.createElement('div');
          tile.className = 'vos-tile' + (val ? ' val-' + val : '');
          tile.textContent = val ? val : '';
          boardEl.appendChild(tile);
        }
      }
      if (scoreEl) scoreEl.textContent = 'Skor: ' + score;
    };

    const addRandom = () => {
      let empty = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] === 0) empty.push({ r, c });
        }
      }
      if (empty.length > 0) {
        const spot = empty[Math.floor(Math.random() * empty.length)];
        grid[spot.r][spot.c] = Math.random() < 0.9 ? 2 : 4;
      }
    };

    const slideRow = (row) => {
      let arr = row.filter(val => val !== 0);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] *= 2;
          score += arr[i];
          arr.splice(i + 1, 1);
        }
      }
      while (arr.length < 4) arr.push(0);
      return arr;
    };

    const moveLeft = () => {
      for (let r = 0; r < 4; r++) grid[r] = slideRow(grid[r]);
      addRandom();
      render();
    };

    const moveRight = () => {
      for (let r = 0; r < 4; r++) grid[r] = slideRow(grid[r].reverse()).reverse();
      addRandom();
      render();
    };

    const moveUp = () => {
      for (let c = 0; c < 4; c++) {
        let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
        col = slideRow(col);
        for (let r = 0; r < 4; r++) grid[r][c] = col[r];
      }
      addRandom();
      render();
    };

    const moveDown = () => {
      for (let c = 0; c < 4; c++) {
        let col = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]];
        col = slideRow(col);
        for (let r = 0; r < 4; r++) grid[3 - r][c] = col[r];
      }
      addRandom();
      render();
    };

    if (restartBtn) {
      restartBtn.onclick = () => {
        grid = [[0, 0, 0, 0], [0, 2, 0, 0], [0, 0, 4, 0], [0, 0, 0, 0]];
        score = 0;
        render();
      };
    }

    render();

    // Touch swipe handling for 2048 game
    let startX = 0, startY = 0;
    boardEl.ontouchstart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    boardEl.ontouchend = (e) => {
      let dx = e.changedTouches[0].clientX - startX;
      let dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) moveRight();
        else if (dx < -30) moveLeft();
      } else {
        if (dy > 30) moveDown();
        else if (dy < -30) moveUp();
      }
    };
  }
}

window.VirtualAndroidOS = VirtualAndroidOS;
