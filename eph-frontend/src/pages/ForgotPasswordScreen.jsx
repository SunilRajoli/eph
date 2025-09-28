// src/pages/ForgotPasswordScreen.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../components/CustomButton';
import FormInput from '../components/FormInput';
import { apiService } from '../services/apiService';

const LockResetIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const EmailIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
    />
  </svg>
);

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    if (!email.trim()) return 'Please enter your email';
    const regex = /^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!regex.test(email.trim())) return 'Enter a valid email';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setMessage(emailError);
      setSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');
    setSuccess(false);

    try {
      const result = await apiService.forgotPassword(email.trim());

      if (result.success) {
        setSuccess(true);
        setMessage(result.message || 'If your email exists, a reset link has been sent.');
      } else {
        setSuccess(false);
        setMessage(result.message || 'An error occurred. Please try again.');
      }
    } catch (error) {
      setSuccess(false);
      setMessage(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <LockResetIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-white text-xl font-bold flex-1">Reset your password</h1>
          </div>

          <p className="text-white/70 mb-6 text-sm">
            Enter the email associated with your account. We will send a password reset link if the
            email exists.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={EmailIcon}
              required
            />

            {message && (
              <div
                className={`p-3 rounded-lg ${
                  success ? 'bg-green-800/20' : 'bg-red-800/20'
                }`}
              >
                <p className={`text-sm ${success ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </p>
              </div>
            )}

            <CustomButton
              type="submit"
              text={loading ? 'Sending...' : 'Send reset link'}
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

export default ForgotPasswordScreen;
