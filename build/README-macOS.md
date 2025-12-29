# Prague to San Francisco Live - macOS Installation

Thank you for downloading Prague to San Francisco Live!

## Installation Steps

1. **Drag** the `Prague to San Francisco Live` app to your `Applications` folder
2. **Important:** First time opening requires a special step (see below)

## First Launch - Security Note

macOS will block the app on first launch because it's not from the App Store. This is normal and safe.

### Method 1: Right-Click Open (Easiest)

1. Open **Finder** → Go to **Applications**
2. Find **Prague to San Francisco Live**
3. **Right-click** (or Control+click) on the app
4. Select **"Open"** from the menu
5. Click **"Open"** in the dialog that appears

![macOS Right-Click Open](https://support.apple.com/library/content/dam/edam/applecare/images/en_US/macos/Big-Sur/macos-big-sur-right-click-open.png)

**That's it!** From now on, you can open Prague to San Francisco Live normally by double-clicking.

### Method 2: Terminal Command (Alternative)

If you prefer using Terminal, you can remove the quarantine attribute:

```bash
# Navigate to Applications folder
cd /Applications

# Remove quarantine attribute
xattr -cr "Prague to San Francisco Live.app"

# Now open normally
open "Prague to San Francisco Live.app"
```

This removes the security flag that macOS applies to downloaded apps. Choose whichever method you prefer!

## System Requirements

### Required Tools (Must Install)

Prague to San Francisco Live requires these command-line tools to fetch live video streams:

- **yt-dlp** - For extracting YouTube video URLs
- **ffmpeg** - For processing video streams

### Installation via Homebrew

If you don't have **Homebrew**, install it first:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then install the required tools:
```bash
brew install yt-dlp ffmpeg
```

**The app will show an error dialog with these instructions if the tools are missing.**

## Features

- 12 live video feeds in a 3x4 grid
- Live feeds from Prague, Czech Republic
- Live feeds from San Francisco, California
- YouTube live streams
- Webcam feeds from both cities
- Automatic quality adjustment
- Click any feed for fullscreen
- Low CPU/memory usage with optimized buffers

## Troubleshooting

### "Prague to San Francisco Live is damaged and can't be opened"

This means Gatekeeper is blocking the app. Follow the **First Launch** steps above.

### Videos not loading

Make sure you installed yt-dlp and ffmpeg:
```bash
which yt-dlp   # Should show: /opt/homebrew/bin/yt-dlp
which ffmpeg   # Should show: /opt/homebrew/bin/ffmpeg
```

If not installed:
```bash
brew install yt-dlp ffmpeg
```

### App won't stay open

Your antivirus software might be blocking it. Add Prague to San Francisco Live to your security software's exclusion list.

---

**Need Help?** Report issues at: https://github.com/ssaannddeerr/video-dashboard/issues

**Version:** 1.0.0
