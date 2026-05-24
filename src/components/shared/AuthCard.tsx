import Link from 'next/link';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-md mx-auto">

      {/* Card */}
      <div className="bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-white/60 mt-1.5 text-sm leading-relaxed">{subtitle}</p>}
        </div>
        {children}
      </div>

      {footer && (
        <div className="mt-5 text-center">{footer}</div>
      )}
    </div>
  );
}

export const inputCls = [
  'w-full px-4 py-3 rounded-xl text-sm',
  'bg-white/10 border border-white/15 text-white placeholder:text-white/40',
  'focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20',
  'transition-all duration-200',
].join(' ');

export const labelCls = 'block text-sm font-medium text-white/80 mb-1.5';

export function AuthError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-red-500/15 border border-red-400/30 text-red-300 rounded-xl px-4 py-3 text-sm mb-5">
      <span className="text-base leading-none mt-0.5 shrink-0">⚠️</span>
      <p>{message}</p>
    </div>
  );
}

export function AuthSuccess({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 rounded-xl px-4 py-3 text-sm mb-5">
      <span className="text-base leading-none mt-0.5 shrink-0">✅</span>
      <p>{message}</p>
    </div>
  );
}

export function AuthButton({ children, isLoading, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }) {
  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className="w-full py-3 rounded-xl bg-linear-to-r from-slate-800 to-black text-white font-semibold text-sm
        hover:from-slate-800 hover:to-slate-900 disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
    >
      {isLoading && (
        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      )}
      {children}
    </button>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 6 characters', ok: password.length >= 6 },
    { label: 'Contains a number', ok: /\d/.test(password) },
    { label: 'Contains uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Contains special char', ok: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const label = ['', 'Weak', 'Fair', 'Good', 'Strong'][score];
  const color = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'][score];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? color : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {checks.map(c => (
            <span key={c.label} className={`text-[11px] ${c.ok ? 'text-emerald-400' : 'text-white/30'}`}>
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        {label && <span className={`text-xs font-semibold ${score === 4 ? 'text-emerald-400' : score >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{label}</span>}
      </div>
    </div>
  );
}
