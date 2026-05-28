'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Package, RotateCcw, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminTable } from '@/components/admin/AdminTable';
import { formatDistanceToNow } from 'date-fns';

interface Donation {
  _id: string;
  userId: { _id: string; name: string; email: string; avatar?: string } | null;
  projectId: { _id: string; title: string; category: string } | null;
  type: string;
  amount?: number;
  items?: { name: string; quantity: number }[];
  message?: string;
  isAnonymous: boolean;
  isRecurring: boolean;
  receiptId?: string;
  donatedAt: string;
}

const CAT_COLOUR: Record<string, string> = {
  Human: '#6366f1', Plant: '#22c55e', Animal: '#f59e0b',
  Environment: '#14b8a6', Education: '#8b5cf6', Health: '#ec4899',
};

export default function AdminDonationsPage() {
  const { token } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchDonations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/donations?page=${page}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setDonations(data.donations || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {}
    setIsLoading(false);
  }, [token, page]);

  // Also fetch total from stats
  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setTotalAmount(d.donations?.totalAmount ?? 0))
      .catch(() => {});
  }, [token]);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  const columns = [
    {
      key: 'donor', label: 'Donor',
      render: (d: Donation) => {
        const donor = d.isAnonymous ? null : d.userId;
        const name  = d.isAnonymous ? 'Anonymous' : (donor?.name ?? 'Unknown');
        const avatar = donor?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1&textColor=fff`;
        return (
          <div className="flex items-center gap-2.5">
            <img src={d.isAnonymous ? 'https://api.dicebear.com/7.x/shapes/svg?seed=anon' : avatar}
              alt={name} className="w-8 h-8 rounded-full bg-muted shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{name}</p>
              {!d.isAnonymous && donor?.email && (
                <p className="text-xs text-muted-foreground truncate">{donor.email}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'project', label: 'Project',
      render: (d: Donation) => d.projectId ? (
        <Link href={`/projects/${d.projectId._id}`} target="_blank"
          className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors max-w-50">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CAT_COLOUR[d.projectId.category] ?? '#6366f1' }} />
          <span className="truncate">{d.projectId.title}</span>
          <ExternalLink size={10} className="shrink-0 opacity-50" />
        </Link>
      ) : <span className="text-xs text-muted-foreground">Project removed</span>,
    },
    {
      key: 'type', label: 'Type', width: 'w-20',
      render: (d: Donation) => (
        <div className="flex items-center gap-1.5">
          {d.type === 'money' ? <Heart size={13} className="text-pink-500" /> : <Package size={13} className="text-amber-500" />}
          <span className="text-xs capitalize">{d.type}</span>
          {
            d.isRecurring && (
                <span title="Recurring">
                <RotateCcw
                    size={11}
                    className="text-blue-500"
                />
                </span>
            )
            }
        </div>
      ),
    },
    {
      key: 'amount', label: 'Amount', width: 'w-28',
      render: (d: Donation) => (
        <div>
          {d.amount != null
            ? <p className="text-sm font-bold text-emerald-600">₹{d.amount.toLocaleString()}</p>
            : d.items?.length
              ? <p className="text-sm text-muted-foreground">{d.items.length} item(s)</p>
              : <span className="text-muted-foreground text-sm">—</span>}
        </div>
      ),
    },
    {
      key: 'receipt', label: 'Receipt', width: 'w-28',
      render: (d: Donation) => (
        <span className="text-[11px] font-mono text-muted-foreground">{d.receiptId ?? '—'}</span>
      ),
    },
    {
      key: 'message', label: 'Message',
      render: (d: Donation) => (
        <span className="text-xs text-muted-foreground line-clamp-2 max-w-40">
          {d.message ? `"${d.message}"` : '—'}
        </span>
      ),
    },
    {
      key: 'date', label: 'Date', width: 'w-24',
      render: (d: Donation) => (
        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(d.donatedAt), { addSuffix: true })}</span>
      ),
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">Donations</h1>
          <p className="text-muted-foreground text-sm mt-1">{total.toLocaleString()} total donations</p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-border rounded-xl px-4 py-2.5 text-right">
          <p className="text-xs text-muted-foreground">Total platform raised</p>
          <p className="text-lg font-bold text-emerald-600">₹{totalAmount.toLocaleString()}</p>
        </motion.div>
      </div>

      <AdminTable
        columns={columns} data={donations}
        page={page} pages={pages} total={total}
        onPageChange={setPage} isLoading={isLoading}
        emptyIcon="💰" emptyMessage="No donations yet"
      />
    </div>
  );
}