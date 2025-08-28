@echo off
echo ========================================
echo    TaskFlow v2.0 Complete Setup
echo    Date: 2025-08-05 13:56:30 UTC
echo    User: atiaron
echo ========================================
echo.

:: Set paths and variables
set TASKFLOW_DIR=C:\Users\moshiach\Desktop\TaskFlow
set BACKUP_DIR=%TASKFLOW_DIR%\backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%

echo 🔄 Step 1: Backup existing files...
if exist "%TASKFLOW_DIR%" (
    echo Creating backup...
    mkdir "%BACKUP_DIR%" 2>nul
    xcopy "%TASKFLOW_DIR%\*" "%BACKUP_DIR%\" /E /I /Y >nul 2>&1
    echo ✅ Backup created at: %BACKUP_DIR%
) else (
    echo Creating new TaskFlow directory...
    mkdir "%TASKFLOW_DIR%"
)

cd /d "%TASKFLOW_DIR%"
echo Current directory: %CD%

echo.
echo 🗂️ Step 2: Creating directory structure...
mkdir src\components 2>nul
mkdir src\services 2>nul
mkdir src\config 2>nul
mkdir src\types 2>nul
mkdir public 2>nul
mkdir server\routes 2>nul
echo ✅ Directory structure created

echo.
echo 📦 Step 3: Creating package.json...
(
echo {
echo   "name": "taskflow",
echo   "version": "2.0.0",
echo   "description": "TaskFlow - AI Personal Task Manager with Firebase",
echo   "private": true,
echo   "dependencies": {
echo     "@emotion/react": "^11.11.1",
echo     "@emotion/styled": "^11.11.0",
echo     "@mui/icons-material": "^5.14.3",
echo     "@mui/material": "^5.14.5",
echo     "@testing-library/jest-dom": "^5.17.0",
echo     "@testing-library/react": "^13.4.0",
echo     "@testing-library/user-event": "^13.5.0",
echo     "@types/jest": "^27.5.2",
echo     "@types/node": "^16.18.39",
echo     "@types/react": "^18.2.17",
echo     "@types/react-dom": "^18.2.7",
echo     "firebase": "^10.1.0",
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "react-firebase-hooks": "^5.1.1",
echo     "react-scripts": "5.0.1",
echo     "typescript": "^4.9.5",
echo     "web-vitals": "^2.1.4"
echo   },
echo   "scripts": {
echo     "start": "react-scripts start",
echo     "build": "react-scripts build",
echo     "test": "react-scripts test",
echo     "eject": "react-scripts eject",
echo     "server": "cd server && npm run dev",
echo     "dev": "concurrently \"npm run server\" \"npm start\"",
echo     "install-all": "npm install && cd server && npm install"
echo   },
echo   "eslintConfig": {
echo     "extends": [
echo       "react-app",
echo       "react-app/jest"
echo     ]
echo   },
echo   "browserslist": {
echo     "production": [
echo       ">0.2%",
echo       "not dead",
echo       "not op_mini all"
echo     ],
echo     "development": [
echo       "last 1 chrome version",
echo       "last 1 firefox version",
echo       "last 1 safari version"
echo     ]
echo   },
echo   "homepage": ".",
echo   "proxy": "http://localhost:4000",
echo   "devDependencies": {
echo     "concurrently": "^8.2.0"
echo   }
echo }
) > package.json

echo.
echo 📦 Step 4: Creating server package.json...
cd server
(
echo {
echo   "name": "taskflow-backend",
echo   "version": "2.0.0",
echo   "description": "TaskFlow AI Backend with Function Calling",
echo   "main": "server.js",
echo   "scripts": {
echo     "start": "node server.js",
echo     "dev": "nodemon server.js",
echo     "test": "echo \"No tests yet\" && exit 0"
echo   },
echo   "keywords": ["ai", "tasks", "claude", "firebase", "productivity"],
echo   "author": "atiaron",
echo   "license": "MIT",
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "cors": "^2.8.5",
echo     "dotenv": "^16.3.1",
echo     "node-fetch": "^2.7.0"
echo   },
echo   "devDependencies": {
echo     "nodemon": "^3.0.1"
echo   },
echo   "engines": {
echo     "node": ">=16.0.0"
echo   }
echo }
) > package.json

cd ..

echo.
echo 🔧 Step 5: Creating environment files...
(
echo # Firebase Configuration - REPLACE WITH YOUR ACTUAL VALUES
echo REACT_APP_FIREBASE_API_KEY=your-firebase-api-key-here
echo REACT_APP_FIREBASE_AUTH_DOMAIN=taskflow-atiaron.firebaseapp.com
echo REACT_APP_FIREBASE_PROJECT_ID=taskflow-atiaron
echo REACT_APP_FIREBASE_STORAGE_BUCKET=taskflow-atiaron.appspot.com
echo REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
echo REACT_APP_FIREBASE_APP_ID=your-app-id-here
echo.
echo # Backend API
echo REACT_APP_API_URL=http://localhost:4000
echo REACT_APP_ENVIRONMENT=development
echo REACT_APP_VERSION=2.0.0
) > .env.development

(
echo # Claude API Key - REPLACE WITH YOUR ACTUAL KEY
echo CLAUDE_API_KEY=your-claude-api-key-here
echo.
echo # Server Configuration
echo PORT=4000
echo NODE_ENV=development
echo.
echo # CORS
echo FRONTEND_URL=http://localhost:3000
echo CORS_ORIGIN=http://localhost:3000
echo.
echo # Features
echo ENABLE_FUNCTION_CALLING=true
echo ENABLE_LOGGING=true
) > server\.env

