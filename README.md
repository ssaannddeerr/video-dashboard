# Prague to San Francisco Live

A beautiful Electron-based desktop application that displays live video feeds from Prague and San Francisco in a 3x4 grid layout with an animated gradient background.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📺 Overview

Prague to San Francisco Live is a production-ready desktop application for monitoring multiple live video feeds from Prague, Czech Republic and San Francisco, California simultaneously. With optimized performance, hybrid dependency management, and platform-specific distribution, it provides a seamless experience for watching these two beautiful cities in real-time across all major operating systems.

## ✨ Features

### Core Functionality
- **12 Video Grid Layout** - Displays up to 12 video feeds in a responsive 3x4 grid
- **HLS & DASH Streaming** - Built-in support for HTTP Live Streaming and DASH video sources
- **YouTube Live Streams** - Watch multiple YouTube live streams simultaneously with automatic URL extraction
- **Webcam Feeds** - Live webcam feeds from Prague, Czech Republic and San Francisco, California (Skyline Webcams, Feratel, EarthTV)
- **Auto-Refresh on Focus** - Videos automatically reload when returning to the app, ensuring real-time content
- **Fullscreen Mode** - Click any video to view in fullscreen, click again to return to grid
- **Feed 5 Always Muted** - Dedicated muted feed to prevent audio interference

### Performance & Reliability
- **Memory Optimized** - 13.5% reduction in RAM usage through intelligent buffer management
- **CPU Efficient** - 16.2% reduction in CPU usage with optimized streaming settings
- **Automatic Error Recovery** - Self-healing from network and media playback errors
- **Resource Efficient** - Pauses video playback when window is hidden to save resources

### Distribution & Dependencies
- **Hybrid Dependency Management**
  - **Windows**: yt-dlp and ffmpeg bundled automatically - zero setup required
  - **macOS**: Clear Homebrew installation instructions with copy-to-clipboard support
  - **Linux**: System package manager integration
- **Startup Validation** - Checks for required tools on launch with platform-specific error dialogs
- **macOS Distribution** - Ad-hoc signed with comprehensive installation guide included in DMG
- **Professional Icons** - Custom retro TV icons for all platforms

### User Experience
- **Beautiful UI** - Animated gradient background with smooth transitions and hover effects
- **Cross-Platform** - Works on macOS, Windows, and Linux with platform-optimized builds
- **Clear Documentation** - Quick start guides and troubleshooting for all platforms
- **Security Best Practices** - Context isolation, CSP, and disabled node integration in renderer

## 🖼️ Screenshots

### Main Dashboard
![Dashboard Screenshot](screenshots/dashboard.png)
*The main 3x4 video grid showing multiple live streams with animated gradient background*

## 🛠️ Technology Stack

- **Electron** - Cross-platform desktop application framework
- **HLS.js** - JavaScript library for HLS video streaming
- **Node.js** - JavaScript runtime environment
- **HTML5/CSS3** - Modern web technologies for UI
- **JavaScript** - Application logic and video management

## 📋 Prerequisites

### For Development
- **Node.js** (v16 or higher recommended)
- **npm** (comes with Node.js)
- **yt-dlp** - For extracting YouTube video URLs
- **ffmpeg** - For processing video streams

### For End Users
- **Windows**: No additional setup required (executables bundled)
- **macOS**: Install via Homebrew
  ```bash
  brew install yt-dlp ffmpeg
  ```
- **Linux**: Install via package manager
  ```bash
  # Debian/Ubuntu
  sudo apt install yt-dlp ffmpeg

  # Arch Linux
  sudo pacman -S yt-dlp ffmpeg

  # Fedora
  sudo dnf install yt-dlp ffmpeg
  ```

## 🚀 Quick Start

### For Users (Pre-built Apps)

**See [QUICK_START.md](QUICK_START.md) for detailed installation instructions**

**macOS:**
1. Download `Prague to San Francisco Live.dmg`
2. Open DMG → Drag app to Applications
3. **First launch**: Right-click → Open (or use `xattr -cr`)
4. Install dependencies: `brew install yt-dlp ffmpeg`

**Windows:**
1. Download `Prague to San Francisco Live Setup 1.0.0.exe`
2. Run installer (dependencies bundled automatically)
3. Done! Launch from Start Menu

**Linux:**
1. Download `.AppImage` or `.deb`
2. Install dependencies: `sudo apt install yt-dlp ffmpeg`
3. Run AppImage or install .deb package

### For Developers

