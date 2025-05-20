import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
// import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <ThemeProvider>
        {/* <AuthProvider> */}
          <AppRoutes />
          <Toaster position="top-right" />
        {/* </AuthProvider> */}
      </ThemeProvider>
    </Router>
  );
}

export default App;