const cors = require('cors');

// CORS configuration for development
const corsOptions = {
  origin: function (origin, callback) {
    // בfrontend development או production
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      // הוסף כאן את domain של production
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    // אפשר requests ללא origin (Postman, mobile apps וכו')
    if (!origin) return callback(null, true);
    
    // In development, allow any localhost port for flexibility
    if (process.env.NODE_ENV === 'development' && origin) {
      const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
      if (localhostRegex.test(origin)) {
        console.log(`✅ CORS allowed dev origin: ${origin}`);
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS allowed origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // אפשר cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
};

module.exports = cors(corsOptions);
