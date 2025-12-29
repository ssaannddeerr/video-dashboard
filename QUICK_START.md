# Prague to San Francisco Live - Quick Start Guide

## 🚀 For Users (macOS)

### Installation
1. Download `Prague to San Francisco Live.dmg`
2. Open DMG → Drag app to Applications
3. **First launch only** - Choose one:
   ```bash
   # Option A: GUI Method
   Right-click app → Open → Click "Open"

   # Option B: Terminal Method
   xattr -cr "/Applications/Prague to San Francisco Live.app"
   ```
4. Install dependencies:
   ```bash
   brew install yt-dlp ffmpeg
   ```
5. Done! Launch normally from now on

---

## 🛠️ For Developers (Building)

### Mac Build
```bash
cd /home/sander/video-dashboard-v10
npm run build:mac
```

**Output:** `dist/Prague to San Francisco Live-1.0.0.dmg`

**What happens:**
1. ✅ Icon embedded (`build/icon.icns`)
2. ✅ Ad-hoc signed (via `scripts/sign-mac.sh`)
3. ✅ README included in DMG
4. ✅ Prevents "damaged" error

**Must build on Mac for:**
- Proper ad-hoc signing
- Universal binary (Intel + Apple Silicon)

### Windows Build
```bash
npm run build:win
```

**Output:** `dist/Prague to San Francisco Live Setup 1.0.0.exe`

**Includes:**
- ✅ Icon (`build/icon.ico`)
- ✅ Bundled `yt-dlp.exe` + `ffmpeg.exe`
- ✅ NSIS installer

---

## 📋 What's Included

### Icons
- `build/icon.icns` (Mac, 150 KB)
- `build/icon.ico` (Windows, 142 KB)
- `build/icon.svg` (source)

### Documentation
- `build/README-macOS.md` (in DMG)
- `MAC_SIGNING_SETUP.md` (detailed setup)
- `QUICK_START.md` (this file)

### Scripts
- `scripts/sign-mac.sh` (ad-hoc signing)

---

## 🔑 Key Points

### About xattr
- **What:** macOS quarantine flag on downloaded apps
- **When:** Applied automatically when user downloads DMG
- **Why needed:** Triggers Gatekeeper for unsigned apps
- **Solution:** `xattr -cr` OR right-click → Open
- **Can't pre-remove:** Gets added during download!

### About Ad-hoc Signing
- **What:** Local code signature (no Apple ID needed)
- **Benefit:** Prevents "damaged app" error
- **Limitation:** Still shows Gatekeeper warning
- **Free:** No $99/year Apple Developer account

### Upgrade Path
Want zero-friction installation?
→ Get Apple Developer ID ($99/year)
→ Sign with Developer certificate
→ Notarize with Apple
→ Result: Double-click works immediately

---

## ⚡ Quick Commands

```bash
# Build for Mac (on Mac)
npm run build:mac

# Build for Windows (on any platform)
npm run build:win

# Remove quarantine (for testing)
xattr -cr "dist/Prague to San Francisco Live.app"

# Verify signing
codesign -dv "dist/Prague to San Francisco Live.app"

# Check icons
ls -lh build/icon.{icns,ico,svg}
```

---

## 📦 Distribution Checklist

Before releasing:
- [ ] Build on Mac for proper signing
- [ ] Test DMG on clean Mac
- [ ] Verify README appears in DMG
- [ ] Test right-click → Open works
- [ ] Test xattr command works
- [ ] Verify dependencies install correctly
- [ ] Check videos load properly
- [ ] Verify icon shows in Finder/Dock

---

## 🆘 Troubleshooting

**"App is damaged"**
→ Built on wrong platform, needs Mac build + ad-hoc signing

**README not in DMG**
→ Check `package.json` dmg.contents includes README

**Signing fails**
→ Normal on Linux, only works on Mac

**xattr not found**
→ Only available on macOS, not needed on Linux/Windows

---

**Ready to build?** Run `npm run build:mac` on a Mac! 🎉
