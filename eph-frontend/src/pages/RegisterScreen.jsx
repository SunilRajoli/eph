// src/pages/RegisterScreen.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CustomButton from '../components/CustomButton';
import FormInput from '../components/FormInput';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { apiService } from '../services/apiService';

// Icons
const PersonIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const EmailIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
  </svg>
);
const LockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const SchoolIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
  </svg>
);
const BusinessIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const LinkIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);
const GoogleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);
const GitHubIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    college: '', branch: '', year: '',
    companyName: '', companyWebsite: '', teamSize: '',
    firmName: '', investmentStage: '', firmWebsite: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const theme = useContext(ThemeContext);

  const selectedRole = location.state?.role || 'student';

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email.trim())) newErrors.email = 'Enter valid email';
    if (!formData.password || formData.password.length < 6) newErrors.password = '6+ chars';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (selectedRole === 'admin') {
      setErrorMsg('Admin accounts are invite-only. Use the admin magic link.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: selectedRole,
      };

      if (selectedRole === 'student') {
        if (formData.college.trim()) payload.college = formData.college.trim();
        if (formData.branch.trim()) payload.branch = formData.branch.trim();
        const y = parseInt(formData.year.trim(), 10);
        if (!isNaN(y)) payload.year = y;
      } else if (selectedRole === 'hiring') {
        if (formData.companyName.trim()) payload.company_name = formData.companyName.trim();
        if (formData.companyWebsite.trim()) payload.company_website = formData.companyWebsite.trim();
        const t = parseInt(formData.teamSize.trim(), 10);
        if (!isNaN(t)) payload.team_size = t;
      } else if (selectedRole === 'investor') {
        if (formData.firmName.trim()) payload.firm_name = formData.firmName.trim();
        if (formData.investmentStage.trim()) payload.investment_stage = formData.investmentStage.trim();
        if (formData.firmWebsite.trim()) payload.website = formData.firmWebsite.trim();
      }

      const result = await register(payload);
      if (result.success) {
        navigate('/main', { replace: true, state: { tab: 'competitions' } });
      } else {
        let friendly = result.message || 'Registration failed';
        if (result.errors) {
          if (typeof result.errors === 'object') {
            friendly = Object.entries(result.errors)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join('\n');
          } else if (Array.isArray(result.errors)) {
            friendly = result.errors.join('\n');
          }
        }
        setErrorMsg(friendly);
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
      // Redirect to the OAuth provider
      window.location.href = authUrl;
    } else {
      throw new Error('Failed to get OAuth URL');
    }
    
  } catch (err) {
    console.error('OAuth error:', err);
    setErrorMsg(`Failed to initiate ${provider} login: ${err.message}`);
  } finally {
    setOauthLoading(false);
  }
};

