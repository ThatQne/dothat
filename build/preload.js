// This is a simplified preload script for production builds
const { contextBridge, ipcRenderer } = require('electron');

console.log('Production preload script executing...');

// Get app version from package.json
let appVersion = 'Unknown';
try {
  const path = require('path');
  const fs = require('fs');
  const packagePath = path.join(process.resourcesPath, 'app.asar', 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    appVersion = packageJson.version;
  } else {
    console.log('Cannot find package.json');
  }
} catch (error) {
  console.error('Error getting app version:', error);
}

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

console.log('Production preload script completed. App version:', appVersion); 