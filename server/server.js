// Load environment variables FIRST
const path = require('path');

// Load .env file first
require('dotenv').config();

// Normalize NODE_ENV
const NODE_ENV = (process.env.NODE_ENV || '').trim().toLowerCase();

// Then load environment-specific file
if (NODE_ENV === 'development') {
  const devEnvPath = path.join(__dirname, '.env.development');
  console.log('🔧 Loading dev env from:', devEnvPath);
  require('dotenv').config({ path: devEnvPath, override: true });
} else if (NODE_ENV === 'production') {
  const prodEnvPath = path.join(__dirname, '.env.production');
  console.log('🏭 Loading prod env from:', prodEnvPath);
  require('dotenv').config({ path: prodEnvPath, override: true });
}

// Debug: Check what PORT is loaded
console.log('🔧 Debug: NODE_ENV =', NODE_ENV);
console.log('🔧 Debug: PORT =', process.env.PORT);

const express = require('express');
const applyTrustProxy = require('./config/trustProxy');
const { authLimiter } = require('./middleware/authRateLimit');
const corsMiddleware = require('./middleware/cors'); // NEW: Use our CORS config
const claudeRouter = require('./routes/claude');
const chatRouter = require('./routes/chat');
const authRouter = require('./routes/auth');

// NEW: Initialize Firebase Admin AFTER env is loaded
try {
  require('./firebaseAdmin');
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.warn('⚠️ Firebase Admin initialization failed:', error.message);
}

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.BIND_HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

// Trust proxy based on env (only when behind a real proxy)
applyTrustProxy(app);

// Middleware - NEW CORS
app.use(corsMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// NEW: Add cookie parser (for future HttpOnly cookies if needed)
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString('he-IL');
  console.log(`📡 ${timestamp} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Request body keys:', Object.keys(req.body));
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toLocaleString('he-IL'),
    service: 'TaskFlow Backend',
    version: '2.0.0',
    features: {
      claudeAPI: !!process.env.CLAUDE_API_KEY,
      functionCalling: true,
      firebase: true
    }
  });
});

// Health check API endpoint (with /api prefix)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toLocaleString('he-IL'),
    service: 'TaskFlow Backend',
    version: '2.0.0',
    env: process.env.NODE_ENV,
    features: {
      claudeAPI: !!process.env.CLAUDE_API_KEY,
      functionCalling: true,
      firebase: true
    }
  });
});

// Routes
app.use('/api/claude', claudeRouter);
app.use('/api/chat', chatRouter);

// Apply rate limit only to sensitive auth endpoints
app.use('/api/auth/exchange', authLimiter);
app.use('/api/auth/refresh', authLimiter);
// If password login exists, enable as needed:
// app.use('/api/auth/login', authLimiter);

app.use('/api/auth', authRouter);

// Protected ping endpoint for testing
app.get('/api/ping', authRouter.requireAuthBridge, (req, res) => {
  res.json({ 
    message: 'Pong! Auth successful',
    user: req.user?.email || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    availableRoutes: [
      'GET /health',
      'POST /api/claude',
      'POST /api/chat/send'
    ]
  });
});

// Error Handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 TaskFlow Backend Started`);
  console.log(`📍 Listen: http://${HOST}:${PORT}`);
  console.log(`🔐 trust proxy = ${app.get('trust proxy')}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.log('💡 Try: netstat -ano | findstr :3333');
    console.log('💡 Or change PORT in .env.development');
  } else {
    console.error(`❌ Server startup error:`, err.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});