const { contextBridge, ipcRenderer } = require('electron');

// Get version from webpack-injected global variable or from IPC
const appVersion = typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'Unknown';

// Add debugging information
console.log('Preload script executing...');
console.log('App version from preload:', appVersion);

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Auto-update functions
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  onUpdateProgress: (callback) => ipcRenderer.on('update-download-progress', callback),
  
  // Platform information
  platform: process.platform,
  
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  appVersion: appVersion,
  
  // Debugging
  isPreloadWorking: true
});

// Log when preload is complete
console.log('Preload script completed');
