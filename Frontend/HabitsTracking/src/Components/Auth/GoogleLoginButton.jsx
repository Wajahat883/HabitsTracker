import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const GoogleLoginButton = ({ onSuccess, onError }) => {
  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse || !credentialResponse.credential) {
      if (onError) onError({ message: "No credential received from Google" });
      return;
    }

    console.log("Google credential:", credentialResponse);

    try {
      const res = await axios.post(
        `${API_URL}/api/auth/google`,
        { token: credentialResponse.credential },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      console.log("Google login response:", res.data);
      // Call onSuccess with the original credentialResponse, not backend response
      if (onSuccess) onSuccess(credentialResponse);
    } catch (err) {
      console.error("Google login error:", err.response?.data || err.message);
      if (onError) onError({ message: "Google login failed", error: err.response?.data || err.message });
    }
  };

  const handleError = (err) => {
    console.error("Google login onError:", err);
    if (onError) onError({ message: "Google login failed", error: err });
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleError} 
    />
  );
};

export default GoogleLoginButton;
