'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserProfileCardProps {
  userId: string;
  name: string;
  email: string;
  role?: string;
  location?: string;
  connections?: number;
  views?: number;
  createdProjects?: number;
  supportedProjects?: number;
  onConnect?: () => void;
}

export function UserProfileCard({
  userId,
  name,
  email,
  role = 'Supporter',
  location,
  connections = 0,
  views = 0,
  createdProjects = 0,
  supportedProjects = 0,
  onConnect,
}: UserProfileCardProps) {
  const router = useRouter();
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <Link href={`/profile/${userId}`}>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-8 w-full">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
              <p className="text-gray-600">{role}</p>
              {location && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  📍 {location}
                </p>
              )}
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                ✉️ {email}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-t border-b border-gray-200">
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
          <div>
            <p className="text-sm text-gray-600">📦 {createdProjects} created</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">💚 {supportedProjects} supported</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              onConnect?.();
            }}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition"
          >
            Connect
          </button>
          <Link
            href={`/profile/${userId}`}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
          >
            View Profile
          </Link>
        </div>
      </div>
    </Link>
  );
}