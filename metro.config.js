const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Bundle Whisper GGML model files as assets so `require('...bin')` works
// on both iOS and Android without platform-specific xcodeproj surgery.
config.resolver.assetExts = [...(config.resolver.assetExts ?? []), 'bin'];

module.exports = withNativeWind(config, { input: './global.css' });
