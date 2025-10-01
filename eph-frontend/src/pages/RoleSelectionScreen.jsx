// src/pages/RoleSelectionScreen.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../components/CustomButton';
import RoleCard from '../components/RoleCard';
import { ThemeContext } from '../context/ThemeContext.jsx';

// ✅ New icons from lucide-react
import {
  GraduationCap,      // student
  ShieldCheck,        // admin
  Sparkles,           // header badge
} from 'lucide-react';

const RoleSelectionScreen = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();
  const theme = useContext(ThemeContext);

  // ✅ Cleaner roles with better icons & micro copy
  const roles = [
    {
      key: 'student',
      title: 'Student',
      subtitle: 'Showcase projects, join competitions & learn by doing.',
      icon: ({ className }) => <GraduationCap className={className} />,
    },
    {
      key: 'admin',
      title: 'Admin',
      subtitle: 'Create & manage competitions, teams, and results.',
      icon: ({ className }) => <ShieldCheck className={className} />,
    },
  ];

  const handleContinue = () => {
    if (selectedRole) navigate('/login', { state: { role: selectedRole } });
  };

  const handleSkip = () => navigate('/login');

  return (
    <div
      className="
        min-h-screen relative overflow-hidden
        flex items-center
        bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-950
      "
      // fallback to ThemeContext gradient if you want to keep that option:
      style={theme?.gradient ? { backgroundImage: theme.gradient } : undefined}
    >
      {/* Decorative blobs (subtle) */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="safe-area w-full px-5 py-10">
        {/* Header */}
        <div className="max-w-5xl mx-auto flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight">
                Choose your role
              </h1>
              <p className="text-slate-300 text-sm">We’ll tailor the experience for you.</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-white/80 hover:text-white transition-colors text-sm md:text-base"
          >
            Skip
          </button>
        </div>

        {/* Intro card */}
        <div className="max-w-5xl mx-auto bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-2xl border border-white/10 mb-8">
          <p className="text-slate-200/90 text-sm md:text-base">
            Pick a role to get relevant actions, dashboards, and quick-start tips. You can switch
            later in your profile settings.
          </p>
        </div>

        {/* Roles */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mb-10">
          {roles.map((role) => (
            <button
              key={role.key}
              type="button"
              onClick={() => setSelectedRole(role.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedRole(role.key);
                }
              }}
              className={[
                "group text-left rounded-2xl p-4 md:p-5",
                "bg-white/5 border border-white/10 backdrop-blur-xl",
                "hover:bg-white/10 hover:border-white/20 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-cyan-400/40",
                selectedRole === role.key ? "ring-2 ring-cyan-400/50" : "",
              ].join(" ")}
            >
              <div className="flex items-start gap-4">
                <div className={[
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br from-cyan-500/20 to-cyan-400/10",
                  "border border-white/10 shadow-inner",
                  "group-hover:from-cyan-500/30 group-hover:to-cyan-400/20 transition-colors",
                ].join(" ")}>
                  <role.icon className="w-6 h-6 text-cyan-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg">{role.title}</h3>
                    {selectedRole === role.key && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 mt-1">{role.subtitle}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Continue button */}
        <div className="max-w-md mx-auto">
          <CustomButton
            text={selectedRole ? `Continue as ${selectedRole.toUpperCase()}` : 'Select a role to continue'}
            enabled={!!selectedRole}
            onPressed={handleContinue}
          />
          {/* <p className="mt-3 text-slate-300 text-xs text-center">
            You can change role later in profile settings.
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionScreen;
