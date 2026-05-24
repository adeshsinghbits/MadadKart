'use client';

import { useState } from 'react';
import { Eye, EyeOff, Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Props { token: string }

export function ChangePasswordSection({ token }: Props) {
  const [form, setForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all';

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPwd !== form.confirm) { showToast('error', 'New passwords do not match'); return; }
    if (form.newPwd.length < 6) { showToast('error', 'Password must be at least 6 characters'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('success', 'Password changed successfully!');
      setForm({ current: '', newPwd: '', confirm: '' });
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="flex items-center gap-2 text-base font-bold mb-5">
        <Shield size={16} className="text-primary" /> Change Password
      </h2>

      {toast && (
        <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm mb-4 ${toast.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Current password</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} className={`${inputCls} pr-11`} value={form.current}
              onChange={e => setForm(p => ({ ...p, current: e.target.value }))} required placeholder="••••••••" />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">New password</label>
          <input type={show ? 'text' : 'password'} className={inputCls} value={form.newPwd}
            onChange={e => setForm(p => ({ ...p, newPwd: e.target.value }))} required placeholder="Min. 6 characters" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Confirm new password</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'}
              className={`${inputCls} ${form.confirm && form.confirm !== form.newPwd ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
              value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              required placeholder="••••••••" />
            {form.confirm && form.confirm === form.newPwd && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-sm">✓</span>
            )}
          </div>
        </div>
        <button type="submit" disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50 transition-colors">
          {isLoading ? <><Loader2 size={14} className="animate-spin" /> Changing…</> : <><Shield size={14} /> Change Password</>}
        </button>
      </form>
    </div>
  );
}