echo.
echo 📝 Step 6: Creating TypeScript types...
(
echo export interface User {
echo   id: string;
echo   name: string;
echo   email: string;
echo   picture?: string;
echo   settings: {
echo     theme: 'light' ^| 'dark';
echo     notifications: boolean;
echo     language: string;
echo   };
echo   googleAccessToken?: string;
echo }
echo.
echo export interface Task {
echo   id?: string;
echo   title: string;
echo   description?: string;
echo   completed: boolean;
echo   priority?: 'low' ^| 'medium' ^| 'high';
echo   dueDate?: Date ^| null;
echo   tags?: string[];
echo   estimatedTime?: number;
echo   createdAt: Date;
echo   updatedAt: Date;
echo   userId?: string;
echo }
echo.
echo export interface ChatMessage {
echo   id: string;
echo   content: string;
echo   sender: 'user' ^| 'ai';
echo   timestamp: Date;
echo   type: 'text' ^| 'action';
echo }
echo.
echo export interface ChatSession {
echo   id: string;
echo   title: string;
echo   messages: ChatMessage[];
echo   createdAt: Date;
echo   updatedAt: Date;
echo   isActive: boolean;
echo   userId?: string;
echo }
echo.
echo export interface AIContext {
echo   currentTasks: Task[];
echo   recentChats: ChatMessage[];
echo   userPreferences: any;
echo   currentTime: Date;
echo   userName?: string;
echo   userId?: string;
echo }
echo.
echo export interface AIAction {
echo   action: 'create_task' ^| 'update_task' ^| 'delete_task' ^| 'schedule_reminder';
echo   payload: any;
echo }
echo.
echo export interface AIResponse {
echo   type: 'text_response' ^| 'action_success' ^| 'action_error';
echo   text?: string;
echo   data?: any;
echo   actions?: AIAction[];
echo }
) > src\types.ts

echo.
echo 🔥 Step 7: Creating Firebase configuration...
(
echo import { initializeApp } from 'firebase/app';
echo import { getFirestore } from 'firebase/firestore';
echo import { getAuth } from 'firebase/auth';
echo.
echo // Firebase configuration - update with your actual values
echo const firebaseConfig = {
echo   apiKey: process.env.REACT_APP_FIREBASE_API_KEY ^|^| "demo-key",
echo   authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ^|^| "taskflow-atiaron.firebaseapp.com",
echo   projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ^|^| "taskflow-atiaron",
echo   storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ^|^| "taskflow-atiaron.appspot.com",
echo   messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ^|^| "123456789",
echo   appId: process.env.REACT_APP_FIREBASE_APP_ID ^|^| "demo-app-id"
echo };
echo.
echo console.log('🔥 Firebase initializing for environment:', process.env.REACT_APP_ENVIRONMENT^);
echo console.log('📍 Project ID:', firebaseConfig.projectId^);
echo.
echo // Initialize Firebase
echo const app = initializeApp(firebaseConfig^);
echo.
echo // Initialize services
echo export const db = getFirestore(app^);
echo export const auth = getAuth(app^);
echo.
echo console.log('✅ Firebase initialized successfully'^);
echo.
echo export default app;
) > src\config\firebase.ts

echo.
echo 🛠️ Step 8: Creating FirebaseService...
(
echo import {
echo   collection,
echo   addDoc,
echo   updateDoc,
echo   deleteDoc,
echo   doc,
echo   getDocs,
echo   query,
echo   where,
echo   orderBy,
echo   onSnapshot,
echo   serverTimestamp
echo } from 'firebase/firestore';
echo import { db } from '../config/firebase';
echo import { Task, ChatMessage } from '../types';
echo.
echo export class FirebaseService {
echo.
echo   static async addTask(userId: string, task: Omit^<Task, 'id'^>^): Promise^<string^> {
echo     try {
echo       console.log('🔥 Adding task to Firestore:', task^);
echo.
echo       const taskData = {
echo         ...task,
echo         userId,
echo         createdAt: serverTimestamp(^),
echo         updatedAt: serverTimestamp(^)
echo       };
echo.
echo       const docRef = await addDoc(collection(db, 'tasks'^), taskData^);
echo       console.log('✅ Task added with ID:', docRef.id^);
echo.
echo       return docRef.id;
echo     } catch (error^) {
echo       console.error('❌ Error adding task:', error^);
echo       throw error;
echo     }
echo   }
echo.
echo   static async updateTask(userId: string, taskId: string, updates: Partial^<Task^>^): Promise^<void^> {
echo     try {
echo       const taskRef = doc(db, 'tasks', taskId^);
echo.
echo       await updateDoc(taskRef, {
echo         ...updates,
echo         updatedAt: serverTimestamp(^)
echo       }^);
echo.
echo       console.log('✅ Task updated:', taskId^);
echo     } catch (error^) {
echo       console.error('❌ Error updating task:', error^);
echo       throw error;
echo     }
echo   }
echo.
echo   static async deleteTask(userId: string, taskId: string^): Promise^<void^> {
echo     try {
echo       await deleteDoc(doc(db, 'tasks', taskId^)^);
echo       console.log('✅ Task deleted:', taskId^);
echo     } catch (error^) {
echo       console.error('❌ Error deleting task:', error^);
echo       throw error;
echo     }
echo   }
echo.
echo   static subscribeToUserTasks(
echo     userId: string, 
echo     callback: (tasks: Task[]^) =^> void
echo   ^): (^) =^> void {
echo     console.log('👂 Setting up real-time tasks listener for user:', userId^);
echo.
echo     const q = query(
echo       collection(db, 'tasks'^),
echo       where('userId', '==', userId^),
echo       orderBy('createdAt', 'desc'^)
echo     ^);
echo.
echo     const unsubscribe = onSnapshot(q, (querySnapshot^) =^> {
echo       const tasks: Task[] = [];
echo.
echo       querySnapshot.forEach((doc^) =^> {
echo         const data = doc.data(^);
echo         tasks.push({
echo           id: doc.id,
echo           title: data.title,
echo           description: data.description,
echo           completed: data.completed,
echo           priority: data.priority,
echo           dueDate: data.dueDate?.toDate?.() ^|^| data.dueDate,
echo           tags: data.tags ^|^| [],
echo           estimatedTime: data.estimatedTime,
echo           createdAt: data.createdAt?.toDate?.() ^|^| new Date(),
echo           updatedAt: data.updatedAt?.toDate?.() ^|^| new Date()
echo         }^);
echo       }^);
echo.
echo       console.log('🔄 Tasks updated:', tasks.length^);
echo       callback(tasks^);
echo     }, (error^) =^> {
echo       console.error('❌ Error in tasks listener:', error^);
echo     }^);
echo.
echo     return unsubscribe;
echo   }
echo.
echo   static async saveChatMessage(userId: string, message: ChatMessage^): Promise^<void^> {
echo     try {
echo       await addDoc(collection(db, 'chat_messages'^), {
echo         ...message,
echo         userId,
echo         timestamp: serverTimestamp(^)
echo       }^);
echo     } catch (error^) {
echo       console.error('❌ Error saving chat message:', error^);
echo       throw error;
echo     }
echo   }
echo.
echo   static async getChatHistory(userId: string, limit = 20^): Promise^<ChatMessage[]^> {
echo     try {
echo       const q = query(
echo         collection(db, 'chat_messages'^),
echo         where('userId', '==', userId^),
echo         orderBy('timestamp', 'desc'^)
echo       ^);
echo.
echo       const querySnapshot = await getDocs(q^);
echo       const messages: ChatMessage[] = [];
echo.
echo       querySnapshot.forEach((doc^) =^> {
echo         const data = doc.data(^);
echo         messages.push({
echo           id: doc.id,
echo           content: data.content,
echo           sender: data.sender,
echo           timestamp: data.timestamp?.toDate?.() ^|^| new Date(),
echo           type: data.type ^|^| 'text'
echo         }^);
echo       }^);
echo.
echo       return messages.reverse(^); // Return in chronological order
echo     } catch (error^) {
echo       console.error('❌ Error getting chat history:', error^);
echo       return [];
echo     }
echo   }
echo }
) > src\services\FirebaseService.ts

