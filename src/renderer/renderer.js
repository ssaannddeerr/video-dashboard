// Store HLS instances globally for URL updates
const hlsInstances = {};

// HLS Video Initialization Function
function initializeHLSVideo(videoElement, streamUrl) {
  if (Hls.isSupported()) {
    const hls = new Hls({
      autoStartLoad: true,
      startPosition: -1,
      debug: false,
      enableWorker: true,
      lowLatencyMode: true,
    });

    hls.loadSource(streamUrl);
    hls.attachMedia(videoElement);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
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

  const hlsInstance = hlsInstances[videoId];

  // If no HLS instance exists yet, create one (initial load case)
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

  // Update source (HLS.js handles the transition)
  hlsInstance.loadSource(newUrl);
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
    'video-1': (token) => `https://hd-auth.skylinewebcams.com/live.m3u8?a=${token}&vid=1`,
    'video-3': (token) => `https://livecdn-de-earthtv-com.global.ssl.fastly.net/edge0/cdnedge/HpL-X8UABqM/playlist.m3u8?token=${token}&domain=www.earthtv.com`,
    'video-6': (token) => `https://hd-auth.skylinewebcams.com/live.m3u8?a=${token}&vid=6`
  };

  // Source webpage URLs where users can get new tokens
  const sourceUrls = {
    'video-1': 'https://www.skylinewebcams.com/en/webcam/czech-republic/prague/prague/old-town.html',
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
        currentFullscreenContainer = null;
        console.log('Exited fullscreen');
      } else {
        // Enter fullscreen
        if (currentFullscreenContainer) {
          currentFullscreenContainer.classList.remove('fullscreen');
        }
        container.classList.add('fullscreen');
        videoGrid.classList.add('has-fullscreen');
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
      currentFullscreenContainer = null;
      console.log('Exited fullscreen (ESC)');
    }
  });

  console.log('Fullscreen toggle feature enabled');
  // ===== END FULLSCREEN FEATURE =====

  // Set up URL refresh listener FIRST (before requesting initial URLs)
  window.electronAPI.onUrlsRefreshed((results) => {
    console.log('Received URL refresh notification:', results.length, 'URLs');
    results.forEach(({ videoId, url, success }) => {
      if (success && url) {
        updateVideoSource(videoId, url);
      } else {
        console.log(`${videoId}: refresh failed, keeping existing URL`);
      }
    });
  });

  try {
    // Request initial URLs from main process
    console.log('Requesting initial URLs...');
    const urlMap = await window.electronAPI.requestInitialUrls();

    // Initialize all videos with received URLs
    console.log('Received URL map:', urlMap);
    Object.entries(urlMap).forEach(([videoId, url]) => {
      const videoElement = document.getElementById(videoId);
      console.log(`Initializing ${videoId}:`, { element: !!videoElement, url });

      if (videoElement && url) {
        const hlsInstance = initializeHLSVideo(videoElement, url);
        if (hlsInstance) {
          hlsInstances[videoId] = hlsInstance;
          console.log(`✓ ${videoId} initialized successfully`);
        } else {
          console.log(`✗ ${videoId} HLS instance creation failed`);
        }
      } else {
        console.log(`✗ ${videoId} skipped - element: ${!!videoElement}, url: ${!!url}`);
      }
    });

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
