# Changelog

All notable changes to Prague to San Francisco Live will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-12-29

### Added
- **macOS App Signing & Distribution**
  - Ad-hoc code signing via `scripts/sign-mac.sh` to prevent "damaged app" error
  - Comprehensive installation guide included in DMG (`build/README-macOS.md`)
  - Two methods for Gatekeeper bypass:
    - Method 1: Right-click → Open (GUI)
    - Method 2: `xattr -cr` command (Terminal)
  - Documented xattr quarantine attribute behavior

- **Application Icons**
  - Created retro TV icon with colorful vertical bars
  - macOS: `build/icon.icns` (150 KB, multi-resolution)
  - Windows: `build/icon.ico` (142 KB, multi-resolution)
  - Source: `build/icon.svg`

- **Documentation**
  - `MAC_SIGNING_SETUP.md` - Comprehensive Mac signing and distribution guide
  - `QUICK_START.md` - Quick reference for users and developers
  - `build/README-macOS.md` - Installation instructions embedded in DMG
  - Distribution checklist and troubleshooting sections

### Changed
- Updated `package.json` with `afterSign` hook for Mac builds
- Enhanced DMG layout to include README file at bottom center
- Updated `.gitignore` to exclude build outputs while preserving icons and documentation

---

## [0.9.0] - 2025-12-28

### Added
- **Focus-Based Auto-Refresh**
  - Automatic page reload when window regains focus
  - Ensures live streams stay current/real-time after returning to app
  - Prevents out-of-date video issue caused by pause logic

### Changed
- Replaced resume-on-focus behavior with full page reload
- Updated focus event handler in `src/renderer/renderer.js:606-613`

### Fixed
- Videos becoming behind real-time after leaving and re-entering application
- Stale stream content when window loses/regains focus

---

## [0.8.0] - 2025-12-27

### Added
- **Hybrid Dependency Management**
  - Platform-aware executable path resolution via `getExecutablePath()`
  - Startup dependency validation via `checkDependencies()`
  - Platform-specific error dialogs:
    - **macOS**: Homebrew installation instructions with copy-to-clipboard
    - **Windows**: Reinstall instructions and antivirus check reminder
    - **Linux**: Generic installation message
  - Console logging for dependency detection

- **Windows Binary Bundling**
  - Bundled `yt-dlp.exe` (18 MB) in `resources/bin/`
  - Bundled `ffmpeg.exe` (95 MB) in `resources/bin/`
  - Configured `extraResources` in `package.json` for automatic bundling
  - Windows users get zero-setup experience

- **macOS System PATH Support**
  - Uses system-installed yt-dlp and ffmpeg
  - Clear error dialogs with Homebrew installation commands
  - Avoids Mac bundling complexities and universal DMG issues

### Changed
- Updated all 4 `spawn()` calls to use `getExecutablePath()` helper
- Added imports: `dialog`, `shell`, `clipboard` to main process
- Modified `app.whenReady()` to check dependencies before window creation
- App quits gracefully if dependencies are missing after showing error dialog

### Fixed
- Silent failures when yt-dlp or ffmpeg are missing
- No user-visible errors when video extraction fails
- Cross-platform executable path resolution

---

## [0.7.1] - 2025-12-26

### Added
- **Performance Optimizations**
  - HLS buffer size reduction: 30s → 10s (via `maxBufferLength`)
  - DASH buffer optimization: Reduced `bufferTimeAtTopQuality` and `stableBufferTime`
  - DASH instance cleanup: Always destroy old instances before creating new ones
  - Enhanced visibility pause handling with separate `blur`/`focus` event listeners

### Performance Results
- **Memory**: 862 MB → 746 MB average (13.5% reduction)
- **Peak Memory**: 961 MB → 875 MB (8.9% reduction)
- **CPU**: 16.2% average reduction
- No impact on video playback performance or quality

### Changed
- Updated HLS.js configuration in `src/renderer/renderer.js:48-59`
- Updated DASH player settings in `src/renderer/renderer.js:14-27`
- Improved DASH instance lifecycle management in `src/renderer/renderer.js:213-225`
- Enhanced window visibility detection in `src/renderer/renderer.js:596-615`

---

## [0.7.0] - 2025-12-26

### Added
- **Feed 5 Muting**
  - Video feed 5 (YouTube stream) now remains muted during playback
  - Muted state persists even when entering fullscreen mode
  - Prevents audio interference with other feeds

### Changed
- Updated fullscreen handler in `src/renderer/renderer.js:426-429`
- Added conditional check to skip unmuting for `video-5` element

---

## [Pre-v0.7] - Earlier

### Initial Features
- 12-video grid layout (3x4)
- HLS and DASH streaming support
- YouTube live stream integration
- Webcam feed support (Prague, EarthTV)
- Feratel webcam authentication via HTTP proxy
- Animated gradient background
- Fullscreen mode for individual feeds
- Click-to-focus video interaction
- Cross-platform support (macOS, Windows, Linux)
- Electron security best practices

---

## Version Numbering Guide

- **v1.0.0**: Full release with Mac signing, icons, documentation
- **v0.9.0**: Focus auto-refresh feature
- **v0.8.0**: Hybrid dependency management with Windows bundling
- **v0.7.1**: Performance optimizations
- **v0.7.0**: Feed 5 muting feature

---

## Upgrade Notes

### From v0.9 to v1.0
- Mac builds now include ad-hoc signing (must build on macOS)
- New app icons will appear after update
- README included in DMG for Mac users
- No code changes required

### From v0.8 to v0.9
- Videos will auto-refresh on window focus
- No configuration changes required

### From v0.7 to v0.8
- **Windows users**: yt-dlp and ffmpeg now bundled automatically
- **Mac users**: Must install dependencies via Homebrew if not already installed
  ```bash
  brew install yt-dlp ffmpeg
  ```
- **Linux users**: Install yt-dlp and ffmpeg via package manager

### From v0.7.0 to v0.7.1
- Memory usage reduced by ~13%
- CPU usage reduced by ~16%
- No breaking changes

---

## Links

- [Quick Start Guide](QUICK_START.md)
- [Mac Signing Setup](MAC_SIGNING_SETUP.md)
- [Optimization Results](OPTIMIZATION_RESULTS.md)
