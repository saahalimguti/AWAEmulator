/**
 * MuMuPlayer Pro - Master Web Console Controller
 * Dual-Engine Architecture:
 *   1. Standalone In-Browser Virtual Android 12 Engine (Instant, Responsive on Mobile/Tablet/PC)
 *   2. Native Mac Hardware Bridge (1080p 60 FPS Apple Silicon Metal Hardware Stream)
 */

let bridge = null;
let emulator = null;
let keymapper = null;
let virtualOS = null;
let currentApps = [];
let isAimMode = false;
let currentEngineMode = 'standalone'; // 'standalone' or 'bridge'

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  const canvasEl = document.getElementById('mumu-canvas');
  const streamImgEl = document.getElementById('mumu-stream-img');
  const overlayEl = document.getElementById('keymap-overlay');
  const vosContainer = document.getElementById('virtual-android-container');

  // Initialize Bridge Client
  bridge = new MuMuBridgeClient('');
  emulator = new MuMuEmulatorCore(canvasEl, streamImgEl, bridge);
  keymapper = new MuMuKeymapper(overlayEl, bridge);
  
  window.bridge = bridge;
  window.emulator = emulator;
  window.emulatorCore = emulator;
  window.keymapper = keymapper;

  // Initialize In-Browser Virtual Android OS
  if (vosContainer && window.VirtualAndroidOS) {
    virtualOS = new window.VirtualAndroidOS(vosContainer, (mode) => {
      console.log('Virtual OS Mode change:', mode);
    });
    window.virtualOS = virtualOS;
  }

  // Setup Bridge Event Handling
  bridge.onStatusChange(handleBridgeStatus);
  bridge.startHeartbeat(2500);

  // Determine initial engine mode
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  const isHttps = window.location.protocol === 'https:';

  if (isMobile || isHttps) {
    // Default to Standalone WebOS immediately so mobile & remote users never wait
    setEngineMode('standalone', false);
  } else {
    // On local Mac desktop, attempt bridge first
    setEngineMode('bridge', false);
    setTimeout(() => {
      if (!bridge.isConnected && currentEngineMode === 'bridge') {
        setEngineMode('standalone', false);
      }
    }, 1800);
  }

  // Setup drag-and-drop for APK sideloading
  setupDragAndDrop();

  // Setup Pointer Lock (FPS Gaming Aim Mode)
  setupPointerLockEvents();

  // Android Clock Tick
  setInterval(updateAndroidClock, 1000);
  updateAndroidClock();
}

function setEngineMode(mode, notify = true) {
  currentEngineMode = mode;
  const btn = document.getElementById('mode-switcher-btn');
  const vosContainer = document.getElementById('virtual-android-container');
  const canvasEl = document.getElementById('mumu-canvas');
  const streamImgEl = document.getElementById('mumu-stream-img');
  const fpsEl = document.getElementById('stat-fps');

  if (mode === 'bridge') {
    if (btn) {
      btn.textContent = '🖥️ Mac Bridge (HD)';
      btn.classList.add('bridge-mode');
    }
    if (vosContainer) vosContainer.classList.remove('active');
    
    if (bridge && bridge.isConnected) {
      if (streamImgEl) {
        streamImgEl.style.display = 'block';
        if (!streamImgEl.src || !streamImgEl.src.includes('stream.mjpeg')) {
          streamImgEl.src = `${bridge.baseUrl}/api/stream.mjpeg?t=${Date.now()}`;
        }
      }
      if (canvasEl) canvasEl.style.display = 'none';
    } else {
      if (canvasEl) {
        canvasEl.style.display = 'block';
        if (emulator) emulator.renderBootScreen();
      }
      if (streamImgEl) streamImgEl.style.display = 'none';
    }
    if (fpsEl) fpsEl.textContent = '60 FPS';
    if (notify) showToast('Mod Enjin: Perkakasan Mac MuMu (1080p 60 FPS ARM64)');
  } else {
    if (btn) {
      btn.textContent = '⚡ WebOS Standalone';
      btn.classList.remove('bridge-mode');
    }
    if (vosContainer) vosContainer.classList.add('active');
    if (canvasEl) canvasEl.style.display = 'none';
    if (streamImgEl) streamImgEl.style.display = 'none';
    if (fpsEl) fpsEl.textContent = '60 FPS';
    if (notify) showToast('Mod Enjin: Standalone In-Browser Android 12 (Mobile Ready)');
  }
}

