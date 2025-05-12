const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const fs = require('fs');
const path = require('path');

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';
// Force HMR if environment variable is set
const forceHmr = process.env.FORCE_HMR === 'true';

// Check if icon files exist
const iconPath = './assets/icons/logo';
const hasIcoIcon = fs.existsSync(path.resolve(__dirname, iconPath + '.ico'));
const hasPngIcon = fs.existsSync(path.resolve(__dirname, iconPath + '.png'));
const hasIcnsIcon = fs.existsSync(path.resolve(__dirname, iconPath + '.icns'));

// Config object
const config = {
  packagerConfig: {
    // AutoUnpackNatives plugin requires asar to be true
    asar: true,
    asarUnpack: [
      "**/node_modules/electron-updater/**",
      "**/node_modules/builder-util-runtime/**",
      "**/node_modules/electron-log/**"
    ],
    // Enhanced ignore patterns to reduce package size
    ignore: [
      "^\\/\\.vscode",
      "^\\/node_modules\\/\\.bin",
      "^\\/node_modules\\/electron($|\\/$)",
      "^\\/node_modules\\/electron-builder($|\\/$)",
      "^\\/node_modules\\/\\.cache",
      "^\\/\\.git($|\\/$)",
      "\\.map$",
      "^/\\.github($|/)",
      "^\\/out($|\\/$)",
      // Additional patterns to reduce size
      "^/\\.env($|/)",
      "^/\\.github\\-token\\-helper\\.ps1$",
      "^/\\.publish\\-with\\-token\\.ps1$",
      "node_modules/\\@babel($|/)",
      "node_modules/\\.bin($|/)",
      "node_modules/\\.cache($|/)",
      "node_modules/.*\\.d\\.ts$",
      "node_modules/.*\\.map$",
      "node_modules/.*/test($|/)",
      "node_modules/.*/tests($|/)",
      "node_modules/.*/docs($|/)",
      "node_modules/.*/examples($|/)",
      "node_modules/.*\\.md$",
      "node_modules/.*LICENSE.*",
      "\\.log$",
      "\\.d\\.ts$",
      "\\.test\\.js$",
      "\\.spec\\.js$"
    ],
    // Better compression for asar
    extraResource: [],
    // Control pruning of dev dependencies
    prune: false, // Disable pruning completely for faster development
    // Overwrite existing files
    overwrite: true,
    // Reduce package size
    derefSymlinks: true,
    // Set the app name
    appVersion: '1.0.2',
    // Specify executable name
    executableName: 'DoThat',
    // Set app metadata
    appCopyright: `Copyright © ${new Date().getFullYear()} ThatQne`,
    // Set app icon
    icon: './assets/icons/logo',
    // OSX specific options
    osxSign: {
      identity: 'Developer ID Application: ThatQne',
      'hardened-runtime': true,
      'entitlements-inherit': 'entitlements.plist',
      'signature-flags': 'library'
    },
    shortcutName: 'DoThat'
  },
  rebuildConfig: {},
  // Only include Windows makers to reduce build time and size
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'DoThat',
        description: 'A beautiful app to plan and organize your exams and tasks',
        // Enable compression
        noMsi: true, // Don't create MSI to reduce output files
        // Add installation options
        setupExe: 'DoThat-Setup.exe',
        remoteReleases: 'https://github.com/ThatQne/todo',
        setupIcon: './assets/icons/logo.ico',
        loadingGif: './assets/installer-loading.gif',
        // Support loading electron-updater from asar
        // Add parameters for execution
        allowElevation: true,
        // Better compression algorithm
        compressionLevel: 9
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
      config: {
        // Only build for windows to reduce time
        // Improve compression
        options: {
          compression: 'maximum'
        }
      }
    }
  ],
  // Add GitHub publisher configuration
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'ThatQne',
          name: 'todo'
        },
        prerelease: false,
        draft: false
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/preload.js'
              }
            }
          ]
        },
        // Updated CSP to allow unsafe-eval for HMR
        devContentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss: localhost:*",
        // Use development mode in dev, production in prod
        mode: isDevelopment ? 'development' : 'production',
        // Enable faster development experience
        devServer: {
          hot: true,
          liveReload: false, // Disable live reload in favor of HMR
          compress: false, // Disable compression in dev for speed
          static: false, // Disable static file serving to improve rebuild times
          client: {
            overlay: {
              errors: true,
              warnings: false
            },
            progress: true
          },
          devMiddleware: {
            writeToDisk: true, // Write to disk to ensure preload script is accessible
          }
        },
        // Don't watch node_modules for faster recompilation
        watchOptions: {
          ignored: /node_modules/
        }
      }
    },
    // Only include FusesPlugin in production mode
    ...(isDevelopment ? [] : [
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true
    })
    ])
  ]
};

// Add icon to packager config if it exists
if (hasIcoIcon || hasPngIcon || hasIcnsIcon) {
  config.packagerConfig.icon = iconPath;
}

// Add icons to maker configs if they exist
if (hasIcoIcon) {
  if (!config.makers[0].config) config.makers[0].config = {};
  config.makers[0].config.setupIcon = iconPath + '.ico';
}

module.exports = config;
