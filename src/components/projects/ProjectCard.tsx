'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Users, TrendingUp, BadgeCheck, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Project {
  _id: string;
  title: string;
  objective: string;
  category: string;
  status?: string;
  location: { address: string; coordinates: [number, number] };
  images?: string[];
  pictureOfSuccess?: string;
  creator: { _id: string; name: string; avatar?: string; ngoVerified?: boolean };
  totalDonations: number;
  goalAmount?: number;
  donors?: any[];
  volunteers?: any[];
  isVerified?: boolean;
  createdAt: string;
}

const CATEGORY_CONFIG: Record<string, { emoji: string; gradient: string; badge: string }> = {
  Human:       { emoji: '🤝', gradient: 'from-blue-500 to-cyan-500',    badge: 'bg-blue-100 text-blue-700' },
  Plant:       { emoji: '🌱', gradient: 'from-green-500 to-emerald-500', badge: 'bg-green-100 text-green-700' },
  Animal:      { emoji: '🐾', gradient: 'from-amber-500 to-orange-500',  badge: 'bg-amber-100 text-amber-700' },
  Environment: { emoji: '🌍', gradient: 'from-teal-500 to-green-600',    badge: 'bg-teal-100 text-teal-700' },
  Education:   { emoji: '📚', gradient: 'from-violet-500 to-purple-600', badge: 'bg-violet-100 text-violet-700' },
  Health:      { emoji: '❤️',  gradient: 'from-pink-500 to-rose-500',    badge: 'bg-pink-100 text-pink-700' },
};

export function ProjectCard({ project }: { project: Project }) {
  const cat = CATEGORY_CONFIG[project.category] || CATEGORY_CONFIG.Human;
  const img = project.images?.[0] || project.pictureOfSuccess;
  const progress = project.goalAmount ? Math.min((project.totalDonations / project.goalAmount) * 100, 100) : null;
  const donorCount = project.donors?.length ?? 0;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
      <Link href={`/projects/${project._id}`} className="block h-full">
        <div className="bg-white rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow h-full flex flex-col overflow-hidden">
          {/* Image */}
          <div className="relative h-44 bg-gradient-to-br from-muted to-accent overflow-hidden">
            {img ? (
              <img src={img} alt={project.title} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-5xl opacity-80`}>
                {cat.emoji}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute top-3 left-3 flex gap-1.5">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.badge} flex items-center gap-1`}>
                {cat.emoji} {project.category}
              </span>
              {project.isVerified && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <BadgeCheck size={11} /> Verified
                </span>
              )}
            </div>
            {project.status === 'completed' && (
              <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">Completed</div>
            )}
          </div>

          {/* Body */}
          <div className="p-4 flex-1 flex flex-col gap-3">
            <div>
              <h3 className="font-semibold text-foreground leading-tight line-clamp-2 mb-1">{project.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{project.objective}</p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={12} className="text-primary shrink-0" />
              <span className="truncate">{project.location.address}</span>
            </div>

            {/* Progress */}
            {progress !== null && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">₹{project.totalDonations.toLocaleString()}</span>
                  <span className="text-muted-foreground">of ₹{project.goalAmount!.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${cat.gradient} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users size={12} /> {donorCount} donors</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <img
                  src={project.creator.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${project.creator.name}`}
                  alt={project.creator.name}
                  className="w-5 h-5 rounded-full"
                />
                {project.creator.ngoVerified && <BadgeCheck size={12} className="text-blue-500" />}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
