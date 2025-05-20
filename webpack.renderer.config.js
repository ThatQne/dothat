const HtmlWebpackPlugin = require('html-webpack-plugin');
const rules = require('./webpack.rules');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

// Get the package.json version for consistency
const packageJson = require('./package.json');
const appVersion = packageJson.version;

// Determine if in development or production mode
const isDevelopment = process.env.NODE_ENV !== 'production';

rules.push({
  test: /\.css$/,
  use: [
    { loader: 'style-loader' }, 
    { loader: 'css-loader', options: { 
      modules: false, 
      importLoaders: 1
    }}
  ],
});

module.exports = {
  // Put your normal webpack config below 
  output: {
    path: path.resolve(__dirname, '.webpack/renderer'),
    publicPath: '../',
  },
  module: {
    rules,
  },
  mode: isDevelopment ? 'development' : 'production',
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'main_window/index.html',
      inject: 'body',
      publicPath: '../'
    }),
    new webpack.DefinePlugin({
      'APP_VERSION': JSON.stringify(appVersion || '1.0.0'),
      'process.env.NODE_ENV': JSON.stringify(isDevelopment ? 'development' : 'production')
    })
  ],
  optimization: isDevelopment ? {
    // Minimal optimization for development
    minimize: false
  } : {
    // Production optimization
    minimize: true,
    sideEffects: true,
    usedExports: true,
    moduleIds: 'deterministic',
    mangleExports: 'deterministic',
    splitChunks: {
      chunks: 'all',
      minSize: 30000,
      maxSize: 244000, // Smaller chunks for faster builds
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: 2020,
          compress: {
            passes: 2,
            drop_console: false, // Keep console logs for debugging
            drop_debugger: true,
          },
          output: {
            comments: false,
          },
          mangle: true,
        },
        extractComments: false,
        parallel: true,
      }),
    ],
  },
  performance: {
    hints: false, // Disable performance hints for faster builds
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  // External modules that should not be bundled
  externals: {
    'electron': 'commonjs electron'
  },
  // Use source-map for better debugging
  devtool: isDevelopment ? 'source-map' : 'source-map',
  // Reduce output size
  stats: isDevelopment ? 'normal' : 'errors-only'
};
