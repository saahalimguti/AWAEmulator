/**
 * MuMuPlayer Pro - Master Web Console Controller
 * 100% Real Android 12 Execution with Headless Standalone Hypervisor Engine.
 */

let bridge = null;
let emulator = null;
let keymapper = null;
let currentApps = [];
let isAimMode = false;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  const canvasEl = document.getElementById('mumu-canvas');
  const streamImgEl = document.getElementById('mumu-stream-img');
  const overlayEl = document.getElementById('keymap-overlay');

  bridge = new MuMuBridgeClient('');
  emulator = new MuMuEmulatorCore(canvasEl, streamImgEl, bridge);
  keymapper = new MuMuKeymapper(overlayEl, bridge);
  window.keymapper = keymapper;
  window.emulator = emulator;
  window.emulatorCore = emulator;

  // Status updates from bridge
  bridge.onStatusChange(handleBridgeStatus);
  bridge.startHeartbeat(2000);

  // Setup drag-and-drop for APK sideloading
  setupDragAndDrop();

  // Setup Pointer Lock (FPS Gaming Aim Mode)
  setupPointerLockEvents();

  // Android Clock Tick
  setInterval(updateAndroidClock, 1000);
  updateAndroidClock();

  // Cloud deployment notice (Vercel)
  if (window.location.hostname.includes('vercel.app')) {
    setTimeout(() => {
      showToast('🌐 AWAEmulator Cloud Interface: Menyambung ke Enjin MuMu tempatan (http://localhost:8088)', 8000);
    }, 1200);
  }
}