echo.
echo 🔐 Step 9: Creating AuthService...
(
echo import {
echo   signInWithPopup,
echo   GoogleAuthProvider,
echo   signOut,
echo   onAuthStateChanged,
echo   User as FirebaseUser
echo } from 'firebase/auth';
echo import { auth } from '../config/firebase';
echo import { User } from '../types';
echo.
echo export class AuthService {
echo   private static googleProvider = new GoogleAuthProvider(^);
echo.
echo   static async signInWithGoogle(^): Promise^<User ^| null^> {
echo     try {
echo       console.log('🔐 Starting Google sign in...'^);
echo.
echo       // Add scopes for Google Calendar
echo       this.googleProvider.addScope('https://www.googleapis.com/auth/calendar.events'^);
echo       this.googleProvider.addScope('email'^);
echo       this.googleProvider.addScope('profile'^);
echo.
echo       const result = await signInWithPopup(auth, this.googleProvider^);
echo       const firebaseUser = result.user;
echo.
echo       // Get access token
echo       const credential = GoogleAuthProvider.credentialFromResult(result^);
echo       const accessToken = credential?.accessToken;
echo.
echo       const user: User = {
echo         id: firebaseUser.uid,
echo         name: firebaseUser.displayName ^|^| 'Anonymous',
echo         email: firebaseUser.email ^|^| '',
echo         picture: firebaseUser.photoURL ^|^| '',
echo         settings: {
echo           theme: 'light',
echo           notifications: true,
echo           language: 'he'
echo         },
echo         googleAccessToken: accessToken
echo       };
echo.
echo       console.log('✅ User signed in:', user^);
echo       return user;
echo.
echo     } catch (error: any^) {
echo       console.error('❌ Error signing in:', error^);
echo.
echo       if (error.code === 'auth/popup-closed-by-user'^) {
echo         throw new Error('ההתחברות בוטלה על ידי המשתמש'^);
echo       } else if (error.code === 'auth/popup-blocked'^) {
echo         throw new Error('הדפדפן חסם את חלון ההתחברות'^);
echo       } else {
echo         throw new Error('שגיאה בהתחברות עם Google'^);
echo       }
echo     }
echo   }
echo.
echo   static async signOut(^): Promise^<void^> {
echo     try {
echo       await signOut(auth^);
echo       console.log('✅ User signed out'^);
echo     } catch (error^) {
echo       console.error('❌ Error signing out:', error^);
echo       throw error;
echo     }
echo   }
echo.
echo   static onAuthStateChanged(callback: (user: User ^| null^) =^> void^): (^) =^> void {
echo     console.log('👂 Setting up auth state listener'^);
echo.
echo     return onAuthStateChanged(auth, (firebaseUser: FirebaseUser ^| null^) =^> {
echo       if (firebaseUser^) {
echo         const user: User = {
echo           id: firebaseUser.uid,
echo           name: firebaseUser.displayName ^|^| 'Anonymous',
echo           email: firebaseUser.email ^|^| '',
echo           picture: firebaseUser.photoURL ^|^| '',
echo           settings: {
echo             theme: 'light',
echo             notifications: true,
echo             language: 'he'
echo           }
echo         };
echo.
echo         console.log('🔄 Auth state changed - user logged in:', user^);
echo         callback(user^);
echo       } else {
echo         console.log('🔄 Auth state changed - user logged out'^);
echo         callback(null^);
echo       }
echo     }^);
echo   }
echo.
echo   static getCurrentUser(^): User ^| null {
echo     const firebaseUser = auth.currentUser;
echo.
echo     if (firebaseUser^) {
echo       return {
echo         id: firebaseUser.uid,
echo         name: firebaseUser.displayName ^|^| 'Anonymous',
echo         email: firebaseUser.email ^|^| '',
echo         picture: firebaseUser.photoURL ^|^| '',
echo         settings: {
echo           theme: 'light',
echo           notifications: true,
echo           language: 'he'
echo         }
echo       };
echo     }
echo.
echo     return null;
echo   }
echo }
) > src\services\AuthService.ts

