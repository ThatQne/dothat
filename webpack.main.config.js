const webpack = require('webpack');
const path = require('path');

// Get the package.json version
const packageJson = require('./package.json');
const appVersion = packageJson.version;

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';
// Force HMR if environment variable is set
const forceHmr = process.env.FORCE_HMR === 'true';

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.js',
  // Put your normal webpack config below here
  output: {
    path: path.resolve(__dirname, '.webpack/main'),
    filename: 'index.js'
  },
  module: {
    rules: require('./webpack.rules'),
  },
  plugins: [
    new webpack.DefinePlugin({
      'APP_VERSION': JSON.stringify(appVersion || '1.0.0'),
      'process.env.NODE_ENV': JSON.stringify(isDevelopment ? 'development' : 'production')
    })
  ],
  mode: isDevelopment ? 'development' : 'production',
  optimization: isDevelopment ? {
    // Minimal optimization for development
    minimize: false,
    removeAvailableModules: false,
    removeEmptyChunks: false,
  } : {
    // Full optimization for production
    minimize: true,
    sideEffects: true,
    usedExports: true,
    moduleIds: 'deterministic',
    mangleExports: 'deterministic'
  },
  // Externals - modules to not bundle
  externals: [
    {
      'electron': 'commonjs electron',
      'electron-updater': 'commonjs electron-updater',
      'electron-log': 'commonjs electron-log',
      'fs': 'commonjs fs',
      'path': 'commonjs path',
      'url': 'commonjs url',
      'child_process': 'commonjs child_process',
      'os': 'commonjs os',
      'crypto': 'commonjs crypto',
      'events': 'commonjs events',
      'stream': 'commonjs stream',
      'util': 'commonjs util',
      'http': 'commonjs http',
      'https': 'commonjs https',
      'net': 'commonjs net',
      'tls': 'commonjs tls',
      'zlib': 'commonjs zlib'
    }
  ],
  // Speed up builds by limiting asset size warnings
  performance: isDevelopment ? false : {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  // Better devtool for development
  devtool: isDevelopment ? (forceHmr ? 'eval' : 'eval-source-map') : 'source-map',
  // Reduce output size
  stats: isDevelopment ? 'errors-warnings' : 'errors-only',
  // Add cache for faster rebuilds in development
  cache: isDevelopment ? {
    type: 'memory',
    maxGenerations: Infinity,
  } : false,
  target: 'electron-main'
};
