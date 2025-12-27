const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');

// Video configuration mapping video IDs to their source URLs
const VIDEO_CONFIG = {
  'video-2': {
    youtubeUrl: 'https://www.youtube.com/watch?v=lWaDZ0E5xsw',
    currentHlsUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  'video-4': {
    youtubeUrl: 'https://www.youtube.com/live/0jUGiYZKAMg',
    currentHlsUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  'video-9': {
    youtubeUrl: 'https://www.youtube.com/watch?v=CXYr04BWvmc',
    currentHlsUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  'video-10': {
    youtubeUrl: 'https://www.youtube.com/watch?v=0aF8elLpiMo',
    currentHlsUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  'video-11': {
    youtubeUrl: 'https://www.youtube.com/watch?v=BSWhGNXxT9A',
    currentHlsUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  'video-12': {
    youtubeUrl: 'https://www.youtube.com/watch?v=046kfvReqT4',
    currentHlsUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  // Non-YouTube feeds (remain unchanged)
  'video-1': {
    staticUrl: null,
    isYoutube: false
  },
  'video-3': {
    staticUrl: 'https://livecdn-de-earthtv-com.global.ssl.fastly.net/edge0/cdnedge/HpL-X8UABqM/playlist.m3u8?token=EAIY6wE4p6eVeECIHUgF.CgdlYXJ0aHR2EAEyC0hwTC1YOFNBQnFJOgtIcEwtWDhVQUJxTQ.GR_kWLQufjppJjYUX_WI6iiZU9Lt2Dz0zpCBSrcZSLPRYlYFFUjYFakYM20FPAOw_VNJtRrFBQ3lSYbcL8NhYA&domain=www.earthtv.com',
    isYoutube: false
  },
  'video-6': {
    staticUrl: null,
    isYoutube: false
  }
};

// Fetch YouTube HLS URL using yt-dlp
async function fetchYouTubeUrl(youtubeUrl) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '-f', 'best[ext=mp4]',
      '-g',
      youtubeUrl
    ], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    ytdlp.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        // Extract first URL (manifest URL)
        const url = stdout.trim().split('\n')[0];
        resolve(url);
      } else {
        reject(new Error(`yt-dlp failed: ${stderr || 'Unknown error'}`));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      ytdlp.kill();
      reject(new Error('yt-dlp timeout'));
    }, 30000);
  });
}

