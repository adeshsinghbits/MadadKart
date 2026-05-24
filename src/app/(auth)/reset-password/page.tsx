'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';
import {
  AuthCard, AuthError, AuthButton, PasswordStrength,
  inputCls, labelCls,
} from '@/components/shared/AuthCard';

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [tokenStatus, setTokenStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [userName, setUserName] = useState('');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !email) { setTokenStatus('invalid'); return; }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        setTokenStatus(data.valid ? 'valid' : 'invalid');
        if (data.valid && data.name) setUserName(data.name);
      })
      .catch(() => setTokenStatus('invalid'));
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenStatus === 'checking') {
    return (
      <AuthCard title="Verifying link…">
        <div className="flex flex-col items-center py-8 gap-3">
          <span className="w-10 h-10 rounded-full border-2 border-slate-400/30 border-t-slate-400 animate-spin" />
          <p className="text-white/50 text-sm">Checking your reset link…</p>
        </div>
      </AuthCard>
    );
  }

  if (tokenStatus === 'invalid') {
    return (
      <AuthCard title="Link expired or invalid" footer={
        <Link href="/forgot-password" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/70 text-sm transition-colors">
          <ArrowLeft size={14} /> Request a new link
        </Link>
      }>
        <div className="text-center py-4">
          <div className="text-5xl mb-4">🔗</div>
          <p className="text-white/60 text-sm leading-relaxed">
            This password reset link is invalid or has expired. Reset links are only valid for <strong className="text-white/80">1 hour</strong>.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={userName ? `Hi ${userName.split(' ')[0]}, set a new password` : 'Set a new password'}
      subtitle="Choose a strong password you haven't used before."
      footer={
        !success && (
          <Link href="/login" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/70 text-sm transition-colors">
            <ArrowLeft size={14} /> Back to login
          </Link>
        )
      }
    >
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Password reset!</h3>
            <p className="text-white/60 text-sm mb-6">Your password has been changed. You can now log in with your new credentials.</p>
            <Link href="/login"
              className="inline-block px-6 py-3 rounded-xl bg-linear-to-r from-slate-500 to-slate-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25">
              Go to Login →
            </Link>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error && <AuthError message={error} />}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setError(''); }}
                    className={`${inputCls} pr-11`}
                    placeholder="Min. 6 characters"
                    required
                    autoFocus
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
              </div>
              <div>
                <label className={labelCls}>Confirm new password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={e => { setForm(p => ({ ...p, confirm: e.target.value })); setError(''); }}
                    className={`${inputCls} ${form.confirm && form.confirm !== form.password ? 'border-red-400/60' : ''}`}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                  />
                  {form.confirm && form.confirm === form.password && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">✓</span>
                  )}
                </div>
              </div>
              <div className="pt-1">
                <AuthButton isLoading={isLoading}>
                  {isLoading ? 'Resetting password…' : 'Reset password'}
                </AuthButton>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthCard title="Loading…">
        <div className="flex justify-center py-8">
          <span className="w-8 h-8 rounded-full border-2 border-purple-400/30 border-t-slate-400 animate-spin" />
        </div>
      </AuthCard>
    }>
      <ResetPasswordInner />
    </Suspense>
  );
}