import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  gradient: string;
  trend?: number; // % change
  index?: number;
}

export function StatCard({ label, value, sub, icon, gradient, trend, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
      className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center text-white shadow-sm`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-emerald-100 text-emerald-700'
            : trend < 0 ? 'bg-red-100 text-red-700'
            : 'bg-muted text-muted-foreground'
          }`}>
            {trend > 0 ? <TrendingUp size={11} /> : trend < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}
