import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import MainApp from './components/MainApp';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;