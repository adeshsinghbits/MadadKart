'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, BadgeCheck, Heart, UserPlus,  } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DonationModal } from '@/components/donations/DonationModal';
import { DonorList } from '@/components/donations/DonarList';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

const MapComponent = dynamic(() => import('@/components/map/MapClient').then(m => m.default), {
  ssr: false,
  loading: () => <div className="h-48 bg-muted rounded-xl skeleton" />,
});

const CATEGORY_GRADIENT: Record<string, string> = {
  Human: 'from-blue-500 to-cyan-500', Plant: 'from-green-500 to-emerald-500',
  Animal: 'from-amber-500 to-orange-500', Environment: 'from-teal-500 to-green-600',
  Education: 'from-violet-500 to-purple-600', Health: 'from-pink-500 to-rose-500',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token, isAuthenticated } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  const [volunteerRole, setVolunteerRole] = useState('');
  const [volunteerMsg, setVolunteerMsg] = useState('');
  const [volunteerLoading, setVolunteerLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'updates' | 'volunteers' | 'milestones'>('about');
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleDonationSuccess = () => {
    setShowDonateModal(false);
    setSuccessMsg('🎉 Donation successful! Thank you for your support.');
    setTimeout(() => setSuccessMsg(''), 5000);
    load();
  };

  const handleVolunteer = async () => {
    if (!volunteerRole.trim()) return;
    setVolunteerLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: volunteerRole, message: volunteerMsg }),
      });
      if (res.ok) {
        setShowVolunteerForm(false);
        setSuccessMsg('✅ Volunteer application submitted!');
        setTimeout(() => setSuccessMsg(''), 5000);
        load();
      }
    } catch {}
    setVolunteerLoading(false);
  };

  if (isLoading) return <LoadingSpinner text="Loading project..." />;
  if (!project) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-4">😔</div><p>Project not found</p>
        <Link href="/explore" className="text-primary hover:underline text-sm">Browse projects</Link></div>
    </div>
  );

  const [lng, lat] = project.location.coordinates;
  const isOwner = user?._id === (project.creator._id || project.creator);
  const gradient = CATEGORY_GRADIENT[project.category] || 'from-purple-500 to-blue-500';
  const progress = project.goalAmount ? Math.min((project.totalDonations / project.goalAmount) * 100, 100) : null;
  const acceptedVolunteers = project.volunteers?.filter((v: any) => v.status === 'accepted') || [];
  const pendingVolunteers = project.volunteers?.filter((v: any) => v.status === 'pending') || [];
  const userVolApp = project.volunteers?.find((v: any) => (v.user?._id || v.user) === user?._id);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero image */}
      <div className={`relative h-72 md:h-96 bg-linear-to-br ${gradient} overflow-hidden`}>
        {(project.images?.[0] || project.pictureOfSuccess) && (
          <img src={project.images?.[0] || project.pictureOfSuccess} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex gap-2 mb-3">
              <span className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-sm">{project.category}</span>
              {project.isVerified && <span className="text-xs font-semibold bg-emerald-500/80 text-white px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1"><BadgeCheck size={11} /> Verified</span>}
              <span className={`text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm ${project.status === 'active' ? 'bg-green-500/80 text-white' : 'bg-gray-500/80 text-white'}`}>{project.status}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white">{project.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm">
              {successMsg}
            </motion.div>
          )}

          {/* Creator info */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <Link href={`/profile/${project.creator._id || project.creator}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src={project.creator.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${project.creator.name}`}
                alt={project.creator.name} className="w-12 h-12 rounded-full" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">{project.creator.name}</span>
                  {project.creator.ngoVerified && <BadgeCheck size={16} className="text-blue-500" />}
                </div>
                <p className="text-sm text-muted-foreground">Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</p>
              </div>
            </Link>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="flex border-b border-border">
              {(['about', 'updates', 'milestones', 'volunteers'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'text-primary border-b-2 border-primary -mb-px' : 'text-muted-foreground hover:text-foreground'}`}>
                  {tab} {tab === 'updates' && project.updates?.length ? `(${project.updates.length})` : ''}
                  {tab === 'volunteers' && acceptedVolunteers.length ? `(${acceptedVolunteers.length})` : ''}
                  {tab === 'milestones' && project.milestones?.length ? `(${project.milestones.length})` : ''}
                </button>
              ))}
            </div>
            <div className="p-5">
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
                    <div className="bg-muted/50 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                      <p className="text-sm font-medium">{new Date(project.duration.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-1">End Date</p>
                      <p className="text-sm font-medium">{new Date(project.duration.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
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
                              <p className="text-xs text-muted-foreground">Drop at: {item.dropLocation}</p>
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
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3"><MapPin size={14} className="text-primary" />{project.location.address}</div>
                    <MapComponent
                      latitude={lat}
                      longitude={lng}
                      address={project.location.address || 'Project location'}
                      interactive={true}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'updates' && (
                <div className="space-y-4">
                  {project.updates?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No updates yet.</p>
                  ) : project.updates?.slice().reverse().map((update: any) => (
                    <div key={update._id} className="border-l-2 border-primary/30 pl-4 space-y-1">
                      <h4 className="font-medium text-sm">{update.title}</h4>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(update.postedAt), { addSuffix: true })}</p>
                      <p className="text-sm text-muted-foreground">{update.content}</p>
                      {update.images?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {update.images.map((img: string, i: number) => (
                            <img key={i} src={img} alt="" className="w-20 h-20 rounded-lg object-cover" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'milestones' && (
                <div className="space-y-3">
                  {project.milestones?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No milestones set.</p>
                  ) : project.milestones?.map((m: any) => (
                    <div key={m._id} className={`flex items-start gap-3 p-3 rounded-xl ${m.isCompleted ? 'bg-emerald-50 border border-emerald-200' : 'bg-muted/40'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${m.isCompleted ? 'bg-emerald-500 text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                        {m.isCompleted ? '✓' : m.order + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{m.title}</p>
                        {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                        {m.targetDate && <p className="text-xs text-muted-foreground mt-1">Target: {new Date(m.targetDate).toLocaleDateString()}</p>}
                      </div>
                      {m.isCompleted && isOwner && (
                        <span className="text-xs text-emerald-600 font-medium">Completed</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'volunteers' && (
                <div className="space-y-4">
                  {acceptedVolunteers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No volunteers yet. Be the first!</p>
                  ) : (
                    <div className="space-y-3">
                      {acceptedVolunteers.map((v: any) => (
                        <div key={v._id} className="flex items-center gap-3">
                          <img src={v.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${v.user?.name}`}
                            alt={v.user?.name} className="w-9 h-9 rounded-full" />
                          <div>
                            <p className="text-sm font-medium">{v.user?.name}</p>
                            <p className="text-xs text-muted-foreground">{v.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isOwner && pendingVolunteers.length > 0 && (
                    <div className="mt-4 border-t border-border pt-4">
                      <h4 className="text-sm font-semibold mb-3">Pending Applications ({pendingVolunteers.length})</h4>
                      {pendingVolunteers.map((v: any) => (
                        <div key={v._id} className="flex items-center gap-3 mb-3">
                          <img src={v.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${v.user?.name}`}
                            alt={v.user?.name} className="w-8 h-8 rounded-full" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{v.user?.name}</p>
                            <p className="text-xs text-muted-foreground">{v.role}</p>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={async () => {
                              await fetch(`/api/projects/${id}/volunteer`, {
                                method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ volunteerId: v.user?._id || v.user, status: 'accepted' }),
                              });
                              load();
                            }} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-200 transition-colors">Accept</button>
                            <button onClick={async () => {
                              await fetch(`/api/projects/${id}/volunteer`, {
                                method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ volunteerId: v.user?._id || v.user, status: 'rejected' }),
                              });
                              load();
                            }} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors">Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Donation card */}
          <div className="bg-white rounded-2xl border border-border p-5 sticky top-20">
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-bold">₹{project.totalDonations.toLocaleString()}</span>
                {project.goalAmount && <span className="text-sm text-muted-foreground">of ₹{project.goalAmount.toLocaleString()}</span>}
              </div>
              {progress !== null && (
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
                  <motion.div className={`h-full bg-linear-to-r ${gradient} rounded-full`}
                    initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} />
                </div>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                <span>{project.donors?.length || 0} donors</span>
                {project.volunteersNeeded && <span>{acceptedVolunteers.length}/{project.volunteersNeeded} volunteers</span>}
              </div>
            </div>

            {isAuthenticated ? (
              <div className="space-y-2">
                <button onClick={() => setShowDonateModal(true)}
                  className={`w-full py-3 rounded-xl text-white font-semibold bg-linear-to-r ${gradient} hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}>
                  <Heart size={16} /> Donate Now
                </button>
                {!userVolApp && project.volunteersNeeded && (
                  <button onClick={() => setShowVolunteerForm(!showVolunteerForm)}
                    className="w-full py-3 rounded-xl font-semibold border border-border hover:bg-accent transition-colors flex items-center justify-center gap-2 text-sm">
                    <UserPlus size={15} /> Volunteer
                  </button>
                )}
                {userVolApp && (
                  <p className="text-xs text-center text-muted-foreground bg-muted rounded-lg py-2">
                    Volunteer status: <span className={`font-medium ${userVolApp.status === 'accepted' ? 'text-emerald-600' : userVolApp.status === 'rejected' ? 'text-red-500' : 'text-amber-600'}`}>{userVolApp.status}</span>
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
              <Link href="/login" className={`block w-full py-3 rounded-xl text-white font-semibold text-center bg-linear-to-r ${gradient} hover:opacity-90 transition-opacity`}>
                Login to Support
              </Link>
            )}

            {showVolunteerForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2 border-t border-border pt-3">
                <input value={volunteerRole} onChange={e => setVolunteerRole(e.target.value)} placeholder="Your role / skill"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary" />
                <textarea value={volunteerMsg} onChange={e => setVolunteerMsg(e.target.value)} placeholder="Message (optional)" rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-primary" />
                <button onClick={handleVolunteer} disabled={volunteerLoading}
                  className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  {volunteerLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </motion.div>
            )}
          </div>

          {/* Donors list */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-semibold mb-4">Recent Supporters</h3>
            <DonorList donors={donations} />
          </div>
        </div>
      </div>

      {showDonateModal && (
        <DonationModal projectId={id} projectTitle={project.title} onClose={() => setShowDonateModal(false)} onSuccess={handleDonationSuccess} />
      )}
    </div>
  );
}
