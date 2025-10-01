// src/pages/LoginScreen.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CustomButton from '../components/CustomButton';
import FormInput from '../components/FormInput';
import { apiService } from '../services/apiService';

// Lucide icons
import { Mail, LockKeyhole, LogIn, ArrowLeft, Github, ShieldCheck } from 'lucide-react';

// Google glyph
const GoogleGlyph = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.826 31.657 29.286 35 24 35 16.82 35 11 29.18 11 22S16.82 9 24 9c3.31 0 6.315 1.236 8.59 3.26l5.657-5.657C34.89 3.017 29.676 1 24 1 10.745 1 0 11.745 0 25s10.745 24 24 24c12.683 0 23.122-9.266 23.957-21H24v-7.917h19.611z"/>
  </svg>
);

const LoginScreen = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const selectedRole = location.state?.role;
  const isAdmin = (selectedRole || '').toLowerCase() === 'admin';

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email.trim()))
      newErrors.email = 'Enter a valid email';
    if (!formData.password || formData.password.length < 6)
      newErrors.password = 'Minimum 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await login({
        email: formData.email.trim(),
        password: formData.password,
        role: selectedRole,
      });

      if (result.success) {
        if (result.mustChangePassword) {
          navigate('/change-password', { replace: true });
        } else {
          const user = result.user;
          const isAdminRole = (user?.role || '').toLowerCase() === 'admin';
          navigate(isAdminRole ? '/admin' : '/main', {
            replace: true,
            state: { tab: 'competitions' },
          });
        }
      } else {
        setErrorMsg(result.message || 'Login failed');
      }
    } catch (err) {
      setErrorMsg(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setOauthLoading(true);
    setErrorMsg('');
    try {
      let authUrl;
      if (provider === 'google') {
        const response = await apiService.getGoogleAuthUrl();
        authUrl = response.data?.authUrl;
      } else if (provider === 'github') {
        const response = await apiService.getGitHubAuthUrl();
        authUrl = response.data?.authUrl;
      }
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error('Failed to get OAuth URL');
      }
    } catch (err) {
      setErrorMsg(`Failed to initiate ${provider} login: ${err.message}`);
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md px-5 py-6 md:px-6 md:py-7">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border bg-slate-700/60 hover:bg-slate-700/80 border-slate-600/60 text-slate-200"
            type="button"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back</span>
          </button>
          {selectedRole && (
            <div className="px-3 py-1.5 rounded-full bg-slate-700/60 inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold tracking-wide text-slate-200">
                {selectedRole.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-700">
            <LogIn className="w-6 h-6 text-slate-100" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-slate-300">Sign in to continue</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <FormInput
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            icon={Mail}
            required
          />
          <FormInput
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            error={errors.password}
            icon={LockKeyhole}
            showPasswordToggle
            required
          />

          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-slate-300 hover:text-white transition-colors text-sm"
            >
              Forgot Password?
            </button>
          </div>

          {errorMsg && (
            <div className="bg-red-900/20 border border-red-800/40 text-red-200 text-sm p-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          <CustomButton
            type="submit"
            text={loading ? 'Signing in...' : 'Login'}
            enabled={!loading && !oauthLoading}
            loading={loading}
          />

          {!isAdmin && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/register', { state: { role: selectedRole } })}
                className="text-slate-300 hover:text-white transition-colors text-sm"
              >
                Don&apos;t have an account? <span className="text-white">Register</span>
              </button>
            </div>
          )}
        </form>

        {/* OAuth */}
        {!isAdmin && (
          <>
            <div className="flex items-center my-5">
              <div className="flex-1 h-px bg-slate-600/50" />
              <span className="px-3 text-slate-400 text-sm">OR</span>
              <div className="flex-1 h-px bg-slate-600/50" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleOAuthLogin('google')}
                disabled={oauthLoading}
                className="h-12 px-3 bg-slate-700/60 hover:bg-slate-700/80 border border-slate-600/60 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <GoogleGlyph />
                <span className="text-slate-100 font-semibold text-sm">Google</span>
              </button>

              <button
                onClick={() => handleOAuthLogin('github')}
                disabled={oauthLoading}
                className="h-12 px-3 bg-slate-700/60 hover:bg-slate-700/80 border border-slate-600/60 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Github className="w-5 h-5 text-slate-100" />
                <span className="text-slate-100 font-semibold text-sm">GitHub</span>
              </button>
            </div>

            <p className="text-slate-400 text-xs text-center mt-3">
              {oauthLoading ? 'Opening provider…' : 'Sign in quickly using external providers'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
