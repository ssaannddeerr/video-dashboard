# Mac Build Instructions & Dependency Handling

## Current Issue

The Mac build will **launch successfully** but videos won't load if dependencies are missing:
- ✗ No error dialog shown to user
- ✗ Errors only visible in DevTools console
- ✗ User sees blank video boxes with no explanation

## What Happens Without Dependencies

### User Experience:
1. User downloads `.dmg` and installs app
2. App launches (looks normal)
3. Videos don't load - blank boxes
4. No indication of what's wrong
5. User thinks app is broken and uninstalls

### Console Errors (invisible to user):
```
✗ Failed to refresh video-2: spawn yt-dlp ENOENT
✗ Failed to refresh video-4: spawn yt-dlp ENOENT
✗ Feratel video refresh failed: spawn yt-dlp ENOENT
```

## Solutions for Mac

### Option 1: Bundle Binaries (Recommended) ⭐

Mac allows bundling executables in the app bundle:

#### Step 1: Download Mac Binaries

```bash
# yt-dlp (universal binary)
wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos -O yt-dlp
chmod +x yt-dlp

# ffmpeg (use static build or Homebrew)
# Option A: Download from https://evermeet.cx/ffmpeg/
# Option B: Extract from Homebrew: /opt/homebrew/bin/ffmpeg
```

#### Step 2: Project Structure

```
video-dashboard-v7/
├── resources/
│   ├── mac/
│   │   ├── yt-dlp         (universal binary)
│   │   └── ffmpeg         (universal binary)
```

#### Step 3: Update package.json

```json
"build": {
  "mac": {
    "category": "public.app-category.video",
    "target": [
      {
        "target": "dmg",
        "arch": ["universal"]
      }
    ],
    "icon": "build/icon.icns",
    "extraResources": [
      {
        "from": "resources/mac",
        "to": "Resources/bin",
        "filter": ["**/*"]
      }
    ]
  }
}
```

#### Step 4: Update main.js

```javascript
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

// Get bundled executable path
function getExecutablePath(execName) {
  // In packaged app
  if (app.isPackaged) {
    if (process.platform === 'darwin') {
      // macOS: Contents/Resources/bin/
      return path.join(process.resourcesPath, 'bin', execName);
    } else if (process.platform === 'win32') {
      // Windows: resources/bin/
      return path.join(process.resourcesPath, 'bin', execName + '.exe');
    }
  }

  // In development - use system PATH
  return execName;
}

// Check if executable exists and is executable
function checkExecutable(execPath) {
  try {
    fs.accessSync(execPath, fs.constants.X_OK);
    return true;
  } catch (err) {
    return false;
  }
}
```

#### Step 5: Add Startup Dependency Check

```javascript
const { dialog } = require('electron');

async function checkDependencies() {
  const ytdlpPath = getExecutablePath('yt-dlp');
  const ffmpegPath = getExecutablePath('ffmpeg');

  const missing = [];

  if (!checkExecutable(ytdlpPath)) {
    missing.push('yt-dlp');
  }

  if (!checkExecutable(ffmpegPath)) {
    missing.push('ffmpeg');
  }

  if (missing.length > 0) {
    const result = await dialog.showMessageBox({
      type: 'error',
      title: 'Missing Dependencies',
      message: 'Required tools not found',
      detail: `The following tools are missing:\n\n${missing.join(', ')}\n\n` +
              `The app requires these to function properly.\n\n` +
              (app.isPackaged
                ? 'Please reinstall the application.'
                : 'Install via Homebrew:\n  brew install yt-dlp ffmpeg'),
      buttons: app.isPackaged
        ? ['Quit', 'Continue Anyway']
        : ['Quit', 'Install Instructions', 'Continue Anyway'],
      defaultId: 0,
      cancelId: 0
    });

    if (result.response === 1 && !app.isPackaged) {
      // Open Homebrew installation instructions
      require('electron').shell.openExternal('https://brew.sh');
    }

    if (result.response === 0) {
      app.quit();
      return false;
    }
  }

  return true;
}

// Update app.whenReady()
app.whenReady().then(async () => {
  // Check dependencies first
  if (!await checkDependencies()) {
    return;
  }

  cleanupFeratelCache();
  createWindow();
  // ... rest of code
});
```

### Option 2: Development-Friendly Alternative

For development builds, make dependencies optional:

```javascript
// Graceful degradation
async function refreshAllYouTubeUrls(mainWindow) {
  const ytdlpPath = getExecutablePath('yt-dlp');

  if (!checkExecutable(ytdlpPath)) {
    console.warn('⚠️  yt-dlp not found - YouTube videos will not update');
    // Use fallback/cached URLs if available
    return [];
  }

  // Proceed with normal refresh...
}
```

### Option 3: Homebrew Dependency (Developer Build)

Add a README note for developers:

```markdown
## macOS Requirements

Install dependencies via Homebrew:
```bash
brew install yt-dlp ffmpeg
```

## Build Comparison

| Approach | Pros | Cons |
|----------|------|------|
| **Bundle Binaries** | ✓ Works out-of-box<br>✓ No user setup<br>✓ Professional | ✗ Larger app size (+120MB)<br>✗ Need to update binaries |
| **Require Homebrew** | ✓ Smaller build<br>✓ Auto-updates via brew | ✗ Users must install manually<br>✗ Not beginner-friendly |
| **Hybrid** | ✓ Bundle for release<br>✓ Dev uses system tools | ✓ Best of both worlds | More complex build |

## Code Signing & Notarization

macOS will require:
1. **Code signing** - Sign app with Apple Developer ID
2. **Notarization** - Submit to Apple for malware scan
3. **Hardened Runtime** - Security requirements

Without these, users will see:
- "App is damaged and can't be opened" (requires Right-click → Open workaround)
- Gatekeeper warnings

## Distribution

The `.dmg` file will:
- Open to show drag-to-Applications window
- Include background image with instructions
- Be ~150-280MB depending on bundled tools

## Testing

Test on a **clean Mac** without Homebrew:
```bash
# Remove Homebrew temporarily
brew uninstall yt-dlp ffmpeg

# Test your built app
open dist/Video\ Dashboard-1.0.0.dmg

# Reinstall for development
brew install yt-dlp ffmpeg
```

## Recommended Approach

**For Distribution:** Bundle binaries (Option 1)
- Best user experience
- Professional appearance
- No setup required

**For Development:** Use system tools
- Faster builds
- Easier updates
- Check with `app.isPackaged` flag
