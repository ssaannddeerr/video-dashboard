const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process
// to use limited Electron APIs if needed in the future
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: platform info for future use
  platform: process.platform
});
