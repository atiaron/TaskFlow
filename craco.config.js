module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // ✅ ESBuild במקום TypeScript Compiler (מהיר פי 20!)
      webpackConfig.module.rules.push({
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        include: paths.appSrc,
        use: [
          {
            loader: 'esbuild-loader',
            options: {
              loader: 'tsx',
              target: 'es2015'
            }
          }
        ]
      });

      // ✅ Cache אגרסיבי
      webpackConfig.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename]
        }
      };

      // ✅ השבת checks מיותרים בproduction
      if (env === 'production') {
        webpackConfig.optimization.minimize = true;
        webpackConfig.devtool = false;
        
        // הסר TypeScript type checking מה-build
        webpackConfig.plugins = webpackConfig.plugins.filter(
          plugin => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
        );
      }

      return webpackConfig;
    }
  },
  
  // ✅ TypeScript configuration מהיר
  typescript: {
    enableTypeChecking: false // בדוק טיפוסים בנפרד!
  }
};
