import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/Auth/Login";
import Signup from "./Components/Auth/Signup";
import Dashboard from "./Pages/Dashboard";
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
          <Route path="/dashboard" element={
            <HabitProvider>
              <SocketProvider token={localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}>
                <Dashboard />
              </SocketProvider>
            </HabitProvider>
          } />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ChartDataProvider>
    </ThemeProvider>
  );
}

export default App;
