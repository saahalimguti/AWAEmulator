/**
 * MuMuPlayer Pro - High Performance 1:1 Web Console Engine
 * Zero fake mockups. 100% Real Android 12 ARM64 Execution.
 * Connects directly to MuMuPlayer Pro headless hypervisor stream with full touch & gesture mapping.
 */

class MuMuEmulatorCore {
  constructor(canvasEl, streamImgEl, bridgeClient) {
    this.canvas = canvasEl;
    this.ctx = canvasEl ? canvasEl.getContext('2d') : null;
    this.streamImg = streamImgEl;
    this.bridge = bridgeClient;

    this.androidWidth = 2560;
    this.androidHeight = 1440;
    this.fps = 60;
    this.isConnected = false;
    this.isBooting = true;
    this.streamUrl = '';

    // Pointer gesture tracking
    this.isPointerDown = false;
    this.pointerStart = { x: 0, y: 0, time: 0, clientX: 0, clientY: 0 };
    this.lastPointer = { x: 0, y: 0 };

    this.init();
  }

  init() {
    this.setupStream();
    this.setupInputListeners();
    this.setupDragAndDrop();
    this.renderBootScreen();

    // Listen to bridge status updates
    this.bridge.onStatusChange((status) => {
      if (status.connected) {
        if (this.isBooting || !this.isConnected) {
          this.onConnected(status);
        }
        if (status.width && status.height) {
          this.androidWidth = status.width;
          this.androidHeight = status.height;
          const viewport = document.getElementById('viewport');
          if (viewport) {
            viewport.style.aspectRatio = `${this.androidWidth} / ${this.androidHeight}`;
          }
        }
        if (status.fps) {
          this.fps = status.fps;
        }
      } else {
        this.onDisconnected();
      }
    });
  }

  setupStream() {
    if (!this.streamImg) return;

    this.streamUrl = `${this.bridge.baseUrl}/api/stream.mjpeg?t=${Date.now()}`;
    this.streamImg.src = this.streamUrl;

    // MJPEG multipart stream never triggers onload in browsers, switch display on connected event
    this.streamImg.onerror = () => {
      setTimeout(() => {
        if (this.streamImg && this.isConnected) {
          this.streamImg.src = `${this.bridge.baseUrl}/api/stream.mjpeg?t=${Date.now()}`;
        }
      }, 1500);
    };
  }

  onConnected(status) {
    this.isConnected = true;
    this.isBooting = false;
    if (this.canvas) this.canvas.style.display = 'none';
    if (this.streamImg) {
      this.streamImg.style.display = 'block';
      if (!this.streamImg.src || !this.streamImg.src.includes('stream.mjpeg')) {
        this.streamImg.src = `${this.bridge.baseUrl}/api/stream.mjpeg?t=${Date.now()}`;
      }
    }
  }

  onOrientationChanged(rotation, width, height) {
    this.androidWidth = width || (rotation === '1' ? 2560 : 1440);
    this.androidHeight = height || (rotation === '1' ? 1440 : 2560);
    const viewport = document.getElementById('viewport');
    if (viewport) {
      viewport.style.aspectRatio = '' + this.androidWidth + ' / ' + this.androidHeight;
    }
    if (this.streamImg) {
      this.streamImg.src = this.bridge.baseUrl + '/api/stream.mjpeg?t=' + Date.now();
    }
  }

  onDisconnected() {
    this.isConnected = false;
    if (window.currentEngineMode === 'standalone') {
      this.isBooting = false;
      if (this.canvas) this.canvas.style.display = 'none';
      if (this.streamImg) this.streamImg.style.display = 'none';
      return;
    }
    this.isBooting = true;
    if (this.canvas) {
      this.canvas.style.display = 'block';
      this.renderBootScreen();
    }
    if (this.streamImg) {
      this.streamImg.style.display = 'none';
    }
  }

  renderBootScreen() {
    if (window.currentEngineMode === 'standalone') {
      if (this.canvas) this.canvas.style.display = 'none';
      return;
    }
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width = this.canvas.parentElement.clientWidth || 1280;
    const h = this.canvas.height = this.canvas.parentElement.clientHeight || 720;

    // Dark sleek gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a0e17');
    grad.addColorStop(1, '#05070c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Glowing MuMu Blue Arc
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 - 40, 50, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00f0ff';
    ctx.stroke();

    // Icon
    ctx.fillStyle = '#00f0ff';
    ctx.font = '36px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', w / 2, h / 2 - 40);
    ctx.restore();

    // Title
    ctx.fillStyle = '#f0f4fc';
    ctx.font = '700 22px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MuMuPlayer Pro', w / 2, h / 2 + 35);

    // Subtitle
    ctx.fillStyle = '#8b9bb4';
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.fillText('Android 12 (ARM64 Apple Silicon) • Headless Engine', w / 2, h / 2 + 65);

    // Loading indicator
    const barW = 280;
    const barH = 4;
    const barX = (w - barW) / 2;
    const barY = h / 2 + 100;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.roundRect(barX, barY, barW, barH, 2);
    ctx.fill();

