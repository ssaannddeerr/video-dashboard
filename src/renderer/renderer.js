// Store HLS and DASH instances globally for URL updates
const hlsInstances = {};
const dashInstances = {};

// Store both low and high quality URLs for YouTube videos
const videoQualityUrls = {};

// DASH Video Initialization Function
function initializeDASHVideo(videoElement, streamUrl) {
  if (typeof dashjs !== 'undefined') {
    const player = dashjs.MediaPlayer().create();

    // Configure player settings with optimized buffers
    player.updateSettings({
      streaming: {
        lowLatencyEnabled: true,
        delay: {
          liveDelay: 3
        },
        buffer: {
          bufferTimeAtTopQuality: 10,      // Reduce buffer
          bufferTimeAtTopQualityLongForm: 20,
          bufferToKeep: 10,                 // Keep less back-buffer
          stableBufferTime: 6               // Start playback sooner
        }
      }
    });

    // Set up event listeners before initialization
    player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
      console.log('DASH stream initialized');
      videoElement.play().catch(err => {
        console.error('Autoplay prevented:', err);
      });
    });

    player.on(dashjs.MediaPlayer.events.ERROR, (e) => {
      console.error('DASH error:', e);
    });

    // Initialize with autoplay
    player.initialize(videoElement, streamUrl, true);

    return player;
  } else {
    console.error('DASH is not supported - dashjs library not loaded');
    return null;
  }
}

// HLS Video Initialization Function
function initializeHLSVideo(videoElement, streamUrl) {
  if (Hls.isSupported()) {
    const hls = new Hls({
      autoStartLoad: true,
      startPosition: -1,
      debug: false,
      enableWorker: true,
      lowLatencyMode: true,
      // Optimized buffer settings for reduced memory usage
      maxBufferLength: 10,        // Reduce from 30s to 10s
      maxMaxBufferLength: 20,     // Max buffer cap
      maxBufferSize: 10 * 1024 * 1024,  // 10MB max buffer
      maxBufferHole: 0.5          // Smaller gap tolerance
    });

    hls.loadSource(streamUrl);
    hls.attachMedia(videoElement);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      // Debug: Log available quality levels
      console.log(`HLS levels available: ${hls.levels.length}`, hls.levels.map(l => ({
        height: l.height,
        width: l.width,
        bitrate: l.bitrate,
        name: l.name
      })));

      // Set to low quality (360p-ish) for grid view
      setLowQuality(hls);

      videoElement.play().catch(err => {
        console.error('Autoplay prevented:', err);
        // Add visual indicator that user interaction is needed
      });
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error('Network error, trying to recover...');
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error('Media error, trying to recover...');
            hls.recoverMediaError();
            break;
          default:
            console.error('Fatal error, cannot recover:', data);
            hls.destroy();
            break;
        }
      }
    });

    return hls;
  } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS support (Safari)
    videoElement.src = streamUrl;
    videoElement.addEventListener('loadedmetadata', () => {
      videoElement.play().catch(err => {
        console.error('Autoplay prevented:', err);
      });
    });
    return null;
  } else {
    console.error('HLS is not supported in this browser');
    return null;
  }
}

// Set HLS to low quality (~360p)
function setLowQuality(hls) {
  if (!hls || !hls.levels || hls.levels.length === 0) {
    console.log('Cannot set quality - no levels available');
    return;
  }

  // Use lowest quality level (index 0 is usually lowest)
  hls.currentLevel = 0;

  const level = hls.levels[0];
  const info = level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)}kbps`;
  console.log(`Set quality to LOW: level 0 (${info})`);
}

// Set HLS to max quality
function setMaxQuality(hls) {
  if (!hls || !hls.levels || hls.levels.length === 0) {
    console.log('Cannot set quality - no levels available');
    return;
  }

  // Set to highest quality (last level is usually highest)
  const maxLevel = hls.levels.length - 1;
  hls.currentLevel = maxLevel;

  const level = hls.levels[maxLevel];
  const info = level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)}kbps`;
  console.log(`Set quality to MAX: level ${maxLevel} (${info})`);
}

