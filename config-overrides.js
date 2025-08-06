// cspell:disable
const path = require('path');

module.exports = function override(config, env) {
  // ✅ 1. השבת source maps בproduction (חוסך 60% זמן!)
  if (env === 'production') {
    config.devtool = false;
  }

  // ✅ 2. Cache אגרסיבי
  config.cache = {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    },
    cacheDirectory: path.resolve(__dirname, '.webpack-cache')
  };

  // ✅ 3. Parallel processing
  config.parallelism = require('os').cpus().length;

  // ✅ 4. מינימיזציה מקבילית
  if (env === 'production') {
    config.optimization = {
      ...config.optimization,
      minimize: true,
      minimizer: [
        ...config.optimization.minimizer,
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      }
    };
  }

  // ✅ 5. Resolve optimization
  config.resolve = {
    ...config.resolve,
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react': path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom')
    },
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ],
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  };

  return config;
};
