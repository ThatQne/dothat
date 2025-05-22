const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('node:path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { globalShortcut } = require('electron');
const remoteMain = require('@electron/remote/main');

// Initialize @electron/remote
remoteMain.initialize();

// Configure logging
log.transports.file.level = 'debug'; // Increase logging level to debug
log.transports.console.level = 'debug'; // Also log to console
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/main.log');
log.info('Application starting...');

// Handle Windows installer events - this enables the custom install experience
if (process.platform === 'win32') {
  // Handle creating/removing shortcuts on Windows when installing/uninstalling
  const handleSquirrelEvent = () => {
    if (process.argv.length === 1) {
      return false;
    }

    const ChildProcess = require('child_process');
    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = (command, args) => {
      let spawnedProcess;

      try {
        spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
      } catch (error) {
        log.error(`Failed to spawn process: ${error}`);
      }

      return spawnedProcess;
    };

    const spawnUpdate = args => {
      return spawn(updateDotExe, args);
    };

    const squirrelEvent = process.argv[1];
    log.info(`Processing squirrel event: ${squirrelEvent}`);
    
    switch (squirrelEvent) {
      case '--squirrel-install':
      case '--squirrel-updated':
        // Create shortcuts when the app is installed or updated
        // This is the key part for shortcut prompts
        log.info('Creating desktop and start menu shortcuts');
        
        // Always create start menu shortcuts
        spawnUpdate(['--createShortcut', exeName, '--shortcut-locations=StartMenu']);
        
        // Prompt for desktop shortcut and auto-start options
        setTimeout(() => {
          // Force dialog to appear by showing it from the executable
          const dialogOptions = {
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'DoThat Installation',
            message: 'Would you like to add a desktop shortcut for DoThat?',
            checkboxLabel: 'Start DoThat when I log in to Windows',
            checkboxChecked: false,
            icon: path.join(appFolder, 'resources', 'assets', 'icons', 'logo.png')
          };
          
          try {
            // Use sync version to ensure it shows up during installation
            const response = dialog.showMessageBoxSync(null, dialogOptions);
            
            if (response === 0) { // Yes button for desktop shortcut
              log.info('Creating desktop shortcut');
              spawnUpdate(['--createShortcut', exeName, '--shortcut-locations=Desktop']);
            }
            
            // Check if auto-start was selected
            const checkboxChecked = dialogOptions.checkboxChecked;
            if (checkboxChecked) {
              log.info('Creating startup shortcut for auto-start');
              spawnUpdate(['--createShortcut', exeName, '--shortcut-locations=Startup']);
            }
          } catch (error) {
            log.error('Error showing installation dialog:', error);
            // Create desktop shortcut by default if dialog fails
            spawnUpdate(['--createShortcut', exeName, '--shortcut-locations=Desktop']);
          }
          
          app.quit();
        }, 1000);
        
        return true;

      case '--squirrel-uninstall':
        // Remove shortcuts
        log.info('Removing shortcuts for uninstall');
        spawnUpdate(['--removeShortcut', exeName]);
        
        // Show goodbye message
        setTimeout(() => {
          dialog.showMessageBox({
            type: 'info',
            buttons: ['OK'],
            title: 'Uninstalling DoThat',
            message: 'DoThat has been uninstalled successfully. We\'re sorry to see you go!'
          }).then(() => {
            app.quit();
          });
        }, 1000);
        return true;

      case '--squirrel-obsolete':
        // This is called on the outgoing version of the app before 
        // the updated version starts replacing it. Quit immediately.
        app.quit();
        return true;
    }
    
    return false;
  };

  // Check if we need to handle a Squirrel.Windows event
  if (handleSquirrelEvent()) {
    // If we handled a squirrel event, quit the app immediately
    app.quit();
  }
}

// Default electron-squirrel-startup handler (redundant with above, but kept for compatibility)
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Global reference to mainWindow to prevent garbage collection
let mainWindow = null;

const createWindow = () => {
  log.info('Creating main window...');
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#181818', // Match your dark theme background
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: true, // Enable remote module
      // Add security options
      worldSafeExecuteJavaScript: true,
      sandbox: true,
      // Set CSP in webPreferences
      webSecurity: true
    },
    icon: path.join(__dirname, '../assets/icons/logo.png'),
    show: false, // Don't show until ready-to-show
    autoHideMenuBar: true, // Hide the menu bar
    frame: true, // Keep the frame for dragging and minimizing
    title: 'DoThat - Exam Planner' // Set window title
  });

  // Enable remote module for this window
  remoteMain.enable(mainWindow.webContents);

  // Register keyboard shortcuts

  // Zoom in (Ctrl + Plus)
  globalShortcut.register('CommandOrControl+=', () => {
    const currentZoom = mainWindow.webContents.getZoomFactor();
    mainWindow.webContents.setZoomFactor(currentZoom + 0.1);
  });

  // Zoom out (Ctrl + Minus)
  globalShortcut.register('CommandOrControl+-', () => {
    const currentZoom = mainWindow.webContents.getZoomFactor();
    mainWindow.webContents.setZoomFactor(Math.max(0.5, currentZoom - 0.1));
  });

  // Reset zoom (Ctrl + 0)
  globalShortcut.register('CommandOrControl+0', () => {
    mainWindow.webContents.setZoomFactor(1.0);
  });

  // Maximize/Restore (Ctrl + M)
  globalShortcut.register('CommandOrControl+M', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  // Handle window zoom
  mainWindow.webContents.on('zoom-changed', (event, zoomDirection) => {
    const currentZoom = mainWindow.webContents.getZoomFactor();
    if (zoomDirection === 'in') {
      mainWindow.webContents.setZoomFactor(currentZoom + 0.1);
    } else {
      mainWindow.webContents.setZoomFactor(Math.max(0.5, currentZoom - 0.1));
    }
  });

  // Handle maximize/restore
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-unmaximized');
  });

  // Debug window state
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    log.error(`Window failed to load: ${code} - ${desc}`);
  });

  // Set proper CSP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    // More permissive CSP for development mode, stricter for production
    const cspHeader = process.env.NODE_ENV === 'development'
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss: localhost:*;"
      : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;";
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspHeader]
      }
    });
  });

  // Try to load splash screen, but continue if it fails
  let splash = null;
  try {
    const splashFile = path.join(__dirname, '../assets/splash.html');
    const fs = require('fs');
    
    if (fs.existsSync(splashFile)) {
      splash = new BrowserWindow({
        width: 500,
        height: 300,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        icon: path.join(__dirname, '../assets/icons/logo.png')
      });
      
      splash.loadFile(splashFile);
      splash.center();
    }
  } catch (error) {
    log.warn('Failed to create splash screen:', error);
  }

  // Dynamic URL for loading the index.html
  const isDev = process.env.NODE_ENV === 'development';
  const mainWindowURL = isDev
    ? 'http://localhost:3000/main_window'
    : (typeof MAIN_WINDOW_WEBPACK_ENTRY !== 'undefined' ? MAIN_WINDOW_WEBPACK_ENTRY : undefined);

  // Load the index.html of the app
  log.info('Loading app URL...');
  mainWindow.loadURL(mainWindowURL).catch(error => {
    log.error('Failed to load app URL:', error);
  });

  // When the main window is ready, show it and close splash if it exists
  mainWindow.once('ready-to-show', () => {
    log.info('Window ready to show');
    if (splash) {
      splash.destroy();
    }
    mainWindow.show();
    log.info('Window shown');
    
    // Check for updates after app is visible (if in production)
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        try {
          log.info('Checking for updates...');
          autoUpdater.checkForUpdatesAndNotify();
        } catch (error) {
          log.error('Error checking for updates:', error);
        }
      }, 3000); // Wait 3 seconds to check for updates
    }
  });

  // Open the DevTools in development mode only
  if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
  }
};

