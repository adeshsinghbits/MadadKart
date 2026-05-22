import Project, { IProject, ISupportItem } from '@/lib/models/Project';
import { connectDB } from '@/lib/db/mongodb';
import { validateProjectData } from '@/lib/utils/validation';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from '@/lib/utils/errors';
import mongoose from 'mongoose';

export interface CreateProjectInput {
  firstName: string;
  lastName: string;
  title: string;
  objective: string;
  description: string;
  category: 'Human' | 'Plant' | 'Animal';
  startDate: string;
  endDate: string;
  latitude: number;
  longitude: number;
  address: string;
  pictureOfSuccess?: string;
  supportItems: ISupportItem[];
}

export class ProjectService {
  static async createProject(
    userId: string,
    data: CreateProjectInput
  ): Promise<IProject> {
    await connectDB();

    const projectData = {
      ...data,
      creator: userId,
      location: {
        type: 'Point' as const,
        coordinates: [data.longitude, data.latitude],
        address: data.address,
      },
      startDate: data.startDate,
      endDate: data.endDate,
    };

    const validation = validateProjectData(projectData);
    if (!validation.isValid) {
      throw new ValidationError(
        `Validation failed: ${Object.values(validation.errors).join(', ')}`
      );
    }

    const project = await Project.create({
      creator: userId,
      firstName: data.firstName,
      lastName: data.lastName,
      title: data.title,
      objective: data.objective,
      description: data.description,
      category: data.category,
      duration: {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
        address: data.address,
      },
      pictureOfSuccess: data.pictureOfSuccess,
      supportItems: data.supportItems,
      donors: [],
      totalDonations: 0,
    });

    return await project.populate('creator', 'name email');
  }

  static async getProjectById(projectId: string): Promise<IProject> {
    await connectDB();

    const project = await Project.findById(projectId)
      .populate('creator', 'name email')
      .populate('donors', 'name email');

    if (!project) {
      throw new NotFoundError('Project');
    }

    return project;
  }

  static async getAllProjects(filters: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ projects: IProject[]; total: number }> {
    await connectDB();

    const query: any = {};

    if (filters.category && filters.category !== 'All') {
      query.category = filters.category;
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { objective: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 12, 100);
    const skip = (page - 1) * limit;

    const projects = await Project.find(query)
      .populate('creator', 'name email')
      .populate('donors', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments(query);

    return { projects, total };
  }

  static async getProjectsByCreator(userId: string): Promise<IProject[]> {
    await connectDB();

    return await Project.find({ creator: userId })
      .populate('creator', 'name email')
      .populate('donors', 'name email')
      .sort({ createdAt: -1 });
  }

  static async getNearbyProjects(
    latitude: number,
    longitude: number,
    maxDistance: number = 50000
  ): Promise<IProject[]> {
    await connectDB();

    return await Project.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance,
        },
      },
    })
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });
  }

  static async updateProject(
    projectId: string,
    userId: string,
    data: Partial<CreateProjectInput>
  ): Promise<IProject> {
    await connectDB();

    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.creator.toString() !== userId) {
      throw new AuthorizationError();
    }

    Object.assign(project, {
      ...data,
      location: data.latitude && data.longitude
        ? {
            type: 'Point' as const,
            coordinates: [data.longitude, data.latitude],
            address: data.address || project.location.address,
          }
        : project.location,
    });

    return await project.save();
  }

  static async deleteProject(projectId: string, userId: string): Promise<void> {
    await connectDB();

    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.creator.toString() !== userId) {
      throw new AuthorizationError();
    }

    await Project.deleteOne({ _id: projectId });
  }
}