// Fetch EarthCam HLS URL by scraping the page - tries multiple URL patterns
async function fetchEarthCamUrl(pageUrl) {
  return new Promise((resolve, reject) => {
    https.get(pageUrl, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          // Try multiple URL patterns in priority order

          // 1. Try android_livepath (mobile-optimized, may have better access)
          const androidMatch = data.match(/"android_livepath"\s*:\s*"([^"]+)"/);
          if (androidMatch) {
            let androidPath = androidMatch[1].replace(/\\\//g, '/');
            if (androidPath.startsWith('http')) {
              console.log('  Using android_livepath URL');
              return resolve(androidPath);
            } else if (androidPath.startsWith('/')) {
              console.log('  Using android_livepath URL with domain');
              return resolve(`https://videos-3.earthcam.com${androidPath}`);
            } else {
              console.log('  Using android_livepath URL with full domain');
              return resolve(`https://videos-3.earthcam.com/${androidPath}`);
            }
          }

          // 2. Try html5_streamingdomain + html5_streampath combination
          const domainMatch = data.match(/"html5_streamingdomain"\s*:\s*"([^"]+)"/);
          const pathMatch = data.match(/"html5_streampath"\s*:\s*"([^"]+)"/);
          if (domainMatch && pathMatch) {
            let domain = domainMatch[1].replace(/\\\//g, '/');
            let path = pathMatch[1].replace(/\\\//g, '/');
            console.log('  Using html5_streamingdomain + html5_streampath');
            return resolve(`${domain}${path}`);
          }

          // 3. Try "stream" field (full URL with tokens)
          const streamMatch = data.match(/"stream"\s*:\s*"([^"]+)"/);
          if (streamMatch) {
            let streamUrl = streamMatch[1].replace(/\\\//g, '/');
            console.log('  Using stream field URL');
            return resolve(streamUrl);
          }

          // 4. Fallback: try html5_streampath alone
          if (pathMatch) {
            let streamPath = pathMatch[1].replace(/\\\//g, '/');
            if (streamPath.startsWith('http')) {
              console.log('  Using html5_streampath alone (full)');
              return resolve(streamPath);
            } else {
              console.log('  Using html5_streampath alone (with domain)');
              return resolve(`https://videos-3.earthcam.com${streamPath}`);
            }
          }

          // 5. Last resort: try to find any .m3u8 URL
          const m3u8Match = data.match(/https?:\\\/\\\/[^"]+\.m3u8[^"\s]*/);
          if (m3u8Match) {
            console.log('  Using regex-found m3u8 URL');
            return resolve(m3u8Match[0].replace(/\\\//g, '/'));
          }

          reject(new Error('Could not find any stream URL in page'));
        } catch (error) {
          reject(new Error(`Failed to parse page: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`HTTP request failed: ${error.message}`));
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('EarthCam fetch timeout'));
    }, 10000);
  });
}

// Refresh all YouTube URLs in parallel
async function refreshAllYouTubeUrls(mainWindow) {
  const refreshPromises = Object.entries(VIDEO_CONFIG)
    .filter(([id, config]) => config.isYoutube)
    .map(async ([videoId, config]) => {
      try {
        console.log(`Refreshing ${videoId}...`);

        const newUrl = await fetchYouTubeUrl(config.youtubeUrl);

        VIDEO_CONFIG[videoId].currentHlsUrl = newUrl;
        VIDEO_CONFIG[videoId].lastRefresh = Date.now();

        console.log(`✓ ${videoId} refreshed successfully`);
        return { videoId, url: newUrl, success: true };
      } catch (error) {
        console.error(`✗ Failed to refresh ${videoId}:`, error.message);
        // Keep existing URL if available
        return {
          videoId,
          url: VIDEO_CONFIG[videoId].currentHlsUrl,
          success: false,
          error: error.message
        };
      }
    });

  const results = await Promise.all(refreshPromises);

  // Notify renderer process if window exists
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('urls-refreshed', results);
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`URL refresh complete: ${successCount}/${results.length} successful`);

  return results;
}

let mainWindow = null;
let refreshTimer = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: '#1e3c72',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    autoHideMenuBar: true,
    fullscreen: false,
    fullscreenable: true,
    icon: path.join(__dirname, '../../assets/icons/icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Optional: Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

// IPC handler for initial URL request from renderer
ipcMain.handle('get-initial-urls', async () => {
  // If URLs haven't been refreshed yet, return null (they'll be sent via event after refresh)
  // Otherwise, return the current URL map
  const urlMap = {};
  Object.entries(VIDEO_CONFIG).forEach(([id, config]) => {
    if (config.isYoutube) {
      urlMap[id] = config.currentHlsUrl;
    } else {
      urlMap[id] = config.staticUrl;
    }
  });

  return urlMap;
});

app.whenReady().then(async () => {
  // Create window first
  createWindow();

  // Wait for renderer to be ready, then perform initial URL refresh
  mainWindow.webContents.once('did-finish-load', async () => {
    console.log('Renderer loaded, performing initial YouTube URL refresh...');
    await refreshAllYouTubeUrls(mainWindow);
  });

  // Start periodic refresh timer (5 hours for YouTube)
  const REFRESH_INTERVAL = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
  refreshTimer = setInterval(async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Periodic YouTube refresh triggered`);

    try {
      await refreshAllYouTubeUrls(mainWindow);
    } catch (error) {
      console.error('Periodic YouTube refresh failed:', error);
    }
  }, REFRESH_INTERVAL);

  console.log(`Periodic YouTube refresh scheduled every ${REFRESH_INTERVAL / 1000 / 60 / 60} hours`);

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup timers on app quit
app.on('before-quit', () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    console.log('YouTube refresh timer cleared');
  }
});
