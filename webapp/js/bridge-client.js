/**
 * MuMuPlayer Pro - Mimic Protocol Client
 * Handles high-speed communication with the local ADB Bridge Daemon.
 */

class MuMuBridgeClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.isConnected = false;
    this.deviceInfo = null;
    this.latencyMs = 0;
    this.statusListeners = [];
    this.streamMode = 'canvas'; // 'canvas' or 'mjpeg'
    this.pollInterval = null;
  }

  onStatusChange(fn) {
    this.statusListeners.push(fn);
  }

  notifyStatus(info) {
    this.statusListeners.forEach(fn => fn(info));
  }

  async checkHealth() {
    const t0 = performance.now();
    try {
      const res = await fetch(`${this.baseUrl}/api/status`, { cache: 'no-store' });
      this.latencyMs = Math.round(performance.now() - t0);
      if (res.ok) {
        const data = await res.json();
        this.isConnected = data.connected;
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

  startHeartbeat(intervalMs = 2000) {
    this.checkHealth();
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => this.checkHealth(), intervalMs);
  }

  async tap(x, y, clientW, clientH) {
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
    try {
      const res = await fetch(`${this.baseUrl}/api/apps`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Get apps failed:', e);
    }
    return { packages: [] };
  }

  async launchApp(pkg) {
    return await fetch(`${this.baseUrl}/api/app/launch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: pkg })
    });
  }

  async rotateScreen() {
    return await fetch(`${this.baseUrl}/api/control/rotate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
  }

  async wakeDevice() {
    return await fetch(`${this.baseUrl}/api/control/wake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
  }
}

window.MuMuBridgeClient = MuMuBridgeClient;