function toggleEngineMode() {
  if (currentEngineMode === 'standalone') {
    if (!bridge.isConnected && !bridge.baseUrl) {
      openBridgeModal();
    } else {
      setEngineMode('bridge');
    }
  } else {
    setEngineMode('standalone');
  }
}

function handleBridgeStatus(info) {
  const dot = document.getElementById('status-dot');
  const modelEl = document.getElementById('android-model');
  const fpsEl = document.getElementById('stat-fps');

  if (dot) {
    dot.className = info.connected ? 'status-dot-mini online' : 'status-dot-mini';
  }

  if (info.connected) {
    if (modelEl) {
      modelEl.textContent = `MuMuPlayer Pro • ${info.model || 'Google Pixel 8 Pro'} (Android ${info.android_version || '12'})`;
    }
    if (fpsEl) {
      fpsEl.textContent = `${info.fps || 60} FPS`;
    }
    // If user selected bridge mode and it connected, reveal the live stream
    if (currentEngineMode === 'bridge') {
      const canvasEl = document.getElementById('mumu-canvas');
      const streamImgEl = document.getElementById('mumu-stream-img');
      if (canvasEl) canvasEl.style.display = 'none';
      if (streamImgEl) {
        streamImgEl.style.display = 'block';
        if (!streamImgEl.src || !streamImgEl.src.includes('stream.mjpeg')) {
          streamImgEl.src = `${bridge.baseUrl}/api/stream.mjpeg?t=${Date.now()}`;
        }
      }
    }
  } else {
    if (modelEl) {
      modelEl.textContent = 'MuMuPlayer Pro • Android 12 (ARM64 Apple Silicon)';
    }
  }

  if (info.width && info.height) {
    const viewport = document.getElementById('viewport');
    if (viewport && currentEngineMode === 'bridge') {
      viewport.style.aspectRatio = `${info.width} / ${info.height}`;
    }
    if (emulator) {
      emulator.androidWidth = info.width;
      emulator.androidHeight = info.height;
    }
  }
}

function updateAndroidClock() {
  const d = new Date();
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const clockEl = document.getElementById('android-clock');
  if (clockEl) clockEl.textContent = timeStr;
}

function sendNavKey(key) {
  if (currentEngineMode === 'standalone' && window.virtualOS) {
    if (key === 'BACK') window.virtualOS.handleBack();
    else if (key === 'HOME') window.virtualOS.goHome();
    else if (key === 'RECENTS') window.virtualOS.toggleRecents();
    else if (key === 'VOLUME_UP') {
      window.virtualOS.settings.volume = Math.min(100, (window.virtualOS.settings.volume || 80) + 10);
      showToast(`Kelantangan: ${window.virtualOS.settings.volume}%`);
    } else if (key === 'VOLUME_DOWN') {
      window.virtualOS.settings.volume = Math.max(0, (window.virtualOS.settings.volume || 80) - 10);
      showToast(`Kelantangan: ${window.virtualOS.settings.volume}%`);
    }
    return;
  }

  if (bridge && bridge.isConnected) {
    bridge.sendKey(key);
  } else if (window.virtualOS) {
    if (key === 'BACK') window.virtualOS.handleBack();
    else if (key === 'HOME') window.virtualOS.goHome();
    else if (key === 'RECENTS') window.virtualOS.toggleRecents();
  }
}

async function rotateScreen() {
  if (currentEngineMode === 'standalone') {
    const chassis = document.getElementById('device-chassis');
    if (chassis) {
      const isPortrait = chassis.classList.toggle('portrait');
      showToast(isPortrait ? 'Orientasi: Potret (9:16)' : 'Orientasi: Landskap (16:9)');
    }
    return;
  }

  if (bridge && bridge.isConnected) {
    showToast('Memutar orientasi paparan Android 12...');
    try {
      const res = await bridge.rotateScreen();
      const data = await res.json();
      if (data && data.ok) {
        const isLandscape = data.rotation === '1';
        showToast(isLandscape ? 'Orientasi: Landskap (16:9 - 2560x1440)' : 'Orientasi: Potret (9:16 - 1440x2560)');
        if (window.emulatorCore) {
          window.emulatorCore.onOrientationChanged(data.rotation, data.width, data.height);
        }
      }
    } catch (e) {
      console.error('Rotate error:', e);
    }
  } else {
    showToast('Bridge tidak disambungkan ke Mac');
  }
}

