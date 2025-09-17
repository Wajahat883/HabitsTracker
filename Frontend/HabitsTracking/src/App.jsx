import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from "./Components/Auth/Login";
import Signup from "./Components/Auth/Signup";
import Dashboard from "./Pages/Dashboard";
import Home from "./Pages/Home";
import AppShell from "./Components/AppShell";
import { CompletionProvider } from './context/CompletionContext';
import { ChartDataProvider } from "./context/ChartDataContext";
import { ThemeProvider } from './context/ThemeContext';
import { HabitProvider } from "./context/HabitContextStable";
import { SocketProvider } from "./context/SocketContext";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from './Components/Common/ErrorBoundary';

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
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/*" element={<AppShell />} />
                    </Routes>
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
