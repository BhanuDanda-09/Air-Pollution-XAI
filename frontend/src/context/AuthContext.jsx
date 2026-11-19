import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import userService from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [healthProfile, setHealthProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  const isAuthenticated = Boolean(user && authService.getToken() && !localStorage.getItem('demo_role'));

  // Load latest user profile and persistent health profile
  const refreshUser = useCallback(async () => {
    if (!authService.getToken() || localStorage.getItem('demo_role')) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await authService.getMe();
      if (res?.user) {
        setUser(res.user);
        if (res.health_profile) {
          setHealthProfile(res.health_profile);
        }
      }
    } catch (err) {
      console.warn('Session verification notice:', err?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Listen for global logout events dispatched by Axios interceptor
    const handleLogoutEvent = () => {
      authService.clearSession();
      setUser(null);
      setHealthProfile(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, [refreshUser]);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res?.user) {
      setUser(res.user);
      if (res.health_profile) {
        setHealthProfile(res.health_profile);
      }
      setIsAuthModalOpen(false);
    }
    return res;
  };

  const register = async (email, password, name) => {
    const res = await authService.register(email, password, name);
    if (res?.user) {
      setUser(res.user);
      if (res.health_profile) {
        setHealthProfile(res.health_profile);
      }
      setIsAuthModalOpen(false);
    }
    return res;
  };

  const logout = () => {
    authService.clearSession();
    setUser(null);
    setHealthProfile(null);
  };

  const updateHealthProfile = async (profileData) => {
    if (!isAuthenticated) return null;
    const updated = await userService.updateProfile(profileData);
    if (updated) {
      setHealthProfile(updated);
    }
    return updated;
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        healthProfile,
        isAuthenticated,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        login,
        register,
        logout,
        updateHealthProfile,
        refreshUser,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
