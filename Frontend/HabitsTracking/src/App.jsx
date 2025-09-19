import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from "./Components/Auth/Login";
import Signup from "./Components/Auth/Signup";
import Dashboard from "./Pages/Dashboard";
import Home from "./Pages/Home";
import LandingPage from "./Pages/LandingPage";
import AppShell from "./Components/AppShell";
import { CompletionProvider } from './context/CompletionContext';
import { ChartDataProvider } from "./context/ChartDataContext";
import { ThemeProvider } from './context/ThemeContext';
import { HabitProvider } from "./context/HabitContextStable";
import { SocketProvider } from "./context/SocketContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import ErrorBoundary from './Components/Common/ErrorBoundary';

// Router component that handles authentication-based routing
const AppRouter = () => {
  const { authenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Public routes - Landing page is the default */}
      <Route path="/" element={authenticated ? <Navigate to="/app/home" replace /> : <LandingPage />} />
      <Route path="/login" element={authenticated ? <Navigate to="/app/home" replace /> : <Login />} />
      <Route path="/signup" element={authenticated ? <Navigate to="/app/home" replace /> : <Signup />} />
      
      {/* Protected app routes */}
      <Route path="/app/*" element={authenticated ? <AppShell /> : <Navigate to="/" replace />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to={authenticated ? "/app/home" : "/"} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <ChartDataProvider>
            <HabitProvider>
              <CompletionProvider>
                <SocketProvider>
                  <Router>
                    <AppRouter />
                  </Router>
                </SocketProvider>
              </CompletionProvider>
            </HabitProvider>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
              toastClassName="custom-toast"
              bodyClassName="custom-toast-body"
            />
          </ChartDataProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