1. Clone this repository:
   ```bash
   git clone https://github.com/ssaannddeerr/video-dashboard.git
   cd video-dashboard
   ```
   *(Note: Repository may be renamed to match app name)*

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure yt-dlp and ffmpeg are installed (see Prerequisites)

4. Run the application:
   ```bash
   npm start
   ```

## 📦 Building

Build the application for your platform:

```bash
# For macOS (must build on Mac for proper signing)
npm run build:mac
# Output: dist/Prague to San Francisco Live-1.0.0.dmg

# For Windows (can build on any platform)
npm run build:win
# Output: dist/Prague to San Francisco Live Setup 1.0.0.exe

# For Linux
npm run build:linux
# Output: dist/Prague to San Francisco Live-1.0.0.AppImage, dist/prague-to-san-francisco-live_1.0.0_amd64.deb
```

The built application will be available in the `dist/` directory.

**Important Notes:**
- **Mac builds** should be built on macOS to enable proper ad-hoc signing
- **Windows builds** include bundled yt-dlp.exe and ffmpeg.exe (~280MB)
- **Linux builds** require users to install yt-dlp and ffmpeg separately

See [QUICK_START.md](QUICK_START.md) for detailed build instructions and troubleshooting.

## 🎥 Video Sources

The application displays live feeds from two cities:

### 🇨🇿 Prague, Czech Republic
- Prague city center webcams (Skyline Webcams)
- Feratel webcam feeds
- Various city landmarks and streets

### 🇺🇸 San Francisco, California
- Golden Gate Bridge views
- Downtown San Francisco webcams
- Bay Area live streams
- EarthTV San Francisco feed

**Note:** Some video stream URLs may expire and need to be refreshed periodically. YouTube stream URLs typically expire after a few hours and can be refreshed using `yt-dlp`:

```bash
yt-dlp -f 'best' -g 'YOUTUBE_URL' 2>/dev/null
```

## 🗂️ Project Structure

```
video-dashboard-v10/
├── src/
│   ├── main/
│   │   └── main.js          # Electron main process (with dependency checking)
│   ├── preload/
│   │   └── preload.js       # Preload script for security
│   └── renderer/
│       ├── index.html       # Main HTML file
│       ├── renderer.js      # Video initialization logic (optimized buffers)
│       └── styles.css       # UI styling
├── build/
│   ├── icon.svg             # Source icon (retro TV design)
│   ├── icon.icns            # macOS icon (150 KB)
│   ├── icon.ico             # Windows icon (142 KB)
│   └── README-macOS.md      # Installation guide (included in DMG)
├── scripts/
│   └── sign-mac.sh          # Ad-hoc signing script
├── resources/
│   └── bin/
│       ├── yt-dlp.exe       # Windows bundled (18 MB)
│       └── ffmpeg.exe       # Windows bundled (95 MB)
├── CHANGELOG.md             # Version history
├── QUICK_START.md           # Quick reference guide
├── MAC_SIGNING_SETUP.md     # Mac distribution guide
├── package.json             # Dependencies and build config
└── README.md                # This file
```

## ⚙️ Configuration

Video sources can be configured in `src/renderer/renderer.js`. Look for the initialization code for each video element and update the stream URLs as needed.

## 🔒 Security

This application follows Electron security best practices:
- Context isolation enabled
- Node integration disabled in renderer
- Content Security Policy implemented
- Web security enabled

## 🐛 Known Issues

- **YouTube stream URLs expire** after a few hours and require manual refresh (app will auto-retry)
- **Some webcam feeds** may require authentication tokens that expire
- **Windows antivirus** may flag yt-dlp.exe as suspicious (false positive)
- **macOS Gatekeeper** requires right-click → Open on first launch (documented in DMG)
- **Large Windows installer** (~280MB due to bundled executables)

## 📚 Documentation

- **[CHANGELOG.md](CHANGELOG.md)** - Complete version history with detailed changes
- **[QUICK_START.md](QUICK_START.md)** - Quick reference guide for users and developers
- **[MAC_SIGNING_SETUP.md](MAC_SIGNING_SETUP.md)** - macOS code signing and distribution guide
- **[build/README-macOS.md](build/README-macOS.md)** - Installation instructions included in DMG

## 🤝 Contributing

This is a personal project currently in development. Contributions, suggestions, and feedback are welcome!

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Video streams provided by various public sources including Skyline Webcams, EarthTV, and YouTube
- HLS.js library by video-dev
- Electron framework by OpenJS Foundation

## 📧 Contact

For questions or suggestions, please open an issue on GitHub.

---

**Prague to San Francisco Live v1.0.0** - Watch two beautiful cities in real-time with optimized performance, hybrid dependency management, and professional distribution for all platforms.
