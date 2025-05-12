const webpack = require('webpack');

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
  module: {
    rules: require('./webpack.rules'),
  },
  plugins: [
    new webpack.DefinePlugin({
      'APP_VERSION': JSON.stringify(appVersion || '1.0.0')
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
  // Reduce bundle size by marking these as external
  externals: [
    'electron',
    'electron-updater',
    'electron-log',
    'fs',
    'path',
    'url',
    'child_process',
    'os',
    'crypto',
    'events',
    'stream',
    'util',
    'http',
    'https',
    'net',
    'tls',
    'zlib'
  ],
  // Speed up builds by limiting asset size warnings
  performance: isDevelopment ? false : {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  // Better devtool for development
  devtool: isDevelopment ? (forceHmr ? 'eval' : 'eval-source-map') : false,
  // Reduce output size
  stats: isDevelopment ? 'errors-warnings' : 'errors-only',
  // Add cache for faster rebuilds in development
  cache: isDevelopment ? {
    type: 'memory',
    maxGenerations: Infinity,
  } : false,
  // Improve development performance
  watchOptions: {
    aggregateTimeout: 100,
    poll: 1000,
    ignored: /node_modules/,
  },
  // Increase build performance
  snapshot: {
    managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
    immutablePaths: [],
    buildDependencies: {
      timestamp: true,
    },
  }
};
