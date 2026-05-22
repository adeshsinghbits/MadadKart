'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Donor {
  _id: string;
  name: string;
  email: string;
}

export interface DonationStats {
  totalDonors: number;
  recentDonors: number;
}

interface DonationsState {
  donors: any[];
  stats: DonationStats | null;
  isLoading: boolean;
  error: string | null;
}

export function useDonations() {
  const { token } = useAuth();
  const [state, setState] = useState<DonationsState>({
    donors: [],
    stats: null,
    isLoading: false,
    error: null,
  });

  const getDonors = useCallback(async (projectId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `/api/donations/${projectId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch donors');
      }

      const data = await response.json();

      setState({
        donors: data.donors,
        stats: data.stats,
        isLoading: false,
        error: null,
      });

      return data.donors;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error fetching donors';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, []);

  const donate = useCallback(
    async (projectId: string, message?: string, amount?: number) => {
      if (!token) {
        setState((prev) => ({
          ...prev,
          error: 'Not authenticated',
        }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch('/api/donations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId,
            message,
            amount,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create donation');
        }

        const result = await response.json();

        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));

        return result.donation;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error creating donation';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
      }
    },
    [token]
  );

  return {
    ...state,
    getDonors,
    donate,
  };
}