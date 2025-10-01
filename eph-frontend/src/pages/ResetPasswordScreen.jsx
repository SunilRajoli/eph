// src/pages/ResetPasswordScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomButton from '../components/CustomButton';
import FormInput from '../components/FormInput';
import { apiService } from '../services/apiService';

// Better icons (lucide-react)
import { LockKeyhole, ArrowLeft, ShieldCheck, AlertTriangle, KeyRound } from 'lucide-react';

const ResetPasswordScreen = () => {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
        setMessage(result.message || 'Password reset successful. Redirecting to login…');
        setTimeout(() => navigate('/login'), 1200);
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
    <div className="min-h-screen flex items-center justify-center px-4
                    bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-slate-900/70 backdrop-blur-md p-6 md:p-7 rounded-2xl border border-slate-700/60 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="text-slate-200/90 hover:text-white transition-colors"
                type="button"
                aria-label="Go back"
                title="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-slate-50 text-2xl font-bold">Set a new password</h1>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-cyan-300" />
            </div>
          </div>

          {maskedToken && (
            <p className="text-slate-300/80 text-xs mb-4">
              Using token: <span className="font-mono">{maskedToken}</span>
            </p>
          )}

          {/* Form — force inputs to be dark even on paste/autofill */}
          <form
            onSubmit={handleSubmit}
            className="
              space-y-4
              [&_input]:bg-slate-800/70 [&_input]:text-slate-100 [&_input]:placeholder-slate-400
              [&_input]:border [&_input]:border-slate-700/70 [&_input]:rounded-lg
              [&_input]:px-10 [&_input]:py-2
              [&_input:focus]:outline-none [&_input:focus]:ring-2 [&_input:focus]:ring-cyan-500/50
              [&_.icon]:text-slate-300
            "
          >
            <FormInput
              type="password"
              placeholder="New password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              icon={LockKeyhole}
              showPasswordToggle
              required
            />

            <FormInput
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              icon={LockKeyhole}
              showPasswordToggle
              required
            />

            {message && (
              <div
                className={`p-3 rounded-lg border flex items-start gap-2 ${
                  success
                    ? 'bg-emerald-900/20 border-emerald-700/40'
                    : 'bg-rose-900/20 border-rose-700/40'
                }`}
              >
                {success ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-300 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-300 mt-0.5" />
                )}
                <p className={`text-sm ${success ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {message}
                </p>
              </div>
            )}

            <CustomButton
              type="submit"
              text={loading ? 'Saving…' : 'Save new password'}
              enabled={!loading}
              loading={loading}
            />

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-slate-300 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
