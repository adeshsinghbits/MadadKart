'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Globe, BadgeCheck,
  UserPlus, UserCheck, TrendingUp, Calendar, 
  PenLine, ExternalLink, 
} from 'lucide-react';
import { FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { BadgeDisplay } from '@/components/shared/BadgeDisplay';
import { ImpactScore } from '@/components/shared/ImpactScore';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDistanceToNow } from 'date-fns';

/* ── Types ─────────────────────────────────────────────────────── */
interface Follower { _id: string; name: string; avatar?: string; impactScore?: number; role?: string; ngoVerified?: boolean }
interface FullUser {
  _id: string; name: string; email: string; role: string;
  avatar?: string; coverImage?: string; bio?: string;
  location?: string; website?: string; isNGO?: boolean; ngoVerified?: boolean;
  impactScore: number; totalDonated: number; volunteeringHours: number;
  streakDays: number; badges: any[]; followers: Follower[]; following: Follower[];
  socialLinks?: { twitter?: string; linkedin?: string; instagram?: string };
  createdAt: string;
}
interface ProfileData { user: FullUser; createdProjects: any[]; donatedProjects: any[] }

/* ── Helpers ────────────────────────────────────────────────────── */
const avatar = (u: { name: string; avatar?: string }) =>
  u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}&backgroundColor=6366f1&textColor=fff`;

const TABS = ['Projects', 'Supported', 'Followers', 'Following'] as const;
type Tab = typeof TABS[number];

/* ── Component ─────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: me, token, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Projects');

  const isOwnProfile = me?._id === userId;

  /* Fetch profile */
  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (me) {
          setIsFollowing(data.user.followers?.some((f: Follower) => f._id === me._id));
        }
      }
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  /* Follow / unfollow */
  const handleFollow = async () => {
    if (!isAuthenticated) return;
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
        // Optimistically update count
        setProfile(p => {
          if (!p) return p;
          const followers = data.following
            ? [...p.user.followers, { _id: me!._id, name: me!.name, avatar: me?.avatar }]
            : p.user.followers.filter(f => f._id !== me!._id);
          return { ...p, user: { ...p.user, followers } };
        });
      }
    } catch {}
    setFollowLoading(false);
  };

  if (isLoading) return <LoadingSpinner text="Loading profile…" />;
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <EmptyState icon="👤" title="Profile not found" description="This user doesn't exist or has been removed."
        action={{ label: 'Go home', href: '/' }} />
    </div>
  );

  const { user } = profile;
  const joinDate = new Date(user.createdAt);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="relative h-52 md:h-64 bg-linear-to-br from-slate-600 via-slate-900 to-black overflow-hidden">
        {user.coverImage && (
          <img src={user.coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />

        {isOwnProfile && (
          <Link href="/profile/edit"
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white border border-white/30 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors flex items-center gap-1.5">
            <PenLine size={13} /> Edit Profile
          </Link>
        )}
      </div>

      <div className="mx-10 px-4">

        <div className="bg-white rounded-2xl border border-border shadow-sm -mt-16 relative z-10 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-5">

            {/* Avatar */}
            <div className="relative -mt-16 sm:-mt-20 shrink-0">
              <img src={avatar(user)} alt={user.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-lg bg-muted" />
              {user.ngoVerified && (
                <span className="absolute -bottom-1.5 -right-1.5 bg-blue-500 text-white rounded-full p-1 shadow border-2 border-white">
                  <BadgeCheck size={12} />
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-2 sm:pt-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    {user.ngoVerified && (
                      <span className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                        <BadgeCheck size={12} /> Verified NGO
                      </span>
                    )}
                    {user.role === 'admin' && (
                      <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">Admin</span>
                    )}
                  </div>

                  <ImpactScore score={user.impactScore} />

                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                    {user.location && (
                      <span className="flex items-center gap-1"><MapPin size={13} className="text-primary" />{user.location}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      Joined {formatDistanceToNow(joinDate, { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Social links */}
                  {user.socialLinks?.twitter && (
                    <a href={`https://twitter.com/${user.socialLinks.twitter}`} target="_blank" rel="noreferrer"
                      className="p-2 rounded-xl border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                      <FaTwitter size={16} />
                    </a>
                  )}
                  {user.socialLinks?.linkedin && (
                    <a href={`https://linkedin.com/in/${user.socialLinks.linkedin}`} target="_blank" rel="noreferrer"
                      className="p-2 rounded-xl border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                      <FaLinkedin size={16} />
                    </a>
                  )}
                  {user.socialLinks?.instagram && (
                    <a href={`https://instagram.com/${user.socialLinks.instagram}`} target="_blank" rel="noreferrer"
                      className="p-2 rounded-xl border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                      <FaInstagram size={16} />
                    </a>
                  )}
                  {user.website && (
                    <a href={user.website} target="_blank" rel="noreferrer"
                      className="p-2 rounded-xl border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                      <Globe size={16} />
                    </a>
                  )}

                  {isOwnProfile ? (
                    <Link href="/profile/edit"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium">
                      <PenLine size={14} /> Edit Profile
                    </Link>
                  ) : isAuthenticated ? (
                    <button onClick={handleFollow} disabled={followLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        isFollowing
                          ? 'border border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      } disabled:opacity-50`}>
                      {followLoading ? (
                        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : isFollowing ? (
                        <><UserCheck size={15} /> Following</>
                      ) : (
                        <><UserPlus size={15} /> Follow</>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-2xl border-t border-border pt-4">{user.bio}</p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-5 border-t border-border">
            {[
              { label: 'Projects', value: profile.createdProjects.length, icon: '🚀' },
              { label: 'Donated', value: `₹${(user.totalDonated || 0).toLocaleString()}`, icon: '💰' },
              { label: 'Followers', value: user.followers?.length ?? 0, icon: '👥' },
              { label: 'Following', value: user.following?.length ?? 0, icon: '❤️' },
              { label: 'Hours Volunteered', value: user.volunteeringHours ?? 0, icon: '⏱️' },
            ].map(stat => (
              <div key={stat.label} className="bg-muted/40 rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{stat.icon}</div>
                <div className="text-lg font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Badges */}
          {user.badges?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Badges Earned</h3>
              <BadgeDisplay badges={user.badges} />
            </div>
          )}
        </div>

        {/* ── Tabs ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-8">
          {/* Tab bar */}
          <div className="flex border-b border-border overflow-x-auto">
            {TABS.map(tab => {
              const count = tab === 'Projects' ? profile.createdProjects.length
                : tab === 'Supported' ? profile.donatedProjects.length
                : tab === 'Followers' ? user.followers?.length ?? 0
                : user.following?.length ?? 0;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}>
                  {tab}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    activeTab === tab ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

                {/* Projects created */}
                {activeTab === 'Projects' && (
                  profile.createdProjects.length === 0 ? (
                    <EmptyState icon="🚀" title="No projects yet"
                      description={isOwnProfile ? "Start your first social impact project!" : `${user.name} hasn't created any projects yet.`}
                      action={isOwnProfile ? { label: 'Create a Project', href: '/projects/create' } : undefined} />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {profile.createdProjects.map((p, i) => (
                        <motion.div key={p._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <ProjectCard project={p} />
                        </motion.div>
                      ))}
                    </div>
                  )
                )}

                {/* Supported projects */}
                {activeTab === 'Supported' && (
                  profile.donatedProjects.length === 0 ? (
                    <EmptyState icon="💝" title="No supported projects yet"
                      description={isOwnProfile ? "Start donating to make a difference!" : `${user.name} hasn't supported any projects publicly.`}
                      action={isOwnProfile ? { label: 'Explore Projects', href: '/explore' } : undefined} />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {profile.donatedProjects.map((p, i) => (
                        <motion.div key={p._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <ProjectCard project={p} />
                        </motion.div>
                      ))}
                    </div>
                  )
                )}

                {/* Followers */}
                {activeTab === 'Followers' && (
                  !user.followers?.length ? (
                    <EmptyState icon="👥" title="No followers yet"
                      description={isOwnProfile ? "Share your profile to grow your network!" : `${user.name} has no followers yet.`} />
                  ) : (
                    <UserGrid users={user.followers} currentUserId={me?._id} />
                  )
                )}

                {/* Following */}
                {activeTab === 'Following' && (
                  !user.following?.length ? (
                    <EmptyState icon="❤️" title="Not following anyone yet"
                      description={isOwnProfile ? "Discover people making an impact!" : `${user.name} isn't following anyone yet.`} />
                  ) : (
                    <UserGrid users={user.following} currentUserId={me?._id} />
                  )
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── UserGrid subcomponent ──────────────────────────────────────── */
function UserGrid({ users, currentUserId }: { users: Follower[]; currentUserId?: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((u, i) => (
        <motion.div key={u._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
          <Link href={`/profile/${u._id}`}
            className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent transition-colors group">
            <img src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}&backgroundColor=6366f1&textColor=fff`}
              alt={u.name} className="w-11 h-11 rounded-full object-cover shrink-0 bg-muted" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{u.name}</p>
                {u.ngoVerified && <BadgeCheck size={13} className="text-blue-500 shrink-0" />}
              </div>
              {u.impactScore != null && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <TrendingUp size={10} /> {u.impactScore} pts
                </p>
              )}
            </div>
            <ExternalLink size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
