const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const fs = require('fs');
const path = require('path');

// Read package.json to get version
const packageJson = require('./package.json');
const appVersion = packageJson.version;

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Check if icon files exist
const iconPath = './assets/icons/logo';
const hasIcoIcon = fs.existsSync(path.resolve(__dirname, iconPath + '.ico'));

// Config object
const config = {
  packagerConfig: {
    asar: true,
    asarUnpack: [
      "**/node_modules/electron-updater/**",
      "**/node_modules/builder-util-runtime/**",
      "**/node_modules/electron-log/**"
    ],
    ignore: [
      // Development files
      "^\\/\\.vscode",
      "^\\/\\.git",
      "^\\/\\.github",
      "^\\/out",
      "^\\/\\.env",
      "^\\/\\.github\\-token\\-helper\\.ps1$",
      "^\\/\\.publish\\-with\\-token\\.ps1$",
      
      // Node modules optimization
      "^\\/node_modules\\/\\.bin",
      "^\\/node_modules\\/electron($|\\/$)",
      "^\\/node_modules\\/electron-builder($|\\/$)",
      "^\\/node_modules\\/\\.cache",
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
      
      // Source maps and types
      "\\.map$",
      "\\.d\\.ts$",
      "\\.test\\.js$",
      "\\.spec\\.js$",
      "\\.log$"
    ],
    prune: true, // Enable pruning in production
    overwrite: true,
    derefSymlinks: true,
    appVersion: appVersion,
    executableName: 'DoThat',
    appCopyright: `Copyright © ${new Date().getFullYear()} ThatQne`,
    icon: './assets/icons/logo',
    osxSign: {
      identity: 'Developer ID Application: ThatQne',
      'hardened-runtime': true,
      'entitlements-inherit': 'entitlements.plist',
      'signature-flags': 'library'
    },
    shortcutName: 'DoThat'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'DoThat',
        description: 'A beautiful app to plan and organize your exams and tasks',
        noMsi: true,
        setupExe: 'DoThat-Setup.exe',
        remoteReleases: 'https://github.com/ThatQne/dothat',
        setupIcon: './assets/icons/logo.ico',
        loadingGif: './assets/installer-loading.gif',
        allowElevation: true,
        compressionLevel: 9
      }
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'ThatQne',
          name: 'dothat'
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
              js: './src/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/preload.js'
              },
              htmlWebpackPlugin: {
                publicPath: './'
              }
            }
          ]
        },
        port: 3000,
        devContentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss: localhost:*",
        mode: isDevelopment ? 'development' : 'production',
        logging: isDevelopment ? 'verbose' : 'info',
        nodeIntegration: false,
        devServer: {
          hot: true,
          liveReload: false,
          compress: false,
          static: false,
          client: {
            overlay: {
              errors: true,
              warnings: false
            },
            progress: true
          },
          devMiddleware: {
            publicPath: '/main_window',
            writeToDisk: true
          }
        },
        watchOptions: {
          ignored: /node_modules/
        }
      }
    },
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
if (hasIcoIcon) {
  config.packagerConfig.icon = iconPath;
  config.makers[0].config.setupIcon = iconPath + '.ico';
}

module.exports = config;
