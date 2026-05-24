'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlignLeft, Calendar, Target, Tag, Users, MapPin,
  Plus, Trash2, Save, Loader2, AlertCircle, ImagePlus, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LocationInput } from '@/components/projects/LocationInput';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const MapComponent = dynamic(
  () => import('@/components/map/MapComponent').then(m => m.MapComponent),
  { ssr: false, loading: () => <div className="h-72 w-full rounded-xl bg-muted skeleton" /> }
);

/* ── Shared primitives ────────────────────────────────────────── */
const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all placeholder:text-muted-foreground';

const CATEGORIES = ['Human', 'Plant', 'Animal', 'Environment', 'Education', 'Health'] as const;
const CAT_EMOJI: Record<string, string> = {
  Human: '🤝', Plant: '🌱', Animal: '🐾', Environment: '🌍', Education: '📚', Health: '❤️',
};
const STATUSES = ['active', 'paused', 'completed'] as const;

interface SupportItem { item: string; quantity: number; byWhen: string; dropLocation: string }
interface Milestone { _id?: string; title: string; description: string; targetDate: string; order: number; isCompleted: boolean }

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-border p-6">
    <h2 className="flex items-center gap-2 text-base font-bold mb-5 text-foreground">
      <span className="text-primary">{icon}</span> {title}
    </h2>
    {children}
  </div>
);

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5 text-foreground">{label}</label>
    {children}
    {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
  </div>
);

