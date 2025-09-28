// src/pages/RoleSelectionScreen.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../components/CustomButton';
import RoleCard from '../components/RoleCard';
import { ThemeContext } from '../context/ThemeContext.jsx';

const SchoolIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7" />
  </svg>
);

const WorkIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
  </svg>
);

const MoneyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const AdminIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const RoleSelectionScreen = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();
  const theme = useContext(ThemeContext);

  const roles = [
    { key: 'student',  title: 'Student',  subtitle: 'Showcase projects & join competitions', icon: SchoolIcon },
    { key: 'hiring',   title: 'Hiring',   subtitle: 'Discover talents & post opportunities', icon: WorkIcon },
    { key: 'investor', title: 'Investor', subtitle: 'Find startups & promising projects',    icon: MoneyIcon },
    { key: 'admin',    title: 'Admin',    subtitle: 'Manage competitions & platform',        icon: AdminIcon },
  ];

  const handleContinue = () => {
    if (selectedRole) navigate('/login', { state: { role: selectedRole } });
  };

  const handleSkip = () => navigate('/login');

  return (
    <div
      className="
        min-h-screen
        bg-gradient-primary    /* uses tailwind.config.js backgroundImage */
        flex items-center
      "
      /* fallback to ThemeContext gradient if class not present for any reason */
      style={{ backgroundImage: theme?.gradient }}
    >
      <div className="safe-area w-full px-5 py-6">
        {/* Header */}
        <div className="max-w-5xl mx-auto flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">⚙</span>
            </div>
            <h1 className="text-white text-2xl md:text-3xl font-bold">Choose your role</h1>
          </div>
          <button
            onClick={handleSkip}
            className="text-white/80 hover:text-white transition-colors text-sm md:text-base"
          >
            Skip
          </button>
        </div>

        {/* Intro card */}
        <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-xs p-4 md:p-5 rounded-xl border border-white/20 mb-6">
          <p className="text-white/80 text-sm md:text-base">
            Select a role that best describes you. This helps tailor the experience and show relevant content.
          </p>
        </div>

        {/* Role grid (responsive) */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mb-8">
          {roles.map((role) => (
            <RoleCard
              key={role.key}
              title={role.title}
              subtitle={role.subtitle}
              icon={role.icon}
              selected={selectedRole === role.key}
              onTap={() => setSelectedRole(role.key)}
            />
          ))}
        </div>

        {/* Continue button */}
        <div className="max-w-md mx-auto">
          <CustomButton
            text={selectedRole ? `Continue as ${selectedRole.toUpperCase()}` : 'Select a role to continue'}
            enabled={!!selectedRole}
            onPressed={handleContinue}
          />
          <p className="mt-3 text-white/75 text-xs text-center">
            You can change role later in profile settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionScreen;
