// 🚦 Service Injection - טוען שירותים לפי סביבה
const isDev = process.env.NODE_ENV === 'development' || 
             process.env.REACT_APP_IS_DEV_MODE === 'true' ||
             window.location.hostname === 'localhost';

console.log('🚦 Service Injector:', { 
  NODE_ENV: process.env.NODE_ENV,
  IS_DEV_MODE: process.env.REACT_APP_IS_DEV_MODE,
  hostname: window.location.hostname,
  isDev 
});

if (isDev) {
  console.log('🔧 Development mode - using mocks');
} else {
  console.log('🔒 Production mode - using real services');
}

// Auth service injection (working)
export const AuthService = isDev ? require('./MockAuth').default : require('./RealAuth').default;
console.log('✅ AuthService loaded:', AuthService.constructor?.name || 'MockAuth');

// For now, export existing services directly until we create Mock/Real versions
export { FirebaseService } from './FirebaseService';
export { StorageService } from './StorageService';
export { SecurityManager } from './SecurityManager';
export { SyncManager } from './SyncManager';
export { EnhancedClaudeService } from './EnhancedClaudeService';
export { RealTimeSyncService } from './RealTimeSyncService';
export { memoryService as MemoryService } from './MemoryService';
export { toolRegistry as ToolRegistry } from './ToolRegistry';

// TODO: Create Mock/Real versions for these services
// export const FirebaseService = isDev ? require('./MockFirebase').default : require('./RealFirebase').default;
// export const SyncService = isDev ? require('./MockSync').default : require('./RealSync').default;
