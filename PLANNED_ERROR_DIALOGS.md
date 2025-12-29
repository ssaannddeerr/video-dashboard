# Planned Startup Error Dialogs

## Overview

The app will check for required dependencies on startup. If any are missing, it will show a platform-specific error dialog with installation instructions.

---

## macOS Error Dialog

### Scenario: yt-dlp or ffmpeg missing

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  Missing Dependencies                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Video Dashboard requires these tools:              │
│                                                     │
│  • yt-dlp  (video URL extraction)                   │
│  • ffmpeg  (video processing)                       │
│                                                     │
│  To install, open Terminal and run:                │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ # Install Homebrew (if not installed)        │ │
│  │ /bin/bash -c "$(curl -fsSL https://raw.\     │ │
│  │ githubusercontent.com/Homebrew/install/\      │ │
│  │ HEAD/install.sh)"                            │ │
│  │                                              │ │
│  │ # Install dependencies                       │ │
│  │ brew install yt-dlp ffmpeg                   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Then restart Video Dashboard.                      │
│                                                     │
│     [ Copy Commands ]  [ Open Terminal ]  [ Quit ]  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Dialog Details:**
- **Type:** Error icon (⚠️)
- **Title:** "Missing Dependencies"
- **Buttons:**
  - "Copy Commands" - Copies install commands to clipboard
  - "Open Terminal" - Opens Terminal.app
  - "Quit" - Closes the app (default)

---

## Windows Error Dialog

### Scenario: yt-dlp or ffmpeg missing

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  Missing Dependencies                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Video Dashboard requires these tools:              │
│                                                     │
│  • yt-dlp.exe  (video URL extraction)               │
│  • ffmpeg.exe  (video processing)                   │
│                                                     │
│  These should be included with the app.             │
│  If you see this message, the installation          │
│  may be incomplete or corrupted.                    │
│                                                     │
│  Please try:                                        │
│  1. Reinstall Video Dashboard                       │
│  2. Check your antivirus hasn't blocked files       │
│                                                     │
│  Or download manually:                              │
│  • yt-dlp: github.com/yt-dlp/yt-dlp/releases        │
│  • ffmpeg: ffmpeg.org/download.html                 │
│                                                     │
│        [ Download Links ]  [ Reinstall ]  [ Quit ]  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Dialog Details:**
- **Type:** Error icon (⚠️)
- **Title:** "Missing Dependencies"
- **Buttons:**
  - "Download Links" - Opens download pages in browser
  - "Reinstall" - Shows reinstall instructions
  - "Quit" - Closes the app (default)

---

## Alternative: Simplified Dialogs

If the above seems too complex, here are shorter versions:

### macOS (Simplified)

```
┌─────────────────────────────────────────────┐
│  ⚠️  Missing Dependencies                   │
├─────────────────────────────────────────────┤
│                                             │
│  Required tools not found:                  │
│  • yt-dlp                                   │
│  • ffmpeg                                   │
│                                             │
│  Install via Terminal:                      │
│                                             │
│  brew install yt-dlp ffmpeg                 │
│                                             │
│  (Need Homebrew? Visit brew.sh)             │
│                                             │
│     [ Copy Command ]  [ More Info ]  [ OK ] │
│                                             │
└─────────────────────────────────────────────┘
```

### Windows (Simplified)

```
┌─────────────────────────────────────────────┐
│  ⚠️  Missing Dependencies                   │
├─────────────────────────────────────────────┤
│                                             │
│  Required tools not found:                  │
│  • yt-dlp.exe                               │
│  • ffmpeg.exe                               │
│                                             │
│  These should be bundled with the app.      │
│  Please reinstall Video Dashboard.          │
│                                             │
│  If problem persists, your antivirus        │
│  may be blocking these files.               │
│                                             │
│          [ Reinstall ]  [ OK ]              │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Implementation Plan

### Code Structure

```javascript
// main.js

const { dialog, shell, clipboard } = require('electron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if command exists on system
function commandExists(command) {
  try {
    if (process.platform === 'win32') {
      require('child_process').execSync(`where ${command}`, { stdio: 'ignore' });
    } else {
      require('child_process').execSync(`which ${command}`, { stdio: 'ignore' });
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Check dependencies on startup
async function checkDependencies() {
  const missing = [];

  if (!commandExists('yt-dlp')) missing.push('yt-dlp');
  if (!commandExists('ffmpeg')) missing.push('ffmpeg');

  if (missing.length === 0) return true;

  // Show platform-specific dialog
  if (process.platform === 'darwin') {
    return await showMacDialog(missing);
  } else if (process.platform === 'win32') {
    return await showWindowsDialog(missing);
  }

  return false;
}

// Call in app.whenReady()
app.whenReady().then(async () => {
  if (!await checkDependencies()) {
    app.quit();
    return;
  }

  // Continue normal startup...
});
```

---

## Questions for Approval

1. **Which dialog style do you prefer?**
   - [ ] Detailed (with full instructions)
   - [ ] Simplified (shorter, cleaner)

2. **Mac dialog buttons:**
   - [ ] "Copy Commands" + "Open Terminal" + "Quit"
   - [ ] "Copy Command" + "More Info" + "OK"
   - [ ] Other: ___________

3. **Windows dialog buttons:**
   - [ ] "Download Links" + "Reinstall" + "Quit"
   - [ ] "Reinstall" + "OK"
   - [ ] Other: ___________

4. **Should the app quit automatically or let user continue?**
   - [ ] Auto-quit (force installation)
   - [ ] Optional continue (show warning but allow running)

5. **Additional checks needed?**
   - [ ] Check for Homebrew on Mac first
   - [ ] Check Windows PATH for executables
   - [ ] Provide fallback if dependencies fail

---

## My Recommendation

**For macOS:** Simplified dialog with "Copy Command" button
- Most Mac users know Terminal basics
- Homebrew link in parentheses is enough
- Keep it clean and actionable

**For Windows:** Simplified dialog with "Reinstall" button
- Windows users expect bundled dependencies
- If missing = corrupted install or AV block
- Point them to reinstall

**Behavior:** Auto-quit and force installation (don't let app run broken)
