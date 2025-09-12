import { useContext } from "react";
import { ChartDataContext } from "./ChartDataContext";

export const useChartData = () => useContext(ChartDataContext);
