'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthCard, AuthError, AuthButton, inputCls, labelCls } from '@/components/shared/AuthCard';

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(form.email, form.password);
  };

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); clearError(); };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to your MadadKart account to continue making impact."
      footer={
        <p className="text-white/50 text-sm">
          Don't have an account?{' '}
          <Link href="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
            Sign up free
          </Link>
        </p>
      }
    >
      {error && <AuthError message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Email address</label>
          <input
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            className={inputCls}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace('mb-1.5', '')}>Password</label>
            <Link href="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => set('password', e.target.value)}
              className={`${inputCls} pr-11`}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="pt-1">
          <AuthButton isLoading={isLoading}>
            {isLoading ? 'Logging in…' : 'Log in'}
          </AuthButton>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <p className="text-xs text-white/30">
          By logging in you agree to our{' '}
          <Link href="/terms" className="text-white/50 hover:text-white/70 underline">Terms</Link>
          {' & '}
          <Link href="/privacy" className="text-white/50 hover:text-white/70 underline">Privacy Policy</Link>
        </p>
      </div>
    </AuthCard>
  );
}