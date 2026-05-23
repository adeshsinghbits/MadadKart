'use client';

import { formatDistanceToNow } from 'date-fns';
import { BadgeCheck } from 'lucide-react';

interface Donation {
  _id: string;
  userId: { _id: string; name: string; avatar?: string } | null;
  amount?: number;
  message?: string;
  isAnonymous?: boolean;
  donatedAt: string;
}

export function DonorList({ donors }: { donors: Donation[] }) {
  if (!donors?.length) return (
    <div className="text-center py-8">
      <div className="text-4xl mb-2">💝</div>
      <p className="text-sm text-muted-foreground">Be the first to support!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {donors.map(d => {
        const donor = d.isAnonymous ? null : d.userId;
        const name = d.isAnonymous ? 'Anonymous' : (donor?.name || 'Someone');
        const avatar = donor?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;
        return (
          <div key={d._id} className="flex items-start gap-3">
            <img src={d.isAnonymous ? 'https://api.dicebear.com/7.x/shapes/svg?seed=anon' : avatar}
              alt={name} className="w-9 h-9 rounded-full shrink-0 bg-muted" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">{name}</span>
                {d.amount && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">₹{d.amount.toLocaleString()}</span>}
              </div>
              {d.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">"{d.message}"</p>}
              <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(d.donatedAt), { addSuffix: true })}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}