echo.
echo 🤖 Step 10: Creating AdvancedAIService...
(
echo import { ChatMessage, AIContext, AIAction } from '../types';
echo.
echo export class AdvancedAIService {
echo.
echo   private static getApiUrl(^): string {
echo     const apiUrl = process.env.REACT_APP_API_URL ^|^| 'http://localhost:4000';
echo     console.log('🌐 Using API URL:', apiUrl^);
echo     return apiUrl;
echo   }
echo.
echo   static async sendMessage(
echo     message: string,
echo     context: AIContext,
echo     chatHistory: ChatMessage[]
echo   ^): Promise^<{
echo     response: string;
echo     actions?: AIAction[];
echo   }^> {
echo     try {
echo       console.log('🤖 Advanced AI processing:', message^);
echo       console.log('👤 User:', context.userName, 'ID:', context.userId^);
echo.
echo       const systemPrompt = this.buildAdvancedPrompt(context^);
echo       const messages = this.buildMessages(chatHistory, message, context^);
echo       const apiUrl = this.getApiUrl(^);
echo.
echo       console.log('📤 Sending to backend:', `${apiUrl}/api/claude`^);
echo.
echo       const response = await this.fetchWithRetry(`${apiUrl}/api/claude`, {
echo         method: 'POST',
echo         headers: {
echo           'Content-Type': 'application/json',
echo         },
echo         body: JSON.stringify({
echo           messages,
echo           system: systemPrompt,
echo           enableFunctionCalling: true,
echo           timestamp: new Date(^).toISOString(^),
echo           userId: context.userId
echo         }^)
echo       }^);
echo.
echo       if (!response.ok^) {
echo         const errorText = await response.text(^);
echo         console.error('❌ Backend error:', response.status, errorText^);
echo         throw new Error(`Backend error: ${response.status} - ${errorText}`^);
echo       }
echo.
echo       const data = await response.json(^);
echo       console.log('✅ AI Response received:', data^);
echo.
echo       if (data.type === 'action_success'^) {
echo         console.log('🎬 Function Calling success!'^);
echo         return {
echo           response: data.message ^|^| 'הפעולה בוצעה בהצלחה!',
echo           actions: data.actions ^|^| []
echo         };
echo       } else if (data.type === 'action_error'^) {
echo         console.error('❌ Function Calling error:', data.error^);
echo         return {
echo           response: `שגיאה בביצוע הפעולה: ${data.error}`,
echo           actions: []
echo         };
echo       } else {
echo         const content = data.content?.[0];
echo         return {
echo           response: content?.text ^|^| 'מצטער, לא הצלחתי להבין',
echo           actions: []
echo         };
echo       }
echo.
echo     } catch (error^) {
echo       console.error('❌ Advanced AI Service Error:', error^);
echo       return this.handleServiceError(error^);
echo     }
echo   }
echo.
echo   private static async fetchWithRetry(
echo     url: string, 
echo     options: RequestInit, 
echo     maxRetries: number = 3
echo   ^): Promise^<Response^> {
echo     let lastError: Error;
echo.
echo     for (let attempt = 1; attempt ^<= maxRetries; attempt++^) {
echo       try {
echo         console.log(`🔄 Attempt ${attempt}/${maxRetries} to ${url}`^);
echo         const response = await fetch(url, options^);
echo         if (response.ok ^|^| response.status ^< 500^) {
echo           return response;
echo         }
echo         throw new Error(`Server error: ${response.status}`^);
echo       } catch (error: any^) {
echo         console.log(`❌ Attempt ${attempt} failed:`, error.message^);
echo         lastError = error;
echo         if (attempt ^< maxRetries^) {
echo           const delay = Math.pow(2, attempt^) * 1000;
echo           console.log(`⏳ Waiting ${delay}ms before retry...`^);
echo           await new Promise(resolve =^> setTimeout(resolve, delay^)^);
echo         }
echo       }
echo     }
echo     throw lastError!;
echo   }
echo.
echo   private static handleServiceError(error: any^): { response: string; actions: any[] } {
echo     if (error.message.includes('timeout'^)^) {
echo       return {
echo         response: 'הבקשה נמשכה יותר מדי זמן. אנסה שוב... ⏰',
echo         actions: []
echo       };
echo     }
echo     if (error.message.includes('Failed to fetch'^)^) {
echo       return {
echo         response: 'בעיית חיבור לאינטרנט. בדוק את החיבור שלך... 📡',
echo         actions: []
echo       };
echo     }
echo     return {
echo       response: 'מצטער, יש לי בעיה טכנית זמנית. אנסה שוב בעוד רגע... 🔄',
echo       actions: []
echo     };
echo   }
echo.
echo   private static buildAdvancedPrompt(context: AIContext^): string {
echo     const currentTime = new Date(^).toLocaleString('he-IL'^);
echo     const today = new Date(^).toISOString(^).split('T'^)[0];
echo     const tomorrow = new Date(^);
echo     tomorrow.setDate(tomorrow.getDate(^) + 1^);
echo     const tomorrowStr = tomorrow.toISOString(^).split('T'^)[0];
echo.
echo     return `אתה TaskFlow AI, עוזר אישי חכם של ${context.userName ^|^| 'atiaron'}.
echo.
echo 📅 זמן נוכחי: ${currentTime}
echo 👤 משתמש: ${context.userName}
echo.
echo ⚡ Function Calling Mode:
echo כשהמשתמש מבקש ליצור משימה - החזר JSON:
echo.
echo {
echo   "action": "create_task",
echo   "payload": {
echo     "title": "כותרת המשימה",
echo     "description": "תיאור המשימה", 
echo     "priority": "medium",
echo     "dueDate": "${today}",
echo     "tags": ["תג1"]
echo   }
echo }
echo.
echo 📅 תאריכים:
echo - "היום" → ${today}
echo - "מחר" → ${tomorrowStr}
echo.
echo 🗣️ אם זה לא בקשה לפעולה - ענה טקסט רגיל בעברית.`;
echo   }
echo.
echo   private static buildMessages(chatHistory: ChatMessage[], currentMessage: string, context: AIContext^): any[] {
echo     const messages = [];
echo     chatHistory.slice(-8^).forEach(msg =^> {
echo       messages.push({
echo         role: msg.sender === 'user' ? 'user' : 'assistant',
echo         content: msg.content
echo       }^);
echo     }^);
echo     messages.push({
echo       role: "user",
echo       content: currentMessage
echo     }^);
echo     return messages;
echo   }
echo }
) > src\services\AdvancedAIService.ts

echo.
echo 🖥️ Step 11: Creating server files...

