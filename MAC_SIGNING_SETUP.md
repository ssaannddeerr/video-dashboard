# Mac App Signing & Distribution Setup

## ✅ What's Been Configured

### 1. Icons Created
- **Source:** `build/icon.svg` (retro TV with color bars)
- **Mac:** `build/icon.icns` (150 KB, multi-resolution)
- **Windows:** `build/icon.ico` (142 KB, multi-resolution)
- **Preview:** `build/icon-1024.png` (high-res preview)
- **App Name:** Prague to San Francisco Live

### 2. Ad-hoc Code Signing
- **Script:** `scripts/sign-mac.sh` (executable)
- **Purpose:** Prevents "damaged app" error on macOS
- **Automatic:** Runs after build via `afterSign` hook
- **Limitation:** Users still need right-click → Open first time

### 3. DMG Installation Guide
- **File:** `build/README-macOS.md`
- **Included in DMG:** Yes (positioned at bottom center)
- **Contents:**
  - Step-by-step installation instructions for Prague to San Francisco Live
  - Right-click → Open workaround explained
  - Homebrew installation guide for yt-dlp/ffmpeg
  - Troubleshooting section

### 4. Package Configuration
Updated `package.json`:
```json
{
  "afterSign": "scripts/sign-mac.sh",
  "dmg": {
    "contents": [
      { "x": 130, "y": 220 },                    // App icon
      { "x": 410, "y": 220, "type": "link" },    // Applications link
      { "x": 270, "y": 400, "type": "file",      // README (NEW)
        "path": "build/README-macOS.md" }
    ]
  }
}
```

---

## 🔨 How to Build

### Mac Build
```bash
cd /home/sander/video-dashboard-v10
npm run build:mac
```

**Result:**
- `dist/Prague to San Francisco Live-1.0.0.dmg`
- Includes README file
- App is ad-hoc signed (if built on Mac)
- No "damaged" error
- Users must right-click → Open first time

### Windows Build
```bash
npm run build:win
```

**Result:**
- `dist/Prague to San Francisco Live Setup 1.0.0.exe`
- Includes bundled yt-dlp.exe + ffmpeg.exe
- May show SmartScreen warning (normal for unsigned apps)

---

## 📦 What Users Will See

### Mac Installation Experience

1. **Download:** `Prague to San Francisco Live-1.0.0.dmg`
2. **Open DMG:** Shows:
   - Prague to San Francisco Live app icon (left)
   - Applications folder shortcut (right)
   - README file (bottom center) ← **NEW**
3. **Drag app** to Applications
4. **First launch** - Choose one method:
   - **Method 1 (GUI):** Right-click → Open → Click "Open"
   - **Method 2 (Terminal):** `xattr -cr "Prague to San Francisco Live.app"`
   - Both methods explained in README
5. **Subsequent launches:** Double-click works normally ✓

### DMG Layout
```
┌─────────────────────────────────────────────┐
│                                             │
│   📺                           📁            │
│  Prague to                 Applications     │
│  San Francisco                              │
│  Live                                       │
│                                             │
│            📄 README-macOS.md               │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔐 Signing Status

### Current: Ad-hoc Signing (Option 1 + 2)
✅ No cost
✅ Prevents "damaged" error
✅ README guides users through first launch (2 methods)
⚠️ Requires right-click → Open OR `xattr -cr` first time

### About xattr (Quarantine Attribute)

When users download the app, macOS adds a "quarantine" flag:
```bash
# Check if app has quarantine attribute
xattr -l "Prague to San Francisco Live.app"
# Shows: com.apple.quarantine: ...

# Remove it
xattr -cr "Prague to San Francisco Live.app"
```

**Why is this needed?**
- macOS marks all downloaded apps with `com.apple.quarantine`
- This triggers Gatekeeper to check code signing
- Ad-hoc signature → Gatekeeper shows warning
- Removing attribute → Bypasses Gatekeeper check

**Two ways to bypass:**
1. Right-click → Open (adds permission, keeps attribute)
2. `xattr -cr` (removes attribute entirely)

**Note:** You can't pre-remove this when building - it's added during download!

### Future: Apple Developer ID (Option 3)
If you want seamless installation:
1. Join Apple Developer Program ($99/year)
2. Create Developer ID Application certificate
3. Update `package.json`:
```json
"mac": {
  "identity": "Developer ID Application: Your Name (TEAMID)",
  "hardenedRuntime": true,
  "gatekeeperAssess": false
}
```
4. Add notarization script
5. Result: No right-click needed, just double-click ✓

---

## ✅ Testing Checklist

### On Mac (Required for proper testing):
- [ ] Build DMG: `npm run build:mac`
- [ ] Verify icons appear correctly
- [ ] Open DMG, check README is visible
- [ ] Drag app to Applications
- [ ] Try double-click (should show warning)
- [ ] Right-click → Open → Should work
- [ ] Close and double-click again (should work normally)
- [ ] Check dependencies: `which yt-dlp ffmpeg`
- [ ] Launch app, verify videos load

### On Any Platform:
- [ ] Icons exist: `ls -lh build/icon.{icns,ico,svg}`
- [ ] Script is executable: `ls -lh scripts/sign-mac.sh`
- [ ] README exists: `cat build/README-macOS.md`

---

## 📝 Files Created

```
video-dashboard-v10/
├── build/
│   ├── icon.svg              # Source icon (retro TV)
│   ├── icon.icns            # Mac icon (150 KB)
│   ├── icon.ico             # Windows icon (142 KB)
│   ├── icon-1024.png        # High-res preview
│   ├── icon.iconset/        # Individual PNG sizes
│   └── README-macOS.md      # Installation guide for DMG
├── scripts/
│   └── sign-mac.sh          # Ad-hoc signing script
└── package.json             # Updated with afterSign + DMG contents
```

---

## 🎯 Summary

**Option 1 + 2 implemented:**
- ✅ Clear README with installation instructions
- ✅ Ad-hoc code signing (no "damaged" error)
- ✅ Beautiful retro TV icon
- ✅ Professional DMG layout

**User experience:**
- One-time right-click → Open
- Clear instructions visible in DMG
- No confusion about "damaged" error

This is the best free solution for macOS distribution! 🚀
