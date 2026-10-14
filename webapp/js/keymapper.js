/**
 * MuMuPlayer Pro - Gaming Keymapper Engine
 * Enables PC/Web Gaming Controls (WASD, Mouse Look, Skill Keys) for heavy games like GTA.
 */

class MuMuKeymapper {
  constructor(overlayCanvas, bridgeClient) {
    this.canvas = overlayCanvas;
    this.ctx = overlayCanvas.getContext('2d');
    this.bridge = bridgeClient;
    this.enabled = true;
    this.visible = false;

    // Default Keymap Scheme (GTA / FPS layout in 16:9 1280x720 canvas)
    this.bindings = [
      { id: 'w', key: 'W', label: 'W', x: 200, y: 480, radius: 24, type: 'action' },
      { id: 'a', key: 'A', label: 'A', x: 145, y: 535, radius: 24, type: 'action' },
      { id: 's', key: 'S', label: 'S', x: 200, y: 535, radius: 24, type: 'action' },
      { id: 'd', key: 'D', label: 'D', x: 255, y: 535, radius: 24, type: 'action' },
      { id: 'space', key: ' ', label: 'SPACE (Sprint)', x: 1080, y: 560, radius: 36, type: 'action' },
      { id: 'shift', key: 'Shift', label: 'SHIFT (Roll)', x: 980, y: 600, radius: 26, type: 'action' },
      { id: 'f', key: 'F', label: 'F (Enter Car)', x: 1150, y: 450, radius: 28, type: 'action' },
      { id: 'r', key: 'R', label: 'R (Reload)', x: 1060, y: 450, radius: 26, type: 'action' },
      { id: 'q', key: 'Q', label: 'Q (Weapon -)', x: 980, y: 480, radius: 24, type: 'action' },
      { id: 'e', key: 'E', label: 'E (Weapon +)', x: 1060, y: 380, radius: 24, type: 'action' }
    ];

    this.activeKeys = new Set();
    this.initCanvasSize();
    this.bindEvents();
    this.render();
  }

  initCanvasSize() {
    const parent = this.canvas.parentElement;
    if (parent && parent.clientWidth > 0 && parent.clientHeight > 0) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
    } else {
      this.canvas.width = 1280;
      this.canvas.height = 720;
    }
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      const upper = e.key.toUpperCase();
      const binding = this.bindings.find(b => b.key.toUpperCase() === upper || b.key === e.key);
      if (binding && !this.activeKeys.has(binding.id)) {
        this.activeKeys.add(binding.id);
        this.executeBindingTap(binding);
        this.render();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!this.enabled) return;
      const upper = e.key.toUpperCase();
      const binding = this.bindings.find(b => b.key.toUpperCase() === upper || b.key === e.key);
      if (binding) {
        this.activeKeys.delete(binding.id);
        this.render();
      }
    });

    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.render();
    });
  }

  executeBindingTap(binding) {
    // Send tap relative to 1280x720 canvas
    this.bridge.tap(binding.x, binding.y, 1280, 720);
    if (window.showToast) window.showToast(`Key ${binding.label} pressed!`, 1000);
  }

  toggleVisibility() {
    this.visible = !this.visible;
    this.render();
    return this.visible;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.visible) return;

    this.bindings.forEach(b => {
      const isActive = this.activeKeys.has(b.id);
      ctx.save();
      
      // Outer ring
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? 'rgba(0, 240, 255, 0.55)' : 'rgba(20, 28, 44, 0.45)';
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = isActive ? '#00f0ff' : 'rgba(255, 255, 255, 0.35)';
      ctx.stroke();

      if (isActive) {
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
      }

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, b.x, b.y);

      ctx.restore();
    });
  }
}

window.MuMuKeymapper = MuMuKeymapper;
