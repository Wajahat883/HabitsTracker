import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { signup as signupAPI } from '../../api/users';
import GoogleLoginButton from './GoogleLoginButton';
import { showToast } from '../../config/toast';
import Loader from '../Common/Loader';
import signupImage from "../../assets/pexels-elly-fairytale-3822583.jpg";

const Signup = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      showToast.error("Username is required");
      return false;
    }
    if (!formData.email.trim()) {
      showToast.error("Email is required");
      return false;
    }
    if (!formData.password.trim()) {
      showToast.error("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      showToast.error("Password must be at least 6 characters long");
      return false;
    }
    if (!formData.agreeToTerms) {
      showToast.error("Please agree to the terms and conditions");
      return false;
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const result = await signupAPI(formData.email, formData.password, formData.username);
      showToast.success("Account created successfully! Welcome to HabitTracker!");
      
      // Store auth data and update context
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('userProfile', JSON.stringify(result.user));
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = 
        error.code === 'auth/email-already-in-use' ? 'This email is already registered. Please use a different email or sign in instead.' :
        error.code === 'auth/invalid-email' ? 'Please enter a valid email address.' :
        error.code === 'auth/weak-password' ? 'Password is too weak. Please choose a stronger password.' :
        error.message || 'Failed to create account. Please try again.';
      
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      navigate('/dashboard');
    } catch (error) {
      console.error('Google signup error:', error);
      showToast.error("Google signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-20 h-8 bg-white/10 rounded-full top-1/4 left-0 animate-pulse opacity-60"></div>
        <div className="absolute w-24 h-10 bg-white/10 rounded-full top-3/5 right-0 animate-pulse opacity-60"></div>
        <div className="absolute w-16 h-6 bg-white/10 rounded-full top-1/6 right-1/4 animate-pulse opacity-60"></div>
        <div className="absolute w-28 h-12 bg-white/10 rounded-full bottom-1/4 left-1/4 animate-pulse opacity-60"></div>
      </div>

      <div className="w-full max-w-7xl flex items-center gap-12 relative z-10">
        
        {/* Left Side - Description and Image */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center text-center">
          {/* Hero Image */}
          <div className="relative mb-8">
            <div className="w-96 h-96 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <img 
                src={signupImage} 
                alt="Start Your Journey" 
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 text-center">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                </div>
                <p className="text-white text-sm font-semibold">Your Journey Starts Here</p>
              </div>
            </div>
          </div>
          
          {/* Description Content */}
          <div className="max-w-lg">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Start Your Journey
            </h1>
            <p className="text-blue-100/90 text-lg leading-relaxed mb-8">
              Join thousands of users who have transformed their lives through consistent habit tracking. Create your account and begin building the life you've always wanted.
            </p>
            
            {/* Why Join Section */}
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Build Momentum</h3>
                  <p className="text-blue-100 text-sm">Start small and watch your habits compound into life-changing results</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Track Progress</h3>
                  <p className="text-blue-100 text-sm">Visualize your success with beautiful charts and streak counters</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Stay Motivated</h3>
                  <p className="text-blue-100 text-sm">Connect with friends and join communities for support and accountability</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-2">Join HabitTracker</h2>
              <p className="text-blue-100">Create your account to start building better habits</p>
            </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 pl-12 bg-white/90 backdrop-blur-sm border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 focus:bg-white transition-all duration-300"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 pl-12 bg-white/90 backdrop-blur-sm border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 focus:bg-white transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="w-full px-4 py-3 pl-12 pr-12 bg-white/90 backdrop-blur-sm border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 focus:bg-white transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="h-4 w-4 text-cyan-400 focus:ring-cyan-400 bg-white/90 border-0 rounded"
                required
              />
              <label className="ml-2 text-sm text-white/90">
                I agree to the{' '}
                <Link to="/terms" className="text-cyan-300 hover:text-cyan-200 underline">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-cyan-300 hover:text-cyan-200 underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/70">Or continue with</span>
              </div>
            </div>

            <GoogleLoginButton onSuccess={handleGoogleSignup} />
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/70">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-cyan-300 hover:text-cyan-200 font-semibold transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;