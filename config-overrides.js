// cspell:disable
const path = require('path');

module.exports = function override(config, env) {
  config.resolve.symlinks = false;
  config.resolve.cacheWithContext = false;
  
  config.cache = {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
    buildDependencies: {
      config: [__filename]
    },
    maxMemoryGenerations: 1
  };

  config.devtool = false;
  
  if (env === 'development') {
    config.optimization = {
      ...config.optimization,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
      usedExports: false,
      sideEffects: false
    };
    
    config.watchOptions = {
      ignored: '**/node_modules/**',
      aggregateTimeout: 100,
      poll: false
    };

    config.plugins = config.plugins.filter(plugin => {
      const name = plugin.constructor.name;
      return !(
        name === 'ForkTsCheckerWebpackPlugin' ||
        name === 'ESLintWebpackPlugin' ||
        name === 'ModuleScopePlugin'
      );
    });
  }
  
  return config;
};
