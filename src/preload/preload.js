const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process
// to use limited Electron APIs if needed in the future
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,

  // Request initial URLs from main process
  requestInitialUrls: () => ipcRenderer.invoke('get-initial-urls'),

  // Listen for URL refresh updates from main process
  onUrlsRefreshed: (callback) => {
    ipcRenderer.on('urls-refreshed', (event, results) => callback(results));
  },

  // Remove listener when no longer needed
  removeUrlsRefreshedListener: () => {
    ipcRenderer.removeAllListeners('urls-refreshed');
  },

  // Listen for Feratel video updates
  onFeratelVideoReady: (callback) => {
    ipcRenderer.on('feratel-video-ready', (event, data) => callback(data));
  },

  removeFeratelVideoListener: () => {
    ipcRenderer.removeAllListeners('feratel-video-ready');
  },

  // MPV controls
  startMPV: (videoId, streamUrl, geometry) => ipcRenderer.invoke('start-mpv', videoId, streamUrl, geometry),
  stopMPV: (videoId) => ipcRenderer.invoke('stop-mpv', videoId)
});
