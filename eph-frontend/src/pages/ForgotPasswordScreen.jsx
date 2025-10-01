// src/pages/ForgotPasswordScreen.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../components/CustomButton';
import FormInput from '../components/FormInput';
import { apiService } from '../services/apiService';

// Better icons (lucide-react)
import { KeyRound, Mail, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (emailStr) => {
    if (!emailStr.trim()) return 'Please enter your email';
    const regex = /^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!regex.test(emailStr.trim())) return 'Enter a valid email';
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
              <h1 className="text-slate-50 text-2xl font-bold">Reset your password</h1>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-cyan-300" />
            </div>
          </div>

          <p className="text-slate-300/90 mb-6 text-sm">
            Enter the email associated with your account. If it exists, we’ll send a secure link to reset your password.
          </p>

          {/* Form — force inputs to be dark */}
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
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
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
                  <AlertCircle className="w-5 h-5 text-rose-300 mt-0.5" />
                )}
                <p className={`text-sm leading-5 ${success ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {message}
                </p>
              </div>
            )}

            <CustomButton
              type="submit"
              text={loading ? 'Sending…' : 'Send reset link'}
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

export default ForgotPasswordScreen;