function powerDevice() {
  if (currentEngineMode === 'standalone') {
    if (window.virtualOS) {
      window.virtualOS.toggleShade();
      showToast('Panel Notifikasi & Kawalan Android 12');
    }
    return;
  }

  if (bridge && bridge.isConnected) {
    bridge.wakeDevice();
    showToast('Togol kuasa/skrin kunci peranti');
  }
}

function rebootDevice() {
  if (confirm('Adakah anda pasti mahu memulakan semula (reboot) peranti Android 12?')) {
    if (currentEngineMode === 'standalone' && window.virtualOS) {
      window.virtualOS.closeCurrentApp();
      window.virtualOS.goHome();
      showToast('Memuatkan semula persekitaran maya...');
      closeModal('modal-settings');
      return;
    }

    if (bridge && bridge.isConnected) {
      fetch(`${bridge.baseUrl}/api/control/reboot`, { method: 'POST' });
      showToast('Memulakan semula Android OS...');
    }
    closeModal('modal-settings');
  }
}

function takeScreenshot() {
  showToast('Mengambil tangkapan skrin resolusi penuh...');
  if (currentEngineMode === 'bridge' && bridge && bridge.isConnected) {
    const a = document.createElement('a');
    a.href = `${bridge.baseUrl}/api/control/screenshot?t=${Date.now()}`;
    a.download = `mumu_screenshot_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    showToast('📸 Tangkapan skrin Android 12 (Standalone) berjaya disimpan.');
  }
}

function toggleKeymapOverlay() {
  if (!keymapper) return;
  const isVis = keymapper.toggleVisibility();
  const btn = document.getElementById('btn-tool-keymap');
  if (btn) {
    if (isVis) {
      btn.classList.add('active');
      showToast('Paparan Keymapper WASD diaktifkan');
    } else {
      btn.classList.remove('active');
      showToast('Paparan Keymapper disembunyikan');
    }
  }
}

/* PC Gaming Pointer Lock / Mouse Look Mode */
function toggleFpsAimMode() {
  const viewport = document.getElementById('viewport');
  if (!isAimMode) {
    viewport.requestPointerLock = viewport.requestPointerLock || viewport.mozRequestPointerLock;
    if (viewport.requestPointerLock) viewport.requestPointerLock();
  } else {
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
    if (document.exitPointerLock) document.exitPointerLock();
  }
}

function setupPointerLockEvents() {
  const viewport = document.getElementById('viewport');
  const btn = document.getElementById('btn-tool-fpslock');
  if (!viewport || !btn) return;

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === viewport) {
      isAimMode = true;
      btn.classList.add('active');
      showToast('🎯 Mod Pembidikan Tetikus (FPS Aim Lock) Aktif! Tekan ESC untuk keluar.');
    } else {
      isAimMode = false;
      btn.classList.remove('active');
      showToast('Mod Pembidikan Tetikus dinonaktifkan.');
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!isAimMode || currentEngineMode !== 'bridge' || !bridge.isConnected) return;
    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;

    if (Math.abs(movementX) > 1 || Math.abs(movementY) > 1) {
      const centerX = Math.round((emulator.androidWidth || 1440) / 2);
      const centerY = Math.round((emulator.androidHeight || 2560) / 2);
      bridge.swipe(centerX, centerY, centerX + movementX * 3, centerY + movementY * 3, 50, emulator.androidWidth, emulator.androidHeight);
    }
  });
}

/* APK Sideloading Drag & Drop */
function setupDragAndDrop() {
  const dropzone = document.getElementById('apk-dropzone-inner');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--accent-cyan)';
      dropzone.style.background = 'rgba(0, 240, 255, 0.08)';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--border-subtle)';
      dropzone.style.background = 'transparent';
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.apk')) {
      uploadAndInstallApk(files[0]);
    } else {
      showToast('Sila masukkan fail yang sah berformat .apk sahaja');
    }
  });
}

function handleApkSelected(input) {
  if (input.files && input.files[0]) {
    uploadAndInstallApk(input.files[0]);
  }
}

async function uploadAndInstallApk(file) {
  const logEl = document.getElementById('apk-status-log');
  if (logEl) logEl.textContent = `Memasang ${file.name}... Sila tunggu.`;

  if (currentEngineMode === 'standalone' && window.virtualOS) {
    const cleanName = file.name.replace(/\.apk$/i, '');
    window.virtualOS.installApp(cleanName.toLowerCase(), cleanName, '📦', '#06b6d4');
    if (logEl) logEl.textContent = `Pemasangan berjaya! Aplikasi ${file.name} telah ditambah ke skrin utama Android 12.`;
    showToast(`Aplikasi ${cleanName} sedia digunakan!`);
    setTimeout(() => closeModal('modal-apk'), 1500);
    return;
  }

  if (!bridge || !bridge.isConnected) {
    if (window.virtualOS) {
      const cleanName = file.name.replace(/\.apk$/i, '');
      window.virtualOS.installApp(cleanName.toLowerCase(), cleanName, '📦', '#06b6d4');
      if (logEl) logEl.textContent = `Pemasangan berjaya di WebOS Maya.`;
      showToast(`Aplikasi ${cleanName} sedia digunakan!`);
      setTimeout(() => closeModal('modal-apk'), 1500);
      return;
    }
    if (logEl) logEl.textContent = 'Ralat: Bridge Mac tidak disambungkan.';
    return;
  }

  const formData = new FormData();
  formData.append('apk', file);

  try {
    const res = await fetch(`${bridge.baseUrl}/api/apk/install`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      if (logEl) logEl.textContent = `Pemasangan berjaya: ${file.name}`;
      showToast(`Pemasangan APK Berjaya!`);
      setTimeout(() => closeModal('modal-apk'), 2000);
    } else {
      if (logEl) logEl.textContent = `Ralat pemasangan: ${data.error || 'Gagal'}`;
    }
  } catch (err) {
    if (logEl) logEl.textContent = `Ralat rangkaian: ${err.message}`;
  }
}

/* Modals & Remote Bridge Setup */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function openBridgeModal() {
  const input = document.getElementById('bridge-host-input');
  if (input && bridge) {
    input.value = bridge.baseUrl || 'http://192.168.0.2:8088';
  }
  openModal('modal-bridge');
}

function setBridgeUrl(url) {
  const input = document.getElementById('bridge-host-input');
  if (input) input.value = url;
}

async function saveCustomBridge() {
  const input = document.getElementById('bridge-host-input');
  const url = (input ? input.value : '').trim();
  if (!url) {
    showToast('Sila masukkan alamat URL Bridge yang sah');
    return;
  }
  showToast(`Menyambung ke Bridge Mac: ${url}...`);
  closeModal('modal-bridge');
  bridge.setBaseUrl(url);
  const res = await bridge.checkHealth();
  if (res && res.connected) {
    showToast('Berjaya disambungkan ke Enjin MuMu Mac!');
    setEngineMode('bridge');
  } else {
    showToast('Sambungan tidak dapat dicapai. Kekal dalam WebOS Standalone.');
    setEngineMode('standalone');
  }
}

function openAppsModal() {
  openModal('modal-apps');
  loadAppsList();
}

async function loadAppsList() {
  const container = document.getElementById('apps-list-container');
  if (!container) return;

  if (currentEngineMode === 'standalone' && window.virtualOS) {
    const apps = window.virtualOS.installedApps || [];
    container.innerHTML = apps.map(app => `
      <div class="vos-ps-item" style="margin-bottom: 8px;">
        <div class="vos-ps-icon" style="background: ${app.color};">${app.icon}</div>
        <div class="vos-ps-info">
          <div class="vos-ps-title">${app.name}</div>
          <div class="vos-ps-sub">${app.badge || 'Aplikasi Sistem'}</div>
        </div>
        <button class="vos-ps-install-btn" onclick="window.virtualOS.openApp('${app.id}'); closeModal('modal-apps');">Buka</button>
      </div>
    `).join('');
    return;
  }

  if (!bridge || !bridge.isConnected) {
    container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Bridge tidak disambungkan ke Mac. Sila tukar ke WebOS Maya.</div>';
    return;
  }

  try {
    const data = await bridge.getInstalledApps();
    currentApps = data.packages || [];
    renderApps(currentApps);
  } catch (e) {
    container.innerHTML = `<div style="color: var(--accent-red); text-align: center; padding: 20px;">Gagal memuat senarai aplikasi: ${e.message}</div>`;
  }
}

function renderApps(list) {
  const container = document.getElementById('apps-list-container');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Tiada aplikasi dijumpai.</div>';
    return;
  }

  container.innerHTML = list.map(pkg => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 8px; margin-bottom: 8px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">📱</span>
        <div>
          <div style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${pkg}</div>
          <div style="font-size: 11px; color: var(--text-muted);">Android Package</div>
        </div>
      </div>
      <button class="mode-btn" style="padding: 4px 12px; font-size: 11px; background: rgba(0, 240, 255, 0.15); border: 1px solid var(--accent-cyan); color: var(--accent-cyan);" onclick="launchApp('${pkg}')">Lancarkan</button>
    </div>
  `).join('');
}