:: Server main file
(
echo const express = require('express'^);
echo const cors = require('cors'^);
echo const claudeRouter = require('./routes/claude'^);
echo require('dotenv'^).config(^);
echo.
echo const app = express(^);
echo const PORT = process.env.PORT ^|^| 4000;
echo.
echo app.use(cors({
echo   origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
echo   credentials: true,
echo   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
echo   allowedHeaders: ['Content-Type', 'Authorization']
echo }^)^);
echo.
echo app.use(express.json({ limit: '10mb' }^)^);
echo app.use(express.urlencoded({ extended: true }^)^);
echo.
echo app.use((req, res, next^) =^> {
echo   const timestamp = new Date(^).toLocaleString('he-IL'^);
echo   console.log(`📡 ${timestamp} - ${req.method} ${req.path}`^);
echo   next(^);
echo }^);
echo.
echo app.get('/health', (req, res^) =^> {
echo   res.json({ 
echo     status: 'OK', 
echo     timestamp: new Date(^).toLocaleString('he-IL'^),
echo     service: 'TaskFlow Backend',
echo     version: '2.0.0',
echo     features: {
echo       claudeAPI: !!process.env.CLAUDE_API_KEY,
echo       functionCalling: true,
echo       firebase: true
echo     }
echo   }^);
echo }^);
echo.
echo app.use('/api/claude', claudeRouter^);
echo.
echo app.use((req, res^) =^> {
echo   res.status(404^).json({ 
echo     error: 'Route not found',
echo     availableRoutes: ['GET /health', 'POST /api/claude']
echo   }^);
echo }^);
echo.
echo app.listen(PORT, (^) =^> {
echo   console.log('🚀 TaskFlow Backend Server Started!'^);
echo   console.log('📍 URL:', `http://localhost:${PORT}`^);
echo   console.log('🔑 Claude API:', process.env.CLAUDE_API_KEY ? '✅ Configured' : '❌ Missing'^);
echo   console.log('---'^);
echo }^);
) > server\server.js

:: Claude route
(
echo const express = require('express'^);
echo const router = express.Router(^);
echo.
echo const handleFunctionCalling = (claudeResponse^) =^> {
echo   try {
echo     const responseText = claudeResponse.content[0].text;
echo     console.log('📝 Claude response:', responseText^);
echo     const parsedJson = JSON.parse(responseText^);
echo.
echo     if (parsedJson.action ^&^& parsedJson.payload^) {
echo       console.log('✅ Valid JSON action detected:', parsedJson^);
echo       return {
echo         isAction: true,
echo         action: parsedJson,
echo         message: `✅ יצרתי לך את המשימה "${parsedJson.payload.title}"!`
echo       };
echo     }
echo     return { isAction: false };
echo   } catch (error^) {
echo     console.log('📝 Not a JSON action, treating as regular text'^);
echo     return { isAction: false };
echo   }
echo };
echo.
echo const buildSystemPrompt = (enableFunctionCalling^) =^> {
echo   const currentTime = new Date(^).toLocaleString('he-IL'^);
echo   if (enableFunctionCalling^) {
echo     return `אתה TaskFlow AI. כשמבקשים ליצור משימה - החזר רק JSON:
echo {"action": "create_task", "payload": {"title": "כותרת", "description": "תיאור", "priority": "medium"}}
echo זמן נוכחי: ${currentTime}`;
echo   }
echo   return `אתה עוזר ידידותי בעברית. זמן: ${currentTime}`;
echo };
echo.
echo router.post('/', async (req, res^) =^> {
echo   try {
echo     const { messages, system, enableFunctionCalling = false } = req.body;
echo     console.log('🚀 Claude API Request - Function Calling:', enableFunctionCalling^);
echo.
echo     if (!messages ^|^| !Array.isArray(messages^)^) {
echo       return res.status(400^).json({ error: 'Invalid request' }^);
echo     }
echo.
echo     const systemPrompt = system ^|^| buildSystemPrompt(enableFunctionCalling^);
echo.
echo     const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
echo       method: 'POST',
echo       headers: {
echo         'Content-Type': 'application/json',
echo         'x-api-key': process.env.CLAUDE_API_KEY,
echo         'anthropic-version': '2023-06-01'
echo       },
echo       body: JSON.stringify({
echo         model: 'claude-3-haiku-20240307',
echo         max_tokens: 1500,
echo         system: systemPrompt,
echo         messages: messages
echo       }^)
echo     }^);
echo.
echo     if (!claudeResponse.ok^) {
echo       console.error('❌ Claude API Error:', claudeResponse.status^);
echo       return res.status(500^).json({ error: 'Claude API error' }^);
echo     }
echo.
echo     const claudeData = await claudeResponse.json(^);
echo.
echo     if (enableFunctionCalling^) {
echo       const functionResult = handleFunctionCalling(claudeData^);
echo       if (functionResult.isAction^) {
echo         return res.json({
echo           type: 'action_success',
echo           message: functionResult.message,
echo           actions: [functionResult.action]
echo         }^);
echo       }
echo     }
echo.
echo     res.json(claudeData^);
echo   } catch (error^) {
echo     console.error('❌ Server Error:', error^);
echo     res.status(500^).json({ error: 'Internal server error' }^);
echo   }
echo }^);
echo.
echo module.exports = router;
) > server\routes\claude.js

echo.
echo 📱 Step 12: Creating React components...