// Update video source with new URL (for periodic refresh)
function updateVideoSource(videoId, newUrl) {
  const videoElement = document.getElementById(videoId);

  if (!videoElement) {
    console.warn(`Cannot update ${videoId}: missing element`);
    return;
  }

  if (!newUrl) {
    console.warn(`Cannot update ${videoId}: no URL provided`);
    return;
  }

  // Detect stream type
  const isDash = newUrl.includes('.mpd');
  const isMp4 = newUrl.includes('.mp4');
  const isLocalFile = newUrl && (newUrl.startsWith('/') || newUrl.includes('video-cache'));

  if (isMp4 || isLocalFile) {
    // Handle native MP4 playback (for local files and Feratel)
    console.log(`${videoId}: Using native MP4 playback`);

    // Clean up any existing HLS/DASH instances
    if (hlsInstances[videoId]) {
      hlsInstances[videoId].destroy();
      delete hlsInstances[videoId];
    }
    if (dashInstances[videoId]) {
      dashInstances[videoId].destroy();
      delete dashInstances[videoId];
    }

    // For local files, use file:// protocol
    const videoSrc = isLocalFile ? `file://${newUrl}` : newUrl;

    // Remove any existing ended listeners to avoid duplicates
    const oldEndedHandler = videoElement._loopHandler;
    if (oldEndedHandler) {
      videoElement.removeEventListener('ended', oldEndedHandler);
    }

    // Add manual loop handler for reliable looping (especially for local files)
    const loopHandler = () => {
      console.log(`${videoId}: Video ended, restarting loop...`);
      videoElement.currentTime = 0;
      videoElement.play().catch(err => {
        console.error(`${videoId}: Failed to restart loop:`, err);
      });
    };
    videoElement._loopHandler = loopHandler;
    videoElement.addEventListener('ended', loopHandler);

    // Use native video element
    videoElement.src = videoSrc;
    videoElement.load();
    videoElement.play().catch(err => {
      console.error(`${videoId}: Autoplay prevented:`, err);
    });
  } else if (isDash) {
    // Handle DASH stream
    const dashInstance = dashInstances[videoId];

    // Always clean up old instance before creating new one
    if (dashInstance) {
      console.log(`Destroying old DASH instance for ${videoId}`);
      dashInstance.destroy();
      delete dashInstances[videoId];
    }

    console.log(`Creating new DASH instance for ${videoId}`);
    dashInstances[videoId] = initializeDASHVideo(videoElement, newUrl);
  } else {
    // Handle HLS stream
    const hlsInstance = hlsInstances[videoId];

    if (!hlsInstance) {
      console.log(`Creating initial HLS instance for ${videoId}`);
      hlsInstances[videoId] = initializeHLSVideo(videoElement, newUrl);
      return;
    }

    // Check if URL actually changed
    const currentUrl = hlsInstance.url;
    if (currentUrl === newUrl) {
      console.log(`${videoId}: URL unchanged, skipping update`);
      return;
    }

    console.log(`Updating ${videoId} with new URL`);
    hlsInstance.loadSource(newUrl);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Video Dashboard initialized');

  // ===== TOKEN UPDATE BUTTON HANDLER - REGISTER FIRST! =====
  console.log('Registering token update button handlers...');
  const buttons = document.querySelectorAll('.token-update-btn');
  console.log(`Found ${buttons.length} token update buttons`);

  const modal = document.getElementById('token-modal');
  const tokenInput = document.getElementById('token-input');
  const submitBtn = document.getElementById('token-submit');
  const cancelBtn = document.getElementById('token-cancel');
  const sourceUrlElement = document.getElementById('token-source-url');
  let currentVideoId = null;

  // URL patterns for different video sources
  const urlPatterns = {
    'video-3': (token) => `https://livecdn-de-earthtv-com.global.ssl.fastly.net/edge0/cdnedge/HpL-X8UABqM/playlist.m3u8?token=${token}&domain=www.earthtv.com`,
    'video-6': (token) => `https://hd-auth.skylinewebcams.com/live.m3u8?a=${token}&vid=6`
  };

  // Source webpage URLs where users can get new tokens
  const sourceUrls = {
    'video-3': 'https://www.earthtv.com/en/webcam/prague-charles-bridge',
    'video-6': 'https://www.skylinewebcams.com/en/webcam/czech-republic/prague/prague/prague.html'
  };

  // Function to show modal
  function showTokenModal(videoId) {
    currentVideoId = videoId;
    tokenInput.value = '';

    // Set the source URL link
    const sourceUrl = sourceUrls[videoId];
    if (sourceUrl) {
      sourceUrlElement.href = sourceUrl;
      sourceUrlElement.textContent = sourceUrl;
    }

    modal.style.display = 'flex';
    tokenInput.focus();
  }

  // Function to hide modal
  function hideTokenModal() {
    modal.style.display = 'none';
    currentVideoId = null;
  }

  // Function to update token
  function updateToken() {
    const newToken = tokenInput.value.trim();

    console.log('User entered token:', newToken ? 'yes' : 'empty');

    if (!newToken || newToken === '') {
      console.log('Token update cancelled - empty input');
      hideTokenModal();
      return;
    }

    // Get the appropriate URL pattern for this video
    const urlPattern = urlPatterns[currentVideoId];
    if (!urlPattern) {
      console.error(`No URL pattern defined for ${currentVideoId}`);
      hideTokenModal();
      return;
    }

    const newUrl = urlPattern(newToken);
    console.log(`Updating ${currentVideoId} with URL:`, newUrl);

    // Force update even if no existing instance
    const videoElement = document.getElementById(currentVideoId);
    if (videoElement) {
      // Destroy existing instance if present
      if (hlsInstances[currentVideoId]) {
        hlsInstances[currentVideoId].destroy();
        delete hlsInstances[currentVideoId];
      }

      // Create new instance
      const newInstance = initializeHLSVideo(videoElement, newUrl);
      if (newInstance) {
        hlsInstances[currentVideoId] = newInstance;
        console.log(`✓ ${currentVideoId} updated successfully`);
      }
    }

    // Store in localStorage
    localStorage.setItem(`${currentVideoId}-token`, newToken);
    console.log('Token saved to localStorage');

    hideTokenModal();
  }

  // Register button click handlers
  buttons.forEach((btn, index) => {
    console.log(`Registering handler for button ${index}:`, btn.dataset.video);

    btn.addEventListener('click', (e) => {
      console.log('🔑 KEY BUTTON CLICKED!', e);
      e.preventDefault();
      e.stopPropagation();

      const videoId = btn.dataset.video;
      console.log('Video ID:', videoId);
      showTokenModal(videoId);
    });

    console.log(`✓ Handler registered for button ${index}`);
  });

  // Register modal button handlers
  submitBtn.addEventListener('click', updateToken);
  cancelBtn.addEventListener('click', hideTokenModal);

  // Allow Enter key to submit
  tokenInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      updateToken();
    }
  });

  // Allow Escape key to cancel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      hideTokenModal();
    }
  });

  console.log('All button handlers registered');
  // ===== END BUTTON HANDLER =====

  // ===== FULLSCREEN TOGGLE FEATURE =====
  const videoGrid = document.querySelector('.video-grid');
  let currentFullscreenContainer = null;

  // Add click handlers to all video containers
  document.querySelectorAll('.video-container').forEach(container => {
    container.addEventListener('click', (e) => {
      // Don't trigger fullscreen if clicking the token button
      if (e.target.closest('.token-update-btn')) {
        return;
      }

      // Toggle fullscreen
      if (currentFullscreenContainer === container) {
        // Exit fullscreen
        container.classList.remove('fullscreen');
        videoGrid.classList.remove('has-fullscreen');

        // Mute the video and switch to low quality when exiting fullscreen
        const video = container.querySelector('video');
        if (video) {
          video.muted = true;

          // Switch to low quality URL for grid view
          const videoId = video.id;
          if (videoQualityUrls[videoId] && videoQualityUrls[videoId].lowQualityUrl) {
            updateVideoSource(videoId, videoQualityUrls[videoId].lowQualityUrl);
          }
        }

        currentFullscreenContainer = null;
        console.log('Exited fullscreen');
      } else {
        // Enter fullscreen
        if (currentFullscreenContainer) {
          currentFullscreenContainer.classList.remove('fullscreen');

          // Mute the previous fullscreen video and switch to low quality
          const prevVideo = currentFullscreenContainer.querySelector('video');
          if (prevVideo) {
            prevVideo.muted = true;

            const prevVideoId = prevVideo.id;
            if (videoQualityUrls[prevVideoId] && videoQualityUrls[prevVideoId].lowQualityUrl) {
              updateVideoSource(prevVideoId, videoQualityUrls[prevVideoId].lowQualityUrl);
            }
          }
        }

        container.classList.add('fullscreen');
        videoGrid.classList.add('has-fullscreen');

        // Unmute the video and switch to high quality when entering fullscreen
        const video = container.querySelector('video');
        if (video) {
          // Keep video-5 muted even in fullscreen
          if (video.id !== 'video-5') {
            video.muted = false;
          }

          // Switch to high quality URL for fullscreen view
          const videoId = video.id;
          if (videoQualityUrls[videoId] && videoQualityUrls[videoId].highQualityUrl) {
            updateVideoSource(videoId, videoQualityUrls[videoId].highQualityUrl);
          }
        }

        currentFullscreenContainer = container;
        console.log('Entered fullscreen');
      }
    });
  });

  // ESC key to exit fullscreen
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentFullscreenContainer) {
      currentFullscreenContainer.classList.remove('fullscreen');
      videoGrid.classList.remove('has-fullscreen');

      // Mute the video and switch to low quality when exiting fullscreen
      const video = currentFullscreenContainer.querySelector('video');
      if (video) {
        video.muted = true;

        // Switch to low quality URL for grid view
        const videoId = video.id;
        if (videoQualityUrls[videoId] && videoQualityUrls[videoId].lowQualityUrl) {
          updateVideoSource(videoId, videoQualityUrls[videoId].lowQualityUrl);
        }
      }

      currentFullscreenContainer = null;
      console.log('Exited fullscreen (ESC)');
    }
  });

  console.log('Fullscreen toggle feature enabled');
  // ===== END FULLSCREEN FEATURE =====

  // Set up URL refresh listener FIRST (before requesting initial URLs)
  window.electronAPI.onUrlsRefreshed(async (results) => {
    console.log('Received URL refresh notification:', results.length, 'URLs');
    for (const { videoId, lowQualityUrl, highQualityUrl, success } of results) {
      if (success && lowQualityUrl) {
        // YouTube stream (dual quality URLs)
        videoQualityUrls[videoId] = {
          lowQualityUrl,
          highQualityUrl
        };

        // Update to low quality (we're in grid view by default)
        updateVideoSource(videoId, lowQualityUrl);
        console.log(`${videoId}: refreshed with dual quality URLs`);
      } else {
        console.log(`${videoId}: refresh failed, keeping existing URLs`);
      }
    }
  });

  // Set up Feratel video update listener
  window.electronAPI.onFeratelVideoReady((data) => {
    console.log('Feratel video ready:', data);
    const { videoId, path, timestamp } = data;

    const videoElement = document.getElementById(videoId);
    if (!videoElement) {
      console.warn(`Video element ${videoId} not found`);
      return;
    }

    console.log(`${videoId}: Updating to new video with timestamp ${timestamp}`);

    // Add timestamp to force browser to reload (bypasses cache)
    // Since we overwrite feratel-current.mp4, the path stays the same but content changes
    const pathWithTimestamp = `${path}?t=${timestamp}`;

    // Save current playback state
    const wasPlaying = !videoElement.paused;

    // Switch to new video immediately
    updateVideoSource(videoId, pathWithTimestamp);

    // Resume playback if it was playing before
    if (wasPlaying) {
      videoElement.play().catch(err => {
        console.error(`${videoId}: Failed to resume playback:`, err);
      });
    }
  });

  try {
    // Request initial URLs from main process
    console.log('Requesting initial URLs...');
    const urlMap = await window.electronAPI.requestInitialUrls();

    // Initialize all videos with received URLs
    console.log('Received URL map:', urlMap);
    for (const [videoId, urlData] of Object.entries(urlMap)) {
      const videoElement = document.getElementById(videoId);

      if (urlData.useMPV) {
        // Feratel stream via proxy - use regular video element
        if (urlData.url) {
          console.log(`✓ ${videoId} using proxy URL`);
          if (videoElement) {
            updateVideoSource(videoId, urlData.url);
          }
        } else {
          console.log(`✗ ${videoId} skipped - no URL`);
        }
      } else if (urlData.isYoutube) {
        // YouTube video with dual quality
        if (videoElement && urlData.lowQualityUrl) {
          // Store both URLs
          videoQualityUrls[videoId] = {
            lowQualityUrl: urlData.lowQualityUrl,
            highQualityUrl: urlData.highQualityUrl
          };

          // Initialize with low quality for grid view
          updateVideoSource(videoId, urlData.lowQualityUrl);
          console.log(`✓ ${videoId} initialized with low quality`);
        } else {
          console.log(`✗ ${videoId} skipped - no low quality URL yet`);
        }
      } else {
        // Non-YouTube video (static URL)
        if (videoElement && urlData.url) {
          updateVideoSource(videoId, urlData.url);
          console.log(`✓ ${videoId} initialized successfully`);
        } else {
          console.log(`✗ ${videoId} skipped - no URL`);
        }
      }
    }

    console.log('All video feeds initialized');
  } catch (error) {
    console.error('Failed to initialize video feeds:', error);
  }

  // Add visibility change handler to pause/resume videos when window is hidden
  document.addEventListener('visibilitychange', () => {
    const videos = document.querySelectorAll('video');
    if (document.hidden) {
      videos.forEach(v => v.pause());
    } else {
      videos.forEach(v => {
        v.play().catch(err => console.log('Resume play prevented:', err));
      });
    }
  });

  // Enhanced visibility handling - pause when window loses focus (minimized/background)
  let windowVisible = true;

  window.addEventListener('blur', () => {
    windowVisible = false;
    const videos = document.querySelectorAll('video');
    videos.forEach(v => v.pause());
    console.log('Window lost focus - videos paused');
  });

  window.addEventListener('focus', () => {
    windowVisible = true;
    if (!document.hidden) {
      // Reload page to get fresh live streams (avoids out-of-date video after pause)
      console.log('Window gained focus - reloading page for fresh streams');
      window.location.reload();
    }
  });

  // On load, check for stored tokens and apply them
  console.log('=== CHECKING LOCALSTORAGE FOR SAVED TOKENS ===');
  const tokenApplications = [];

  Object.keys(localStorage).forEach(key => {
    if (key.endsWith('-token')) {
      const videoId = key.replace('-token', '');
      const token = localStorage.getItem(key);
      console.log(`Found saved token: ${videoId} -> ${token}`);

      // Get the appropriate URL pattern for this video
      const urlPattern = urlPatterns[videoId];
      if (!urlPattern) {
        console.warn(`No URL pattern for ${videoId}, skipping stored token`);
        return;
      }

      const url = urlPattern(token);
      console.log(`Generated URL for ${videoId}: ${url}`);

      // Update the video if it exists
      if (document.getElementById(videoId)) {
        tokenApplications.push({ videoId, url });
      } else {
        console.warn(`Element ${videoId} not found in DOM`);
      }
    }
  });

  // Apply tokens with staggered timing to avoid race conditions
  tokenApplications.forEach((app, index) => {
    const delay = 2000 + (index * 500); // Stagger by 500ms each
    console.log(`Scheduling token application for ${app.videoId} in ${delay}ms`);
    setTimeout(() => {
      console.log(`NOW APPLYING stored token for ${app.videoId}`);
      console.log(`  URL: ${app.url}`);
      updateVideoSource(app.videoId, app.url);
    }, delay);
  });

  console.log('=== LOCALSTORAGE CHECK COMPLETE ===');
});
