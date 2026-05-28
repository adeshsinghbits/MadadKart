'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FolderOpen, Heart, TrendingUp,
  Activity, Star, BarChart2, Award,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/admin/StatCard';
import { formatDistanceToNow } from 'date-fns';

interface Stats {
  users:     { total: number; newThisMonth: number; ngoCount: number };
  projects:  { total: number; active: number; completed: number; pending: number; newThisWeek: number };
  donations: { totalAmount: number; totalCount: number; thisMonthAmount: number; thisMonthCount: number };
  categoryBreakdown: { _id: string; count: number; raised: number }[];
  topDonors: { _id: string; total: number; count: number; user: { name: string; email: string; avatar?: string } }[];
  dailySignups: { _id: string; count: number }[];
}

const CAT_COLOUR: Record<string, string> = {
  Human: '#6366f1', Plant: '#22c55e', Animal: '#f59e0b',
  Environment: '#14b8a6', Education: '#8b5cf6', Health: '#ec4899',
};
const CAT_EMOJI: Record<string, string> = {
  Human: '🤝', Plant: '🌱', Animal: '🐾', Environment: '🌍', Education: '📚', Health: '❤️',
};

export default function AdminOverviewPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setStats(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [token]);

  const kpis = stats ? [
    {
      label: 'Total Users',
      value: stats.users.total.toLocaleString(),
      sub: `+${stats.users.newThisMonth} this month`,
      icon: <Users size={20} />,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Total Projects',
      value: stats.projects.total.toLocaleString(),
      sub: `${stats.projects.active} active · ${stats.projects.completed} completed`,
      icon: <FolderOpen size={20} />,
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Total Raised',
      value: `₹${(stats.donations.totalAmount / 100000).toFixed(1)}L`,
      sub: `₹${stats.donations.thisMonthAmount.toLocaleString()} this month`,
      icon: <Heart size={20} />,
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      label: 'Verified NGOs',
      value: stats.users.ngoCount.toLocaleString(),
      sub: `${stats.projects.newThisWeek} new projects this week`,
      icon: <Award size={20} />,
      gradient: 'from-amber-400 to-orange-500',
    },
  ] : [];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide analytics and key metrics.</p>
      </div>

      {/* KPI grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-5 h-32 skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((k, i) => <StatCard key={k.label} {...k} index={i} />)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Project status breakdown */}
        {stats && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-primary" /> Project Status</h3>
            <div className="space-y-3">
              {[
                { label: 'Active', value: stats.projects.active, total: stats.projects.total, color: '#22c55e' },
                { label: 'Completed', value: stats.projects.completed, total: stats.projects.total, color: '#6366f1' },
                { label: 'Pending Review', value: stats.projects.pending, total: stats.projects.total, color: '#f59e0b' },
              ].map(item => {
                const pct = stats.projects.total > 0 ? Math.round((item.value / stats.projects.total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground">{item.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: item.color }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Category breakdown */}
        {stats && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity size={16} className="text-primary" /> Projects by Category</h3>
            <div className="space-y-2.5">
              {stats.categoryBreakdown.slice(0, 6).map((cat, i) => {
                const colour = CAT_COLOUR[cat._id] ?? '#6366f1';
                const maxCount = stats.categoryBreakdown[0]?.count ?? 1;
                return (
                  <div key={cat._id} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center">{CAT_EMOJI[cat._id] ?? '📌'}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{cat._id}</span>
                        <span className="text-muted-foreground">{cat.count} projects</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: colour }}
                          initial={{ width: 0 }} animate={{ width: `${(cat.count / maxCount) * 100}%` }}
                          transition={{ duration: 0.7, delay: 0.1 * i }} />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      ₹{cat.raised >= 100000 ? `${(cat.raised / 100000).toFixed(1)}L` : cat.raised.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top donors */}
        {stats && stats.topDonors.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Star size={16} className="text-amber-500" /> Top Donors</h3>
            <div className="space-y-3">
              {stats.topDonors.map((d, i) => (
                <div key={d._id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <img
                    src={d.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(d.user.name)}&backgroundColor=6366f1&textColor=fff`}
                    alt={d.user.name} className="w-8 h-8 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.user.name}</p>
                    <p className="text-xs text-muted-foreground">{d.count} donation{d.count !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 shrink-0">₹{d.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Daily signups sparkline */}
        {stats && stats.dailySignups.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> Daily Signups (30d)</h3>
            <div className="flex items-end gap-1 h-24">
              {(() => {
                const max = Math.max(...stats.dailySignups.map(d => d.count), 1);
                return stats.dailySignups.map((d, i) => (
                  <motion.div key={d._id}
                    className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors cursor-default relative group"
                    style={{ height: `${(d.count / max) * 100}%`, minHeight: 4 }}
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.01 }}
                    title={`${d._id}: ${d.count} signups`}>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 whitespace-nowrap">
                      <div className="bg-foreground text-background text-[10px] rounded px-1.5 py-0.5 shadow">
                        {d.count}
                      </div>
                    </div>
                  </motion.div>
                ));
              })()}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>{stats.dailySignups[0]?._id?.slice(5)}</span>
              <span>{stats.dailySignups[stats.dailySignups.length - 1]?._id?.slice(5)}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