:: Main App component
(
echo import React, { useState, useEffect } from 'react';
echo import { ThemeProvider, createTheme } from '@mui/material/styles';
echo import { CssBaseline, Container, CircularProgress, Box, Typography } from '@mui/material';
echo import { User } from './types';
echo import { AuthService } from './services/AuthService';
echo import LoginScreen from './components/LoginScreen';
echo import MainNavigation from './components/MainNavigation';
echo import TaskList from './components/TaskList';
echo import ChatInterface from './components/ChatInterface';
echo import CalendarView from './components/CalendarView';
echo.
echo const theme = createTheme({
echo   direction: 'rtl',
echo   palette: {
echo     primary: { main: '#1976d2' },
echo     secondary: { main: '#dc004e' },
echo   },
echo   typography: {
echo     fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
echo   },
echo }^);
echo.
echo function App(^) {
echo   const [user, setUser] = useState^<User ^| null^>(null^);
echo   const [loading, setLoading] = useState(true^);
echo   const [currentTab, setCurrentTab] = useState^<string^>('tasks'^);
echo.
echo   useEffect((^) =^> {
echo     console.log('🚀 App starting - setting up auth listener'^);
echo     const unsubscribe = AuthService.onAuthStateChanged((user^) =^> {
echo       setUser(user^);
echo       setLoading(false^);
echo     }^);
echo     return (^) =^> unsubscribe(^);
echo   }, []^);
echo.
echo   const handleTasksUpdate = (^) =^> {
echo     console.log('📝 Tasks updated'^);
echo   };
echo.
echo   if (loading^) {
echo     return (
echo       ^<ThemeProvider theme={theme}^>
echo         ^<CssBaseline /^>
echo         ^<Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}^>
echo           ^<CircularProgress size={60} /^>
echo           ^<Typography variant="h6"^>טוען את TaskFlow...^</Typography^>
echo         ^</Container^>
echo       ^</ThemeProvider^>
echo     ^);
echo   }
echo.
echo   if (!user^) {
echo     return (
echo       ^<ThemeProvider theme={theme}^>
echo         ^<CssBaseline /^>
echo         ^<LoginScreen /^>
echo       ^</ThemeProvider^>
echo     ^);
echo   }
echo.
echo   const renderCurrentTab = (^) =^> {
echo     switch (currentTab^) {
echo       case 'tasks':
echo         return ^<TaskList user={user} onTasksUpdate={handleTasksUpdate} /^>;
echo       case 'chat':
echo         return ^<ChatInterface user={user} onTasksUpdate={handleTasksUpdate} /^>;
echo       case 'calendar':
echo         return ^<CalendarView user={user} /^>;
echo       default:
echo         return ^<TaskList user={user} onTasksUpdate={handleTasksUpdate} /^>;
echo     }
echo   };
echo.
echo   return (
echo     ^<ThemeProvider theme={theme}^>
echo       ^<CssBaseline /^>
echo       ^<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}^>
echo         {renderCurrentTab(^)}
echo         ^<MainNavigation currentTab={currentTab} onTabChange={setCurrentTab} user={user} /^>
echo       ^</Box^>
echo     ^</ThemeProvider^>
echo   ^);
echo }
echo.
echo export default App;
) > src\App.tsx

:: Login Screen component
(
echo import React, { useState } from 'react';
echo import { Container, Paper, Typography, Button, Box, Alert } from '@mui/material';
echo import { Google as GoogleIcon } from '@mui/icons-material';
echo import { AuthService } from '../services/AuthService';
echo.
echo const LoginScreen: React.FC = (^) =^> {
echo   const [loading, setLoading] = useState(false^);
echo   const [error, setError] = useState^<string ^| null^>(null^);
echo.
echo   const handleGoogleSignIn = async (^) =^> {
echo     setLoading(true^);
echo     setError(null^);
echo     try {
echo       await AuthService.signInWithGoogle(^);
echo     } catch (error: any^) {
echo       setError(error.message^);
echo     } finally {
echo       setLoading(false^);
echo     }
echo   };
echo.
echo   return (
echo     ^<Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}^>
echo       ^<Paper sx={{ p: 4, width: '100%', textAlign: 'center' }}^>
echo         ^<Typography variant="h3" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}^>
echo           TaskFlow
echo         ^</Typography^>
echo         ^<Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}^>
echo           העוזר האישי החכם שלך
echo         ^</Typography^>
echo.
echo         {error ^&^& (
echo           ^<Alert severity="error" sx={{ mb: 2 }}^>
echo             {error}
echo           ^</Alert^>
echo         ^)}
echo.
echo         ^<Button
echo           variant="contained"
echo           size="large"
echo           startIcon={^<GoogleIcon /^>}
echo           onClick={handleGoogleSignIn}
echo           disabled={loading}
echo           sx={{ py: 2, px: 4, fontSize: '1.1rem' }}
echo         ^>
echo           {loading ? 'מתחבר...' : 'התחבר עם Google'}
echo         ^</Button^>
echo.
echo         ^<Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}^>
echo           ^<Typography variant="body2" color="text.secondary"^>
echo             🤖 AI חכם לניהול משימות
echo           ^</Typography^>
echo           ^<Typography variant="body2" color="text.secondary"^>
echo             🔄 סנכרון בין מכשירים
echo           ^</Typography^>
echo           ^<Typography variant="body2" color="text.secondary"^>
echo             🎯 תכנון אישי מותאם
echo           ^</Typography^>
echo         ^</Box^>
echo       ^</Paper^>
echo     ^</Container^>
echo   ^);
echo };
echo.
echo export default LoginScreen;
) > src\components\LoginScreen.tsx

