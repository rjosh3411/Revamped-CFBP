import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    setLoading(true);
    const token = localStorage.getItem('cfb_jwt_token');

    try {
      // Fetch demo users for easy switching
      const demoRes = await api.getDemoUsers();
      if (demoRes?.demoUsers) {
        setDemoUsers(demoRes.demoUsers);
      }

      if (token) {
        const res = await api.getMe();
        if (res?.user) {
          setUser(res.user);
        } else {
          localStorage.removeItem('cfb_jwt_token');
          setUser(null);
        }
      } else if (demoRes?.demoUsers?.length > 0) {
        // Auto-login as the first demo user (Coach Reed) if no active token exists
        const coach = demoRes.demoUsers[0];
        const switchRes = await api.switchDemoUser(coach.id);
        if (switchRes?.token) {
          localStorage.setItem('cfb_jwt_token', switchRes.token);
          setUser(switchRes.user);
        }
      }
    } catch (err) {
      console.warn('Auth initialization error:', err);
    } finally {
      setLoading(false);
    }
  }

  const login = async (loginId, password) => {
    const res = await api.login(loginId, password);
    if (res?.token && res?.user) {
      localStorage.setItem('cfb_jwt_token', res.token);
      setUser(res.user);
      setAuthModalOpen(false);
      return res.user;
    }
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res?.token && res?.user) {
      localStorage.setItem('cfb_jwt_token', res.token);
      setUser(res.user);
      setAuthModalOpen(false);
      return res.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('cfb_jwt_token');
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await api.updateProfile(data);
    if (res?.user) {
      setUser(res.user);
    }
    return res;
  };

  const switchDemo = async (userId) => {
    try {
      const res = await api.switchDemoUser(userId);
      if (res?.token && res?.user) {
        localStorage.setItem('cfb_jwt_token', res.token);
        setUser(res.user);
      }
    } catch (err) {
      console.error('Failed to switch demo user:', err);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res?.user) setUser(res.user);
    } catch (e) {}
  };

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuth = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        demoUsers,
        authModalOpen,
        authMode,
        login,
        register,
        logout,
        updateProfile,
        switchDemo,
        refreshUser,
        openAuth,
        closeAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
