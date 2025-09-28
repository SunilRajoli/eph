// controllers/authController.js - Enhanced version
const { User } = require('../models');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const config = require('../config');

const authController = {
  // Modified login to check for force_password_change
  login: async (req, res) => {
    try {
      const { email, password, role } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Optionally check role hint (soft enforcement)
      if (role && user.role !== role) {
        return res.status(403).json({
          success: false,
          message: `User does not have the '${role}' role`
        });
      }

      // Verify password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      user.last_login = new Date();
      await user.save();

      // Generate JWT token
      const token = authService.generateToken(user);

      // Check if user must change password (for newly invited admins)
      const mustChangePassword = user.force_password_change === true;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          token,
          mustChangePassword // Frontend will redirect to change password page
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  },

  // Enhanced change password to handle force_password_change flag
  changePassword : async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If NOT a forced change, verify the current password
    if (!user.force_password_change) {
      const ok = await user.validatePassword(currentPassword);
      if (!ok) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    // Strength check
    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 chars and include upper, lower, number, and special character',
      });
    }

    // Update (model hook will hash if you use password_hash setter/hook)
    user.password_hash = newPassword;
    user.force_password_change = false;
    user.password_changed_at = new Date();
    await user.save();

    // Fire-and-forget notification
    emailService
      .sendPasswordChangedNotification(user.email, user.name)
      .then(() => logger.info('Password change notification sent', { userId: user.id }))
      .catch((err) => logger.warn('Failed to send password change notification', { error: err?.message }));

    // Return a safe user object (no sensitive fields)
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: !!user.is_verified,
      force_password_change: !!user.force_password_change,
    };

    return res.json({
      success: true,
      message: 'Password changed successfully',
      data: { user: safeUser },
    });
  } catch (error) {
    logger.error('Password change error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error?.message,
    });
  }
},

  // Modified register to prevent admin registration via public endpoint
  register: async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role = 'student',
        college,
        branch,
        year,
        company_name,
        company_website,
        team_size,
        firm_name,
        investment_stage,
        website
      } = req.body;

      // Prevent admin role registration via public endpoint
      if (role === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin accounts can only be created by existing admins'
        });
      }

      // Basic required-checks
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: { general: ['name, email and password are required'] }
        });
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: { email: ['User with this email already exists'] }
        });
      }

      // Prepare userData for non-admin users
      const userData = {
        name,
        email,
        password_hash: password,
        role: ['student', 'hiring', 'investor'].includes(role) ? role : 'student',
      };

      // Add optional fields
      if (typeof college !== 'undefined') userData.college = college;
      if (typeof branch !== 'undefined') userData.branch = branch;
      if (typeof year !== 'undefined') {
        const parsedYear = Number.isFinite(Number(year)) ? parseInt(year, 10) : null;
        if (parsedYear !== null) userData.year = parsedYear;
        else {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: { year: ['Year must be an integer'] }
          });
        }
      }

      // Create new user
      const user = await User.create(userData);

      // Generate JWT token
      const token = authService.generateToken(user);

      // Send welcome email
      emailService.sendWelcomeEmail(user.email, user.name)
        .then((result) => {
          logger.info('Welcome email queued/sent', { to: user.email, result });
        })
        .catch((err) => {
          logger.warn('Failed to send welcome email', { to: user.email, error: err?.message || err });
        });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toJSON(),
          token
        }
      });

    } catch (error) {
      logger.error('Registration error:', error?.stack || error);

      // Handle Sequelize validation errors
      if (error?.name === 'SequelizeValidationError' && Array.isArray(error.errors)) {
        const details = {};
        error.errors.forEach((e) => {
          if (!details[e.path]) details[e.path] = [];
          details[e.path].push(e.message);
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: details
        });
      }

      // Handle unique constraint errors
      if (error?.name === 'SequelizeUniqueConstraintError' || (error.parent?.code === '23505')) {
        const details = {};
        if (error?.fields) {
          Object.keys(error.fields).forEach((k) => { 
            details[k] = [`${k} must be unique`]; 
          });
        } else {
          details.email = ['Email already exists'];
        }
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: details
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error?.message || String(error)
      });
    }
  },

  // Keep all existing methods (profile, updateProfile, forgotPassword, resetPassword, etc.)
  // ... (copy from your existing authController)

  // Get current user profile
  profile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON()
        }
      });

    } catch (error) {
      logger.error('Profile fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { name, college, branch, year, skills, profile_pic_url, phone, org, country } = req.body;
      
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user data
      const updateData = {};
      if (name) updateData.name = name;
      if (college) updateData.college = college;
      if (branch) updateData.branch = branch;
      if (year) updateData.year = year;
      if (skills) updateData.skills = skills;
      if (phone) updateData.phone = phone;
      if (org) updateData.org = org;
      if (country) updateData.country = country;
      if (profile_pic_url) updateData.profile_pic_url = profile_pic_url;

      await user.update(updateData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toJSON()
        }
      });

    } catch (error) {
      logger.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  },

  // Add other existing methods here...
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findByEmail(email);

      if (!user) {
        logger.info('Password reset requested for unknown email', { email });
        return res.json({
          success: true,
          message: 'If your email is registered, you will receive a password reset link'
        });
      }

      const resetExpiry = (config?.auth?.passwordResetExpirySeconds) || 3600;
      const ipAddress = typeof req.ip === 'string' ? req.ip : (req.headers['x-forwarded-for'] || null);
      const userAgent = (req.get && req.get('User-Agent')) ? req.get('User-Agent') : (req.headers['user-agent'] || null);

      const resetRecord = await authService.createPasswordResetToken(user.id, {
        expiresInSeconds: resetExpiry,
        ipAddress: ipAddress ? String(ipAddress) : null,
        userAgent: userAgent ? String(userAgent) : null
      });

      const tokenString = resetRecord && (resetRecord.token || (typeof resetRecord.get === 'function' && resetRecord.get('token')));
      if (!tokenString) {
        logger.error('Password reset token missing after creation', { resetRecord });
        return res.status(500).json({ success: false, message: 'Failed to create password reset token' });
      }

      const scheme = (config?.app?.deepLinkScheme) || (process.env.DEEP_LINK_SCHEME || 'eph');
      const deepLink = `${scheme}://reset-password?token=${encodeURIComponent(tokenString)}`;

      const frontendBase = (process.env.FRONTEND_URL || (config?.app?.frontendUrl) || 'http://localhost:3000').replace(/\/+$/, '');
      const webFallback = `${frontendBase}/reset-password?token=${encodeURIComponent(tokenString)}`;

      await emailService.sendPasswordResetEmail(user.email, user.name, tokenString, { 
        expiresInSeconds: resetExpiry, 
        deepLink, 
        webFallback 
      });

      logger.info('Password reset email queued/sent', { to: user.email, resetId: resetRecord.id || null });
      return res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });

    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request',
        error: error?.message || String(error)
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      const resetRecord = await authService.validatePasswordResetToken(token);
      if (!resetRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      const user = await User.findByPk(resetRecord.user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.password_hash = newPassword; // Will be hashed by model hook
      await user.save();

      // Mark reset token as used
      await resetRecord.markAsUsed();

      res.json({
        success: true,
        message: 'Password reset successful'
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password',
        error: error.message
      });
    }
  },

  logout: async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  }
};

// Helper function for password strength validation
function isPasswordStrong(password) {
  if (!password || password.length < 8) return false;
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

module.exports = authController;