'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Heart, Users, Star, PlusCircle, Folder,
  Bell, ChevronRight, BadgeCheck, LayoutGrid,
  Clock, Target, Zap, Award, Edit3, Trash2, CheckCircle,
  BarChart2, Loader2, MapPin,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { BadgeDisplay } from '@/components/shared/BadgeDisplay';
import { ImpactScore } from '@/components/shared/ImpactScore';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProjectCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { formatDistanceToNow } from 'date-fns';

/* ──────────────────────────────────────────────────────────────── */
/*  Types                                                           */
/* ──────────────────────────────────────────────────────────────── */
interface DashboardStats {
  totalDonated: number;
  volunteeringHours: number;
  impactScore: number;
  badges: any[];
  streakDays: number;
}

interface Donation {
  _id: string;
  projectId: { _id: string; title: string; images?: string[]; category: string } | null;
  amount?: number;
  items?: { name: string; quantity: number }[];
  type: string;
  message?: string;
  isAnonymous: boolean;
  donatedAt: string;
  receiptId?: string;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  sender?: { name: string; avatar?: string };
}

/* ──────────────────────────────────────────────────────────────── */
/*  Helpers                                                         */
/* ──────────────────────────────────────────────────────────────── */
const avatar = (name: string, url?: string) =>
  url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1&textColor=fff`;

const NOTIF_ICON: Record<string, string> = {
  new_follower: '👤', new_donation: '💰', project_completed: '🏆',
  volunteer_accepted: '✅', volunteer_rejected: '❌',
  milestone_completed: '🎯', project_update: '📢', new_volunteer: '🙋',
};

const CAT_COLOUR: Record<string, string> = {
  Human: '#6366f1', Plant: '#22c55e', Animal: '#f59e0b',
  Environment: '#14b8a6', Education: '#8b5cf6', Health: '#ec4899',
};

/* ──────────────────────────────────────────────────────────────── */
/*  Component                                                       */
/* ──────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'donations' | 'notifications'>('overview');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login?redirect=/dashboard');
  }, [authLoading, isAuthenticated, router]);

  /* ── Load all data ───────────────────────────────────────── */
  const loadData = useCallback(async () => {
    if (!user || !token) return;
    setIsLoadingData(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [projRes, donRes, notifRes] = await Promise.all([
        fetch(`/api/users/${user._id}`),
        fetch('/api/donations', { headers }),
        fetch('/api/notifications', { headers }),
      ]);

      if (projRes.ok) {
        const d = await projRes.json();
        setMyProjects(d.createdProjects || []);
        setStats({
          totalDonated: d.user?.totalDonated ?? 0,
          volunteeringHours: d.user?.volunteeringHours ?? 0,
          impactScore: d.user?.impactScore ?? 0,
          badges: d.user?.badges ?? [],
          streakDays: d.user?.streakDays ?? 0,
        });
      }

      if (donRes.ok) {
        const d = await donRes.json();
        setDonations(d.donations || []);
      }

      if (notifRes.ok) {
        const d = await notifRes.json();
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      }
    } catch {}
    setIsLoadingData(false);
  }, [user, token]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Mark notifications read ────────────────────────────── */
  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    setUnreadCount(0);
  };

  /* ── Delete project ─────────────────────────────────────── */
  const handleDelete = async (projectId: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setDeletingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMyProjects(p => p.filter(x => x._id !== projectId));
    } catch {}
    setDeletingId(null);
  };

  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  /* ── KPI summary stats ───────────────────────────────────── */
  const kpis = [
    {
      label: 'Impact Score',
      value: stats?.impactScore ?? user?.impactScore ?? 0,
      icon: <TrendingUp size={18} />,
      colour: 'from-violet-500 to-purple-600',
      suffix: 'pts',
    },
    {
      label: 'Total Donated',
      value: `₹${(stats?.totalDonated ?? 0).toLocaleString()}`,
      icon: <Heart size={18} />,
      colour: 'from-pink-500 to-rose-500',
    },
    {
      label: 'Projects Created',
      value: myProjects.length,
      icon: <Folder size={18} />,
      colour: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Donations Made',
      value: donations.length,
      icon: <Star size={18} />,
      colour: 'from-amber-400 to-orange-500',
    },
  ];

  const TABS = [
    { key: 'overview', label: 'Overview', icon: <LayoutGrid size={15} /> },
    { key: 'projects', label: 'My Projects', icon: <Folder size={15} />, badge: myProjects.length },
    { key: 'donations', label: 'Donations', icon: <Heart size={15} />, badge: donations.length },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={15} />, badge: unreadCount },
  ] as const;

  return (
    <div className="min-h-screen bg-muted/30">

      {/* ── Hero banner ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img src={avatar(user.name, user.avatar)} alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">Welcome back, {user.name.split(' ')[0]} 👋</h1>
                {(user as any).ngoVerified && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-blue-500/20 border border-blue-400/30 text-blue-200 px-2.5 py-1 rounded-full">
                    <BadgeCheck size={12} /> Verified NGO
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <ImpactScore score={stats?.impactScore ?? (user as any).impactScore ?? 0} />
                {stats?.streakDays ? (
                  <span className="flex items-center gap-1.5 text-sm text-white/70">
                    <Zap size={13} className="text-amber-400" /> {stats.streakDays}-day streak
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href="/projects/create"
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow">
                <PlusCircle size={15} /> New Project
              </Link>
              <Link href={`/profile/${user._id}`}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors">
                View Profile
              </Link>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {kpis.map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.colour} flex items-center justify-center text-white mb-3 shadow`}>
                  {kpi.icon}
                </div>
                <div className="text-xl font-bold text-white">{kpi.value}{kpi.suffix}</div>
                <div className="text-xs text-white/60 mt-0.5">{kpi.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-white border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}>
                {tab.icon}
                {tab.label}
                {'badge' in tab && tab.badge > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                    tab.key === 'notifications'
                      ? 'bg-red-500 text-white'
                      : 'bg-primary/10 text-primary'
                  }`}>{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

            {/* ═══════ OVERVIEW ═══════ */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: recent activity */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Badges */}
                  {stats?.badges && stats.badges.length > 0 && (
                    <div className="bg-white rounded-2xl border border-border p-5">
                      <h3 className="font-semibold mb-4 flex items-center gap-2"><Award size={16} className="text-amber-500" /> Your Badges</h3>
                      <BadgeDisplay badges={stats.badges} />
                    </div>
                  )}

                  {/* Recent projects */}
                  <div className="bg-white rounded-2xl border border-border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2"><Folder size={16} className="text-primary" /> Recent Projects</h3>
                      <button onClick={() => setActiveTab('projects')} className="text-xs text-primary hover:underline flex items-center gap-1">
                        View all <ChevronRight size={13} />
                      </button>
                    </div>
                    {isLoadingData ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ProjectCardSkeleton /><ProjectCardSkeleton />
                      </div>
                    ) : myProjects.length === 0 ? (
                      <EmptyState icon="🚀" title="No projects yet"
                        description="Create your first project and start making an impact."
                        action={{ label: 'Create Project', href: '/projects/create' }} />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {myProjects.slice(0, 4).map(p => <ProjectCard key={p._id} project={p} />)}
                      </div>
                    )}
                  </div>

                  {/* Recent donations */}
                  <div className="bg-white rounded-2xl border border-border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2"><Heart size={16} className="text-pink-500" /> Recent Donations</h3>
                      <button onClick={() => setActiveTab('donations')} className="text-xs text-primary hover:underline flex items-center gap-1">
                        View all <ChevronRight size={13} />
                      </button>
                    </div>
                    {donations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No donations yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {donations.slice(0, 4).map(d => <DonationRow key={d._id} donation={d} />)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: sidebar */}
                <div className="space-y-5">

                  {/* Quick actions */}
                  <div className="bg-white rounded-2xl border border-border p-5">
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Quick Actions</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Create a Project', href: '/projects/create', icon: <PlusCircle size={15} />, primary: true },
                        { label: 'Edit Profile', href: '/profile/edit', icon: <Edit3 size={15} /> },
                        { label: 'Explore Projects', href: '/explore', icon: <LayoutGrid size={15} /> },
                        { label: 'View on Map', href: '/map', icon: <MapPin size={15} /> },
                      ].map(action => (
                        <Link key={action.href} href={action.href}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            action.primary
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'hover:bg-accent text-foreground border border-border'
                          }`}>
                          {action.icon} {action.label}
                          <ChevronRight size={13} className="ml-auto" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Recent notifications */}
                  <div className="bg-white rounded-2xl border border-border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm flex items-center gap-1.5">
                        <Bell size={15} className="text-primary" /> Notifications
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                        )}
                      </h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No notifications.</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.slice(0, 5).map(n => (
                          <NotificationRow key={n._id} notification={n} />
                        ))}
                        {notifications.length > 5 && (
                          <button onClick={() => setActiveTab('notifications')} className="text-xs text-primary hover:underline w-full text-center pt-1">
                            View all {notifications.length} →
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Streak */}
                  {stats?.streakDays ? (
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white">
                      <div className="text-3xl mb-1">🔥</div>
                      <div className="text-2xl font-bold">{stats.streakDays} days</div>
                      <div className="text-sm text-white/80">Active streak! Keep it up.</div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* ═══════ MY PROJECTS ═══════ */}
            {activeTab === 'projects' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">My Projects <span className="text-muted-foreground text-base font-normal">({myProjects.length})</span></h2>
                  <Link href="/projects/create"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                    <PlusCircle size={15} /> New Project
                  </Link>
                </div>

                {isLoadingData ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => <ProjectCardSkeleton key={i} />)}
                  </div>
                ) : myProjects.length === 0 ? (
                  <EmptyState icon="🚀" title="You haven't created any projects yet"
                    description="Start your first social impact initiative and inspire others to contribute."
                    action={{ label: 'Create your first project', href: '/projects/create' }} />
                ) : (
                  <div className="space-y-5">
                    {/* Detailed project rows */}
                    {myProjects.map((proj, i) => (
                      <motion.div key={proj._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <div className="bg-white rounded-2xl border border-border p-5 flex flex-col sm:flex-row gap-4">
                          {/* Thumb */}
                          <div className="w-full sm:w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-muted"
                            style={!(proj.images?.[0] || proj.pictureOfSuccess) ? { background: (CAT_COLOUR[proj.category] ?? '#6366f1') + '20' } : {}}>
                            {(proj.images?.[0] || proj.pictureOfSuccess) ? (
                              <img src={proj.images?.[0] || proj.pictureOfSuccess} alt={proj.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl">
                                {proj.category === 'Human' ? '🤝' : proj.category === 'Plant' ? '🌱' : proj.category === 'Animal' ? '🐾' : proj.category === 'Education' ? '📚' : proj.category === 'Health' ? '❤️' : '🌍'}
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-bold text-base leading-tight">{proj.title}</h3>
                                  {proj.isVerified && <BadgeCheck size={14} className="text-blue-500" />}
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    proj.status === 'active' ? 'bg-emerald-100 text-emerald-700'
                                    : proj.status === 'completed' ? 'bg-blue-100 text-blue-700'
                                    : 'bg-muted text-muted-foreground'
                                  }`}>{proj.status}</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{proj.objective}</p>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                              <span className="flex items-center gap-1.5">
                                <Heart size={13} className="text-pink-400" fill="currentColor" />
                                ₹{(proj.totalDonations || 0).toLocaleString()} raised
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Users size={13} />
                                {proj.donors?.length ?? 0} donors
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock size={13} />
                                {formatDistanceToNow(new Date(proj.createdAt), { addSuffix: true })}
                              </span>
                              {proj.goalAmount && (
                                <span className="flex items-center gap-1.5">
                                  <Target size={13} />
                                  {Math.round((proj.totalDonations / proj.goalAmount) * 100)}% funded
                                </span>
                              )}
                            </div>

                            {/* Progress bar */}
                            {proj.goalAmount && (
                              <div className="mb-4">
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: CAT_COLOUR[proj.category] ?? '#6366f1' }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((proj.totalDonations / proj.goalAmount) * 100, 100)}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 flex-wrap">
                              <Link href={`/projects/${proj._id}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-accent transition-colors">
                                View
                              </Link>
                              <Link href={`/projects/edit/${proj._id}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-accent transition-colors">
                                <Edit3 size={11} /> Edit
                              </Link>
                              <button onClick={() => handleDelete(proj._id)} disabled={deletingId === proj._id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50">
                                {deletingId === proj._id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══════ DONATIONS ═══════ */}
            {activeTab === 'donations' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Donation History <span className="text-muted-foreground text-base font-normal">({donations.length})</span></h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white border border-border px-3 py-1.5 rounded-lg">
                    <BarChart2 size={14} />
                    Total: <span className="font-semibold text-foreground">₹{(stats?.totalDonated || 0).toLocaleString()}</span>
                  </div>
                </div>

                {donations.length === 0 ? (
                  <EmptyState icon="💝" title="No donations yet"
                    description="Support a project to make a difference and appear here."
                    action={{ label: 'Explore Projects', href: '/explore' }} />
                ) : (
                  <div className="bg-white rounded-2xl border border-border overflow-hidden">
                    <div className="divide-y divide-border">
                      {donations.map((d, i) => (
                        <motion.div key={d._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                          <DonationRow donation={d} detailed />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════ NOTIFICATIONS ═══════ */}
            {activeTab === 'notifications' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Notifications</h2>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors">
                      <CheckCircle size={14} /> Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <EmptyState icon="🔔" title="No notifications yet"
                    description="You'll get notified about donations, followers, and project updates." />
                ) : (
                  <div className="bg-white rounded-2xl border border-border overflow-hidden">
                    <div className="divide-y divide-border">
                      {notifications.map((n, i) => (
                        <motion.div key={n._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                          <NotificationRow notification={n} detailed />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/*  Sub-components                                                  */
/* ──────────────────────────────────────────────────────────────── */
function DonationRow({ donation: d, detailed = false }: { donation: Donation; detailed?: boolean }) {
  const project = d.projectId;
  const colour = project ? (CAT_COLOUR[project.category] ?? '#6366f1') : '#6366f1';
  return (
    <div className={`flex items-start gap-4 ${detailed ? 'px-5 py-4' : ''}`}>
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-lg"
        style={{ background: colour }}>
        {d.type === 'items' ? '📦' : '💰'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {project ? (
              <Link href={`/projects/${project._id}`}
                className="text-sm font-semibold hover:text-primary transition-colors truncate block">{project.title}</Link>
            ) : (
              <p className="text-sm font-semibold text-muted-foreground">Project removed</p>
            )}
            {d.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">"{d.message}"</p>}
            <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(d.donatedAt), { addSuffix: true })}</p>
          </div>
          <div className="text-right shrink-0">
            {d.amount && <p className="text-sm font-bold text-emerald-600">+₹{d.amount.toLocaleString()}</p>}
            {d.type === 'items' && <p className="text-xs text-muted-foreground">{d.items?.length} item(s)</p>}
            {detailed && d.receiptId && (
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{d.receiptId}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationRow({ notification: n, detailed = false }: { notification: Notification; detailed?: boolean }) {
  const icon = NOTIF_ICON[n.type] ?? '🔔';
  return (
    <div className={`flex items-start gap-3 ${detailed ? 'px-5 py-4' : 'py-2'} ${!n.isRead ? 'bg-primary/5' : ''}`}>
      {n.sender ? (
        <img src={n.sender.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(n.sender.name)}&backgroundColor=6366f1&textColor=fff`}
          alt={n.sender.name} className="w-9 h-9 rounded-full flex-shrink-0 bg-muted" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-lg">{icon}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{n.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
        {n.link && (
          <Link href={n.link} className="text-xs text-primary hover:underline whitespace-nowrap">View →</Link>
        )}
      </div>
    </div>
  );
}
