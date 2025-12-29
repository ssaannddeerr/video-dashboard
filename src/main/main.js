const { app, BrowserWindow, ipcMain, protocol, dialog, shell, clipboard } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');
const http = require('http');
const fs = require('fs');

// ============================================================================
// DEPENDENCY PATH RESOLUTION & VALIDATION
// ============================================================================

/**
 * Get the correct path to an external executable
 * @param {string} name - Executable name (e.g., 'yt-dlp', 'ffmpeg')
 * @returns {string} - Full path to executable or bare name for PATH lookup
 */
function getExecutablePath(name) {
  // Windows packaged mode: use bundled executables
  if (app.isPackaged && process.platform === 'win32') {
    const exePath = path.join(process.resourcesPath, 'bin', `${name}.exe`);
    console.log(`Windows packaged mode: ${name} -> ${exePath}`);
    return exePath;
  }

  // All other cases: use system PATH (Mac, Linux, dev mode)
  const systemName = process.platform === 'win32' ? `${name}.exe` : name;
  console.log(`Using system PATH: ${systemName}`);
  return systemName;
}

/**
 * Check if an executable exists and is accessible
 * @param {string} execPath - Path to check
 * @returns {boolean} - True if executable exists and is accessible
 */
function checkExecutable(execPath) {
  // If bare name (no path separators), assume it's in PATH
  if (!execPath.includes(path.sep) && !execPath.includes('/')) {
    return true; // Will be validated at runtime
  }

  // For full paths, check file existence
  try {
    return fs.existsSync(execPath);
  } catch (err) {
    return false;
  }
}

/**
 * Show platform-specific error dialog for missing dependencies
 * @param {string[]} missing - Array of missing dependency names
 * @returns {Promise<boolean>} - False (always quit)
 */
async function showDependencyErrorDialog(missing) {
  if (process.platform === 'darwin') {
    // macOS: Homebrew installation instructions
    const brewCommand = `brew install ${missing.join(' ')}`;

    const result = await dialog.showMessageBox({
      type: 'error',
      title: 'Missing Dependencies',
      message: 'Required tools not found',
      detail: `Video Dashboard requires:\n\n${missing.map(m => `  • ${m}`).join('\n')}\n\n` +
              `Install via Terminal:\n\n  ${brewCommand}\n\n` +
              `(Need Homebrew? Visit https://brew.sh)\n\n` +
              `The app will quit now.`,
      buttons: ['Copy Command', 'Open brew.sh', 'Quit'],
      defaultId: 2,
      cancelId: 2
    });

    if (result.response === 0) {
      clipboard.writeText(brewCommand);
      console.log('Copied install command to clipboard');
    } else if (result.response === 1) {
      shell.openExternal('https://brew.sh');
    }

    return false;
  } else if (process.platform === 'win32') {
    // Windows: Reinstall instructions
    await dialog.showMessageBox({
      type: 'error',
      title: 'Missing Dependencies',
      message: 'Required tools not found',
      detail: `Video Dashboard requires:\n\n${missing.map(m => `  • ${m}.exe`).join('\n')}\n\n` +
              `These should be bundled with the app.\n` +
              `Please try:\n` +
              `  1. Reinstall Video Dashboard\n` +
              `  2. Check if antivirus blocked files\n\n` +
              `The app will quit now.`,
      buttons: ['Quit'],
      defaultId: 0
    });

    return false;
  }

  // Linux: Generic message
  await dialog.showMessageBox({
    type: 'error',
    title: 'Missing Dependencies',
    message: 'Required tools not found',
    detail: `Required tools not found: ${missing.join(', ')}\n\nPlease install them and restart.`,
    buttons: ['Quit'],
    defaultId: 0
  });

  return false;
}

/**
 * Check all required dependencies on startup
 * @returns {Promise<boolean>} - True if all dependencies found, false otherwise
 */