:: Simple TaskList component
(
echo import React, { useState, useEffect } from 'react';
echo import { Container, Typography, Box, Paper, Button, Alert } from '@mui/material';
echo import { Add as AddIcon } from '@mui/icons-material';
echo import { Task, User } from '../types';
echo import { FirebaseService } from '../services/FirebaseService';
echo.
echo interface TaskListProps {
echo   user: User;
echo   onTasksUpdate: (^) =^> void;
echo }
echo.
echo const TaskList: React.FC^<TaskListProps^> = ({ user, onTasksUpdate }^) =^> {
echo   const [tasks, setTasks] = useState^<Task[]^>([]^);
echo   const [loading, setLoading] = useState(true^);
echo.
echo   useEffect((^) =^> {
echo     if (!user?.id^) return;
echo     console.log('🔥 Setting up real-time tasks listener'^);
echo     setLoading(true^);
echo     const unsubscribe = FirebaseService.subscribeToUserTasks(user.id, (updatedTasks^) =^> {
echo       setTasks(updatedTasks^);
echo       setLoading(false^);
echo     }^);
echo     return (^) =^> unsubscribe(^);
echo   }, [user?.id]^);
echo.
echo   const createQuickTask = async (^) =^> {
echo     if (!user?.id^) return;
echo     try {
echo       const quickTask = {
echo         title: 'משימה חדשה',
echo         description: 'לחץ לעריכה',
echo         completed: false,
echo         priority: 'medium' as const,
echo         createdAt: new Date(^),
echo         updatedAt: new Date(^)
echo       };
echo       await FirebaseService.addTask(user.id, quickTask^);
echo     } catch (error^) {
echo       console.error('❌ Failed to create task:', error^);
echo     }
echo   };
echo.
echo   if (loading^) {
echo     return (
echo       ^<Container sx={{ py: 2, textAlign: 'center' }}^>
echo         ^<Typography variant="h6" sx={{ mt: 4 }}^>טוען משימות...^</Typography^>
echo       ^</Container^>
echo     ^);
echo   }
echo.
echo   return (
echo     ^<Container sx={{ py: 2, pb: 10 }}^>
echo       ^<Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}^>
echo         שלום {user.name}! 👋
echo       ^</Typography^>
echo.
echo       ^<Box sx={{ mb: 3 }}^>
echo         ^<Alert severity="success"^>
echo           🎉 TaskFlow v2.0 פועל עם Firebase!
echo         ^</Alert^>
echo       ^</Box^>
echo.
echo       ^<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}^>
echo         ^<Typography variant="h5"^>המשימות שלי ({tasks.length}^)^</Typography^>
echo         ^<Button variant="contained" startIcon={^<AddIcon /^>} onClick={createQuickTask}^>
echo           הוסף משימה
echo         ^</Button^>
echo       ^</Box^>
echo.
echo       {tasks.length === 0 ? (
echo         ^<Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}^>
echo           ^<Typography variant="h6" color="text.secondary"^>
echo             אין משימות עדיין
echo           ^</Typography^>
echo           ^<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}^>
echo             בוא נתחיל ליצור כמה משימות!
echo           ^</Typography^>
echo           ^<Button variant="contained" startIcon={^<AddIcon /^>} onClick={createQuickTask} sx={{ mt: 2 }}^>
echo             צור משימה ראשונה
echo           ^</Button^>
echo         ^</Paper^>
echo       ^) : (
echo         tasks.map((task^) =^> (
echo           ^<Paper key={task.id} sx={{ p: 2, mb: 2 }}^>
echo             ^<Typography variant="h6"^>{task.title}^</Typography^>
echo             {task.description ^&^& (
echo               ^<Typography variant="body2" color="text.secondary"^>
echo                 {task.description}
echo               ^</Typography^>
echo             ^)}
echo             ^<Typography variant="caption" color="text.secondary"^>
echo               נוצר: {task.createdAt.toLocaleString('he-IL'^)}
echo             ^</Typography^>
echo           ^</Paper^>
echo         ^)^)
echo       ^)}
echo     ^</Container^>
echo   ^);
echo };
echo.
echo export default TaskList;
) > src\components\TaskList.tsx

:: Simple ChatInterface component
(
echo import React, { useState } from 'react';
echo import { Container, Typography, Box, TextField, Button, Paper, Alert } from '@mui/material';
echo import { Send as SendIcon, Psychology as AIIcon } from '@mui/icons-material';
echo import { User } from '../types';
echo import { AdvancedAIService } from '../services/AdvancedAIService';
echo import { FirebaseService } from '../services/FirebaseService';
echo.
echo interface ChatInterfaceProps {
echo   user: User;
echo   onTasksUpdate: (^) =^> void;
echo }
echo.
echo const ChatInterface: React.FC^<ChatInterfaceProps^> = ({ user, onTasksUpdate }^) =^> {
echo   const [inputText, setInputText] = useState(''^);
echo   const [response, setResponse] = useState(''^);
echo   const [loading, setLoading] = useState(false^);
echo.
echo   const handleSend = async (^) =^> {
echo     if (!inputText.trim(^) ^|^| loading^) return;
echo.
echo     setLoading(true^);
echo     try {
echo       const result = await AdvancedAIService.sendMessage(
echo         inputText,
echo         {
echo           currentTasks: [],
echo           recentChats: [],
echo           userPreferences: user.settings,
echo           currentTime: new Date(^),
echo           userName: user.name,
echo           userId: user.id
echo         },
echo         []
echo       ^);
echo.
echo       setResponse(result.response^);
echo.
echo       // Handle actions
echo       if (result.actions ^&^& result.actions.length ^> 0^) {
echo         for (const action of result.actions^) {
echo           if (action.action === 'create_task'^) {
echo             await FirebaseService.addTask(user.id, action.payload^);
echo             onTasksUpdate(^);
echo           }
echo         }
echo       }
echo.
echo     } catch (error^) {
echo       setResponse('שגיאה בתקשורת עם השרת'^);
echo     } finally {
echo       setLoading(false^);
echo       setInputText(''^);
echo     }
echo   };
echo.
echo   return (
echo     ^<Container sx={{ py: 2, pb: 10 }}^>
echo       ^<Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}^>
echo         💬 צ'אט עם AI
echo       ^</Typography^>
echo.
echo       ^<Alert severity="info" sx={{ mb: 3 }}^>
echo         🤖 נסה: "צור לי משימה לקנות חלב"
echo       ^</Alert^>
echo.
echo       {response ^&^& (
echo         ^<Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}^>
echo           ^<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}^>
echo             ^<AIIcon color="primary" /^>
echo             ^<Typography variant="h6"^>TaskFlow AI^</Typography^>
echo           ^</Box^>
echo           ^<Typography variant="body1"^>{response}^</Typography^>
echo         ^</Paper^>
echo       ^)}
echo.
echo       ^<Box sx={{ display: 'flex', gap: 1 }}^>
echo         ^<TextField
echo           fullWidth
echo           value={inputText}
echo           onChange={(e^) =^> setInputText(e.target.value^)}
echo           placeholder="כתוב הודעה..."
echo           disabled={loading}
echo           onKeyPress={(e^) =^> e.key === 'Enter' ^&^& handleSend(^)}
echo         /^>
echo         ^<Button
echo           variant="contained"
echo           onClick={handleSend}
echo           disabled={!inputText.trim(^) ^|^| loading}
echo           sx={{ minWidth: 100 }}
echo         ^>
echo           {loading ? 'שולח...' : ^<SendIcon /^>}
echo         ^</Button^>
echo       ^</Box^>
echo     ^</Container^>
echo   ^);
echo };
echo.
echo export default ChatInterface;
) > src\components\ChatInterface.tsx

