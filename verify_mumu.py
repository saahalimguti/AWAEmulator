#!/usr/bin/env python3
import os
import sys
import hashlib
import subprocess

APP_PATH = "/Applications/MuMuPlayer Pro.app"
BIN_PATH = os.path.join(APP_PATH, "Contents/MacOS/MuMuPlayer Pro")
ORIG_PATH = os.path.join(APP_PATH, "Contents/MacOS/MuMuPlayer Pro.orig")
ADB_PATH = "/Users/halimroslan/Library/Android/sdk/platform-tools/adb"

def check_file_exists(path, desc):
    if os.path.exists(path):
        print(f"[✓] {desc} wujud: {path}")
        return True
    else:
        print(f"[✗] {desc} TIDAK dijumpai: {path}")
        return False

def check_patches():
    if not os.path.exists(BIN_PATH):
        print("[✗] Binari MuMuPlayer Pro tidak dijumpai.")
        return False
    with open(BIN_PATH, "rb") as f:
        # Check patch 1 at 0x15f268
        f.seek(0x15f268)
        p1 = f.read(4)
        # Check patch 2 at 0x16170c
        f.seek(0x16170c)
        p2 = f.read(4)
    
    p1_ok = (p1 == b"\x4f\xff\xff\x97")
    p2_ok = (p2 == b"\xc0\x03\x5f\xd6")
    
    print(f"[i] Patch 1 (0x15f268 - Finish Launch): {'[✓] AKTIF' if p1_ok else '[✗] TIDAK AKTIF (' + p1.hex() + ')'}")
    print(f"[i] Patch 2 (0x16170c - Suppress Alert): {'[✓] AKTIF' if p2_ok else '[✗] TIDAK AKTIF (' + p2.hex() + ')'}")
    return p1_ok and p2_ok

def check_codesign():
    try:
        out = subprocess.check_output(["codesign", "-d", "--entitlements", ":-", BIN_PATH], stderr=subprocess.STDOUT).decode()
        if "com.apple.security.hypervisor" in out:
            print("[✓] Hypervisor Entitlement disahkan aktif.")
            return True
        else:
            print("[✗] Amaran: com.apple.security.hypervisor tiada dalam tandatangan.")
            return False
    except Exception as e:
        print(f"[✗] Ralat memeriksa codesign: {e}")
        return False

def check_adb():
    if not os.path.exists(ADB_PATH):
        print("[i] ADB platform-tools tidak dijumpai pada laluan lalai.")
        return
    try:
        out = subprocess.check_output([ADB_PATH, "devices"]).decode()
        print("[i] Output ADB Devices:")
        for line in out.strip().splitlines():
            print(f"    {line}")
    except Exception as e:
        print(f"[✗] Ralat menjalankan adb: {e}")

if __name__ == "__main__":
    print("=== AUDIT INTEGRITI MUMUPLAYER PRO v1.4.44 ===")
    check_file_exists(APP_PATH, "Aplikasi MuMuPlayer Pro")
    check_file_exists(ORIG_PATH, "Sandaran Binari Asal (.orig)")
    patches_ok = check_patches()
    cs_ok = check_codesign()
    check_adb()
    print("==============================================")
    if patches_ok and cs_ok:
        print("STATUS KESELURUHAN: [✓] SIHAT & BERFUNGSI SEPENUHNYA.")
    else:
        print("STATUS KESELURUHAN: [!] MEMERLUKAN TINDAKAN SUSULAN.")