async function checkDependencies() {
  console.log('=== Checking Dependencies ===');
  console.log(`Platform: ${process.platform}, Packaged: ${app.isPackaged}`);

  const required = ['yt-dlp', 'ffmpeg'];
  const missing = [];

  for (const dep of required) {
    const execPath = getExecutablePath(dep);
    const exists = checkExecutable(execPath);
    console.log(`  ${dep}: ${exists ? '✓' : '✗'} (${execPath})`);
    if (!exists) missing.push(dep);
  }

  if (missing.length > 0) {
    console.error(`Missing dependencies: ${missing.join(', ')}`);
    return await showDependencyErrorDialog(missing);
  }

  console.log('✓ All dependencies found');
  return true;
}

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
    const ytdlp = spawn(getExecutablePath('yt-dlp'), ['-g', pageUrl]);
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

// Fetch current weather data for Prague
async function fetchWeatherData() {
  return new Promise((resolve, reject) => {
    // OpenWeatherMap free API - Prague coordinates
    // NOTE: Replace 'YOUR_API_KEY' with actual API key from openweathermap.org
    const API_KEY = process.env.OPENWEATHER_API_KEY || 'YOUR_API_KEY';
    const options = {
      hostname: 'api.openweathermap.org',
      path: `/data/2.5/weather?lat=50.0755&lon=14.4378&units=metric&appid=${API_KEY}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Video-Dashboard/1.0'
      }
    };

    console.log('Fetching weather data for Prague...');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const weather = JSON.parse(data);
            const weatherData = {
              temperature: Math.round(weather.main.temp),
              feelsLike: Math.round(weather.main.feels_like),
              condition: weather.weather[0].main,
              description: weather.weather[0].description,
              icon: weather.weather[0].icon,
              humidity: weather.main.humidity,
              windSpeed: Math.round(weather.wind.speed * 3.6), // Convert m/s to km/h
              timestamp: Date.now()
            };
            console.log('✓ Weather data fetched:', weatherData);
            resolve(weatherData);
          } else {
            console.warn(`Weather API returned status ${res.statusCode}`);
            // Return fallback data
            resolve({
              temperature: null,
              condition: 'Unknown',
              description: 'Weather data unavailable',
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error('Failed to parse weather data:', error.message);
          resolve({
            temperature: null,
            condition: 'Unknown',
            description: 'Weather data unavailable',
            timestamp: Date.now()
          });
        }
      });
    });

    req.on('error', (err) => {
      console.error('Weather fetch error:', err.message);
      // Return fallback data instead of rejecting
      resolve({
        temperature: null,
        condition: 'Unknown',
        description: 'Weather data unavailable',
        timestamp: Date.now()
      });
    });

    req.end();

    setTimeout(() => {
      req.destroy();
      resolve({
        temperature: null,
        condition: 'Unknown',
        description: 'Weather data unavailable',
        timestamp: Date.now()
      });
    }, 10000);
  });
}

// Get video cache directory path (creates if doesn't exist)
function getVideoCacheDir() {
  const userDataPath = app.getPath('userData');
  const cacheDir = path.join(userDataPath, 'video-cache');

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  return cacheDir;
}

// Remove audio from video using ffmpeg
async function removeAudioFromVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log('Removing audio with ffmpeg...');

    const ffmpeg = spawn(getExecutablePath('ffmpeg'), [
      '-i', inputPath,
      '-c:v', 'copy',      // Copy video stream without re-encoding
      '-an',                // Remove all audio streams
      '-y',                 // Overwrite output file
      outputPath
    ]);

    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        // Verify output file
        const stats = fs.statSync(outputPath);
        if (stats.size < 1024 * 1024) {
          reject(new Error(`Processed file too small: ${stats.size} bytes`));
          return;
        }

        console.log(`✓ Audio removed: ${stats.size} bytes`);
        resolve(outputPath);
      } else {
        reject(new Error(`ffmpeg failed with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`Failed to start ffmpeg: ${err.message}`));
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      ffmpeg.kill();
      reject(new Error('Audio removal timeout'));
    }, 120000);
  });
}

