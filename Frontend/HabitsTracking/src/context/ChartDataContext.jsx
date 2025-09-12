import React, { createContext, useState } from "react";

export const ChartDataContext = createContext();

export const ChartDataProvider = ({ children }) => {
  // Example: Replace with real API data fetching logic
  const [userProgressData, setUserProgressData] = useState({
    labels: ["Completed", "Remaining"],
    datasets: [
      {
        data: [75, 25],
        backgroundColor: ["#38bdf8", "#334155"],
        borderWidth: 2,
      },
    ],
  });

  const [friendData, setFriendData] = useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Friend's Progress",
        data: [8, 12, 14, 16, 19, 13, 20],
        backgroundColor: "#34d399",
        borderRadius: 8,
      },
    ],
  });

  const [compareData, setCompareData] = useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "You",
        data: [10, 15, 12, 18, 20, 17, 22],
        backgroundColor: "#38bdf8",
        borderRadius: 8,
      },
      {
        label: "Friend",
        data: [8, 12, 14, 16, 19, 13, 20],
        backgroundColor: "#34d399",
        borderRadius: 8,
      },
    ],
  });

  return (
    <ChartDataContext.Provider value={{ userProgressData, friendData, compareData, setUserProgressData, setFriendData, setCompareData }}>
      {children}
    </ChartDataContext.Provider>
  );
};

// Hook moved to separate file useChartData.js