    const animX = (Date.now() / 8) % (barW + 80) - 80;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 2);
    ctx.clip();
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(barX + animX, barY, 80, barH);
    ctx.restore();

    ctx.fillStyle = '#4d5b76';
    ctx.font = '12px "Outfit", sans-serif';
    ctx.fillText('Menyambung ke Enjin Hypervisor MuMu...', w / 2, h / 2 + 130);

    if (this.isBooting && this.canvas.style.display !== 'none') {
      requestAnimationFrame(() => this.renderBootScreen());
    }
  }

  /**
   * Translates client viewport coordinates to exact real Android VM screen resolution.
   * Handles letterboxing & aspect ratio offsets automatically.
   */
  getAndroidCoords(clientX, clientY) {
    const el = this.streamImg || this.canvas;
    const rect = el.getBoundingClientRect();

    const imgAspect = (this.androidWidth || 1440) / (this.androidHeight || 2560);
    const clientAspect = rect.width / rect.height;

    let displayW = rect.width;
    let displayH = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (clientAspect > imgAspect) {
      displayW = rect.height * imgAspect;
      offsetX = (rect.width - displayW) / 2;
    } else {
      displayH = rect.width / imgAspect;
      offsetY = (rect.height - displayH) / 2;
    }

    const relX = clientX - rect.left - offsetX;
    const relY = clientY - rect.top - offsetY;

    const normX = Math.max(0, Math.min(1, relX / displayW));
    const normY = Math.max(0, Math.min(1, relY / displayH));

    return {
      realX: Math.round(normX * this.androidWidth),
      realY: Math.round(normY * this.androidHeight),
      normX,
      normY,
      isValid: relX >= 0 && relX <= displayW && relY >= 0 && relY <= displayH
    };
  }

  setupInputListeners() {
    const target = this.streamImg.parentElement || document.getElementById('viewport');
    if (!target) return;

    // Pointer Down (Touch / Mouse Click)
    target.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.isPointerDown = true;
      const coords = this.getAndroidCoords(e.clientX, e.clientY);
      this.pointerStart = {
        x: coords.realX,
        y: coords.realY,
        clientX: e.clientX,
        clientY: e.clientY,
        time: performance.now()
      };
      this.lastPointer = { x: coords.realX, y: coords.realY };

      this.spawnTouchRipple(e.clientX, e.clientY);
    });

    // Pointer Move (Swipe Tracking)
    window.addEventListener('pointermove', (e) => {
      if (!this.isPointerDown) return;
      const coords = this.getAndroidCoords(e.clientX, e.clientY);
      this.lastPointer = { x: coords.realX, y: coords.realY };
    });

    // Pointer Up (Tap vs Swipe Dispatch)
    window.addEventListener('pointerup', (e) => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;

      const coords = this.getAndroidCoords(e.clientX, e.clientY);
      const dx = coords.realX - this.pointerStart.x;
      const dy = coords.realY - this.pointerStart.y;
      const dist = Math.hypot(dx, dy);
      const dur = Math.min(600, Math.max(120, Math.round(performance.now() - this.pointerStart.time)));

      if (dist < 20) {
        // Single Tap
        this.bridge.tap(this.pointerStart.x, this.pointerStart.y, this.androidWidth, this.androidHeight);
      } else {
        // Swipe / Drag gesture
        this.bridge.swipe(
          this.pointerStart.x,
          this.pointerStart.y,
          coords.realX,
          coords.realY,
          dur,
          this.androidWidth,
          this.androidHeight
        );
      }
    });

    // Keyboard navigation mapping directly to real Android keyevents
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'Escape') {
        this.bridge.sendKey('BACK');
      } else if (e.key === 'Backspace') {
        this.bridge.sendKey('DEL');
      } else if (e.key === 'Enter') {
        this.bridge.sendKey('ENTER');
      } else if (e.key === 'ArrowUp') {
        this.bridge.sendKey('UP');
      } else if (e.key === 'ArrowDown') {
        this.bridge.sendKey('DOWN');
      } else if (e.key === 'ArrowLeft') {
        this.bridge.sendKey('LEFT');
      } else if (e.key === 'ArrowRight') {
        this.bridge.sendKey('RIGHT');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.bridge.sendKey('TAB');
      }
    });
  }

  spawnTouchRipple(clientX, clientY) {
    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    ripple.style.left = `${clientX}px`;
    ripple.style.top = `${clientY}px`;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 400);
  }

  setupDragAndDrop() {
    const stage = document.getElementById('stage') || document.body;
    const overlay = document.getElementById('drag-overlay');

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (overlay) overlay.classList.add('active');
    });

    window.addEventListener('dragleave', (e) => {
      if (e.relatedTarget === null && overlay) {
        overlay.classList.remove('active');
      }
    });

    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      if (overlay) overlay.classList.remove('active');

      const files = e.dataTransfer ? e.dataTransfer.files : [];
      if (files.length === 0) return;

      const file = files[0];
      if (!file.name.toLowerCase().endsWith('.apk')) {
        if (window.showToast) window.showToast('⚠️ Sila lepaskan fail format .APK sahaja.');
        return;
      }

      this.uploadAndInstallApk(file);
    });
  }

  async uploadAndInstallApk(file) {
    if (window.showToast) {
      window.showToast(`📦 Memasang ${file.name} ke dalam Android 12...`, 15000);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/apk/install', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.ok) {
        if (window.showToast) {
          window.showToast(`✅ ${data.name || file.name} Berjaya Dipasang! Membuka...`, 5000);
        }
        // Force refresh stream
        setTimeout(() => {
          if (this.streamImg) {
            this.streamImg.src = `${this.bridge.baseUrl}/api/stream.mjpeg?t=${Date.now()}`;
          }
        }, 800);
      } else {
        if (window.showToast) {
          window.showToast(`❌ Gagal: ${data.output || 'Ralat pemasangan'}`, 6000);
        }
      }
    } catch (err) {
      if (window.showToast) {
        window.showToast(`❌ Ralat rangkaian: ${err.message}`, 5000);
      }
    }
  }

  rotateScreen() {
    return this.bridge.rotateScreen();
  }

  setResolution(width, height, density = 360) {
    this.androidWidth = width;
    this.androidHeight = height;
    return fetch('/api/settings/resolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ width, height, density })
    });
  }
}

window.MuMuEmulatorCore = MuMuEmulatorCore;
