import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/Auth/Login";
import Signup from "./Components/Auth/Signup";
import Dashboard from "./Pages/Dashboard";
import { ChartDataProvider } from "./context/ChartDataContext";
import { HabitProvider } from "./context/HabitContext";

function App() {
  return (
    <ChartDataProvider>
      <HabitProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </HabitProvider>
    </ChartDataProvider>
  );
}

export default App;
