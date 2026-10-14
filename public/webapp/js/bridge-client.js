/**
 * MuMuPlayer Pro - Mimic Protocol Client
 * Handles high-speed communication with the local or remote ADB Bridge Daemon.
 */

class MuMuBridgeClient {
  constructor(baseUrl = '') {
    if (!baseUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      const customBridge = urlParams.get('bridge') || localStorage.getItem('mumu_bridge_url');
      if (customBridge) {
        baseUrl = customBridge;
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        baseUrl = 'http://localhost:8088';
      } else {
        // On mobile or Vercel, check localStorage or empty string (non-blocking)
        baseUrl = localStorage.getItem('mumu_bridge_url') || '';
      }
    }
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.isConnected = false;
    this.deviceInfo = null;
    this.latencyMs = 0;
    this.statusListeners = [];
    this.streamMode = 'mjpeg';
    this.pollInterval = null;
  }

  setBaseUrl(newUrl) {
    this.baseUrl = (newUrl || '').replace(/\/$/, '');
    localStorage.setItem('mumu_bridge_url', this.baseUrl);
    return this.checkHealth();
  }

  onStatusChange(fn) {
    this.statusListeners.push(fn);
  }

  notifyStatus(info) {
    this.statusListeners.forEach(fn => fn(info));
  }

  async checkHealth() {
    if (!this.baseUrl) {
      this.isConnected = false;
      this.notifyStatus({ connected: false, reason: 'no_bridge_url' });
      return { connected: false };
    }

    const t0 = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      
      const res = await fetch(`${this.baseUrl}/api/status`, { 
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      this.latencyMs = Math.round(performance.now() - t0);
      if (res.ok) {
        const data = await res.json();
        this.isConnected = Boolean(data.connected);
        this.deviceInfo = data;
        this.notifyStatus(data);
        return data;
      }
    } catch (err) {
      this.isConnected = false;
      this.notifyStatus({ connected: false, error: err.message });
    }
    return { connected: false };
  }

  startHeartbeat(intervalMs = 2500) {
    this.checkHealth();
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => this.checkHealth(), intervalMs);
  }

  stopHeartbeat() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = null;
  }

  async tap(x, y, clientW, clientH) {
    if (!this.baseUrl || !this.isConnected) return;
    try {
      return await fetch(`${this.baseUrl}/api/input/tap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, client_w: clientW, client_h: clientH })
      });
    } catch (e) {
      console.error('Bridge tap failed:', e);
    }
  }

  async swipe(x1, y1, x2, y2, duration = 250, clientW, clientH) {
    if (!this.baseUrl || !this.isConnected) return;
    try {
      return await fetch(`${this.baseUrl}/api/input/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x1, y1, x2, y2, duration, client_w: clientW, client_h: clientH })
      });
    } catch (e) {
      console.error('Bridge swipe failed:', e);
    }
  }

  async sendKey(key) {
    if (!this.baseUrl || !this.isConnected) return;
    try {
      return await fetch(`${this.baseUrl}/api/input/key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
    } catch (e) {
      console.error('Bridge sendKey failed:', e);
    }
  }

  async sendText(text) {
    if (!this.baseUrl || !this.isConnected) return;
    try {
      return await fetch(`${this.baseUrl}/api/input/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
    } catch (e) {
      console.error('Bridge sendText failed:', e);
    }
  }

  async runShell(command) {
    if (!this.baseUrl || !this.isConnected) {
      return { error: 'Bridge tidak disambungkan' };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/shell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  }

  async getInstalledApps() {
    if (!this.baseUrl || !this.isConnected) return { packages: [] };
    try {
      const res = await fetch(`${this.baseUrl}/api/apps`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Get apps failed:', e);
    }
    return { packages: [] };
  }

  async launchApp(pkg) {
    if (!this.baseUrl || !this.isConnected) return;
    return await fetch(`${this.baseUrl}/api/app/launch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: pkg })
    });
  }

  async rotateScreen() {
    if (!this.baseUrl || !this.isConnected) return;
    return await fetch(`${this.baseUrl}/api/control/rotate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
  }

  async wakeDevice() {
    if (!this.baseUrl || !this.isConnected) return;
    return await fetch(`${this.baseUrl}/api/control/wake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
  }
}

window.MuMuBridgeClient = MuMuBridgeClient;
