'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MoreVertical, BadgeCheck, Shield, Ban, UserCheck, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminTable } from '@/components/admin/AdminTable';
import { formatDistanceToNow } from 'date-fns';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
  isNGO: boolean;
  ngoVerified: boolean;
  impactScore: number;
  totalDonated: number;
  createdAt: string;
}

type UserAction = 'verify-ngo' | 'unverify-ngo' | 'ban' | 'unban' | 'make-admin' | 'remove-admin' | 'make-ngo' | 'delete';

const ROLE_COLOURS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  ngo:   'bg-blue-100 text-blue-700',
  user:  'bg-muted text-muted-foreground',
};

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers]   = useState<User[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    try {
      const res = await fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {}
    setIsLoading(false);
  }, [token, page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const applyAction = async (userId: string, action: UserAction) => {
    setActionLoading(`${userId}:${action}`);
    setOpenMenuId(null);
    try {
      if (action === 'delete') {
        if (!confirm('Permanently delete this user?')) { setActionLoading(null); return; }
        const res = await fetch(`/api/admin/users?userId=${userId}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { setUsers(u => u.filter(x => x._id !== userId)); showToast('User deleted'); }
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId, action }),
        });
        const data = await res.json();
        if (res.ok) {
          setUsers(u => u.map(x => x._id === userId ? { ...x, ...data.user } : x));
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
      key: 'user', label: 'User',
      render: (u: User) => (
        <div className="flex items-center gap-3">
          <img src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}&backgroundColor=6366f1&textColor=fff`}
            alt={u.name} className="w-8 h-8 rounded-full bg-muted shrink-0" />
          <div className="min-w-0">
            <Link href={`/profile/${u._id}`} className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-1 truncate">
              {u.name}
              {u.ngoVerified && <BadgeCheck size={12} className="text-blue-500 shrink-0" />}
            </Link>
            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role', label: 'Role', width: 'w-24',
      render: (u: User) => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLOURS[u.role] ?? ROLE_COLOURS.user}`}>
          {u.role}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status', width: 'w-24',
      render: (u: User) => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {u.isVerified ? 'Active' : 'Banned'}
        </span>
      ),
    },
    {
      key: 'score', label: 'Impact', width: 'w-20',
      render: (u: User) => <span className="text-sm font-medium">{u.impactScore}</span>,
    },
    {
      key: 'joined', label: 'Joined', width: 'w-28',
      render: (u: User) => (
        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</span>
      ),
    },
    {
      key: 'actions', label: '', width: 'w-10',
      render: (u: User) => {
        const loading = actionLoading?.startsWith(u._id);
        return (
          <div className="relative">
            <button onClick={() => setOpenMenuId(openMenuId === u._id ? null : u._id)}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <MoreVertical size={15} />}
            </button>
            <AnimatePresence>
              {openMenuId === u._id && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-8 z-50 w-44 bg-white border border-border rounded-xl shadow-xl overflow-hidden">
                  {[
                    u.ngoVerified
                      ? { action: 'unverify-ngo', label: 'Unverify NGO', icon: <BadgeCheck size={13} />, danger: false }
                      : { action: 'verify-ngo', label: 'Verify as NGO', icon: <BadgeCheck size={13} />, danger: false },
                    u.isVerified
                      ? { action: 'ban', label: 'Ban user', icon: <Ban size={13} />, danger: true }
                      : { action: 'unban', label: 'Unban user', icon: <UserCheck size={13} />, danger: false },
                    u.role !== 'admin'
                      ? { action: 'make-admin', label: 'Make admin', icon: <Shield size={13} />, danger: false }
                      : { action: 'remove-admin', label: 'Remove admin', icon: <Shield size={13} />, danger: true },
                    { action: 'delete', label: 'Delete user', icon: <Trash2 size={13} />, danger: true },
                  ].map(item => (
                    <button key={item.action} onClick={() => applyAction(u._id, item.action as UserAction)}
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
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-20 right-4 z-50 bg-foreground text-background text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2 flex-1 min-w-52">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white" />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            Search
          </button>
        </form>

        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white focus:outline-none focus:border-primary">
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="ngo">NGO</option>
          <option value="admin">Admin</option>
        </select>

        {(search || roleFilter) && (
          <button onClick={() => { setSearch(''); setSearchInput(''); setRoleFilter(''); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-destructive transition-colors bg-white">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      <AdminTable
        columns={columns}
        data={users}
        page={page}
        pages={pages}
        total={total}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyIcon="👤"
        emptyMessage="No users found"
      />
    </div>
  );
}