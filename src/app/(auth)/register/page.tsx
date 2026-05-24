'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { FaUser } from "react-icons/fa";
import { CgOrganisation } from "react-icons/cg";
import { useAuth } from '@/context/AuthContext';
import {
  AuthCard, AuthError, AuthButton, PasswordStrength,
  inputCls, labelCls,
} from '@/components/shared/AuthCard';

const ROLES = [
  { value: 'user', label: 'Individual', emoji: <FaUser />, desc: 'Donor or volunteer' },
  { value: 'ngo', label: 'NGO / Org', emoji: <CgOrganisation />, desc: 'Register your organisation' },
];

export default function RegisterPage() {
  const { register, isLoading, error, clearError } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); clearError(); setValidationError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');
    if (form.password !== form.confirm) { setValidationError('Passwords do not match'); return; }
    if (form.password.length < 6) { setValidationError('Password must be at least 6 characters'); return; }
    await register(form.name, form.email, form.password, form.role);
  };

  const displayError = validationError || error;

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join thousands making real social impact across India."
      footer={
        <p className="text-white/50 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-slate-400 hover:text-slate-300 font-semibold transition-colors">
            Log in
          </Link>
        </p>
      }
    >
      {displayError && <AuthError message={displayError} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role selector */}
        <div>
          <label className={labelCls}>I am a…</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => set('role', r.value)}
                className={`flex items-start gap-1 px-4 py-3 rounded-xl border text-left transition-all ${
                  form.role === r.value
                    ? 'border-purple-400 bg-purple-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <span className="text-xl">{r.emoji}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-xs opacity-70">{r.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Full name */}
        <div>
          <label className={labelCls}>Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className={inputCls}
            placeholder="Aarav Sharma"
            required
            autoComplete="name"
          />
        </div>

        {/* Email */}
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

        {/* Password */}
        <div>
          <label className={labelCls}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => set('password', e.target.value)}
              className={`${inputCls} pr-11`}
              placeholder="Min. 6 characters"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <PasswordStrength password={form.password} />
        </div>

        {/* Confirm */}
        <div>
          <label className={labelCls}>Confirm password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.confirm}
              onChange={e => set('confirm', e.target.value)}
              className={`${inputCls} ${form.confirm && form.confirm !== form.password ? 'border-red-400/60' : ''}`}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            {form.confirm && form.confirm === form.password && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-sm">✓</span>
            )}
          </div>
        </div>

        <div className="pt-1">
          <AuthButton isLoading={isLoading}>
            {isLoading ? 'Creating account…' : 'Create Account →'}
          </AuthButton>
        </div>
      </form>

      <p className="mt-5 text-xs text-white/30 text-center">
        By registering you agree to our{' '}
        <Link href="/terms" className="text-white/50 hover:text-white/70 underline">Terms</Link>
        {' & '}
        <Link href="/privacy" className="text-white/50 hover:text-white/70 underline">Privacy Policy</Link>
      </p>
    </AuthCard>
  );
}