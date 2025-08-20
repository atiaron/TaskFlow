import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.taskflow.app',
  appName: 'TaskFlow',
  webDir: 'build',         // Create React App build directory
  server: {
    androidScheme: 'https' // מבטיח Service Worker ב-WebView
  }
};

export default config;