const { getDefaultConfig } = require('expo/metro-config');

// Get the default Expo Metro configuration.
const defaultConfig = getDefaultConfig(__dirname);

// Export the config, spreading the defaults. This ensures only supported options are used.
module.exports = {
  ...defaultConfig,
  // If you need to customize resolver or transformer, you can do so here.
  // resolver: {
  //   ...defaultConfig.resolver,
  //   // custom settings
  // },
  // transformer: {
  //   ...defaultConfig.transformer,
  //   // custom settings
  // },
};
