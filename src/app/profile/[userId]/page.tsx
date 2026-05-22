'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProjectCard } from '@/components/ProjectCard';
import { Project } from '@/hooks/useProjects';

interface UserProfile {
  user: {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  createdProjects: Project[];
  donatedProjects: Project[];
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connections, setConnections] = useState(2);
  const [views, setViews] = useState(564);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setViews(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (isLoading) return <LoadingSpinner />;
  if (!profile) return <div className="text-center py-12">Profile not found</div>;

  const initials = profile.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const joinDate = new Date(profile.user.createdAt);

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-blue-50">

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-12">
          <div className="flex items-start gap-8 mb-8">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-4xl   shrink-0">
              {initials}
            </div>

            <div className="flex-1">
              <h2 className="text-4xl font-bold text-gray-900">{profile.user.name}</h2>
              <p className="text-gray-600 text-lg mt-1">Developer</p>

              {/* Stats Row */}
              <div className="flex items-center gap-8 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    👥 {connections} connections
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    👁️ {views} profile views
                  </p>
                </div>
              </div>

              {/* Location & Email */}
              <div className="flex items-center gap-6 mt-6 text-gray-700">
                <p className="flex items-center gap-2">
                  <span>📍</span> South Delhi, Delhi
                </p>
                <p className="flex items-center gap-2">
                  <span>✉️</span> {profile.user.email}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-col">
              <button className="bg-gray-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 transition">
                Connect
              </button>
              <a
                href={`https://linkedin.com`}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center justify-center gap-2"
              >
                <span>in</span> LinkedIn
              </a>
              <a
                href={`https://twitter.com`}
                className="text-blue-400 hover:text-blue-500 font-semibold flex items-center justify-center gap-2"
              >
                <span>𝕏</span> Twitter
              </a>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Projects</h2>

          {profile.createdProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...profile.createdProjects]
                .slice(0, 6)
                .map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center">
              <p className="text-gray-600 text-lg">No projects yet</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Supported Projects</h2>

          {profile.donatedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...profile.donatedProjects]
                .slice(0, 6)
                .map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center">
              <p className="text-gray-600 text-lg">No projects yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}