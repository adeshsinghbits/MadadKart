'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Project {
  _id: string;
  creator: { _id: string; name: string; email: string };
  firstName: string;
  lastName: string;
  title: string;
  objective: string;
  description: string;
  category: 'Human' | 'Plant' | 'Animal';
  duration: { startDate: string; endDate: string };
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  pictureOfSuccess?: string;
  supportItems: Array<{
    item: string;
    quantity: number;
    byWhen: string;
    dropLocation: string;
  }>;
  donors: string[];
  totalDonations: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useProjects() {
  const { token } = useAuth();
  const [state, setState] = useState<ProjectsState>({
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,
    pagination: { page: 1, limit: 12, total: 0, pages: 0 },
  });

  const fetchProjects = useCallback(
    async (filters?: {
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());

        const response = await fetch(
          `/api/projects?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();

        setState({
          projects: data.projects,
          currentProject: null,
          isLoading: false,
          error: null,
          pagination: {
            page: data.page,
            limit: data.limit,
            total: data.total,
            pages: data.pages,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error fetching projects';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
      }
    },
    []
  );

  const getProjectById = useCallback(async (projectId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/projects/${projectId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const project = await response.json();

      setState((prev) => ({
        ...prev,
        currentProject: project,
        isLoading: false,
      }));

      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error fetching project';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, []);

  const createProject = useCallback(
    async (data: any) => {
      if (!token) {
        setState((prev) => ({
          ...prev,
          error: 'Not authenticated',
        }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create project');
        }

        const result = await response.json();

        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));

        return result.project;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error creating project';
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
    fetchProjects,
    getProjectById,
    createProject,
  };
}
