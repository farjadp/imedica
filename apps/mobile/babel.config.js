// ============================================================================
// File: apps/mobile/babel.config.js
// Why: Removed NativeWind jsxImportSource to fix EAS cloud build.
//      NativeWind will be added back after first successful build.
// ============================================================================

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [],
  };
};
