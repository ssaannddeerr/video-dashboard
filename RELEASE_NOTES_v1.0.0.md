# Prague to San Francisco Live v1.0.0 - Production Release

**Release Date:** December 29, 2025

## 🎉 What's New

Prague to San Francisco Live v1.0.0 is the first production-ready release, bringing live video feeds from Prague, Czech Republic and San Francisco, California right to your desktop. This release features significant performance optimizations, hybrid cross-platform dependency management, professional application icons, and streamlined macOS distribution.

## ✨ Highlights

### 🚀 Performance Optimizations
- **13.5% memory reduction** (862 MB → 746 MB average)
- **16.2% CPU usage reduction**
- Optimized HLS and DASH buffer settings
- Enhanced window visibility handling

### 📦 Hybrid Dependency Management
- **Windows**: Zero-setup experience with bundled executables
- **macOS**: Clear Homebrew installation with copy-to-clipboard
- **Linux**: System package manager integration
- Startup validation with platform-specific error dialogs

### 🍎 macOS Distribution Made Easy
- Ad-hoc code signing prevents "damaged app" error
- Installation guide included in DMG
- Two Gatekeeper bypass methods documented
- No Apple Developer account required

### 🎨 Professional Icons
- Custom retro TV design with colorful bars
- Multi-resolution support for all platforms
- 150 KB macOS .icns / 142 KB Windows .ico

### 🔄 Auto-Refresh Feature
- Videos automatically reload when returning to app
- Always shows current/live content
- No more out-of-date streams after pausing

## 📥 Downloads

### macOS
**File:** `Prague to San Francisco Live-1.0.0.dmg` (size: ~XX MB)

**Installation:**
1. Download and open DMG
2. Drag app to Applications folder
3. Right-click → Open (first time only)
4. Install dependencies:
   ```bash
   brew install yt-dlp ffmpeg
   ```

**Requirements:**
- macOS 10.13 or later
- Homebrew (for dependencies)

### Windows
**File:** `Prague to San Francisco Live Setup 1.0.0.exe` (size: ~280 MB)

**Installation:**
1. Download and run installer
2. Done! Dependencies bundled automatically

**Requirements:**
- Windows 10 or later
- No additional setup required

### Linux
**Files:**
- `Prague to San Francisco Live-1.0.0.AppImage`
- `prague-to-san-francisco-live_1.0.0_amd64.deb`

**Installation:**
```bash
# Install dependencies first
sudo apt install yt-dlp ffmpeg

# Then run AppImage or install .deb
chmod +x Prague\ to\ San\ Francisco\ Live-1.0.0.AppImage
./Prague\ to\ San\ Francisco\ Live-1.0.0.AppImage
```

**Requirements:**
- Ubuntu 20.04+ / Debian 11+ or compatible
- yt-dlp and ffmpeg from system repos

## 📋 Full Changelog

### v1.0.0 (2025-12-29)
- Add macOS ad-hoc code signing
- Add professional retro TV icons for all platforms
- Add installation guide in DMG
- Update documentation with xattr instructions
- Enhance README with current features

### v0.9.0 (2025-12-28)
- Add auto-refresh on window focus
- Fix out-of-date video streams after pausing

### v0.8.0 (2025-12-27)
- Add hybrid dependency management
- Bundle Windows executables (yt-dlp, ffmpeg)
- Add startup validation with error dialogs
- Add platform-specific installation instructions

### v0.7.1 (2025-12-26)
- Optimize HLS buffer settings (30s → 10s)
- Optimize DASH buffer configuration
- Add proper DASH instance cleanup
- Enhance visibility pause handling
- 13.5% memory reduction, 16.2% CPU reduction

### v0.7.0 (2025-12-26)
- Add feed 5 automatic muting
- Ensure mute persists in fullscreen mode

See [CHANGELOG.md](CHANGELOG.md) for detailed changes.

## 📚 Documentation

- **[README.md](README.md)** - Complete project overview
- **[QUICK_START.md](QUICK_START.md)** - Installation and build guide
- **[MAC_SIGNING_SETUP.md](MAC_SIGNING_SETUP.md)** - macOS distribution details
- **[CHANGELOG.md](CHANGELOG.md)** - Complete version history

## 🐛 Known Issues

- YouTube stream URLs expire after a few hours (app auto-retries)
- Windows antivirus may flag yt-dlp.exe (false positive)
- macOS requires right-click → Open on first launch
- Some webcam feeds require periodic re-authentication

## 🔧 Technical Details

**Dependencies:**
- Electron 28.0.0
- HLS.js 1.5.0
- Node.js 16+ (for development)

**Bundled Tools (Windows only):**
- yt-dlp 2024.12.23
- FFmpeg 7.1

**Build Platform Requirements:**
- Mac builds: Must build on macOS for proper signing
- Windows builds: Can build on any platform
- Linux builds: Can build on any platform

## 🙏 Acknowledgments

- Video streams: Skyline Webcams, Feratel, EarthTV, YouTube
- Libraries: HLS.js by video-dev, Electron by OpenJS Foundation
- Tools: yt-dlp, FFmpeg

## 📧 Support

For issues, questions, or suggestions:
- **GitHub Issues**: https://github.com/ssaannddeerr/video-dashboard/issues
- **Documentation**: See links above

---

**Full Changelog**: https://github.com/ssaannddeerr/video-dashboard/compare/PREVIOUS_TAG...v1.0.0
