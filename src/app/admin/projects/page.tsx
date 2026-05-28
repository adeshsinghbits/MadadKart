'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, MoreVertical, BadgeCheck, Pause,
  Play, Trash2, Loader2, ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminTable } from '@/components/admin/AdminTable';
import { formatDistanceToNow } from 'date-fns';

interface Project {
  _id: string;
  title: string;
  category: string;
  status: string;
  isVerified: boolean;
  totalDonations: number;
  goalAmount?: number;
  donors: any[];
  creator: { _id: string; name: string; email: string; avatar?: string };
  location: { address: string };
  createdAt: string;
}

type ProjectAction = 'verify' | 'unverify' | 'pause' | 'activate' | 'complete' | 'delete';

const STATUS_COLOUR: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  paused:    'bg-amber-100 text-amber-700',
  pending:   'bg-muted text-muted-foreground',
};

const CAT_COLOUR: Record<string, string> = {
  Human: '#6366f1', Plant: '#22c55e', Animal: '#f59e0b',
  Environment: '#14b8a6', Education: '#8b5cf6', Health: '#ec4899',
};

const CATEGORIES = ['Human', 'Plant', 'Animal', 'Environment', 'Education', 'Health'];

export default function AdminProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast]       = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search)       params.set('search', search);
    if (category)     params.set('category', category);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const res = await fetch(`/api/admin/projects?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProjects(data.projects || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {}
    setIsLoading(false);
  }, [token, page, search, category, statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const applyAction = async (projectId: string, action: ProjectAction) => {
    setActionLoading(`${projectId}:${action}`);
    setOpenMenuId(null);
    try {
      if (action === 'delete') {
        if (!confirm('Permanently delete this project and all its data?')) { setActionLoading(null); return; }
        const res = await fetch(`/api/admin/projects?projectId=${projectId}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { setProjects(p => p.filter(x => x._id !== projectId)); showToast('Project deleted'); }
      } else {
        const res = await fetch('/api/admin/projects', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ projectId, action }),
        });
        const data = await res.json();
        if (res.ok) {
          setProjects(p => p.map(x => x._id === projectId ? { ...x, ...data.project } : x));
          showToast(data.message || 'Done');
        } else {
          showToast(data.error || 'Action failed');
        }
      }
    } catch { showToast('Something went wrong'); }
    setActionLoading(null);
  };

  const columns = [
    {
      key: 'project', label: 'Project',
      render: (p: Project) => (
        <div className="flex items-start gap-3 max-w-xs">
          <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: CAT_COLOUR[p.category] ?? '#6366f1' }} />
          <div className="min-w-0">
            <Link href={`/projects/${p._id}`} target="_blank"
              className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-1 truncate">
              {p.title} <ExternalLink size={10} className="shrink-0 opacity-50" />
            </Link>
            <p className="text-xs text-muted-foreground truncate">{p.location?.address}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'creator', label: 'Creator', width: 'w-36',
      render: (p: Project) => (
        <Link href={`/profile/${p.creator?._id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={p.creator?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.creator?.name ?? '')}&backgroundColor=6366f1&textColor=fff`}
            alt="" className="w-6 h-6 rounded-full bg-muted shrink-0" />
          <span className="text-xs font-medium truncate">{p.creator?.name}</span>
        </Link>
      ),
    },
    {
      key: 'category', label: 'Category', width: 'w-28',
      render: (p: Project) => (
        <span className="text-xs font-semibold px-2 py-1 rounded-full"
          style={{ background: (CAT_COLOUR[p.category] ?? '#6366f1') + '20', color: CAT_COLOUR[p.category] ?? '#6366f1' }}>
          {p.category}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status', width: 'w-24',
      render: (p: Project) => (
        <div className="flex flex-col gap-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${STATUS_COLOUR[p.status] ?? STATUS_COLOUR.pending}`}>
            {p.status}
          </span>
          {p.isVerified && (
            <span className="flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
              <BadgeCheck size={10} /> Verified
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'raised', label: 'Raised', width: 'w-24',
      render: (p: Project) => (
        <div>
          <p className="text-sm font-semibold">₹{(p.totalDonations || 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{p.donors?.length ?? 0} donors</p>
        </div>
      ),
    },
    {
      key: 'created', label: 'Created', width: 'w-24',
      render: (p: Project) => (
        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
      ),
    },
    {
      key: 'actions', label: '', width: 'w-10',
      render: (p: Project) => {
        const loading = actionLoading?.startsWith(p._id);
        return (
          <div className="relative">
            <button onClick={() => setOpenMenuId(openMenuId === p._id ? null : p._id)}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <MoreVertical size={15} />}
            </button>
            <AnimatePresence>
              {openMenuId === p._id && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-8 z-50 w-44 bg-white border border-border rounded-xl shadow-xl overflow-hidden">
                  {[
                    p.isVerified
                      ? { action: 'unverify', label: 'Unverify', icon: <BadgeCheck size={13} />, danger: false }
                      : { action: 'verify',   label: 'Verify project', icon: <BadgeCheck size={13} />, danger: false },
                    p.status === 'active'
                      ? { action: 'pause',    label: 'Pause', icon: <Pause size={13} />, danger: false }
                      : { action: 'activate', label: 'Activate', icon: <Play size={13} />, danger: false },
                    { action: 'complete', label: 'Mark complete', icon: <BadgeCheck size={13} />, danger: false },
                    { action: 'delete',   label: 'Delete', icon: <Trash2 size={13} />, danger: true },
                  ].map(item => (
                    <button key={item.action} onClick={() => applyAction(p._id, item.action as ProjectAction)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                        item.danger ? 'text-red-600 hover:bg-red-50' : 'text-foreground hover:bg-accent'
                      }`}>
                      {item.icon} {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-20 right-4 z-50 bg-foreground text-background text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">{total.toLocaleString()} total projects</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2 flex-1 min-w-52">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search projects…"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white" />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            Search
          </button>
        </form>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white focus:outline-none focus:border-primary">
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white focus:outline-none focus:border-primary">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="pending">Pending</option>
        </select>
        {(search || category || statusFilter) && (
          <button onClick={() => { setSearch(''); setSearchInput(''); setCategory(''); setStatus(''); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-destructive transition-colors bg-white">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      <AdminTable
        columns={columns} data={projects}
        page={page} pages={pages} total={total}
        onPageChange={setPage} isLoading={isLoading}
        emptyIcon="📁" emptyMessage="No projects found"
      />
    </div>
  );
}