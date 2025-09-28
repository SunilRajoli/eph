// src/context/AuthProvider.jsx
import React, { useReducer, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'SET_MUST_CHANGE_PASSWORD':
      return { ...state, mustChangePassword: action.payload };
    case 'CLEAR_AUTH':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        mustChangePassword: false,
        loading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isAuthenticated: false,
    mustChangePassword: false,
    loading: true,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = authService.getToken();
      const user = authService.getUser();

      if (token && user) {
        dispatch({ type: 'SET_AUTH', payload: { user, token } });
        if (user.force_password_change) {
          dispatch({ type: 'SET_MUST_CHANGE_PASSWORD', payload: true });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      if (response.success) {
        const { user, token, mustChangePassword } = response.data;
        authService.saveToken(token);
        authService.saveUser(user);
        dispatch({ type: 'SET_AUTH', payload: { user, token } });
        if (mustChangePassword || user.force_password_change) {
          dispatch({ type: 'SET_MUST_CHANGE_PASSWORD', payload: true });
        }
        return { success: true, mustChangePassword: mustChangePassword || user.force_password_change };
      }
      return response;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      if (response.success) {
        const { user, token } = response.data;
        authService.saveToken(token);
        authService.saveUser(user);
        dispatch({ type: 'SET_AUTH', payload: { user, token } });
      }
      return response;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      authService.clearToken();
      dispatch({ type: 'CLEAR_AUTH' });
    }
  };

  const clearMustChangePassword = () => {
    dispatch({ type: 'SET_MUST_CHANGE_PASSWORD', payload: false });
  };

  const value = { ...state, login, register, logout, clearMustChangePassword };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};