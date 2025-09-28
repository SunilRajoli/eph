// src/pages/ChangePasswordScreen.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CustomButton from '../components/CustomButton';
import FormInput from '../components/FormInput';
import { apiService } from '../services/apiService';
import { ThemeContext } from '../context/ThemeContext.jsx';

const LockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ArrowLeftIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ChangePasswordScreen = ({ isForced = false }) => {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const { mustChangePassword, clearMustChangePassword } = useAuth();
  const theme = useContext(ThemeContext);

  const actuallyForced = isForced || mustChangePassword;

  const validatePassword = (password) => {
    if (!password || password.length < 8) return 'Password must be at least 8 characters';
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return 'Must include upper, lower, number & special';
    }
    return null;
  };

  const handleInputChange = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) return setErrorMsg(passwordError);
    if (formData.newPassword !== formData.confirmPassword) return setErrorMsg('New passwords do not match');
    if (!actuallyForced && !formData.currentPassword) return setErrorMsg('Current password is required');

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await apiService.changePassword({
        currentPassword: actuallyForced ? null : formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (result?.success) {
        if (actuallyForced) clearMustChangePassword(); // unblocks the guard
        alert('Password changed successfully!');
        navigate('/main', { replace: true }); // go to dashboard
      } else {
        setErrorMsg(result?.message || 'Failed to change password');
      }
    } catch (err) {
      setErrorMsg(err?.message ? `Error: ${err.message}` : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center px-4" style={{ backgroundImage: theme?.gradient }}>
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-xs p-5 md:p-6 rounded-xl border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="text-white/80 hover:text-white transition-colors">
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-white text-lg md:text-xl font-bold">
              {actuallyForced ? 'Set New Password' : 'Change Password'}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!actuallyForced && (
            <FormInput
              type="password"
              placeholder="Current Password"
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              icon={LockIcon}
              showPasswordToggle
              required
            />
          )}

          <FormInput
            type="password"
            placeholder="New Password"
            value={formData.newPassword}
            onChange={(e) => handleInputChange('newPassword', e.target.value)}
            icon={LockIcon}
            showPasswordToggle
            required
          />

          <FormInput
            type="password"
            placeholder="Confirm New Password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            icon={LockIcon}
            showPasswordToggle
            required
          />

          <p className="text-white/70 text-xs">• 8+ chars • Upper & lower • Number • Special</p>

          {errorMsg && (
            <div className="bg-red-800/20 p-3 rounded-lg">
              <p className="text-red-400 text-sm">{errorMsg}</p>
            </div>
          )}

          <CustomButton
            type="submit"
            text={loading ? 'Updating...' : actuallyForced ? 'Set Password' : 'Change Password'}
            enabled={!loading}
            loading={loading}
          />
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordScreen;
