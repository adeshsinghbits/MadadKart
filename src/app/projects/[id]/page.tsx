'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Users, BadgeCheck, Heart,
  UserPlus, Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DonationModal } from '@/components/donations/DonationModal';
import { DonorList } from '@/components/donations/DonarList';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ProjectGallery } from '@/components/projects/ProjectGallery';
import { formatDistanceToNow } from 'date-fns';

const MapComponent = dynamic(
  () => import('@/components/map/MapComponent').then(m => m.MapComponent),
  { ssr: false, loading: () => <div className="h-48 bg-muted rounded-xl skeleton" /> }
);

const CATEGORY_GRADIENT: Record<string, string> = {
  Human:       'from-blue-500 to-cyan-500',
  Plant:       'from-green-500 to-emerald-500',
  Animal:      'from-amber-500 to-orange-500',
  Environment: 'from-teal-500 to-green-600',
  Education:   'from-violet-500 to-purple-600',
  Health:      'from-pink-500 to-rose-500',
};

type Tab = 'about' | 'gallery' | 'updates' | 'milestones' | 'volunteers';

export default function ProjectDetailPage() {
  const { id }                          = useParams<{ id: string }>();
  const { user, token, isAuthenticated }= useAuth();

  const [project, setProject]           = useState<any>(null);
  const [donations, setDonations]       = useState<any[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [showDonateModal, setShowDonate]= useState(false);
  const [showVolForm, setShowVolForm]   = useState(false);
  const [volRole, setVolRole]           = useState('');
  const [volMsg, setVolMsg]             = useState('');
  const [volLoading, setVolLoading]     = useState(false);
  const [activeTab, setActiveTab]       = useState<Tab>('about');
  const [successMsg, setSuccessMsg]     = useState('');

  const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 5000); };

  const load = async () => {
    setIsLoading(true);
    try {
      const [projRes, donRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/donate`),
      ]);
      if (projRes.ok) setProject(await projRes.json());
      if (donRes.ok) { const d = await donRes.json(); setDonations(d.donations || []); }
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleVolunteer = async () => {
    if (!volRole.trim()) return;
    setVolLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: volRole, message: volMsg }),
      });
      if (res.ok) { setShowVolForm(false); flash('✅ Volunteer application submitted!'); load(); }
    } catch {}
    setVolLoading(false);
  };

  if (isLoading) return <LoadingSpinner text="Loading project…" />;
  if (!project)  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-3">
      <div className="text-5xl">😔</div>
      <p className="text-muted-foreground">Project not found.</p>
      <Link href="/explore" className="text-primary hover:underline text-sm">Browse projects</Link>
    </div>
  );

  const [lng, lat]        = project.location.coordinates;
  const isOwner           = user?._id === (project.creator._id ?? project.creator);
  const gradient          = CATEGORY_GRADIENT[project.category] ?? 'from-purple-500 to-blue-500';
  const progress          = project.goalAmount
    ? Math.min((project.totalDonations / project.goalAmount) * 100, 100)
    : null;
  const acceptedVols      = (project.volunteers ?? []).filter((v: any) => v.status === 'accepted');
  const pendingVols       = (project.volunteers ?? []).filter((v: any) => v.status === 'pending');
  const userVolApp        = (project.volunteers ?? []).find(
    (v: any) => (v.user?._id ?? v.user) === user?._id
  );
  const acceptedVolIds    = acceptedVols.map((v: any) => v.user?._id ?? v.user);

  // Gallery count (cover images + gallery items)
  const coverCount   = project.images?.length ?? 0;
  const galleryCount = project.gallery?.length ?? 0;
  const totalPhotos  = coverCount + galleryCount;

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'about',      label: 'About' },
    { key: 'gallery',    label: 'Gallery',    count: totalPhotos },
    { key: 'updates',    label: 'Updates',    count: project.updates?.length },
    { key: 'milestones', label: 'Milestones', count: project.milestones?.length },
    { key: 'volunteers', label: 'Volunteers', count: acceptedVols.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ───────────────────────────────────────────── */}
      <div className={`relative h-72 md:h-96 bg-linear-to-br ${gradient} overflow-hidden`}>
        {(project.images?.[0] || project.pictureOfSuccess) && (
          <img src={project.images?.[0] || project.pictureOfSuccess} alt={project.title}
            className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex gap-2 mb-3 flex-wrap">
              <span className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                {project.category}
              </span>
              {project.isVerified && (
                <span className="text-xs font-semibold bg-emerald-500/80 text-white px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <BadgeCheck size={11} /> Verified
                </span>
              )}
              <span className={`text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm ${
                project.status === 'active' ? 'bg-green-500/80 text-white' : 'bg-gray-500/80 text-white'
              }`}>{project.status}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow">{project.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Main ───────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Success flash */}
          <AnimatePresence>
            {successMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm">
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Creator card */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <Link href={`/profile/${project.creator._id ?? project.creator}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img
                src={project.creator.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(project.creator.name ?? '')}&backgroundColor=6366f1&textColor=fff`}
                alt={project.creator.name}
                className="w-12 h-12 rounded-full object-cover bg-muted"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">{project.creator.name}</span>
                  {project.creator.ngoVerified && <BadgeCheck size={15} className="text-blue-500" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                </p>
              </div>
            </Link>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl overflow-x-hidden border border-border overflow-hidden" id="gallery">
            {/* Tab bar */}
            <div className="flex border-b border-border">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}>
                  {tab.label}
                  {tab.count != null && tab.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

                  {/* ── About ────────────────────────────────── */}
                  {activeTab === 'about' && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="font-semibold mb-2">Objective</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{project.objective}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{project.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Start Date', value: new Date(project.duration.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                          { label: 'End Date',   value: new Date(project.duration.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-muted/50 rounded-xl p-3">
                            <p className="text-xs text-muted-foreground mb-1">{label}</p>
                            <p className="text-sm font-medium">{value}</p>
                          </div>
                        ))}
                      </div>
                      {project.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {project.tags.map((t: string) => (
                            <span key={t} className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full">#{t}</span>
                          ))}
                        </div>
                      )}
                      {project.supportItems?.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Items Needed</h3>
                          <div className="space-y-2">
                            {project.supportItems.map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium">{item.item}</p>
                                  <p className="text-xs text-muted-foreground">Drop: {item.dropLocation}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold">Qty: {item.quantity}</p>
                                  <p className="text-xs text-muted-foreground">By {new Date(item.byWhen).toLocaleDateString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold mb-3">Location</h3>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                          <MapPin size={14} className="text-primary" />{project.location.address}
                        </div>
                        <MapComponent latitude={lat} longitude={lng} address={project.location.address} />
                      </div>
                    </div>
                  )}

                  {/* ── Gallery ──────────────────────────────── */}
                  {activeTab === 'gallery' && (
                    <ProjectGallery
                      projectId={id}
                      creatorId={project.creator._id ?? project.creator}
                      projectTitle={project.title}
                      acceptedVolunteerIds={acceptedVolIds}
                    />
                  )}

                  {/* ── Updates ──────────────────────────────── */}
                  {activeTab === 'updates' && (
                    <div className="space-y-4">
                      {!project.updates?.length ? (
                        <p className="text-center text-muted-foreground py-8 text-sm">No updates yet.</p>
                      ) : [...project.updates].reverse().map((u: any) => (
                        <div key={u._id} className="border-l-2 border-primary/30 pl-4 space-y-1">
                          <h4 className="font-medium text-sm">{u.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(u.postedAt), { addSuffix: true })}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{u.content}</p>
                          {u.images?.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {u.images.map((img: string, i: number) => (
                                <img key={i} src={img} alt="" className="w-20 h-20 rounded-lg object-cover" />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Milestones ────────────────────────────── */}
                  {activeTab === 'milestones' && (
                    <div className="space-y-3">
                      {!project.milestones?.length ? (
                        <p className="text-center text-muted-foreground py-8 text-sm">No milestones set.</p>
                      ) : project.milestones.map((m: any) => (
                        <div key={m._id} className={`flex items-start gap-3 p-3 rounded-xl ${
                          m.isCompleted ? 'bg-emerald-50 border border-emerald-200' : 'bg-muted/40'
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${
                            m.isCompleted ? 'bg-emerald-500 text-white' : 'bg-muted-foreground/20 text-muted-foreground'
                          }`}>{m.isCompleted ? '✓' : m.order + 1}</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{m.title}</p>
                            {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                            {m.targetDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Target: {new Date(m.targetDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Volunteers ────────────────────────────── */}
                  {activeTab === 'volunteers' && (
                    <div className="space-y-4">
                      {!acceptedVols.length ? (
                        <p className="text-center text-muted-foreground py-8 text-sm">No volunteers yet. Be the first!</p>
                      ) : (
                        <div className="space-y-3">
                          {acceptedVols.map((v: any) => (
                            <div key={v._id} className="flex items-center gap-3">
                              <img
                                src={v.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(v.user?.name ?? '')}&backgroundColor=6366f1&textColor=fff`}
                                alt={v.user?.name} className="w-9 h-9 rounded-full" />
                              <div>
                                <p className="text-sm font-medium">{v.user?.name}</p>
                                <p className="text-xs text-muted-foreground">{v.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Owner: pending applications */}
                      {isOwner && pendingVols.length > 0 && (
                        <div className="mt-4 border-t border-border pt-4">
                          <h4 className="text-sm font-semibold mb-3">Pending ({pendingVols.length})</h4>
                          {pendingVols.map((v: any) => (
                            <div key={v._id} className="flex items-center gap-3 mb-3">
                              <img
                                src={v.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(v.user?.name ?? '')}&backgroundColor=6366f1&textColor=fff`}
                                alt={v.user?.name} className="w-8 h-8 rounded-full" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{v.user?.name}</p>
                                <p className="text-xs text-muted-foreground">{v.role}</p>
                              </div>
                              <div className="flex gap-1.5">
                                {['accepted', 'rejected'].map(status => (
                                  <button key={status}
                                    onClick={async () => {
                                      await fetch(`/api/projects/${id}/volunteer`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                        body: JSON.stringify({ volunteerId: v.user?._id ?? v.user, status }),
                                      });
                                      load();
                                    }}
                                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                                      status === 'accepted'
                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}>
                                    {status === 'accepted' ? 'Accept' : 'Reject'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Sidebar ───────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Donation card */}
          <div className="bg-white rounded-2xl border border-border p-5 sticky top-20">
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-bold">₹{project.totalDonations.toLocaleString()}</span>
                {project.goalAmount && (
                  <span className="text-sm text-muted-foreground">of ₹{project.goalAmount.toLocaleString()}</span>
                )}
              </div>
              {progress !== null && (
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
                  <motion.div className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                    initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} />
                </div>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                <span>{project.donors?.length ?? 0} donors</span>
                {project.volunteersNeeded && (
                  <span>{acceptedVols.length}/{project.volunteersNeeded} volunteers</span>
                )}
              </div>
            </div>

            {isAuthenticated ? (
              <div className="space-y-2">
                <button onClick={() => setShowDonate(true)}
                  className={`w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r ${gradient} hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}>
                  <Heart size={15} /> Donate Now
                </button>

                {!userVolApp && project.volunteersNeeded && (
                  <button onClick={() => setShowVolForm(s => !s)}
                    className="w-full py-2.5 rounded-xl font-medium border border-border hover:bg-accent transition-colors flex items-center justify-center gap-2 text-sm">
                    <UserPlus size={14} /> Volunteer
                  </button>
                )}

                {userVolApp && (
                  <p className="text-xs text-center text-muted-foreground bg-muted rounded-lg py-2">
                    Volunteer status:{' '}
                    <span className={`font-medium ${
                      userVolApp.status === 'accepted' ? 'text-emerald-600'
                      : userVolApp.status === 'rejected' ? 'text-red-500'
                      : 'text-amber-600'
                    }`}>{userVolApp.status}</span>
                  </p>
                )}

                {isOwner && (
                  <Link href={`/projects/edit/${id}`}
                    className="w-full py-2.5 rounded-xl font-medium border border-border hover:bg-accent transition-colors flex items-center justify-center text-sm">
                    Edit Project
                  </Link>
                )}
              </div>
            ) : (
              <Link href="/login"
                className={`block w-full py-3 rounded-xl text-white font-semibold text-center bg-gradient-to-r ${gradient} hover:opacity-90 transition-opacity`}>
                Login to Support
              </Link>
            )}

            {/* Volunteer form */}
            <AnimatePresence>
              {showVolForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2 border-t border-border pt-3 overflow-hidden">
                  <input value={volRole} onChange={e => setVolRole(e.target.value)} placeholder="Your role / skill"
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary" />
                  <textarea value={volMsg} onChange={e => setVolMsg(e.target.value)} placeholder="Message (optional)" rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-primary" />
                  <button onClick={handleVolunteer} disabled={volLoading}
                    className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    {volLoading ? 'Submitting…' : 'Submit Application'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Donors list */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-semibold mb-4">Recent Supporters</h3>
            <DonorList donors={donations} />
          </div>

          {/* Gallery quick preview */}
          {totalPhotos > 0 && activeTab !== 'gallery' && (
            <div className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Gallery</h3>
                <button onClick={() => setActiveTab('gallery')}
                  className="text-xs text-primary hover:underline">View all →</button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {project.images?.slice(0, 6).map((img: string, i: number) => (
                  <button key={i} onClick={() => setActiveTab('gallery')}
                    className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showDonateModal && (
        <DonationModal
          projectId={id}
          projectTitle={project.title}
          onClose={() => setShowDonate(false)}
          onSuccess={() => {
            setShowDonate(false);
            flash('🎉 Donation successful! Thank you.');
            load();
          }}
        />
      )}
    </div>
  );
}
