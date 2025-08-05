# TaskFlow Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Anthropic Claude API key (optional)

### Installation Steps

1. **Clone and Install**
   ```bash
   git clone https://github.com/atiaron/TaskFlow.git
   cd TaskFlow
   npm install
   ```

2. **Install Dependencies for Each Part**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

3. **Environment Setup**
   
   **Backend (.env):**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your Anthropic API key
   ```
   
   **Frontend (.env):**
   ```bash
   cd frontend
   cp .env.example .env
   # Usually no changes needed for development
   ```

4. **Start Development**
   ```bash
   # From root directory
   npm run dev
   ```
   
   **Or start individually:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm start
   ```

## 🔧 Troubleshooting

### Common Issues

#### 1. npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. React scripts compilation error
```bash
# Try with different Node version
nvm use 16
# or
nvm use 18
```

#### 3. Firebase authentication issues
- Ensure your domain is added to Firebase Auth authorized domains
- Check Firebase configuration in `frontend/src/services/firebase.ts`

#### 4. Missing Claude API key
- The app will work with mock AI responses if no API key is provided
- Get your key from: https://console.anthropic.com/

### Development Mode URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Backend Health Check: http://localhost:3001/health

## 📱 Features Overview

### ✅ Implemented Features
- Google OAuth Authentication
- Real-time Task Management
- AI Chat Assistant
- Calendar View
- Priority System (High/Medium/Low)
- Tags and Categories
- Due Date Management
- Responsive Mobile Design
- Dark/Light Theme
- Real-time Synchronization

### 🔄 Task Operations
- ✅ Create tasks
- ✅ Edit tasks
- ✅ Delete tasks
- ✅ Mark as complete
- ✅ Set priorities
- ✅ Add due dates
- ✅ Add tags
- ✅ Real-time updates

### 🤖 AI Features
- ✅ Task management assistance
- ✅ Productivity tips
- ✅ Smart suggestions
- ✅ Context-aware responses
- ✅ Fallback mock responses

## 🏗️ Architecture

### Frontend Structure
```
frontend/src/
├── components/          # React components
│   ├── LoginScreen.tsx     # Authentication
│   ├── MainApp.tsx         # Main wrapper
│   ├── TaskList.tsx        # Task management
│   ├── ChatInterface.tsx   # AI chat
│   ├── CalendarView.tsx    # Calendar
│   ├── MainNavigation.tsx  # Navigation
│   └── TaskForm.tsx        # Task creation/editing
├── contexts/            # React contexts
│   └── AuthContext.tsx     # Authentication state
├── services/            # Business logic
│   ├── AuthService.ts      # Firebase auth
│   ├── FirebaseService.ts  # Firestore operations
│   └── AdvancedAIService.ts # AI integration
└── types/               # TypeScript definitions
    └── index.ts
```

### Backend Structure
```
backend/src/
├── routes/              # API endpoints
│   └── chat.ts             # AI chat routes
├── services/            # Business logic
│   └── ClaudeService.ts    # Claude AI integration
├── middleware/          # Express middleware
│   └── errorHandler.ts     # Error handling
└── index.ts             # Server entry point
```

## 🚀 Deployment

### Frontend (Netlify/Vercel)
```bash
cd frontend
npm run build
# Deploy the build/ folder
```

### Backend (Heroku/Railway)
```bash
cd backend
npm run build
# Deploy with start command: npm start
```

### Environment Variables for Production
```bash
# Backend
NODE_ENV=production
PORT=3001
ANTHROPIC_API_KEY=your_key_here
FRONTEND_URL=https://your-frontend-domain.com

# Frontend
REACT_APP_API_URL=https://your-backend-domain.com
```

## 📧 Support

If you encounter any issues:
1. Check this setup guide
2. Review the troubleshooting section
3. Open an issue on GitHub
4. Contact the development team

Happy task managing! 🎯