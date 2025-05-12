/**
 * App information constants
 */

// Try to get version from package.json directly as a fallback
let packageVersion = '1.0.0';
try {
  // Use dynamic require to avoid webpack issues
  const packageJson = require('../../package.json');
  packageVersion = packageJson.version;
} catch (error) {
  console.error('Failed to load package.json:', error);
}

// Get version from webpack-injected global variable, fallback to hardcoded version if not available
export const APP_VERSION = typeof APP_VERSION !== 'undefined' ? APP_VERSION : packageVersion;
export const APP_NAME = 'DoThat';
export const APP_AUTHOR = 'ThatQne'; 