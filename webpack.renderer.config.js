const rules = require('./webpack.rules');
const TerserPlugin = require('terser-webpack-plugin');

rules.push({
  test: /\.css$/,
  use: [
    { loader: 'style-loader' }, 
    { loader: 'css-loader', options: { 
      // Dont use minimize: true
      modules: false, 
      importLoaders: 1
    }}
  ],
});

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  mode: 'production',
  optimization: {
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
            drop_console: true,
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
  // Add these externals to reduce bundle size
  externals: {
    'electron': 'electron'
  },
  // Use source-map for production
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  // Reduce output size
  stats: 'errors-only'
};
