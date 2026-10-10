// ============================================================================
// File: apps/mobile/metro.config.js
// Why: Configures Metro bundler to resolve pnpm workspace symlinks AND
//      works in EAS cloud builds where workspace links may not be available.
// ============================================================================

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the monorepo root so Metro sees workspace packages
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from both the project AND the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Map @imedica/shared to its source directly (works in EAS cloud builds too)
config.resolver.extraNodeModules = {
  '@imedica/shared': path.resolve(monorepoRoot, 'packages/shared/src'),
};

// 4. Enable NativeWind (Tailwind for React Native)
module.exports = withNativeWind(config, { input: './global.css' });