// Alternative approach if you want to open in a popup:
const handleOAuthLoginPopup = async (provider) => {
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
      // Open popup for OAuth
      const popup = window.open(
        authUrl,
        `${provider}_oauth`,
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      // Listen for the popup to close or send a message
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setOauthLoading(false);
          // You might want to check if login was successful here
          // This would require additional implementation
        }
      }, 1000);
      
    } else {
      throw new Error('Failed to get OAuth URL');
    }
    
  } catch (err) {
    console.error('OAuth error:', err);
    setErrorMsg(`Failed to initiate ${provider} login: ${err.message}`);
    setOauthLoading(false);
  }
};

  const renderRoleSpecificFields = () => {
    if (selectedRole === 'student') {
      return (
        <>
          <FormInput
            placeholder="College"
            value={formData.college}
            onChange={(e) => handleInputChange('college', e.target.value)}
            icon={SchoolIcon}
          />
          <FormInput
            placeholder="Branch"
            value={formData.branch}
            onChange={(e) => handleInputChange('branch', e.target.value)}
            icon={SchoolIcon}
          />
          <FormInput
            type="number"
            inputMode="numeric"
            placeholder="Year (e.g. 3)"
            value={formData.year}
            onChange={(e) => handleInputChange('year', e.target.value)}
            icon={SchoolIcon}
          />
        </>
      );
    }
    if (selectedRole === 'hiring') {
      return (
        <>
          <FormInput
            placeholder="Company name"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            icon={BusinessIcon}
          />
          <FormInput
            placeholder="Company website"
            value={formData.companyWebsite}
            onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
            icon={LinkIcon}
          />
          <FormInput
            type="number"
            inputMode="numeric"
            placeholder="Team size"
            value={formData.teamSize}
            onChange={(e) => handleInputChange('teamSize', e.target.value)}
            icon={BusinessIcon}
          />
        </>
      );
    }
    if (selectedRole === 'investor') {
      return (
        <>
          <FormInput
            placeholder="Firm / Angel name"
            value={formData.firmName}
            onChange={(e) => handleInputChange('firmName', e.target.value)}
            icon={BusinessIcon}
          />
          <FormInput
            placeholder="Investment stage (seed/series A)"
            value={formData.investmentStage}
            onChange={(e) => handleInputChange('investmentStage', e.target.value)}
            icon={BusinessIcon}
          />
          <FormInput
            placeholder="Website / portfolio"
            value={formData.firmWebsite}
            onChange={(e) => handleInputChange('firmWebsite', e.target.value)}
            icon={LinkIcon}
          />
        </>
      );
    }
    return null;
  };

  return (
    <div
      className="min-h-screen bg-gradient-primary flex items-center justify-center px-4"
      style={{ backgroundImage: theme?.gradient }} // ThemeContext fallback
    >
      <div className="mx-auto w-full max-w-lg bg-white/10 backdrop-blur-xs p-4 md:p-6 rounded-xl border border-white/20">
        {/* Top bar INSIDE the card */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-white/90 hover:text-white transition-colors text-3xl 9xl:text-base"
              type="button"
            >
              ←
            </button>
            <h1 className="text-white text-xl md:text-2xl font-bold">Register</h1>
          </div>
          {selectedRole && (
            <div className="bg-white/10 px-3 py-1.5 rounded-full">
              <span className="text-white/80 font-semibold text-xs md:text-sm">
                {selectedRole.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center">
            <PersonIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-white text-xl font-semibold">Create account</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-3">
          <FormInput
            placeholder="Full name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            icon={PersonIcon}
            required
          />
          <FormInput
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            icon={EmailIcon}
            required
          />
          <FormInput
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            error={errors.password}
            icon={LockIcon}
            showPasswordToggle
            required
          />

          {/* Role-specific */}
          {renderRoleSpecificFields()}

          {/* Error */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-400/30 text-red-300 text-sm p-3 rounded-lg whitespace-pre-line">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <CustomButton
            type="submit"
            text={loading ? 'Creating...' : 'Register'}
            enabled={!loading}
            loading={loading}
          />

          {/* Login link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login', { state: { role: selectedRole } })}
              className="text-white/80 hover:text-white transition-colors text-sm"
            >
              Already have an account? Login
            </button>
          </div>
        </form>

        {/* OAuth */}
        <div className="flex items-center my-5">
          <div className="flex-1 h-px bg-white/20" />
          <span className="px-3 text-white/70 text-sm">OR</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={oauthLoading}
            className="h-12 px-3 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <GoogleIcon className="w-5 h-5 text-white/80" />
            <span className="text-white/80 font-semibold text-sm">Google</span>
          </button>

          <button
            onClick={() => handleOAuthLogin('github')}
            disabled={oauthLoading}
            className="h-12 px-3 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <GitHubIcon className="w-5 h-5 text-white/80" />
            <span className="text-white/80 font-semibold text-sm">GitHub</span>
          </button>
        </div>

        <p className="text-white/70 text-xs text-center mt-3">
          {oauthLoading ? 'Opening provider…' : 'Register quickly using external providers'}
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