// Download Feratel video to local file using yt-dlp
async function downloadFeratelVideo(streamUrl, cookies) {
  const cacheDir = getVideoCacheDir();
  const tempPath = path.join(cacheDir, 'feratel-temp.mp4');
  const tempNoAudioPath = path.join(cacheDir, 'feratel-temp-no-audio.mp4');
  const finalPath = path.join(cacheDir, 'feratel-current.mp4');

  // Build cookie string
  let cookieString = `JSESSIONID=${cookies.JSESSIONID}`;
  if (cookies.dcs) cookieString += `; dcs=${cookies.dcs}`;

  return new Promise((resolve, reject) => {
    const ytdlp = spawn(getExecutablePath('yt-dlp'), [
      streamUrl,
      '-o', tempPath,
      '--add-header', `Cookie:${cookieString}`,
      '--add-header', 'Referer:https://webtvfc.feratel.com/',
      '--user-agent', 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0',
      '--no-part',
      '--force-overwrites'
    ]);

    let stderr = '';

    ytdlp.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('yt-dlp:', data.toString().trim());
    });

    ytdlp.on('close', async (code) => {
      if (code === 0) {
        // Verify file size (> 1MB for valid video)
        const stats = fs.statSync(tempPath);
        if (stats.size < 1024 * 1024) {
          reject(new Error(`Downloaded file too small: ${stats.size} bytes`));
          return;
        }

        console.log(`✓ Feratel video downloaded: ${stats.size} bytes`);

        try {
          // Remove audio from downloaded video
          await removeAudioFromVideo(tempPath, tempNoAudioPath);

          // Clean up original temp file with audio
          fs.unlinkSync(tempPath);

          // Atomic rename to final path
          fs.renameSync(tempNoAudioPath, finalPath);

          const finalStats = fs.statSync(finalPath);
          console.log(`✓ Final video ready: ${finalStats.size} bytes (no audio)`);
          resolve(finalPath);
        } catch (error) {
          // Clean up temp files on error
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          if (fs.existsSync(tempNoAudioPath)) fs.unlinkSync(tempNoAudioPath);
          reject(error);
        }
      } else {
        reject(new Error(`yt-dlp failed with code ${code}: ${stderr}`));
      }
    });

    setTimeout(() => {
      ytdlp.kill();
      reject(new Error('Download timeout'));
    }, 300000); // 5 minute timeout
  });
}

// Check if video file exists and is valid
function getFeratelVideoPath() {
  const cacheDir = getVideoCacheDir();
  const videoPath = path.join(cacheDir, 'feratel-current.mp4');

  if (!fs.existsSync(videoPath)) return null;

  // Verify file is valid (> 1MB)
  const stats = fs.statSync(videoPath);
  if (stats.size < 1024 * 1024) {
    console.warn('Feratel video file too small, treating as invalid');
    return null;
  }

  return videoPath;
}

