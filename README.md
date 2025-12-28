# Video Dashboard

A beautiful Electron-based desktop application that displays multiple live video streams in a 3x4 grid layout with an animated gradient background.

![Work in Progress](https://img.shields.io/badge/status-work%20in%20progress-yellow)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚧 Work in Progress

This project is currently under active development. Features and functionality may change as the project evolves.

## ✨ Features

- **12 Video Grid Layout** - Displays up to 12 video feeds in a responsive 3x4 grid
- **HLS Streaming Support** - Built-in support for HTTP Live Streaming (HLS) video sources
- **YouTube Live Streams** - Watch multiple YouTube live streams simultaneously
- **Webcam Feeds** - Includes live webcam feeds from around the world (Prague, EarthTV, etc.)
- **Beautiful UI** - Animated gradient background with smooth transitions and hover effects
- **Cross-Platform** - Works on macOS, Windows, and Linux
- **Error Recovery** - Automatic recovery from network and media playback errors
- **Resource Efficient** - Pauses video playback when window is hidden

## 🖼️ Screenshots

### Main Dashboard
![Dashboard Screenshot](screenshots/Screenshot_28-Dec_06-34-59_15985.png)
*The main 3x4 video grid showing multiple live streams with animated gradient background*

## 🛠️ Technology Stack

- **Electron** - Cross-platform desktop application framework
- **HLS.js** - JavaScript library for HLS video streaming
- **Node.js** - JavaScript runtime environment
- **HTML5/CSS3** - Modern web technologies for UI
- **JavaScript** - Application logic and video management

## 📋 Prerequisites

- Node.js (v16 or higher recommended)
- npm (comes with Node.js)

## 🚀 Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/ssaannddeerr/video-dashboard.git
   cd video-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the application:
   ```bash
   npm start
   ```

## 📦 Building

Build the application for your platform:

```bash
# For macOS
npm run build:mac

# For Windows
npm run build:win

# For Linux
npm run build:linux
```

The built application will be available in the `dist/` directory.

## 🎥 Video Sources

The application currently displays:
- Prague city webcam (Skyline Webcams)
- EarthTV live stream
- Multiple YouTube live streams (news, scenery, etc.)
- Placeholder slots for additional feeds

**Note:** Some video stream URLs may expire and need to be refreshed periodically. YouTube stream URLs typically expire after a few hours and can be refreshed using `yt-dlp`:

```bash
yt-dlp -f 'best' -g 'YOUTUBE_URL' 2>/dev/null
```

## 🗂️ Project Structure

```
video-dashboard/
├── src/
│   ├── main/
│   │   └── main.js          # Electron main process
│   ├── preload/
│   │   └── preload.js       # Preload script for security
│   └── renderer/
│       ├── index.html       # Main HTML file
│       ├── renderer.js      # Video initialization logic
│       └── styles.css       # UI styling
├── assets/
│   └── icons/               # Application icons
├── package.json             # Dependencies and scripts
└── README.md               # This file
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

- YouTube stream URLs expire after a few hours and require manual refresh
- Some webcam feeds may require authentication tokens that expire

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

**Status:** 🚧 This project is actively being developed. Check back for updates!
