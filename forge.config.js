const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    icon: 'icons/icon.png',
    asar: true,
    osxSign: {
      hardenedRuntime: true,
      gatekeeperAssess: false,
      entitlements: 'entitlements.plist',
      'entitlements-inherit': 'entitlements.plist',
      verbose: true,
    },
    osxNotarize: {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: 'icons/icon.ico'
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        icon: 'icons/icon.ico'
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: 'icons/icon.png'
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'kinode-dao',
          name: 'kinode-desktop'
        },
        prerelease: true,
        generateReleaseNotes: true
      }
    }
  ]
};
