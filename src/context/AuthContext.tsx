'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'ngo' | 'admin';
  avatar?: string;
  isVerified: boolean;
  isNGO?: boolean;
  ngoVerified?: boolean;
  impactScore?: number;
  badges?: any[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ user: null, token: null, isLoading: true, error: null });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        setState({ user: JSON.parse(user), token, isLoading: false, error: null });
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setState({ user: null, token: null, isLoading: false, error: null });
      }
    } else {
      setState(p => ({ ...p, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState(p => ({ ...p, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setState({ user: data.user, token: data.token, isLoading: false, error: null });
      router.push('/dashboard');
    } catch (e) {
      setState(p => ({ ...p, isLoading: false, error: e instanceof Error ? e.message : 'Login failed' }));
    }
  }, [router]);

  const register = useCallback(async (name: string, email: string, password: string, role = 'user') => {
    setState(p => ({ ...p, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setState({ user: data.user, token: data.token, isLoading: false, error: null });
      router.push('/dashboard');
    } catch (e) {
      setState(p => ({ ...p, isLoading: false, error: e instanceof Error ? e.message : 'Registration failed' }));
    }
  }, [router]);

  const logout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setState({ user: null, token: null, isLoading: false, error: null });
    router.push('/');
  }, [router]);

  const updateUser = useCallback((user: AuthUser) => {
    localStorage.setItem('user', JSON.stringify(user));
    setState(p => ({ ...p, user }));
  }, []);

  const clearError = useCallback(() => setState(p => ({ ...p, error: null })), []);

  return (
    <AuthContext.Provider value={{
      ...state,
      isAuthenticated: !!state.token && !!state.user,
      login, register, logout, updateUser, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}