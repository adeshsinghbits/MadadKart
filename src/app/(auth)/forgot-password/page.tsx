'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import { AuthCard, AuthError, AuthSuccess, AuthButton, inputCls, labelCls } from '@/components/shared/AuthCard';
import EmailSentCard from '@/components/shared/EmailSentCard';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a secure reset link."
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/70 text-sm transition-colors">
          <ArrowLeft size={14} /> Back to login
        </Link>
      }
    >
      <AnimatePresence mode="wait">
        {success ? (
          <EmailSentCard />
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error && <AuthError message={error} />}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    className={`${inputCls} pl-10`}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="pt-1">
                <AuthButton isLoading={isLoading}>
                  {isLoading ? 'Sending reset link…' : 'Send reset link'}
                </AuthButton>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}