:: Simple placeholder components
(
echo import React from 'react';
echo import { Container, Typography } from '@mui/material';
echo import { User } from '../types';
echo.
echo interface CalendarViewProps {
echo   user: User;
echo }
echo.
echo const CalendarView: React.FC^<CalendarViewProps^> = ({ user }^) =^> {
echo   return (
echo     ^<Container sx={{ py: 2, pb: 10 }}^>
echo       ^<Typography variant="h4" gutterBottom^>
echo         📅 לוח שנה
echo       ^</Typography^>
echo       ^<Typography variant="body1"^>
echo         יומן המשימות של {user.name} - בקרוב!
echo       ^</Typography^>
echo     ^</Container^>
echo   ^);
echo };
echo.
echo export default CalendarView;
) > src\components\CalendarView.tsx

(
echo import React from 'react';
echo import { BottomNavigation, BottomNavigationAction, Paper, Avatar } from '@mui/material';
echo import { Task as TaskIcon, Chat as ChatIcon, CalendarMonth as CalendarIcon, Logout as LogoutIcon } from '@mui/icons-material';
echo import { User } from '../types';
echo import { AuthService } from '../services/AuthService';
echo.
echo interface MainNavigationProps {
echo   currentTab: string;
echo   onTabChange: (tab: string^) =^> void;
echo   user: User;
echo }
echo.
echo const MainNavigation: React.FC^<MainNavigationProps^> = ({ currentTab, onTabChange, user }^) =^> {
echo   const handleSignOut = async (^) =^> {
echo     try {
echo       await AuthService.signOut(^);
echo     } catch (error^) {
echo       console.error('Error signing out:', error^);
echo     }
echo   };
echo.
echo   return (
echo     ^<Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}^>
echo       ^<BottomNavigation value={currentTab} onChange={(_, newValue^) =^> onTabChange(newValue^)}^>
echo         ^<BottomNavigationAction label="משימות" value="tasks" icon={^<TaskIcon /^>} /^>
echo         ^<BottomNavigationAction label="צ'אט" value="chat" icon={^<ChatIcon /^>} /^>
echo         ^<BottomNavigationAction label="לוח שנה" value="calendar" icon={^<CalendarIcon /^>} /^>
echo         ^<BottomNavigationAction
echo           label="יציאה"
echo           value="logout"
echo           icon={^<Avatar src={user.picture} sx={{ width: 24, height: 24 }} /^>}
echo           onClick={handleSignOut}
echo         /^>
echo       ^</BottomNavigation^>
echo     ^</Paper^>
echo   ^);
echo };
echo.
echo export default MainNavigation;
) > src\components\MainNavigation.tsx

echo.
echo 📱 Step 13: Creating index.tsx...
(
echo import React from 'react';
echo import ReactDOM from 'react-dom/client';
echo import './index.css';
echo import App from './App';
echo.
echo const root = ReactDOM.createRoot(
echo   document.getElementById('root'^) as HTMLElement
echo ^);
echo.
echo root.render(
echo   ^<React.StrictMode^>
echo     ^<App /^>
echo   ^</React.StrictMode^>
echo ^);
) > src\index.tsx

echo.
echo 🎨 Step 14: Creating index.css...
(
echo body {
echo   margin: 0;
echo   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
echo     'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
echo     sans-serif;
echo   -webkit-font-smoothing: antialiased;
echo   -moz-osx-font-smoothing: grayscale;
echo   direction: rtl;
echo }
echo.
echo code {
echo   font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
echo     monospace;
echo }
echo.
echo * {
echo   box-sizing: border-box;
echo }
) > src\index.css

echo.
echo 📄 Step 15: Creating public files...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="he" dir="rtl"^>
echo   ^<head^>
echo     ^<meta charset="utf-8" /^>
echo     ^<link rel="icon" href="%%PUBLIC_URL%%/favicon.ico" /^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1" /^>
echo     ^<meta name="theme-color" content="#1976d2" /^>
echo     ^<meta name="description" content="TaskFlow - AI Personal Task Manager" /^>
echo     ^<link rel="manifest" href="%%PUBLIC_URL%%/manifest.json" /^>
echo     ^<title^>TaskFlow - AI Personal Assistant^</title^>
echo   ^</head^>
echo   ^<body^>
echo     ^<noscript^>You need to enable JavaScript to run this app.^</noscript^>
echo     ^<div id="root"^>^</div^>
echo   ^</body^>
echo ^</html^>
) > public\index.html

(
echo {
echo   "short_name": "TaskFlow",
echo   "name": "TaskFlow - AI Personal Task Manager",
echo   "icons": [
echo     {
echo       "src": "favicon.ico",
echo       "sizes": "64x64 32x32 24x24 16x16",
echo       "type": "image/x-icon"
echo     }
echo   ],
echo   "start_url": ".",
echo   "display": "standalone",
echo   "theme_color": "#1976d2",
echo   "background_color": "#ffffff"
echo }
) > public\manifest.json

echo.
echo 📦 Step 16: Installing dependencies...
echo Installing main dependencies...
call npm install

echo.
echo Installing server dependencies...
cd server
call npm install
cd ..

echo.
echo ========================================
echo    🎉 TaskFlow v2.0 Setup Complete!
echo ========================================
echo.
echo ✅ All files created successfully
echo ✅ Dependencies installed
echo ✅ Firebase configuration ready
echo ✅ Server setup complete
echo.
echo 🔧 NEXT STEPS:
echo.
echo 1. 🔥 Set up Firebase:
echo    - Go to https://console.firebase.google.com
echo    - Create project: "taskflow-atiaron"
echo    - Enable Firestore + Authentication
echo    - Copy config to .env.development
echo.
echo 2. 🤖 Set up Claude API:
echo    - Get API key from https://console.anthropic.com
echo    - Add to server\.env: CLAUDE_API_KEY=your-key
echo.
echo 3. 🚀 Run the application:
echo    Terminal 1: cd server ^&^& npm run dev
echo    Terminal 2: npm start
echo.
echo 4. 🌐 Open: http://localhost:3000
echo.
echo Current directory: %CD%
echo.
echo 📋 Files created:
echo - Frontend: %CD%\src\
echo - Backend: %CD%\server\
echo - Config: %CD%\.env.development
echo.
echo Happy coding! 🚀
echo.
pause