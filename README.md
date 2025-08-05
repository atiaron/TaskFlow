# TaskFlow

אפליקציית משימות חכמה עם AI מובנה - Progressive Web App עם Claude AI לניהול משימות חכם ומקצועי

## 📋 Overview

TaskFlow is a modern, intelligent task management application that combines the power of React, TypeScript, Firebase, and Claude AI to provide a seamless and smart productivity experience.

## ✨ Features

### Frontend (React + TypeScript)
- **Modern React Application** with TypeScript for type safety
- **Material-UI Components** for beautiful, responsive design
- **Firebase Authentication** with Google sign-in
- **Real-time Task Management** with Firestore synchronization
- **AI Chat Interface** using Claude API for smart assistance
- **Responsive Design** with bottom navigation for mobile-first experience
- **Calendar View** for task scheduling and visualization
- **Priority System** with high, medium, and low priority levels
- **Tags System** for task organization
- **Due Date Management** with smart notifications

### Backend (Express + Node.js)
- **Express Server** with TypeScript
- **CORS Configuration** for secure cross-origin requests
- **Claude AI Integration** for intelligent task assistance
- **Health Check Endpoints** for monitoring
- **Proper Error Handling** with detailed logging
- **Security Middleware** with Helmet.js

### Key Components
1. **LoginScreen.tsx** - Google authentication interface
2. **MainApp.tsx** - Main application wrapper with theme and navigation
3. **TaskList.tsx** - Task display and management with real-time updates
4. **ChatInterface.tsx** - AI chat interface with Claude integration
5. **CalendarView.tsx** - Calendar display for task scheduling
6. **MainNavigation.tsx** - Bottom navigation bar for mobile experience
7. **TaskForm.tsx** - Create/edit task modal with comprehensive form

### Core Services
1. **AuthService.ts** - Firebase authentication management
2. **FirebaseService.ts** - Firestore database operations
3. **AdvancedAIService.ts** - Claude API integration and chat management

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Firestore and Authentication enabled
- Anthropic Claude API key (optional, will use mock responses without it)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/atiaron/TaskFlow.git
   cd TaskFlow
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   **Backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your Anthropic API key
   ```
   
   **Frontend:**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env if needed (API URL is set to localhost:3001 by default)
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both frontend (localhost:3000) and backend (localhost:3001) servers.

### Production Build

```bash
npm run build
npm start
```

## 🔧 Configuration

### Firebase Setup
The application is pre-configured with Firebase project `taskflow-atiaron`. To use your own Firebase project:

1. Create a new Firebase project
2. Enable Firestore and Authentication
3. Add Google as an authentication provider
4. Update the Firebase configuration in `frontend/src/services/firebase.ts`

### Claude AI Setup
1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Add it to `backend/.env` as `ANTHROPIC_API_KEY`
3. The application will work with mock responses if no API key is provided

## 📱 Usage

1. **Sign In**: Use Google authentication to sign in
2. **Create Tasks**: Use the + button to create new tasks with priorities, due dates, and tags
3. **Manage Tasks**: Check off completed tasks, edit existing ones, or delete them
4. **Chat with AI**: Get intelligent assistance for task management and productivity
5. **Calendar View**: Visualize your tasks on a calendar interface
6. **Real-time Sync**: All changes are automatically synchronized across devices

## 🛠 Development

### Project Structure
```
TaskFlow/
├── frontend/                 # React TypeScript frontend
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # Firebase and AI services
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   └── package.json
├── backend/                  # Express TypeScript backend
│   ├── src/
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic services
│   │   └── index.ts         # Server entry point
│   └── package.json
├── package.json             # Root package.json with scripts
└── README.md
```

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm run test` - Run tests for both frontend and backend
- `npm run lint` - Lint both frontend and backend code

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Material-UI (MUI) for components
- Firebase (Auth + Firestore)
- Date-fns for date manipulation
- React Router for navigation

**Backend:**
- Express.js with TypeScript
- Anthropic Claude SDK
- CORS for cross-origin requests
- Helmet.js for security
- Morgan for logging

## 🔒 Security

- Firebase Authentication with Google OAuth
- CORS configuration for secure API access
- Input validation and sanitization
- Error handling without exposing sensitive information
- Helmet.js security headers

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or support, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using React, TypeScript, Firebase, and Claude AI
