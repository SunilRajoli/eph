import React, { useState } from 'react';

const FormInput = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: IconComponent,
  showPasswordToggle = false,
  required = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      <div
        className={[
          'relative rounded-lg border transition-all duration-200 backdrop-blur-xs',
          // base glass
          'bg-white/10 border-white/20',
          // focus style
          focused ? 'bg-white/15 border-white/30 ring-2 ring-white/20' : '',
          // error style
          error ? 'border-red-400/50 ring-1 ring-red-400/30' : '',
        ].join(' ')}
      >
        {IconComponent && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <IconComponent className="w-5 h-5 text-white/70" />
          </div>
        )}

        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          className={[
            'w-full h-12 px-4 bg-transparent text-white placeholder-white/70',
            'focus:outline-none appearance-none autofill:bg-transparent',
            IconComponent ? 'pl-10' : '',
            showPasswordToggle ? 'pr-10' : '',
          ].join(' ')}
          {...props}
        />

        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? (
              <EyeOffIcon className="w-5 h-5 text-white/70" />
            ) : (
              <EyeIcon className="w-5 h-5 text-white/70" />
            )}
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

// simple inline icons
const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

export default FormInput;