// Auto-updater events (with error handling)
try {
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    
    // Only show dialog if window exists
    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: 'A new version is available. It will be downloaded in the background.',
        buttons: ['OK']
      });
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('No updates available:', info);
  });

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    log.info(logMessage);
    
    // Optionally send to renderer
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-download-progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    
    // Prompt user to install update
    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'A new version has been downloaded. Restart the application to apply the updates.',
        buttons: ['Restart', 'Later']
      }).then(result => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    }
  });
} catch (error) {
  log.error('Failed to set up auto-updater:', error);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  log.info('App ready, creating window...');
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle update check from renderer process (with error handling)
ipcMain.handle('check-for-updates', async () => {
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    try {
      await autoUpdater.checkForUpdatesAndNotify();
      return { checkingForUpdates: true };
    } catch (error) {
      log.error('Error checking for updates:', error);
      return { checkingForUpdates: false, error: error.message };
    }
  }
  return { checkingForUpdates: false };
});

// Add a new IPC handler for getting the app version
ipcMain.handle('get-app-version', () => {
  // Use the webpack-injected version if available, otherwise use the app's version
  return typeof APP_VERSION !== 'undefined' ? APP_VERSION : app.getVersion();
});

  // In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Dynamic preload path for dev/prod
const isDev = process.env.NODE_ENV === 'development';
const preloadPath = isDev
  ? path.join(__dirname, 'preload.js')
  : (typeof MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY !== 'undefined' ? MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY : undefined);
