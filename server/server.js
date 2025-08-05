const express = require('express');
const cors = require('cors');
const claudeRouter = require('./routes/claude');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Routes
app.use('/api/claude', claudeRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    availableRoutes: [
      'GET /health',
      'POST /api/claude'
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
app.listen(PORT, () => {
  console.log('🚀 TaskFlow Backend Server Started!');
  console.log('📍 URL:', `http://localhost:${PORT}`);
  console.log('🕐 Time:', new Date().toLocaleString('he-IL'));
  console.log('🔑 Claude API:', process.env.CLAUDE_API_KEY ? '✅ Configured' : '❌ Missing');
  console.log('⚡ Function Calling: ✅ Enabled');
  console.log('🔥 Firebase: ✅ Ready');
  console.log('---');
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