// Cleanup old temp files on startup
function cleanupFeratelCache() {
  const cacheDir = getVideoCacheDir();
  const tempPath = path.join(cacheDir, 'feratel-temp.mp4');
  const tempNoAudioPath = path.join(cacheDir, 'feratel-temp-no-audio.mp4');

  let cleaned = 0;
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
    cleaned++;
  }
  if (fs.existsSync(tempNoAudioPath)) {
    fs.unlinkSync(tempNoAudioPath);
    cleaned++;
  }

  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} old temp file(s)`);
  }
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
    localVideoPath: null,  // Path to downloaded video file
    lastDownload: null,    // Timestamp of last download
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

    const ytdlp = spawn(getExecutablePath('yt-dlp'), [
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

// Refresh all dynamic URLs (YouTube only) in parallel
async function refreshAllYouTubeUrls(mainWindow) {
  const refreshPromises = Object.entries(VIDEO_CONFIG)
    .filter(([id, config]) => config.isYoutube)
    .map(async ([videoId, config]) => {
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

// Refresh Feratel video - download to local file
async function refreshFeratelVideo(mainWindow) {
  const videoId = 'video-1';
  const config = VIDEO_CONFIG[videoId];

  try {
    console.log(`[${new Date().toISOString()}] Starting Feratel video download...`);

    // Fetch cookies and stream URL
    feratelCookies = await fetchFeratelCookies();
    feratelStreamUrl = await fetchFeratelStreamUrl(config.feratelUrl);

    console.log(`Feratel stream URL: ${feratelStreamUrl}`);

    // Fetch weather data in parallel with video download
    const [videoPath, weatherData] = await Promise.all([
      downloadFeratelVideo(feratelStreamUrl, feratelCookies),
      fetchWeatherData()
    ]);

    // Update config
    config.localVideoPath = videoPath;
    config.lastDownload = Date.now();
    config.weatherData = weatherData; // Store weather data in config

    // Notify renderer to update video source and weather
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('feratel-video-ready', {
        videoId,
        path: videoPath,
        timestamp: config.lastDownload,
        weather: weatherData
      });
    }

    console.log(`✓ Feratel video refresh complete`);
    return { success: true, path: videoPath, weather: weatherData };
  } catch (error) {
    console.error(`✗ Feratel video refresh failed:`, error.message);
    return { success: false, error: error.message };
  }
}

let mainWindow = null;
let refreshTimer = null;
let mpvProcesses = {}; // Store MPV subprocess instances
let feratelCookies = {}; // Store both JSESSIONID and dcs
let feratelStreamUrl = null;

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
    } else if (config.isFeratel) {
      // Return local file path instead of proxy URL
      urlMap[id] = {
        url: config.localVideoPath,
        isYoutube: false,
        isFeratel: true,
        useMPV: false
      };
    } else {
      urlMap[id] = {
        url: config.staticUrl,
        isYoutube: false,
        useMPV: false
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
  // Check dependencies FIRST before doing anything
  const depsOk = await checkDependencies();
  if (!depsOk) {
    app.quit();
    return;
  }

  // Cleanup old temp files
  cleanupFeratelCache();

  // Create window first
  createWindow();

  // Wait for renderer to be ready
  mainWindow.webContents.once('did-finish-load', async () => {
    console.log('Renderer loaded, starting initial refresh...');

    // Check if Feratel video already exists
    const existingVideo = getFeratelVideoPath();
    if (existingVideo) {
      console.log('Existing Feratel video found:', existingVideo);
      VIDEO_CONFIG['video-1'].localVideoPath = existingVideo;
    }

    // Start parallel refresh for YouTube and Feratel
    await Promise.all([
      refreshAllYouTubeUrls(mainWindow),
      refreshFeratelVideo(mainWindow)
    ]);
  });

  // Periodic refresh timer for YouTube (5 hours)
  const YOUTUBE_REFRESH_INTERVAL = 5 * 60 * 60 * 1000;
  setInterval(async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Periodic YouTube refresh triggered`);
    try {
      await refreshAllYouTubeUrls(mainWindow);
    } catch (error) {
      console.error('Periodic YouTube refresh failed:', error);
    }
  }, YOUTUBE_REFRESH_INTERVAL);

  // Periodic refresh timer for Feratel (10 minutes)
  const FERATEL_REFRESH_INTERVAL = 10 * 60 * 1000;
  setInterval(async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Periodic Feratel refresh triggered`);
    try {
      await refreshFeratelVideo(mainWindow);
    } catch (error) {
      console.error('Periodic Feratel refresh failed:', error);
    }
  }, FERATEL_REFRESH_INTERVAL);

  console.log(`YouTube refresh: every ${YOUTUBE_REFRESH_INTERVAL / 1000 / 60 / 60} hours`);
  console.log(`Feratel refresh: every ${FERATEL_REFRESH_INTERVAL / 1000 / 60} minutes`);

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
