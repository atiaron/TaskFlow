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
  },

  // 🚦 Dev Server Configuration - Proxy & CSP
  devServer: {
    // Proxy כל קריאה ל-/api אל הbackend המקומי
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug'
      }
    },
    
    // Headers - CSP רופף רק בdev
    headers: process.env.NODE_ENV === 'development' ? {
      'Content-Security-Policy': [
        "default-src 'self' http://localhost:3333 http://127.0.0.1:3333",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3333 https://accounts.google.com https://www.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' http://localhost:3333 http://127.0.0.1:3333 ws://localhost:3000 wss://localhost:3000 https://accounts.google.com https://www.google.com",
        "frame-ancestors 'none'",
        "base-uri 'self'"
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    } : {},
    
    // אפשרויות נוספות לdev
    hot: true,
    open: false, // לא לפתוח browser אוטומטית
    compress: true,
    historyApiFallback: true
  }
};
