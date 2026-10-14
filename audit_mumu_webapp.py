#!/usr/bin/env python3
"""
Comprehensive Audit & Integration Test Suite for MuMuPlayer Pro Web App
(Both Cloud Hypervisor Mode & 100% Standalone Web Mode)
Author: Antigravity IDE (Agency Engineer / Mimic / Ponytail / REA)
"""

import sys
import time
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8088"

def test_endpoint(name, path, method="GET", data=None, expected_code=200):
    url = f"{BASE_URL}{path}"
    t0 = time.time()
    req = urllib.request.Request(url, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json")
        body = json.dumps(data).encode("utf-8")
        req.data = body

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            elapsed = (time.time() - t0) * 1000
            content = resp.read()
            code = resp.getcode()
            assert code == expected_code, f"Expected {expected_code}, got {code}"
            
            parsed = None
            if resp.headers.get_content_type() == "application/json":
                parsed = json.loads(content.decode("utf-8"))
            
            print(f"  [✓ PASS] {name} ({elapsed:.1f}ms) - Status: {code}")
            return True, parsed, elapsed, content
    except Exception as e:
        elapsed = (time.time() - t0) * 1000
        print(f"  [✗ FAIL] {name} ({elapsed:.1f}ms) - Error: {e}")
        return False, None, elapsed, None

def main():
    print("=" * 68)
    print("🔬 AUDIT KOMPREHENSIF PARITI NATIF: MUMUPLAYER PRO WEB APP (STANDALONE)")
    print("=" * 68)

    results = []

    # 1. Test Static Index HTML
    ok, _, elapsed, content = test_endpoint("1. Static Web UI (index.html)", "/")
    results.append(("Static Web UI", ok and b"MuMuPlayer Pro" in content))

    # 2. Test CSS and JS Assets
    ok, _, _, content_css = test_endpoint("2. CSS Design System (app.css)", "/css/app.css")
    results.append(("CSS Stylesheet", ok and b":root" in content_css))

    ok, _, _, content_js = test_endpoint("3. Master Controller JS (app.js)", "/js/app.js")
    results.append(("JavaScript Controller", ok and b"MuMuBridgeClient" in content_js))

    # 3. Test Device Telemetry & Standalone Readiness
    ok, data, elapsed, _ = test_endpoint("4. Telemetry API (/api/status)", "/api/status")
    if ok and data:
        print(f"       -> Mode: {data.get('mode')}, Model: {data.get('model')}, Android: {data.get('android_version')}")
        results.append(("Telemetry & Health", data.get("connected") == True or data.get("standalone_ready") == True))
    else:
        results.append(("Telemetry & Health", False))

    # 4. Test Single Screen Capture Frame
    ok, _, elapsed, frame = test_endpoint("5. Screen Capture (/api/screen.jpg)", "/api/screen.jpg")
    results.append(("Screen Capture Frame", ok and len(frame) > 1000))
    if ok:
        print(f"       -> Frame size: {len(frame)} bytes")

    # 5. Test Precision Input: Tap
    ok, data, _, _ = test_endpoint("6. Precision Input: Tap (/api/input/tap)", "/api/input/tap", method="POST", data={
        "x": 640, "y": 360, "client_w": 1280, "client_h": 720
    })
    results.append(("Input Tap Dispatch", ok and data.get("ok") == True))

    # 6. Test Precision Input: Swipe
    ok, data, _, _ = test_endpoint("7. Precision Input: Swipe (/api/input/swipe)", "/api/input/swipe", method="POST", data={
        "x1": 500, "y1": 500, "x2": 500, "y2": 300, "duration": 200, "client_w": 1280, "client_h": 720
    })
    results.append(("Input Swipe Dispatch", ok and data.get("ok") == True))

    # 7. Test System Navigation Keys
    for key in ["BACK", "HOME", "RECENTS", "VOLUME_UP", "VOLUME_DOWN"]:
        ok, data, _, _ = test_endpoint(f"8. Navigation Key: {key}", "/api/input/key", method="POST", data={"key": key})
        results.append((f"Keyevent {key}", ok and data.get("ok") == True))

    # 8. Test ADB Shell Terminal Command Execution
    ok, data, _, _ = test_endpoint("9. Interactive ADB Shell (/api/shell)", "/api/shell", method="POST", data={
        "command": "getprop ro.product.model"
    })
    results.append(("Shell Command Execution", ok and "GKWS6" in data.get("output", "")))
    if ok:
        print(f"       -> Shell stdout: {data.get('output')}")

    # 9. Test Installed Applications Listing
    ok, data, _, _ = test_endpoint("10. Installed Apps (/api/apps)", "/api/apps")
    pkgs = data.get("packages", []) if data else []
    results.append(("Package Listing", ok and len(pkgs) > 0))
    print(f"       -> Discovered {len(pkgs)} packages in Android 12 Environment")

    # 10. Test Full Resolution Screenshot Download
    ok, _, elapsed, img_data = test_endpoint("11. HD Screenshot Download (/api/control/screenshot)", "/api/control/screenshot")
    results.append(("HD Screenshot Download", ok and len(img_data) > 1000))
    if ok:
        print(f"       -> Captured HD PNG size: {len(img_data) / 1024:.1f} KB")

    # 11. Test Screen Rotation Toggle
    ok, data, _, _ = test_endpoint("12. Screen Rotation Toggle (/api/control/rotate)", "/api/control/rotate", method="POST", data={})
    results.append(("Screen Rotation Control", ok and data.get("ok") == True))

    # 12. Test Resolution & DPI Switching
    ok, data, _, _ = test_endpoint("13. Resolution Presets (/api/settings/resolution)", "/api/settings/resolution", method="POST", data={
        "width": 2560, "height": 1440, "density": 360
    })
    results.append(("Resolution Switcher", ok and data.get("width") == 2560))

    print("\n" + "=" * 68)
    print("📊 KEPUTUSAN AUDIT KESELURUHAN:")
    print("=" * 68)
    all_passed = True
    for test_name, passed in results:
        status_sym = "✅ LULUS" if passed else "❌ GAGAL"
        print(f"{status_sym:<10} | {test_name}")
        if not passed:
            all_passed = False

    print("=" * 68)
    if all_passed:
        print("🏆 100% PARITI FUNGSI NATIF STANDALONE BERJAYA DISAHKAN DAN LULUS SEPENUHNYA!")
        sys.exit(0)
    else:
        print("⚠️ TERDAPAT KEGAGALAN DALAM AUDIT.")
        sys.exit(1)

if __name__ == "__main__":
    main()
