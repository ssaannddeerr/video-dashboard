const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');
const http = require('http');

// Fetch Feratel cookies (both JSESSIONID and dcs)
async function fetchFeratelCookies() {
  return new Promise((resolve, reject) => {
    // Use /webtv/ path to get cookies
    const options = {
      hostname: 'webtvfc.feratel.com',
      path: '/webtv/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0',
        'Accept': 'text/html'
      }
    };

    console.log('Fetching Feratel cookies from /webtv/');

    const req = https.request(options, (res) => {
      console.log('Cookie fetch response status:', res.statusCode);

      // Consume response body
      res.on('data', () => {});
      res.on('end', () => {});

      const cookies = res.headers['set-cookie'] || [];
      console.log('Cookies received:', cookies);

      const cookieObj = {};
      cookies.forEach(cookie => {
        if (cookie.includes('JSESSIONID=')) {
          const match = cookie.match(/JSESSIONID=([^;]+)/);
          if (match) cookieObj.JSESSIONID = match[1];
        }
        if (cookie.includes('dcs=')) {
          const match = cookie.match(/dcs=([^;]+)/);
          if (match) cookieObj.dcs = match[1];
        }
      });

      if (cookieObj.JSESSIONID) {
        console.log('Got Feratel cookies:', cookieObj);
        resolve(cookieObj);
      } else {
        console.warn('No JSESSIONID cookie found');
        reject(new Error('No JSESSIONID cookie found'));
      }
    });

    req.on('error', (err) => {
      console.error('Cookie fetch error:', err);
      reject(err);
    });

    req.end();

    setTimeout(() => {
      req.destroy();
      reject(new Error('Cookie fetch timeout'));
    }, 10000);
  });
}

// Fetch Feratel stream URL
async function fetchFeratelStreamUrl(pageUrl) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', ['-g', pageUrl]);
    let stdout = '';

    ytdlp.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        resolve(stdout.trim().split('\n')[0]);
      } else {
        reject(new Error('yt-dlp failed'));
      }
    });

    setTimeout(() => {
      ytdlp.kill();
      reject(new Error('Stream URL fetch timeout'));
    }, 30000);
  });
}

