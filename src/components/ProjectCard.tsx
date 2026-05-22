'use client';

import Link from 'next/link';
import { Project } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { user } = useAuth();

  const isOwner = user?._id === project.creator._id;

  const categoryEmojis = {
    Human: '🤝',
    Plant: '🌱',
    Animal: '🐾',
  };

  const categoryColors = {
    Human: 'from-blue-100 to-blue-50 text-blue-700',
    Plant: 'from-green-100 to-green-50 text-green-700',
    Animal: 'from-amber-100 to-amber-50 text-amber-700',
  };

  return (
    <Link href={`/projects/${project._id}`}>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col group">
        
        {/* Image */}
        {project.pictureOfSuccess && (
          <div className="w-full h-48 bg-gray-200 overflow-hidden relative">
            <img
              src={project.pictureOfSuccess}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />

            <div
              className={`absolute top-3 right-3 bg-linear-to-r ${
                categoryColors[
                  project.category as keyof typeof categoryColors
                ]
              } px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1`}
            >
              <span>
                {
                  categoryEmojis[
                    project.category as keyof typeof categoryEmojis
                  ]
                }
              </span>
              {project.category}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
            {project.title}
          </h3>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
            {project.objective}
          </p>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-700 mb-4 text-sm">
            <svg
              className="w-4 h-4 text-purple-600 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              />
            </svg>

            <span className="truncate">
              {project.location.address}
            </span>
          </div>

          {/* Stats Bar */}
          <div className="bg-linear-to-r from-purple-50 to-blue-50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">
                {isOwner ? 'Your Impact' : 'Supporters'}
              </p>

              <p className="font-bold text-purple-600 text-lg">
                {project.totalDonations}
              </p>
            </div>

            {isOwner ? (
              <button className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition text-sm">
                Manage →
              </button>
            ) : (
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition text-sm">
                Support →
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}