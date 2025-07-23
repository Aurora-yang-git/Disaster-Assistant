const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude .gguf files from being bundled
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'gguf'
);

module.exports = config;