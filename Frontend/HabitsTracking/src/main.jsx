import { createRoot } from 'react-dom/client';
import './index.css';
import './theme.css';
import './auth.css';
import App from './App.jsx';
import { GoogleOAuthProvider } from "@react-oauth/google";

// Register Chart.js components globally to avoid plugin issues
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
);

console.log('Chart.js Filler plugin registered globally:', ChartJS.registry.plugins.get('filler') !== undefined);

// Removed React.StrictMode to prevent intentional double mounting in development
createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);
