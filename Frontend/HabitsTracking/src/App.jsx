import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/Auth/Login";
import Signup from "./Components/Auth/Signup";
import Dashboard from "./Pages/Dashboard";
import Home from "./Pages/Home";
import AppShell from "./components/AppShell";
import { CompletionProvider } from './context/CompletionContext';
import { ChartDataProvider } from "./context/ChartDataContext";
import { ThemeProvider } from './context/ThemeContext';
import { HabitProvider } from "./context/HabitContext";
import { SocketProvider } from "./context/SocketContext";

function App() {
  return (
  <ThemeProvider>
  <ChartDataProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<AppShell />}> 
            <Route path="/home" element={
              <HabitProvider>
                <CompletionProvider>
                  <SocketProvider token={localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}>
                    <Home />
                  </SocketProvider>
                </CompletionProvider>
              </HabitProvider>
            } />
            <Route path="/dashboard" element={
              <HabitProvider>
                <CompletionProvider>
                  <SocketProvider token={localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}>
                    <Dashboard />
                  </SocketProvider>
                </CompletionProvider>
              </HabitProvider>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </Router>
    </ChartDataProvider>
    </ThemeProvider>
  );
}

export default App;
