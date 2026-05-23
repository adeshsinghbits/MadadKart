'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Package, RotateCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface DonationModalProps {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

const QUICK_AMOUNTS = [100, 500, 1000, 2500, 5000];

export function DonationModal({ projectId, projectTitle, onClose, onSuccess }: DonationModalProps) {
  const { token } = useAuth();
  const [type, setType] = useState<'money' | 'items'>('money');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([{ name: '', quantity: 1 }]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      const body: any = { type, message, isAnonymous, isRecurring };
      if (type === 'money') {
        if (!amount || Number(amount) <= 0) { setError('Enter a valid amount'); setIsLoading(false); return; }
        body.amount = Number(amount);
      } else {
        body.items = items.filter(i => i.name.trim());
      }
      const res = await fetch(`/api/projects/${projectId}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Donation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-lg font-bold">Support this project</h2>
              <p className="text-sm text-muted-foreground truncate">{projectTitle}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors"><X size={18} /></button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
              {(['money', 'items'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${type === t ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                  {t === 'money' ? <><Heart size={15} /> Money</> : <><Package size={15} /> Items</>}
                </button>
              ))}
            </div>

            {type === 'money' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map(a => (
                    <button key={a} onClick={() => setAmount(String(a))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${amount === String(a) ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'}`}>
                      ₹{a.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Custom amount"
                    className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded" />
                  <div className="flex items-center gap-1.5 text-sm">
                    <RotateCcw size={13} className="text-primary" />
                    Make this a monthly recurring donation
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={item.name} onChange={e => { const arr = [...items]; arr[i].name = e.target.value; setItems(arr); }}
                      placeholder="Item name" className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary" />
                    <input type="number" value={item.quantity} onChange={e => { const arr = [...items]; arr[i].quantity = Number(e.target.value); setItems(arr); }}
                      className="w-16 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary" />
                  </div>
                ))}
                <button onClick={() => setItems([...items, { name: '', quantity: 1 }])}
                  className="text-sm text-primary hover:underline">+ Add item</button>
              </div>
            )}

            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Add a message (optional)"
              rows={2} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-primary" />

            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded" />
              Donate anonymously
            </label>

            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-border">
            <button onClick={handleSubmit} disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {isLoading ? 'Processing...' : type === 'money' && amount ? `Donate ₹${Number(amount).toLocaleString()}` : 'Confirm Donation'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
