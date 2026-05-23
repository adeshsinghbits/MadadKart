import Project from '@/lib/models/Project';
import { connectDB } from '@/lib/db/mongodb';
import { NotFoundError, AuthorizationError, ValidationError } from '@/lib/utils/errors';
import { UserService } from './user.service';

export class ProjectService {
  static async createProject(userId: string, data: any) {
    await connectDB();
    const project = await Project.create({
      creator: userId,
      firstName: data.firstName,
      lastName: data.lastName,
      title: data.title,
      objective: data.objective,
      description: data.description,
      category: data.category,
      status: 'active',
      duration: { startDate: new Date(data.startDate), endDate: new Date(data.endDate) },
      location: { type: 'Point', coordinates: [data.longitude, data.latitude], address: data.address },
      images: data.images || [],
      pictureOfSuccess: data.pictureOfSuccess,
      supportItems: data.supportItems || [],
      goalAmount: data.goalAmount,
      volunteersNeeded: data.volunteersNeeded,
      tags: data.tags || [],
      donors: [],
      totalDonations: 0,
    });
    await UserService.updateImpactScore(userId, 20);
    return project.populate('creator', 'name email avatar role ngoVerified');
  }

  static async getProjectById(id: string) {
    await connectDB();
    const project = await Project.findByIdAndUpdate(
      id, { $inc: { viewCount: 1 } }, { new: true }
    )
      .populate('creator', 'name email avatar role ngoVerified impactScore')
      .populate('donors', 'name avatar')
      .populate('volunteers.user', 'name avatar email');
    if (!project) throw new NotFoundError('Project');
    return project;
  }

  static async getAllProjects(filters: {
    category?: string; search?: string; status?: string;
    page?: number; limit?: number; sort?: string;
    lat?: number; lng?: number; radius?: number;
  } = {}) {
    await connectDB();
    const query: any = {};
    if (filters.category && filters.category !== 'All') query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$text = { $search: filters.search };
    }
    if (filters.lat && filters.lng && filters.radius) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [filters.lng, filters.lat] },
          $maxDistance: (filters.radius || 50) * 1000,
        },
      };
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(filters.limit || 12, 100);
    const skip = (page - 1) * limit;

    let sortOpt: any = { createdAt: -1 };
    if (filters.sort === 'popular') sortOpt = { totalDonations: -1 };
    else if (filters.sort === 'trending') sortOpt = { viewCount: -1 };

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('creator', 'name email avatar role ngoVerified')
        .sort(sortOpt).skip(skip).limit(limit),
      Project.countDocuments(query),
    ]);
    return { projects, total };
  }

  static async getProjectsByCreator(userId: string) {
    await connectDB();
    return Project.find({ creator: userId })
      .populate('creator', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  static async getNearbyProjects(lat: number, lng: number, maxDistance = 50000) {
    await connectDB();
    return Project.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: maxDistance,
        },
      },
      status: 'active',
    }).populate('creator', 'name avatar').limit(50);
  }

  static async updateProject(id: string, userId: string, data: any) {
    await connectDB();
    const project = await Project.findById(id);
    if (!project) throw new NotFoundError('Project');
    const isAdmin = data._isAdmin;
    if (!isAdmin && project.creator.toString() !== userId) throw new AuthorizationError();
    delete data._isAdmin;
    Object.assign(project, data);
    if (data.latitude && data.longitude) {
      project.location = { type: 'Point', coordinates: [data.longitude, data.latitude], address: data.address || project.location.address };
    }
    return project.save();
  }

  static async deleteProject(id: string, userId: string, isAdmin = false) {
    await connectDB();
    const project = await Project.findById(id);
    if (!project) throw new NotFoundError('Project');
    if (!isAdmin && project.creator.toString() !== userId) throw new AuthorizationError();
    await project.deleteOne();
  }

  static async addUpdate(projectId: string, userId: string, data: { title: string; content: string; images?: string[] }) {
    await connectDB();
    const project = await Project.findById(projectId);
    if (!project) throw new NotFoundError('Project');
    if (project.creator.toString() !== userId) throw new AuthorizationError();
    project.updates.push({ ...data, postedAt: new Date(), postedBy: userId as any, images: data.images || [] });
    return project.save();
  }

  static async completeMilestone(projectId: string, userId: string, milestoneId: string) {
    await connectDB();
    const project = await Project.findById(projectId);
    if (!project) throw new NotFoundError('Project');
    if (project.creator.toString() !== userId) throw new AuthorizationError();
    const milestone = project.milestones.id(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone');
    milestone.isCompleted = true;
    milestone.completedAt = new Date();
    return project.save();
  }

  static async applyVolunteer(projectId: string, userId: string, data: { role: string; message?: string; hoursCommitted?: number }) {
    await connectDB();
    const project = await Project.findById(projectId);
    if (!project) throw new NotFoundError('Project');
    const already = project.volunteers.some( (v:any) => v.user.toString() === userId);
    if (already) throw new ValidationError('Already applied as volunteer');
    project.volunteers.push({ user: userId as any, ...data, status: 'pending', appliedAt: new Date() });
    return project.save();
  }

  static async updateVolunteerStatus(projectId: string, ownerId: string, volunteerId: string, status: 'accepted' | 'rejected') {
    await connectDB();
    const project = await Project.findById(projectId);
    if (!project) throw new NotFoundError('Project');
    if (project.creator.toString() !== ownerId) throw new AuthorizationError();
    const vol = project.volunteers.find( (v:any) => v.user.toString() === volunteerId);
    if (!vol) throw new NotFoundError('Volunteer application');
    vol.status = status;
    if (status === 'accepted') await UserService.updateImpactScore(volunteerId, 10);
    return project.save();
  }

  static async getStats() {
    await connectDB();
    const [totalProjects, activeProjects, completedProjects] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'active' }),
      Project.countDocuments({ status: 'completed' }),
    ]);
    const aggr = await Project.aggregate([{ $group: { _id: null, totalDonations: { $sum: '$totalDonations' } } }]);
    return { totalProjects, activeProjects, completedProjects, totalDonations: aggr[0]?.totalDonations || 0 };
  }
}