/* ── Component ────────────────────────────────────────────────── */
export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  /* Form state */
  const [form, setForm] = useState({
    title: '', objective: '', description: '',
    category: 'Human', status: 'active',
    startDate: '', endDate: '',
    address: '', latitude: 28.6139, longitude: 77.209,
    goalAmount: '', volunteersNeeded: '',
    tags: '', images: [] as string[],
    pictureOfSuccess: '',
  });
  const [supportItems, setSupportItems] = useState<SupportItem[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  /* Auth guard */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  /* Fetch project */
  useEffect(() => {
    (async () => {
      setIsLoadingProject(true);
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (!res.ok) { router.push('/404'); return; }
        const p = await res.json();
        // Auth check — only creator can edit
        const creatorId = p.creator?._id || p.creator;
        if (user && creatorId !== user._id && user.role !== 'admin') {
          router.push(`/projects/${id}`);
          return;
        }
        setProject(p);
        setForm({
          title: p.title ?? '',
          objective: p.objective ?? '',
          description: p.description ?? '',
          category: p.category ?? 'Human',
          status: p.status ?? 'active',
          startDate: p.duration?.startDate ? p.duration.startDate.slice(0, 10) : '',
          endDate: p.duration?.endDate ? p.duration.endDate.slice(0, 10) : '',
          address: p.location?.address ?? '',
          latitude: p.location?.coordinates?.[1] ?? 28.6139,
          longitude: p.location?.coordinates?.[0] ?? 77.209,
          goalAmount: p.goalAmount ? String(p.goalAmount) : '',
          volunteersNeeded: p.volunteersNeeded ? String(p.volunteersNeeded) : '',
          tags: p.tags?.join(', ') ?? '',
          images: p.images ?? [],
          pictureOfSuccess: p.pictureOfSuccess ?? '',
        });
        setSupportItems(
          (p.supportItems ?? []).map((s: any) => ({
            item: s.item, quantity: s.quantity,
            byWhen: s.byWhen ? s.byWhen.slice(0, 10) : '',
            dropLocation: s.dropLocation,
          }))
        );
        setMilestones(
          (p.milestones ?? []).map((m: any) => ({
            _id: m._id,
            title: m.title ?? '',
            description: m.description ?? '',
            targetDate: m.targetDate ? m.targetDate.slice(0, 10) : '',
            order: m.order ?? 0,
            isCompleted: m.isCompleted ?? false,
          }))
        );
      } catch { router.push('/explore'); }
      setIsLoadingProject(false);
    })();
  }, [id, user]);

  const set = useCallback((k: string, v: any) => setForm(p => ({ ...p, [k]: v })), []);

  /* Upload image */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setSubmitError('Image must be under 5MB'); return; }
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.url) setForm(p => ({ ...p, images: [...p.images, data.url] }));
    } catch { setSubmitError('Image upload failed'); }
    setUploadingImage(false);
    e.target.value = '';
  };

  const removeImage = (idx: number) => setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  /* Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMsg('');

    if (!form.address) { setSubmitError('Please set a project location.'); return; }
    if (form.endDate && form.startDate && new Date(form.endDate) <= new Date(form.startDate)) {
      setSubmitError('End date must be after start date.'); return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        title: form.title,
        objective: form.objective,
        description: form.description,
        category: form.category,
        status: form.status,
        duration: { startDate: form.startDate, endDate: form.endDate },
        latitude: form.latitude,
        longitude: form.longitude,
        address: form.address,
        goalAmount: form.goalAmount ? Number(form.goalAmount) : undefined,
        volunteersNeeded: form.volunteersNeeded ? Number(form.volunteersNeeded) : undefined,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        images: form.images,
        pictureOfSuccess: form.pictureOfSuccess || undefined,
        supportItems: supportItems.map(s => ({ ...s, quantity: Number(s.quantity) })),
        milestones: milestones.map((m, i) => ({ ...m, order: i })),
      };

      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setSuccessMsg('Project updated successfully!');
      setTimeout(() => router.push(`/projects/${id}`), 1200);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────────── */
  if (authLoading || isLoadingProject) return <LoadingSpinner text="Loading project…" />;
  if (!project) return null;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <Link href={`/projects/${id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mb-2">
              ← Back to project
            </Link>
            <h1 className="text-2xl font-bold">Edit Project</h1>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-1">{project.title}</p>
          </div>
          <Link href={`/projects/${id}`}
            className="shrink-0 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors">
            Cancel
          </Link>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {submitError && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm mb-5">
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> {submitError}
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm mb-5">
              ✅ {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Basic details ──────────────────────────────── */}
          <Section title="Basic Details" icon={<AlignLeft size={16} />}>
            <div className="space-y-4">
              <Field label="Title">
                <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} required maxLength={100} />
              </Field>
              <Field label="One-line objective">
                <input className={inputCls} value={form.objective} onChange={e => set('objective', e.target.value)} required />
              </Field>
              <Field label="Full description">
                <textarea className={`${inputCls} resize-none`} rows={6} value={form.description} onChange={e => set('description', e.target.value)} required />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </Section>

          {/* ── Dates & Goals ──────────────────────────────── */}
          <Section title="Timeline & Goals" icon={<Calendar size={16} />}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Start Date">
                <input type="date" className={inputCls} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
              </Field>
              <Field label="End Date">
                <input type="date" className={inputCls} value={form.endDate} onChange={e => set('endDate', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Donation Goal (₹)" hint="Optional">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <input type="number" className={`${inputCls} pl-7`} value={form.goalAmount} min="0"
                    onChange={e => set('goalAmount', e.target.value)} placeholder="50000" />
                </div>
              </Field>
              <Field label="Volunteers Needed" hint="Optional">
                <input type="number" className={inputCls} value={form.volunteersNeeded} min="0"
                  onChange={e => set('volunteersNeeded', e.target.value)} placeholder="10" />
              </Field>
            </div>
            <Field label="Tags" hint="Comma-separated">
              <div className="relative">
                <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input className={`${inputCls} pl-9`} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="water, education, rural" />
              </div>
            </Field>
          </Section>

          {/* ── Location ───────────────────────────────────── */}
          <Section title="Location" icon={<MapPin size={16} />}>
            <div className="space-y-4">
              <Field label="Search address" hint="Search or click the map / drag the pin to adjust.">
                <LocationInput
                  address={form.address}
                  onAddressSelect={(address, lat, lng) => setForm(p => ({ ...p, address, latitude: lat, longitude: lng }))}
                  showGPS showCoords lat={form.latitude} lng={form.longitude}
                />
              </Field>
              <MapComponent
                latitude={form.latitude} longitude={form.longitude}
                address={form.address} interactive height="h-72"
                onLocationSelect={(lat, lng, address) => setForm(p => ({ ...p, latitude: lat, longitude: lng, ...(address ? { address } : {}) }))}
              />
              {form.address && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  <MapPin size={13} className="shrink-0" /><span className="truncate">{form.address}</span>
                </div>
              )}
            </div>
          </Section>

          {/* ── Images ─────────────────────────────────────── */}
          <Section title="Project Images" icon={<ImagePlus size={16} />}>
            <div className="space-y-3">
              {form.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-video bg-muted">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                        <X size={12} />
                      </button>
                      {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded font-medium">Cover</span>}
                    </div>
                  ))}
                </div>
              )}
              <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${uploadingImage ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-accent'}`}>
                {uploadingImage ? <Loader2 size={16} className="animate-spin text-primary" /> : <ImagePlus size={16} className="text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">{uploadingImage ? 'Uploading…' : 'Add image'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            </div>
          </Section>

          {/* ── Support Items ───────────────────────────────── */}
          <Section title="Support Items Needed" icon={<Target size={16} />}>
            <div className="space-y-3 mb-4">
              {supportItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No items yet. Add items people can donate.</p>
              )}
              {supportItems.map((item, i) => (
                <div key={i} className="bg-muted/40 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Item #{i + 1}</span>
                    <button type="button" onClick={() => setSupportItems(s => s.filter((_, idx) => idx !== i))}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Item name</label>
                      <input className={inputCls} value={item.item} required
                        onChange={e => { const a = [...supportItems]; a[i].item = e.target.value; setSupportItems(a); }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Quantity</label>
                      <input type="number" min="1" className={inputCls} value={item.quantity} required
                        onChange={e => { const a = [...supportItems]; a[i].quantity = Number(e.target.value); setSupportItems(a); }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Needed by</label>
                      <input type="date" className={inputCls} value={item.byWhen} required
                        onChange={e => { const a = [...supportItems]; a[i].byWhen = e.target.value; setSupportItems(a); }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Drop location</label>
                      <input className={inputCls} value={item.dropLocation} required
                        onChange={e => { const a = [...supportItems]; a[i].dropLocation = e.target.value; setSupportItems(a); }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSupportItems(s => [...s, { item: '', quantity: 1, byWhen: '', dropLocation: '' }])}
              className="flex items-center gap-2 text-sm text-primary hover:underline font-medium">
              <Plus size={15} /> Add item
            </button>
          </Section>

          {/* ── Milestones ──────────────────────────────────── */}
          <Section title="Milestones" icon={<Target size={16} />}>
            <div className="space-y-3 mb-4">
              {milestones.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No milestones yet. Add key goals to track progress.</p>
              )}
              {milestones.map((m, i) => (
                <div key={i} className={`rounded-xl p-4 space-y-3 border ${m.isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-muted/40 border-transparent'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Milestone {i + 1}</span>
                      {m.isCompleted && <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Completed</span>}
                    </div>
                    <button type="button" onClick={() => setMilestones(ms => ms.filter((_, idx) => idx !== i))}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Title</label>
                      <input className={inputCls} value={m.title} required
                        onChange={e => { const a = [...milestones]; a[i].title = e.target.value; setMilestones(a); }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Description</label>
                      <input className={inputCls} value={m.description}
                        onChange={e => { const a = [...milestones]; a[i].description = e.target.value; setMilestones(a); }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Target date</label>
                      <input type="date" className={inputCls} value={m.targetDate}
                        onChange={e => { const a = [...milestones]; a[i].targetDate = e.target.value; setMilestones(a); }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button"
              onClick={() => setMilestones(ms => [...ms, { title: '', description: '', targetDate: '', order: ms.length, isCompleted: false }])}
              className="flex items-center gap-2 text-sm text-primary hover:underline font-medium">
              <Plus size={15} /> Add milestone
            </button>
          </Section>

          {/* ── Actions ─────────────────────────────────────── */}
          <div className="flex gap-3 pb-10">
            <Link href={`/projects/${id}`}
              className="px-6 py-3 rounded-xl border border-border font-medium text-sm hover:bg-accent transition-colors text-center">
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-linear-to-r from-primary to-purple-600 text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-lg shadow-primary/20">
              {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Saving changes…</> : <><Save size={15} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
