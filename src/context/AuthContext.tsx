import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types.js';
import { api } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: Role) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = api.getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.get('/api/auth/me');
      setUser(data.user);
    } catch {
      api.removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // api.ts fires this the moment ANY authenticated request gets a real 401
    // (token expired / bad signature) - not just on startup. Token is already
    // cleared from localStorage by api.ts before this fires; we just need to
    // clear the in-memory user so ProtectedLayout redirects to /login.
    const handleAuthExpired = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener('skillbridge:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('skillbridge:auth-expired', handleAuthExpired);
  }, []);

  const login = async (email: string, password = 'demo1234') => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      api.setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData: any) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', formData);
      api.setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignore
    } finally {
      api.removeToken();
      setUser(null);
    }
  };

  const switchDemoRole = async (targetRole: Role) => {
    setLoading(true);
    try {
      let email = 'learner@capacityconnect.demo';
      if (targetRole === 'TRAINER') {
        email = 'trainer@capacityconnect.demo';
      } else if (targetRole === 'ADMIN') {
        email = 'admin@capacityconnect.demo';
      }
      const res = await api.post('/api/auth/login', { email, password: 'demo1234' });
      api.setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
        refreshUser
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
