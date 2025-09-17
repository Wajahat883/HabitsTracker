import { createRoot } from 'react-dom/client';
import './index.css';
import './theme.css';
import './auth.css';
import App from './App.jsx';
import { GoogleOAuthProvider } from "@react-oauth/google";

// Removed React.StrictMode to prevent intentional double mounting in development
createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);