function handleBridgeStatus(info) {
  const dot = document.getElementById('status-dot');
  const modelEl = document.getElementById('android-model');
  const fpsEl = document.getElementById('stat-fps');

  if (dot) {
    dot.className = info.connected ? 'status-dot-mini online' : 'status-dot-mini';
  }
  if (modelEl) {
    modelEl.textContent = info.connected 
      ? `MuMuPlayer Pro • ${info.model} (Android ${info.android_version})`
      : 'MuMuPlayer Pro • Android 12 (ARM64 Apple Silicon)';
  }
  if (fpsEl) {
    const fpsVal = info.fps || (emulator ? emulator.fps : 60);
    fpsEl.textContent = `${fpsVal} FPS`;
  }
  if (info.width && info.height) {
    const viewport = document.getElementById('viewport');
    if (viewport) {
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
  if (bridge) {
    bridge.sendKey(key);
  }
}

async function rotateScreen() {
  if (bridge) {
    showToast('Memutar orientasi paparan Android 12...');
    try {
      const res = await bridge.rotateScreen();
      const data = await res.json();
      if (data && data.ok) {
        const isLandscape = data.rotation === '1';
        showToast(isLandscape ? 'Orientasi: Landskap (16:9 - 2560x1440)' : 'Orientasi: Potret (9:16 - 1440x2560)');
        if (window.emulatorCore) {
          window.emulatorCore.onOrientationChanged(data.rotation, data.width, data.height);
        } else if (window.emulator) {
          window.emulator.onOrientationChanged(data.rotation, data.width, data.height);
        }
      }
    } catch (e) {
      console.error('Rotate error:', e);
    }
  }
}

function powerDevice() {
  if (bridge) {
    bridge.wakeDevice();
    showToast('Togol kuasa/skrin kunci peranti');
  }
}

function rebootDevice() {
  if (confirm('Adakah anda pasti mahu memulakan semula (reboot) peranti Android 12?')) {
    fetch('/api/control/reboot', { method: 'POST' });
    showToast('Memulakan semula Android OS...');
    closeModal('modal-settings');
  }
}

function takeScreenshot() {
  showToast('Mengambil tangkapan skrin resolusi penuh...');
  const a = document.createElement('a');
  a.href = `/api/control/screenshot?t=${Date.now()}`;
  a.download = `mumu_screenshot_${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
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
    viewport.requestPointerLock();
  } else {
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
    document.exitPointerLock();
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
    if (!isAimMode) return;
    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;

    if (Math.abs(movementX) > 1 || Math.abs(movementY) > 1) {
      const centerX = Math.round((emulator.androidWidth || 1440) / 2);
      const centerY = Math.round((emulator.androidHeight || 2560) / 2);
      bridge.swipe(centerX, centerY, centerX + movementX * 3, centerY + movementY * 3, 50, emulator.androidWidth, emulator.androidHeight);
    }
  });

  viewport.addEventListener('mousedown', (e) => {
    if (!isAimMode) return;
    const w = emulator.androidWidth || 1440;
    const h = emulator.androidHeight || 2560;
    if (e.button === 0) {
      bridge.tap(Math.round(w * 0.85), Math.round(h * 0.75), w, h);
    } else if (e.button === 2) {
      bridge.tap(Math.round(w * 0.85), Math.round(h * 0.4), w, h);
    }
  });

  viewport.addEventListener('contextmenu', (e) => {
    if (isAimMode) e.preventDefault();
  });
}

/* APK Drag & Drop Sideloading */
function setupDragAndDrop() {
  const stage = document.getElementById('stage') || document.body;
  const dragOverlay = document.getElementById('drag-overlay');
  if (!dragOverlay) return;

  ['dragenter', 'dragover'].forEach(name => {
    stage.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragOverlay.classList.add('open');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    stage.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragOverlay.classList.remove('open');
    });
  });

  stage.addEventListener('drop', (e) => {
    const files = e.dataTransfer ? e.dataTransfer.files : [];
    if (files.length > 0) {
      uploadAndInstallApk(files[0]);
    }
  });
}

function handleApkSelected(input) {
  if (input.files && input.files.length > 0) {
    uploadAndInstallApk(input.files[0]);
  }
}

async function uploadAndInstallApk(file) {
  if (!file.name.toLowerCase().endsWith('.apk')) {
    showToast('⚠️ Sila pilih fail dengan format .apk sahaja!', 3000);
    return;
  }

  openModal('modal-apk');
  const logEl = document.getElementById('apk-status-log');
  logEl.innerHTML = `<span style="color: #00f0ff;">⏳ Memuat naik dan memasang ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)... Sila tunggu sebentar.</span>`;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/apk/install', {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    if (result.ok) {
      const pkg = result.package || 'Aplikasi';
      const appName = result.name || file.name;
      logEl.innerHTML = `
        <div style="background: rgba(0, 255, 136, 0.08); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 10px; padding: 14px; margin-top: 10px;">
          <div style="color: #00ff88; font-weight: 700; font-size: 15px; margin-bottom: 6px;">
            ✓ Berjaya Dipasang: ${appName}
          </div>
          <div style="color: #cbd5e1; font-size: 12px; line-height: 1.5; margin-bottom: 12px;">
            Pakej: <code>${pkg}</code><br>
            Aplikasi telah dilancarkan pada skrin Android 12.
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="mode-btn" style="background: var(--accent-cyan); color: #020617; font-weight: 700; padding: 8px 18px; border-radius: 8px; cursor: pointer;" onclick="closeModal('modal-apk');">
              Lihat Skrin
            </button>
          </div>
        </div>
      `;
      showToast(`Aplikasi ${appName} berjaya dipasang dan dibuka!`);
    } else {
      logEl.innerHTML = `<span style="color: #ff3366;">✗ Ralat pemasangan: ${result.error || result.output}</span>`;
    }
  } catch (err) {
    logEl.innerHTML = `<span style="color: #ff3366;">✗ Kegagalan sambungan: ${err.message}</span>`;
  }
}

/* Apps Modal Management */
async function openAppsModal() {
  openModal('modal-apps');
  const container = document.getElementById('apps-list-container');
  container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Memuatkan senarai aplikasi...</div>';

  try {
    const res = await fetch('/api/apps');
    const data = await res.json();
    currentApps = data.packages || [];
    renderAppsList(currentApps);
  } catch (e) {
    container.innerHTML = '<div style="color: #ff3366; text-align: center; padding: 20px;">Ralat memuatkan senarai aplikasi.</div>';
  }
}

function renderAppsList(apps) {
  const container = document.getElementById('apps-list-container');
  if (!apps || apps.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Tiada aplikasi pihak ketiga dipasang.</div>';
    return;
  }

  container.innerHTML = apps.map(app => {
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px;">
        <div style="display: flex; align-items: center; overflow: hidden; margin-right: 12px;">
          <span style="font-size: 24px; margin-right: 10px; width: 32px; text-align: center; display: inline-block;">📱</span>
          <div style="display: flex; flex-direction: column; overflow: hidden;">
            <span style="color: #fff; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${app.name || app.package}</span>
            <span style="font-size: 11px; color: #00f0ff;"><code>${app.package}</code></span>
          </div>
        </div>
        <div style="display: flex; gap: 6px; flex-shrink: 0;">
          <button class="mode-btn" style="background: rgba(0, 240, 255, 0.18); color: var(--accent-cyan); font-weight: 600;" onclick="launchApp('${app.package}')">Buka</button>
          <button class="mode-btn" style="background: rgba(255, 51, 102, 0.18); color: var(--accent-red); font-weight: 600;" onclick="uninstallApp('${app.package}')">Padam</button>
        </div>
      </div>
    `;
  }).join('');
}

