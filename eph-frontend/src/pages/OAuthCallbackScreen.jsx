// src/pages/OAuthCallbackScreen.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const OAuthCallbackScreen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth(); // Use login method instead of setAuthData
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const provider = searchParams.get('provider');
        const errorParam = searchParams.get('error');
        
        // Debug: Log all URL parameters
        console.log('OAuth Callback Debug:', {
          token: token ? `${token.substring(0, 20)}...` : null,
          provider,
          errorParam,
          allParams: Object.fromEntries(searchParams.entries())
        });
        
        if (errorParam) {
          setError(`OAuth error: ${errorParam}`);
          setTimeout(() => {
            navigate('/login', { 
              state: { error: `OAuth error: ${errorParam}` }
            });
          }, 2000);
          return;
        }
        
        if (token) {
          // Try different auth methods
          console.log('Attempting to set auth data...');
          
          // Method 1: Try the login hook if it has setAuthData
          if (login && typeof login.setAuthData === 'function') {
            console.log('Using login.setAuthData');
            await login.setAuthData({ token, provider });
          } 
          // Method 2: Try direct localStorage approach
          else {
            console.log('Using localStorage fallback');
            localStorage.setItem('auth_token', token);
            localStorage.setItem('oauth_provider', provider || 'unknown');
            
            // Trigger a page reload to pick up the token
            window.location.href = '/main';
            return;
          }
          
          console.log('Auth data set, navigating to main...');
          navigate('/main', { replace: true });
        } else {
          console.error('No token received in callback');
          setError('OAuth login failed - no token received');
          setTimeout(() => {
            navigate('/login', {
              state: { error: 'OAuth login failed' }
            });
          }, 2000);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('OAuth processing failed');
        setTimeout(() => {
          navigate('/login', {
            state: { error: 'OAuth processing failed' }
          });
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
          <div className="text-red-400 text-lg mb-4">OAuth Error</div>
          <p className="text-white/80 text-sm">{error}</p>
          <p className="text-white/60 text-xs mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
      <div className="text-center bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
        <p className="mt-4 text-white">Completing OAuth login...</p>
        <p className="text-white/60 text-xs mt-2">Please wait while we sign you in</p>
      </div>
    </div>
  );
};

export default OAuthCallbackScreen;