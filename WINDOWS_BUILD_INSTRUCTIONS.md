# Windows Build Instructions

## Current Issues

The app depends on external executables that Windows users won't have:
- **yt-dlp** - Required for YouTube URL extraction and Feratel downloads
- **ffmpeg** - Required for Feratel video processing
- **mpv** - Optional, only used for MPV IPC feature (can be removed)

## Solution: Bundle Executables

### Step 1: Download Windows Binaries

1. **yt-dlp**: https://github.com/yt-dlp/yt-dlp/releases
   - Download `yt-dlp.exe` (Windows standalone)

2. **ffmpeg**: https://www.gyan.dev/ffmpeg/builds/
   - Download "ffmpeg-release-essentials.zip"
   - Extract `ffmpeg.exe` from `bin/` folder

### Step 2: Create Resources Folder

```
video-dashboard-v7/
├── resources/
│   ├── bin/
│   │   ├── yt-dlp.exe
│   │   └── ffmpeg.exe
```

### Step 3: Update package.json

Add to the `build` section:

```json
"build": {
  "productName": "Prague to San Francisco Live",
  "appId": "com.praguetosanfranciscolive.app",
  "directories": {
    "output": "dist"
  },
  "files": [
    "src/**/*",
    "package.json",
    "resources/**/*"
  ],
  "extraResources": [
    {
      "from": "resources/bin",
      "to": "bin",
      "filter": ["**/*"]
    }
  ],
  "win": {
    "target": ["nsis"],
    "icon": "build/icon.ico"
  }
}
```

### Step 4: Update main.js to Use Bundled Executables

Add helper function at the top of main.js:

```javascript
const path = require('path');
const { app } = require('electron');

// Get path to bundled executable
function getExecutablePath(execName) {
  if (process.platform === 'win32') {
    execName += '.exe';
  }

  // In production (packaged app)
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'bin', execName);
  }

  // In development
  return execName; // Use system PATH
}

// Usage:
const ytdlpPath = getExecutablePath('yt-dlp');
const ffmpegPath = getExecutablePath('ffmpeg');
```

Then replace all spawn calls:

```javascript
// OLD:
const ytdlp = spawn('yt-dlp', [...]);

// NEW:
const ytdlp = spawn(getExecutablePath('yt-dlp'), [...]);
```

### Step 5: Add Error Handling (Optional but Recommended)

Check if executables exist and show user-friendly error:

```javascript
const fs = require('fs');

function checkDependencies() {
  const ytdlpPath = getExecutablePath('yt-dlp');
  const ffmpegPath = getExecutablePath('ffmpeg');

  if (!fs.existsSync(ytdlpPath)) {
    dialog.showErrorBox(
      'Missing Dependency',
      'yt-dlp executable not found. Please reinstall the application.'
    );
    return false;
  }

  if (!fs.existsSync(ffmpegPath)) {
    dialog.showErrorBox(
      'Missing Dependency',
      'ffmpeg executable not found. Please reinstall the application.'
    );
    return false;
  }

  return true;
}

// Call in app.whenReady()
app.whenReady().then(() => {
  if (!checkDependencies()) {
    app.quit();
    return;
  }

  createWindow();
  // ... rest of code
});
```

## Option 2: Remove Dependencies

If you don't want to bundle executables, you can:

1. **Remove Feratel support** - Requires yt-dlp and ffmpeg
2. **Simplify YouTube** - Use static URLs instead of dynamic extraction
3. **Remove MPV** - Not currently used by main features

## Build Process

### Windows Build Commands

```bash
# Install dependencies
npm install

# Build for Windows (run on Windows or with wine)
npm run build:win

# Output will be in dist/
# Example: dist/Prague to San Francisco Live Setup 1.0.0.exe
```

### Testing

After building:
1. Install the `.exe` on a clean Windows machine
2. Check if videos load correctly
3. Check console for errors (F12)
4. Test Feratel video refresh
5. Test YouTube URL refresh

## File Sizes

- Base Electron app: ~150MB
- yt-dlp.exe: ~12MB
- ffmpeg.exe: ~100MB
- **Total installed size: ~260-280MB**

## Distribution

The NSIS installer will:
- Install all files to Program Files
- Create shortcuts
- Include uninstaller
- Support silent install: `installer.exe /S`

## Important Notes

- **Code Signing**: Consider signing the .exe to avoid Windows SmartScreen warnings
- **Auto-updates**: Consider adding electron-updater for automatic updates
- **Antivirus**: Some AV may flag yt-dlp.exe - this is a false positive