// Video configuration mapping video IDs to their source URLs
const VIDEO_CONFIG = {
  'video-2': {
    youtubeUrl: 'https://www.youtube.com/watch?v=lWaDZ0E5xsw',
    lowQualityUrl: null,
    highQualityUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  'video-4': {
    youtubeUrl: 'https://www.youtube.com/live/0jUGiYZKAMg',
    lowQualityUrl: null,
    highQualityUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  'video-5': {
    youtubeUrl: 'https://www.youtube.com/watch?v=IFnbDmgP69Q',
    lowQualityUrl: null,
    highQualityUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  'video-7': {
    youtubeUrl: 'https://www.youtube.com/watch?v=AttVS4KM8tY',
    lowQualityUrl: null,
    highQualityUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  'video-9': {
    youtubeUrl: 'https://www.youtube.com/watch?v=CXYr04BWvmc',
    lowQualityUrl: null,
    highQualityUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  'video-10': {
    youtubeUrl: 'https://www.youtube.com/watch?v=0aF8elLpiMo',
    lowQualityUrl: null,
    highQualityUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  'video-11': {
    youtubeUrl: 'https://www.youtube.com/watch?v=BSWhGNXxT9A',
    lowQualityUrl: null,
    highQualityUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  'video-12': {
    youtubeUrl: 'https://www.youtube.com/watch?v=046kfvReqT4',
    lowQualityUrl: null,
    highQualityUrl: null,
    lastRefresh: null,
    isYoutube: true
  },
  // Non-YouTube feeds (remain unchanged)
  'video-1': {
    feratelUrl: 'https://webtvfc.feratel.com/webtv/?design=v5&pg=DA7D2F22-8600-464D-9D4F-CDB04014A6C5&cam=2127&lg=en&autoplay=1&sound=muted&muted=1&mute=1&playsinline=1&c45=1',
    staticUrl: null,
    lastRefresh: null,
    isFeratel: true,
    isYoutube: false
  },
  'video-3': {
    staticUrl: 'https://livecdn-de-earthtv-com.global.ssl.fastly.net/edge0/cdnedge/HpL-X8UABqM/playlist.m3u8?token=EAIY6wE4p6eVeECIHUgF.CgdlYXJ0aHR2EAEyC0hwTC1YOFNBQnFJOgtIcEwtWDhVQUJxTQ.GR_kWLQufjppJjYUX_WI6iiZU9Lt2Dz0zpCBSrcZSLPRYlYFFUjYFakYM20FPAOw_VNJtRrFBQ3lSYbcL8NhYA&domain=www.earthtv.com',
    isYoutube: false
  },
  'video-6': {
    staticUrl: null,
    isYoutube: false
  },
  'video-8': {
    staticUrl: 'https://live.idnes.cz/slow/vrsovice_720p/manifest_w1564000375.mpd',
    isYoutube: false,
    isDash: true
  }
};

// Fetch YouTube URL using yt-dlp with specific quality
async function fetchYouTubeUrl(youtubeUrl, quality = 'high') {
  return new Promise((resolve, reject) => {
    // Quality format strings
    const formats = {
      low: 'bestvideo[height<=480]+bestaudio/best[height<=480]/worst',
      high: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
    };

    const ytdlp = spawn('yt-dlp', [
      '-f', formats[quality],
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

// Fetch both low and high quality URLs
async function fetchBothQualities(youtubeUrl) {
  try {
    const [lowQualityUrl, highQualityUrl] = await Promise.all([
      fetchYouTubeUrl(youtubeUrl, 'low'),
      fetchYouTubeUrl(youtubeUrl, 'high')
    ]);
    return { lowQualityUrl, highQualityUrl };
  } catch (error) {
    throw error;
  }
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

// Refresh all dynamic URLs (YouTube and Feratel) in parallel
async function refreshAllYouTubeUrls(mainWindow) {
  const refreshPromises = Object.entries(VIDEO_CONFIG)
    .filter(([id, config]) => config.isYoutube || config.isFeratel)
    .map(async ([videoId, config]) => {
      if (config.isFeratel) {
        // Handle Feratel stream - fetch cookies and stream URL, serve via proxy
        try {
          console.log(`Refreshing ${videoId} (Feratel)...`);

          // Fetch cookies and stream URL
          feratelCookies = await fetchFeratelCookies();
          feratelStreamUrl = await fetchFeratelStreamUrl(config.feratelUrl);

          console.log(`Feratel stream URL: ${feratelStreamUrl}`);
          console.log(`Feratel cookies:`, feratelCookies);

          // Create proxy if not exists
          createFeratelProxy();

          // Use local proxy URL
          const proxyUrl = 'http://127.0.0.1:9877/stream.mp4';
          VIDEO_CONFIG[videoId].staticUrl = proxyUrl;
          VIDEO_CONFIG[videoId].lastRefresh = Date.now();

          console.log(`✓ ${videoId} (Feratel) refreshed successfully`);
          return {
            videoId,
            url: proxyUrl,
            isFeratel: true,
            success: true
          };
        } catch (error) {
          console.error(`✗ Failed to refresh ${videoId} (Feratel):`, error.message);
          return {
            videoId,
            url: VIDEO_CONFIG[videoId].staticUrl,
            isFeratel: true,
            success: false,
            error: error.message
          };
        }
      } else {
        // Handle YouTube stream
        try {
          console.log(`Refreshing ${videoId}...`);

          const { lowQualityUrl, highQualityUrl } = await fetchBothQualities(config.youtubeUrl);

          VIDEO_CONFIG[videoId].lowQualityUrl = lowQualityUrl;
          VIDEO_CONFIG[videoId].highQualityUrl = highQualityUrl;
          VIDEO_CONFIG[videoId].lastRefresh = Date.now();

          console.log(`✓ ${videoId} refreshed successfully (low + high quality)`);
          return {
            videoId,
            lowQualityUrl,
            highQualityUrl,
            success: true
          };
        } catch (error) {
          console.error(`✗ Failed to refresh ${videoId}:`, error.message);
          // Keep existing URLs if available
          return {
            videoId,
            lowQualityUrl: VIDEO_CONFIG[videoId].lowQualityUrl,
            highQualityUrl: VIDEO_CONFIG[videoId].highQualityUrl,
            success: false,
            error: error.message
          };
        }
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
let mpvProcesses = {}; // Store MPV subprocess instances
let feratelProxy = null;
let feratelCookies = {}; // Store both JSESSIONID and dcs
let feratelStreamUrl = null;

// Create a simple HTTP proxy for Feratel stream
function createFeratelProxy() {
  if (feratelProxy) return;

  feratelProxy = http.createServer(async (req, res) => {
    if (!feratelStreamUrl || !feratelCookies.JSESSIONID) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Stream not ready');
      return;
    }

    console.log('Proxying Feratel stream request');

    const streamUrl = new URL(feratelStreamUrl);

    // Build cookie string with both cookies
    let cookieString = `JSESSIONID=${feratelCookies.JSESSIONID}`;
    if (feratelCookies.dcs) {
      cookieString += `; dcs=${feratelCookies.dcs}`;
    }

    const options = {
      hostname: streamUrl.hostname,
      path: streamUrl.pathname + streamUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0',
        'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
        'Referer': 'https://webtvfc.feratel.com/',
        'Cookie': cookieString,
        'Range': req.headers.range || 'bytes=0-',
        'Connection': 'keep-alive'
      }
    };

    console.log('Proxying with cookie:', cookieString);

    https.get(options, (streamRes) => {
      console.log('Stream response status:', streamRes.statusCode);

      const headers = {
        'Content-Type': streamRes.headers['content-type'] || 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*'
      };

      if (streamRes.headers['content-length']) {
        headers['Content-Length'] = streamRes.headers['content-length'];
      }
      if (streamRes.headers['content-range']) {
        headers['Content-Range'] = streamRes.headers['content-range'];
      }

      res.writeHead(streamRes.statusCode, headers);
      streamRes.pipe(res);
    }).on('error', (err) => {
      console.error('Proxy error:', err);
      res.writeHead(500);
      res.end('Proxy error');
    });
  });

  feratelProxy.listen(9877, '127.0.0.1', () => {
    console.log('Feratel proxy listening on http://127.0.0.1:9877');
  });
}

// Start MPV for a specific video
function startMPV(videoId, streamUrl, windowId) {
  // Stop existing instance if any
  if (mpvProcesses[videoId]) {
    mpvProcesses[videoId].kill();
    delete mpvProcesses[videoId];
  }

  console.log(`Starting MPV for ${videoId} with URL: ${streamUrl}`);

  const mpv = spawn('mpv', [
    streamUrl,
    '--loop=inf',
    '--no-audio',
    '--really-quiet',
    '--no-osc',
    '--no-osd-bar',
    '--no-input-default-bindings',
    '--input-vo-keyboard=no',
    '--no-border',
    '--wid=' + windowId,
    '--vo=gpu',
    '--hwdec=auto'
  ], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  mpv.stdout.on('data', (data) => {
    console.log(`MPV ${videoId} stdout:`, data.toString());
  });

  mpv.stderr.on('data', (data) => {
    console.error(`MPV ${videoId} stderr:`, data.toString());
  });

  mpv.on('error', (err) => {
    console.error(`MPV error for ${videoId}:`, err);
  });

  mpv.on('close', (code) => {
    console.log(`MPV for ${videoId} exited with code ${code}`);
    delete mpvProcesses[videoId];
  });

  mpvProcesses[videoId] = mpv;
  console.log(`MPV process spawned for ${videoId}`);
  return mpv;
}

// Stop MPV for a specific video
function stopMPV(videoId) {
  if (mpvProcesses[videoId]) {
    mpvProcesses[videoId].kill();
    delete mpvProcesses[videoId];
    console.log(`Stopped MPV for ${videoId}`);
  }
}

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
  // Return URL map with both low and high quality for YouTube videos
  const urlMap = {};
  Object.entries(VIDEO_CONFIG).forEach(([id, config]) => {
    if (config.isYoutube) {
      urlMap[id] = {
        lowQualityUrl: config.lowQualityUrl,
        highQualityUrl: config.highQualityUrl,
        isYoutube: true,
        useMPV: false
      };
    } else {
      urlMap[id] = {
        url: config.staticUrl,
        isYoutube: false,
        useMPV: config.isFeratel || false
      };
    }
  });

  return urlMap;
});

// IPC handler to start MPV for a video with positioning
ipcMain.handle('start-mpv', async (event, videoId, streamUrl, geometry) => {
  try {
    console.log(`Request to start MPV for ${videoId}`);
    console.log(`Stream URL: ${streamUrl}`);
    console.log(`Geometry:`, geometry);

    if (mpvProcesses[videoId]) {
      console.log(`Killing existing MPV for ${videoId}`);
      mpvProcesses[videoId].kill();
      delete mpvProcesses[videoId];
    }

    // Get window position for absolute positioning
    const [winX, winY] = mainWindow.getPosition();
    const absX = winX + geometry.x;
    const absY = winY + geometry.y;

    // Build geometry string with absolute screen coordinates
    const geometryStr = `${geometry.width}x${geometry.height}+${absX}+${absY}`;
    console.log(`MPV geometry (absolute): ${geometryStr}`);

    const mpvArgs = [
      streamUrl,
      '--loop=inf',
      '--mute=yes',
      '--no-osc',
      '--no-osd-bar',
      '--no-input-default-bindings',
      '--no-input-cursor',
      '--cursor-autohide=no',
      '--no-border',
      '--ontop',
      '--geometry=' + geometryStr,
      '--vo=gpu',
      '--hwdec=auto',
      '--keep-open=yes',
      '--no-window-dragging',
      '--force-window-position'
    ];

    console.log(`MPV args:`, mpvArgs.join(' '));

    const mpv = spawn('mpv', mpvArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    mpv.stdout.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('AV:') && !output.includes('Cache:') && !output.includes('Buffering')) {
        console.log(`MPV ${videoId}:`, output);
      }
    });

    mpv.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('libcuda') && !output.includes('VDPAU')) {
        console.error(`MPV ${videoId} error:`, output);
      }
    });

    mpv.on('error', (err) => {
      console.error(`MPV spawn error for ${videoId}:`, err);
    });

    mpv.on('close', (code) => {
      console.log(`MPV for ${videoId} exited with code ${code}`);
      delete mpvProcesses[videoId];
    });

    mpvProcesses[videoId] = mpv;
    console.log(`✓ MPV process spawned for ${videoId}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to start MPV for ${videoId}:`, error);
    return { success: false, error: error.message };
  }
});

// IPC handler to stop MPV
ipcMain.handle('stop-mpv', async (event, videoId) => {
  stopMPV(videoId);
  return { success: true };
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

// Cleanup timers and MPV processes on app quit
app.on('before-quit', () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    console.log('YouTube refresh timer cleared');
  }

  // Stop all MPV processes
  Object.keys(mpvProcesses).forEach(videoId => {
    stopMPV(videoId);
  });
  console.log('All MPV processes stopped');
});
