'use client';

import Link from 'next/link';

interface Donor {
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  message?: string;
  donatedAt: string;
  amount?: number;
}

interface DonorListProps {
  donors: any[];
  stats?: {
    totalDonors: number;
    recentDonors: number;
  };
}

export function DonorList({ donors, stats }: DonorListProps) {
  if (!donors || donors.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">No donors yet. Be the first to donate!</p>
      </div>
    );
  }

  return (
    <div>
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Total Donors</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalDonors}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">This Week</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.recentDonors}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {donors.map((donation, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1">
              <Link
                href={`/profile/${donation.userId._id}`}
                className="font-semibold text-gray-800 hover:text-blue-600"
              >
                {donation.userId.name}
              </Link>
              {donation.message && (
                <p className="text-sm text-gray-600 mt-1">
                  "{donation.message}"
                </p>
              )}
            </div>
            <div className="text-right ml-4">
              {donation.amount && (
                <p className="font-semibold text-gray-800">
                  ₹{donation.amount}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {new Date(donation.donatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
