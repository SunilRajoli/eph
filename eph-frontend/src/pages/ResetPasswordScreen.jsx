// src/pages/ResetPasswordScreen.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomButton from '../components/CustomButton';
import FormInput from '../components/FormInput';
import { apiService } from '../services/apiService';
import { ThemeContext } from '../context/ThemeContext.jsx';

const LockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ResetPasswordScreen = () => {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useContext(ThemeContext);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    setToken(tokenFromUrl);
  }, [searchParams]);

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Use 6+ characters';
    return null;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setMessage(passwordError);
      setSuccess(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setSuccess(false);
      return;
    }

    if (!token) {
      setMessage('Missing reset token. Use the link sent to your email.');
      setSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await apiService.resetPassword(token, formData.password);

      if (result.success) {
        setSuccess(true);
        setMessage(result.message || 'Password reset successful. Please login.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setSuccess(false);
        setMessage(result.message || 'Reset failed. The token may be invalid or expired.');
      }
    } catch (error) {
      setSuccess(false);
      setMessage(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const maskedToken = token ? `${token.slice(0, 8)}…` : null;

  return (
    <div
      className="min-h-screen bg-gradient-primary flex items-center justify-center px-4"
      style={{ backgroundImage: theme?.gradient }} // fallback to ThemeContext gradient
    >
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
              <LockIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-white text-xl font-bold">Set a new password</h1>
          </div>

          {maskedToken && (
            <p className="text-white/70 text-xs mb-4">
              Using token: {maskedToken} (hidden)
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              type="password"
              placeholder="New password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              icon={LockIcon}
              showPasswordToggle
              required
            />

            <FormInput
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              icon={LockIcon}
              showPasswordToggle
              required
            />

            {message && (
              <div className={`p-3 rounded-lg ${success ? 'bg-green-800/20' : 'bg-red-800/20'}`}>
                <p className={`text-sm ${success ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </p>
              </div>
            )}

            <CustomButton
              type="submit"
              text={loading ? 'Saving...' : 'Save new password'}
              enabled={!loading}
              loading={loading}
            />

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-white/70 hover:text-white transition-colors text-sm"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
