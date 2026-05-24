'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Camera, Save, Loader2, MapPin, Globe,User, AlertCircle, CheckCircle,
} from 'lucide-react';
import { FaTwitter, FaLinkedin, FaInstagramSquare   } from "react-icons/fa";
import { useAuth } from '@/context/AuthContext';
import { ChangePasswordSection } from '@/components/shared/ChangePasswordSection';

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all placeholder:text-muted-foreground';
const labelCls = 'block text-sm font-medium mb-1.5 text-foreground';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="text-base font-bold mb-5">{title}</h2>
      {children}
    </div>
  );
}

function Toast({ toast }: { toast: { type: 'success' | 'error'; message: string } | null }) {
  if (!toast) return null;
  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium ${
        toast.type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}>
      {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {toast.message}
    </motion.div>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, token, isAuthenticated, updateUser, isLoading: authLoading } = useAuth();

  const [form, setForm] = useState({
    name: '', bio: '', location: '', website: '',
    avatar: '', coverImage: '',
    socialLinks: { twitter: '', linkedin: '', instagram: '' },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: (user as any).bio || '',
        location: (user as any).location || '',
        website: (user as any).website || '',
        avatar: (user as any).avatar || '',
        coverImage: (user as any).coverImage || '',
        socialLinks: (user as any).socialLinks || { twitter: '', linkedin: '', instagram: '' },
      });
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (file.size > 5 * 1024 * 1024) throw new Error('File must be under 5MB');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  };

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'avatar' | 'coverImage',
    setLoading: (v: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadImage(file);
      setForm(p => ({ ...p, [field]: url }));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast('error', 'Name is required'); return; }
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        socialLinks: {
          twitter: form.socialLinks.twitter.replace('@', '').trim(),
          linkedin: form.socialLinks.linkedin.trim(),
          instagram: form.socialLinks.instagram.replace('@', '').trim(),
        },
      };
      if (form.website.trim()) payload.website = form.website.trim();
      if (form.avatar) payload.avatar = form.avatar;
      if (form.coverImage) payload.coverImage = form.coverImage;

      const res = await fetch(`/api/users/${user!._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      updateUser({ ...user!, ...data.user });
      showToast('success', 'Profile saved!');
      setTimeout(() => router.push(`/profile/${user!._id}`), 1200);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  const previewAvatar = form.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=6366f1&textColor=fff`;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Toast toast={toast} />

        <div className="mb-8">
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Update your public profile information.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Cover & Avatar ─────────────────────────── */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="relative h-36 bg-linear-to-br from-violet-500 to-blue-600 overflow-hidden group cursor-pointer"
              onClick={() => coverRef.current?.click()}>
              {form.coverImage && <img src={form.coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-medium shadow">
                  {uploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  {uploadingCover ? 'Uploading…' : 'Change cover'}
                </div>
              </div>
              <input ref={coverRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleImageChange(e, 'coverImage', setUploadingCover)} />
            </div>
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-10">
                <div className="relative group cursor-pointer" onClick={() => avatarRef.current?.click()}>
                  <img src={previewAvatar} alt={user.name}
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-muted" />
                  <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadingAvatar ? <Loader2 size={18} className="text-white animate-spin" /> : <Camera size={18} className="text-white" />}
                    </div>
                  </div>
                  <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                    onChange={e => handleImageChange(e, 'avatar', setUploadingAvatar)} />
                </div>
                <div className="mb-1">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">Click images to upload</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Basic info ──────────────────────────────── */}
          <Section title="Basic Information">
            <div className="space-y-4">
              <div>
                <label className={labelCls}><span className="flex items-center gap-1.5"><User size={13} /> Full Name</span></label>
                <input className={inputCls} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className={labelCls}>Bio <span className="text-muted-foreground font-normal">(optional)</span></label>
                <textarea className={`${inputCls} resize-none`} rows={4} maxLength={500}
                  value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell people about yourself…" />
                <p className="text-xs text-muted-foreground mt-1 text-right">{form.bio.length}/500</p>
              </div>
              <div>
                <label className={labelCls}><span className="flex items-center gap-1.5"><MapPin size={13} /> Location</span></label>
                <input className={inputCls} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="City, Country" />
              </div>
              <div>
                <label className={labelCls}><span className="flex items-center gap-1.5"><Globe size={13} /> Website</span></label>
                <input type="url" className={inputCls} value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://yourwebsite.com" />
              </div>
            </div>
          </Section>

          {/* ── Social links ─────────────────────────────── */}
          <Section title="Social Links">
            <div className="space-y-4">
              {[
                { key: 'twitter', icon: <FaTwitter size={13} />, label: 'Twitter / X', prefix: 'twitter.com/', placeholder: 'username' },
                { key: 'linkedin', icon: <FaLinkedin size={13} />, label: 'LinkedIn', prefix: 'linkedin.com/in/', placeholder: 'username' },
                { key: 'instagram', icon: <FaInstagramSquare  size={13} />, label: 'Instagram', prefix: 'instagram.com/', placeholder: 'username' },
              ].map(({ key, icon, label, prefix, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}><span className="flex items-center gap-1.5">{icon} {label}</span></label>
                  <div className="flex">
                    <span className="flex items-center px-3 border border-r-0 border-border rounded-l-xl bg-muted text-xs text-muted-foreground whitespace-nowrap">{prefix}</span>
                    <input className="flex-1 px-3 py-2.5 border border-border rounded-r-xl bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      value={(form.socialLinks as any)[key]}
                      onChange={e => setForm(p => ({ ...p, socialLinks: { ...p.socialLinks, [key]: e.target.value } }))}
                      placeholder={placeholder} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Save ─────────────────────────────────────── */}
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
              className="px-6 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-accent transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-all">
              {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </form>

        {/* ── Change Password (separate form, no page reload needed) ── */}
        <div className="mt-5 pb-10">
          <ChangePasswordSection token={token!} />
        </div>
      </div>
    </div>
  );
}