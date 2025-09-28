// src/pages/SplashScreen.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Fixed import path

const SplashScreen = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, mustChangePassword } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        if (isAuthenticated) {
          if (mustChangePassword) {
            navigate('/change-password', { replace: true });
          } else {
            navigate('/main', { replace: true });
          }
        } else {
          navigate('/roles', { replace: true });
        }
      }
    }, 2000); // 2 second splash delay

    return () => clearTimeout(timer);
  }, [loading, isAuthenticated, mustChangePassword, navigate]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-center">
        {/* Logo placeholder */}
        <div className="w-24 h-24 mx-auto mb-8 bg-white bg-opacity-10 rounded-full flex items-center justify-center">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-white">E</span>
          </div>
        </div>
        
        {/* App title */}
        <h1 className="text-4xl font-bold text-white mb-2">EPH Platform</h1>
        <p className="text-white text-opacity-80 text-lg mb-8">
          Engineering Projects Hub
        </p>
        
        {/* Loading indicator */}
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <span className="text-white text-opacity-70">Loading...</span>
        </div>
        
        {/* Tagline */}
        <p className="text-white text-opacity-60 text-sm mt-12">
          Empowering Students, Connecting Opportunities
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;