function filterAppsList() {
  const q = (document.getElementById('app-search').value || '').toLowerCase();
  const filtered = currentApps.filter(p => p.toLowerCase().includes(q));
  renderApps(filtered);
}

async function launchApp(pkg) {
  if (bridge) {
    await bridge.launchApp(pkg);
    showToast(`Melancarkan: ${pkg}`);
    closeModal('modal-apps');
  }
}

function openTerminalModal() {
  openModal('modal-terminal');
  const input = document.getElementById('terminal-input');
  if (input) setTimeout(() => input.focus(), 150);
}

function handleTerminalKey(e) {
  if (e.key === 'Enter') {
    const input = document.getElementById('terminal-input');
    const cmd = input.value.trim();
    if (!cmd) return;
    input.value = '';

    const logs = document.getElementById('terminal-logs');
    logs.innerHTML += `\n<span style="color: #00f0ff;">mumu:/ $</span> ${cmd}`;

    if (currentEngineMode === 'standalone' && window.virtualOS) {
      const res = window.virtualOS.executeVirtualShell(cmd);
      logs.innerHTML += `\n${res}`;
      logs.scrollTop = logs.scrollHeight;
      return;
    }

    if (!bridge || !bridge.isConnected) {
      if (window.virtualOS) {
        const res = window.virtualOS.executeVirtualShell(cmd);
        logs.innerHTML += `\n${res}`;
      } else {
        logs.innerHTML += `\nRalat: Enjin hypervisor tidak aktif.`;
      }
      logs.scrollTop = logs.scrollHeight;
      return;
    }

    bridge.runShell(cmd).then(res => {
      logs.innerHTML += `\n${res.stdout || res.stderr || res.error || ''}`;
      logs.scrollTop = logs.scrollHeight;
    });
  }
}

function openSettingsModal() {
  openModal('modal-settings');
}

function applyResolutionPreset(val) {
  const [res, dpi] = val.split(',');
  const [w, h] = res.split('x').map(Number);
  
  const viewport = document.getElementById('viewport');
  if (viewport) {
    viewport.style.aspectRatio = `${w} / ${h}`;
  }
  showToast(`Resolusi dikemas kini: ${res} (${dpi} DPI)`);
  closeModal('modal-settings');
}

function setDisplayFitMode(mode) {
  const viewport = document.getElementById('viewport');
  if (!viewport) return;
  if (mode === 'contain') {
    viewport.style.objectFit = 'contain';
    viewport.style.aspectRatio = '16 / 9';
    showToast('Mod Paparan: Nisbah 16:9 Asal');
  } else {
    viewport.style.objectFit = 'cover';
    viewport.style.aspectRatio = 'auto';
    showToast('Mod Paparan: Skrin Penuh Tanpa Sempadan');
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.warn('Fullscreen error:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

function showToast(msg, duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
