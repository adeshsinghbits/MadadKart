'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { DonorList } from '@/components/DonorList';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useProjects, Project } from '@/hooks/useProjects';
import { useDonations } from '@/hooks/useDonations';
import { useAuth } from '@/hooks/useAuth';


const MapComponent = dynamic(
  () =>
    import('@/components/MapComponent').then(
      (mod) => mod.MapComponent
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-100 bg-gray-200 rounded-lg animate-pulse" />
    ),
  }
);

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { getProjectById, isLoading: projectLoading } = useProjects();
  const { getDonors, donate, isLoading: donationLoading } = useDonations();
  const { isAuthenticated } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [donors, setDonors] = useState<any[]>([]);
  const [stats, setStats] = useState(null);
  const [showDonateForm, setShowDonateForm] = useState(false);
  const [donateMessage, setDonateMessage] = useState('');
  const [donateAmount, setDonateAmount] = useState('');

  useEffect(() => {
    const loadProject = async () => {
      const proj = await getProjectById(projectId);
      if (proj) setProject(proj);
    };
    loadProject();
  }, [projectId, getProjectById]);

  useEffect(() => {
    if (project) {
      const loadDonors = async () => {
        const donorData = await getDonors(projectId);
        if (donorData) setDonors(donorData);
      };
      loadDonors();
    }
  }, [project, projectId, getDonors]);

  const handleDonate = async () => {
    const success = await donate(
      projectId,
      donateMessage,
      donateAmount ? parseInt(donateAmount) : undefined
    );

    if (success) {
      setShowDonateForm(false);
      setDonateMessage('');
      setDonateAmount('');
      const updatedDonors = await getDonors(projectId);
      if (updatedDonors) setDonors(updatedDonors);
    }
  };

  if (projectLoading) return <LoadingSpinner />;
  if (!project) return <div className="text-center py-12">Project not found</div>;

  const [lng, lat] = project.location.coordinates;
  const categoryColors = {
    Human: 'bg-blue-100 text-blue-700',
    Plant: 'bg-green-100 text-green-700',
    Animal: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => window.history.back()}
          className="text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {project.pictureOfSuccess && (
            <div className="w-full h-96 bg-gray-200">
              <img
                src={project.pictureOfSuccess}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded ${
                  categoryColors[project.category as keyof typeof categoryColors]
                }`}
              >
                {project.category}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {project.totalDonations} donors
              </span>
            </div>

            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {project.title}
            </h1>

            <p className="text-lg text-gray-600 mb-6">{project.objective}</p>

            <div className="flex items-center text-gray-700 mb-6">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              {project.location.address}
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              {project.description}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="font-semibold text-gray-800">
                  {new Date(project.duration.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">End Date</p>
                <p className="font-semibold text-gray-800">
                  {new Date(project.duration.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Support Items Needed
              </h3>
              <div className="space-y-3">
                {project.supportItems.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{item.item}</p>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-600">
                          Drop Location: {item.dropLocation}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        By {new Date(item.byWhen).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              {isAuthenticated && (
                <button
                  onClick={() => setShowDonateForm(!showDonateForm)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  {showDonateForm ? 'Cancel' : 'Donate Now'}
                </button>
              )}
              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 text-center"
                >
                  Login to Donate
                </Link>
              )}
            </div>

            {showDonateForm && (
              <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Support This Project
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message (optional)
                    </label>
                    <textarea
                      value={donateMessage}
                      onChange={(e) => setDonateMessage(e.target.value)}
                      placeholder="Share why you're supporting this project..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (optional, in ₹)
                    </label>
                    <input
                      type="number"
                      value={donateAmount}
                      onChange={(e) => setDonateAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleDonate}
                    disabled={donationLoading}
                    className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {donationLoading ? 'Processing...' : 'Confirm Donation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Location</h2>
              <MapComponent
                latitude={lat}
                longitude={lng}
                address={project.location.address}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Donors ({project.totalDonations})
            </h2>
            <DonorList donors={donors} />
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Created By</h2>
          <Link
            href={`/profile/${project.creator._id}`}
            className="inline-block"
          >
            <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-semibold text-gray-800 hover:text-blue-600">
                  {project.creator.name}
                </p>
                <p className="text-sm text-gray-600">{project.creator.email}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