function filterAppsList() {
  const q = document.getElementById('app-search').value.toLowerCase();
  const filtered = currentApps.filter(a => (a.package && a.package.toLowerCase().includes(q)) || (a.name && a.name.toLowerCase().includes(q)));
  renderAppsList(filtered);
}

async function launchApp(pkg) {
  showToast(`Melancarkan ${pkg}...`);
  if (bridge) {
    await bridge.launchApp(pkg);
    closeModal('modal-apps');
  }
}

async function uninstallApp(pkg) {
  if (confirm(`Nyahpasang pakej ${pkg}?`)) {
    showToast(`Memadamkan ${pkg}...`);
    try {
      const res = await fetch('/api/app/uninstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: pkg })
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`Pakej ${pkg} berjaya dipadam!`);
        openAppsModal();
      }
    } catch (e) {
      showToast('Ralat: ' + e.message);
    }
  }
}

/* Terminal Modal Management */
function openTerminalModal() {
  openModal('modal-terminal');
  setTimeout(() => {
    const input = document.getElementById('terminal-input');
    if (input) input.focus();
  }, 100);
}

async function handleTerminalKey(e) {
  if (e.key === 'Enter') {
    const input = document.getElementById('terminal-input');
    const logs = document.getElementById('terminal-logs');
    const cmd = input.value.trim();
    if (!cmd) return;

    input.value = '';
    logs.innerHTML += `\n<span style="color: #00f0ff;">mumu:/ $ ${cmd}</span>`;

    try {
      const res = await fetch('/api/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();
      const output = data.output || data.error || '(tiada output)';
      logs.innerHTML += `\n${escapeHtml(output)}`;
    } catch (err) {
      logs.innerHTML += `\n<span style="color: #ff3366;">Ralat: ${err.message}</span>`;
    }

    logs.scrollTop = logs.scrollHeight;
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* Settings Modal Management */
function openSettingsModal() {
  openModal('modal-settings');
}

async function applyResolutionPreset(val) {
  const [dims, dpi] = val.split(',');
  const [w, h] = dims.split('x').map(Number);
  const density = Number(dpi);

  showToast(`Menukar resolusi ke ${w}x${h} (${density} DPI)...`);
  try {
    await fetch('/api/settings/resolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ width: w, height: h, density: density })
    });
    emulator.androidWidth = w;
    emulator.androidHeight = h;
    showToast(`Resolusi berjaya ditukar ke ${w}x${h}!`);
  } catch (e) {
    showToast('Ralat menukar resolusi: ' + e.message);
  }
}

/* Generic Modal Helpers */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

/* Toast Notification Helper */
function showToast(msg, duration = 3000) {
  let toast = document.getElementById('mumu-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'mumu-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(16, 20, 31, 0.95);
      color: #f0f4fc;
      border: 1px solid rgba(0, 240, 255, 0.35);
      border-radius: 8px;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
  }, duration);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.sendNavKey = sendNavKey;
window.rotateScreen = rotateScreen;
window.powerDevice = powerDevice;
window.rebootDevice = rebootDevice;
window.takeScreenshot = takeScreenshot;
window.toggleKeymapOverlay = toggleKeymapOverlay;
window.toggleFpsAimMode = toggleFpsAimMode;
window.handleApkSelected = handleApkSelected;
window.openAppsModal = openAppsModal;
window.openTerminalModal = openTerminalModal;
window.openSettingsModal = openSettingsModal;
window.handleTerminalKey = handleTerminalKey;
window.applyResolutionPreset = applyResolutionPreset;
window.filterAppsList = filterAppsList;
window.launchApp = launchApp;
window.uninstallApp = uninstallApp;
window.toggleFullscreen = toggleFullscreen;
