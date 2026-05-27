'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { MapPin, Plus, Trash2, Calendar, Target, AlignLeft, Tag, Users, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LocationInput } from '@/components/projects/LocationInput';

const MapComponent = dynamic(
  () => import('@/components/map/MapComponent').then(m => m.MapComponent),
  {
    ssr: false,
    loading: () => <div className="h-72 w-full rounded-xl bg-muted skeleton flex items-center justify-center text-sm text-muted-foreground">Loading map…</div>,
  }
);

const CATEGORIES = ['Human', 'Plant', 'Animal', 'Environment', 'Education', 'Health'] as const;
const CAT_EMOJI: Record<string, string> = {
  Human: '🤝', Plant: '🌱', Animal: '🐾', Environment: '🌍', Education: '📚', Health: '❤️',
};

interface SupportItem { item: string; quantity: number; byWhen: string; dropLocation: string }

const BLANK_ITEM: SupportItem = { item: '', quantity: 1, byWhen: '', dropLocation: '' };

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-border p-6">
    <h2 className="flex items-center gap-2 text-lg font-bold mb-5">
      <span className="text-primary">{icon}</span> {title}
    </h2>
    {children}
  </div>
);

const Field = ({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5">{label}</label>
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all';

export default function CreateProjectPage() {
  const router = useRouter();
  const { isAuthenticated, user, token, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    title: '',
    objective: '',
    description: '',
    category: 'Human',
    startDate: '',
    endDate: '',
    address: '',
    latitude: 28.6139,
    longitude: 77.2090,
    goalAmount: '',
    volunteersNeeded: '',
    tags: '',
    images: [] as string[],
  });

  const [supportItems, setSupportItems] = useState<SupportItem[]>([{ ...BLANK_ITEM }]);

  const handleImageUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const files = e.target.files;

  if (!files || files.length === 0) return;

  try {
    setUploadingImages(true);

    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      uploadedUrls.push(data.url);
    }

    setForm(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls],
    }));
  } catch (error) {
    console.error(error);
    setSubmitError(
      error instanceof Error ? error.message : 'Image upload failed'
    );
  } finally {
    setUploadingImages(false);
  }
};

  // Pre-fill name
  useEffect(() => {
    if (user) {
      const parts = user.name?.split(' ') ?? [];
      setForm(p => ({ ...p, firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') ?? '' }));
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login?redirect=/projects/create');
  }, [authLoading, isAuthenticated, router]);

  const set = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));

  const handleLocationSelect = (address: string, lat: number, lng: number) => {
    setForm(p => ({ ...p, address, latitude: lat, longitude: lng }));
  };

  const handleMapLocationSelect = (lat: number, lng: number, address?: string) => {
    setForm(p => ({ ...p, latitude: lat, longitude: lng, ...(address ? { address } : {}) }));
  };

  const handleItemChange = (i: number, field: string, value: any) => {
    const arr = [...supportItems];
    arr[i] = { ...arr[i], [field]: value };
    setSupportItems(arr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!form.address) { setSubmitError('Please select a location for your project.'); return; }
    if (new Date(form.endDate) <= new Date(form.startDate)) { setSubmitError('End date must be after start date.'); return; }
    if (supportItems.some(s => !s.item.trim() || !s.dropLocation.trim())) { setSubmitError('Please fill all support item fields.'); return; }

    setIsSubmitting(true);
    try {
      const body = {
        ...form,
        goalAmount: form.goalAmount ? Number(form.goalAmount) : undefined,
        volunteersNeeded: form.volunteersNeeded ? Number(form.volunteersNeeded) : undefined,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        supportItems: supportItems.map(s => ({ ...s, quantity: Number(s.quantity) })),
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');
      router.push(`/projects/${data.project._id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  const STEPS = ['Basic Info', 'Location', 'Items & Goals', 'Review'];

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create a Project</h1>
          <p className="text-muted-foreground mt-1">Share your social impact initiative with the community.</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <button onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${i === currentStep ? 'bg-primary text-primary-foreground shadow-sm' : i < currentStep ? 'bg-primary/10 text-primary' : 'bg-white border border-border text-muted-foreground'}`}>
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${i <= currentStep ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                {step}
              </button>
              {i < STEPS.length - 1 && <div className={`h-px w-6 flex-shrink-0 ${i < currentStep ? 'bg-primary' : 'bg-border'}`} />}
            </React.Fragment>
          ))}
        </div>

        {submitError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 px-4 py-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl text-sm">
            {submitError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Step 0: Basic Info ─────────────────────────────── */}
          {currentStep === 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <Section title="Your Name" icon={<Users size={18} />}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name">
                    <input className={inputCls} value={form.firstName} onChange={e => set('firstName', e.target.value)} required placeholder="Aarav" />
                  </Field>
                  <Field label="Last Name">
                    <input className={inputCls} value={form.lastName} onChange={e => set('lastName', e.target.value)} required placeholder="Sharma" />
                  </Field>
                </div>
              </Section>

              <Section title="Project Images" icon={<Plus size={18} />}>
                <div className="space-y-4">

                  <label
                    className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all"
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />

                    <div className="text-center">
                      <p className="font-medium">
                        {uploadingImages
                          ? 'Uploading...'
                          : 'Click to upload project images'}
                      </p>

                      <p className="text-sm text-muted-foreground mt-1">
                        PNG, JPG, WEBP
                      </p>
                    </div>
                  </label>

                  {form.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {form.images.map((img, index) => (
                        <div
                          key={index}
                          className="relative rounded-xl overflow-hidden border border-border"
                        >
                          <img
                            src={img}
                            alt={`Project ${index}`}
                            className="w-full h-40 object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setForm(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== index),
                              }))
                            }
                            className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>

              <Section title="Project Details" icon={<AlignLeft size={18} />}>
                <div className="space-y-4">
                  <Field label="Title" hint="Clear and specific — 'Provide clean water to Sundarbans villages'">
                    <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} required maxLength={100} placeholder="E.g., Community Water Well Project" />
                  </Field>
                  <Field label="One-line objective">
                    <input className={inputCls} value={form.objective} onChange={e => set('objective', e.target.value)} required placeholder="What is your main goal?" />
                  </Field>
                  <Field label="Description" hint="Tell the full story — the problem, your plan, and the impact.">
                    <textarea className={`${inputCls} resize-none`} rows={5} value={form.description} onChange={e => set('description', e.target.value)} required placeholder="Detailed description…" />
                  </Field>
                </div>
              </Section>

              <Section title="Category & Timeline" icon={<Calendar size={18} />}>
                <div className="space-y-4">
                  <Field label="Category">
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map(cat => (
                        <button key={cat} type="button" onClick={() => set('category', cat)}
                          className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${form.category === cat ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}`}>
                          {CAT_EMOJI[cat]} {cat}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Start Date">
                      <input type="date" className={inputCls} value={form.startDate} onChange={e => set('startDate', e.target.value)} required />
                    </Field>
                    <Field label="End Date">
                      <input type="date" className={inputCls} value={form.endDate} onChange={e => set('endDate', e.target.value)} required />
                    </Field>
                  </div>
                </div>
              </Section>
            </motion.div>
          )}

          {/* ── Step 1: Location ───────────────────────────────── */}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <Section title="Project Location" icon={<MapPin size={18} />}>
                <div className="space-y-4">
                  <Field label="Search for location" hint="Search by city, address or landmark. Use the GPS button to use your current location.">
                    <LocationInput
                      address={form.address}
                      onAddressSelect={handleLocationSelect}
                      placeholder="E.g., Connaught Place, New Delhi"
                      showGPS
                      showCoords
                      lat={form.latitude}
                      lng={form.longitude}
                    />
                  </Field>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin size={11} className="text-primary" />
                      You can also click on the map or drag the pin to fine-tune the location.
                    </p>
                    <MapComponent
                      latitude={form.latitude}
                      longitude={form.longitude}
                      address={form.address || 'Project location'}
                      onLocationSelect={handleMapLocationSelect}
                      interactive
                      height="h-80"
                    />
                  </div>

                  {form.address && (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                      <MapPin size={14} className="shrink-0" />
                      <span className="font-medium truncate">{form.address}</span>
                    </div>
                  )}
                </div>
              </Section>
            </motion.div>
          )}

          {/* ── Step 2: Items & Goals ──────────────────────────── */}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <Section title="Funding Goal & Volunteers" icon={<Target size={18} />}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Donation goal (₹)" hint="Optional">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <input type="number" className={`${inputCls} pl-7`} value={form.goalAmount} onChange={e => set('goalAmount', e.target.value)} min="0" placeholder="50000" />
                    </div>
                  </Field>
                  <Field label="Volunteers needed" hint="Optional">
                    <input type="number" className={inputCls} value={form.volunteersNeeded} onChange={e => set('volunteersNeeded', e.target.value)} min="0" placeholder="10" />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Tags" hint="Comma-separated, e.g. water, rural, women">
                    <div className="relative">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input className={`${inputCls} pl-8`} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="water, education, rural" />
                    </div>
                  </Field>
                </div>
              </Section>

              <Section title="Support Items Needed" icon={<Plus size={18} />}>
                <div className="space-y-3 mb-4">
                  {supportItems.map((item, i) => (
                    <div key={i} className="bg-muted/40 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Item #{i + 1}</span>
                        {supportItems.length > 1 && (
                          <button type="button" onClick={() => setSupportItems(s => s.filter((_, idx) => idx !== i))}
                            className="text-destructive hover:bg-destructive/10 p-1 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Item name">
                          <input className={inputCls} value={item.item} onChange={e => handleItemChange(i, 'item', e.target.value)} placeholder="Water Cans" required />
                        </Field>
                        <Field label="Quantity">
                          <input type="number" className={inputCls} value={item.quantity} onChange={e => handleItemChange(i, 'quantity', e.target.value)} min="1" required />
                        </Field>
                        <Field label="Needed by">
                          <input type="date" className={inputCls} value={item.byWhen} onChange={e => handleItemChange(i, 'byWhen', e.target.value)} required />
                        </Field>
                        <Field label="Drop location">
                          <input className={inputCls} value={item.dropLocation} onChange={e => handleItemChange(i, 'dropLocation', e.target.value)} placeholder="Community centre" required />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setSupportItems(s => [...s, { ...BLANK_ITEM }])}
                  className="flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                  <Plus size={15} /> Add another item
                </button>
              </Section>
            </motion.div>
          )}

          {/* ── Step 3: Review ─────────────────────────────────── */}
          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
                <h2 className="text-lg font-bold">Review your project</h2>
                <div className="divide-y divide-border">
                  <div className="py-3 grid grid-cols-2 text-sm"><span className="text-muted-foreground">Title</span><span className="font-medium">{form.title || '—'}</span></div>
                  <div className="py-3 grid grid-cols-2 text-sm"><span className="text-muted-foreground">Category</span><span>{CAT_EMOJI[form.category]} {form.category}</span></div>
                  <div className="py-3 grid grid-cols-2 text-sm"><span className="text-muted-foreground">Duration</span><span>{form.startDate} → {form.endDate}</span></div>
                  <div className="py-3 grid grid-cols-2 text-sm"><span className="text-muted-foreground">Location</span><span className="truncate">{form.address || '—'}</span></div>
                  <div className="py-3 grid grid-cols-2 text-sm"><span className="text-muted-foreground">Coordinates</span><span>{form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</span></div>
                  {form.goalAmount && <div className="py-3 grid grid-cols-2 text-sm"><span className="text-muted-foreground">Goal</span><span>₹{Number(form.goalAmount).toLocaleString()}</span></div>}
                  {form.volunteersNeeded && <div className="py-3 grid grid-cols-2 text-sm"><span className="text-muted-foreground">Volunteers</span><span>{form.volunteersNeeded}</span></div>}
                  <div className="py-3 grid grid-cols-2 text-sm"><span className="text-muted-foreground">Support items</span><span>{supportItems.filter(s => s.item).length} item(s)</span></div>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground">
                  By submitting, you agree to MadadKart's community guidelines. Your project will be reviewed for verification.
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step navigation ─────────────────────────────────── */}
          <div className="flex justify-between gap-3 pt-2">
            {currentStep > 0 ? (
              <button type="button" onClick={() => setCurrentStep(s => s - 1)}
                className="px-6 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-accent transition-colors">
                ← Back
              </button>
            ) : (
              <Link href="/explore" className="px-6 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-accent transition-colors text-center">
                Cancel
              </Link>
            )}

            {currentStep < STEPS.length - 1 ? (
              <button type="button" onClick={() => setCurrentStep(s => s + 1)}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
                Continue →
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                {isSubmitting ? 'Creating project…' : '🚀 Create Project'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
