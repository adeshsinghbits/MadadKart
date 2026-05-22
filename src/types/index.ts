import { Types } from 'mongoose';

declare global {
  var mongoose: { conn: any; promise: Promise<any> | null };
}

export type UserRole = 'user' | 'ngo' | 'admin';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: Date;
}

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: { twitter?: string; linkedin?: string; instagram?: string };
  isVerified: boolean;
  isNGO: boolean;
  ngoVerified: boolean;
  impactScore: number;
  badges: Badge[];
  followers: (IUser | string)[];
  following: (IUser | string)[];
  totalDonated: number;
  volunteeringHours: number;
  streakDays: number;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectCategory = 'Human' | 'Plant' | 'Animal' | 'Environment' | 'Education' | 'Health';
export type ProjectStatus = 'active' | 'completed' | 'paused' | 'pending';

export interface ISupportItem {
  item: string;
  quantity: number;
  byWhen: Date;
  dropLocation: string;
  fulfilledQuantity?: number;
}

export interface IMilestone {
  _id?: string;
  title: string;
  description: string;
  targetDate: Date;
  isCompleted: boolean;
  completedAt?: Date;
  order: number;
}

export interface IProjectUpdate {
  _id?: string;
  title: string;
  content: string;
  images: string[];
  postedAt: Date;
  postedBy: IUser | string;
}

export interface IVolunteer {
  user: IUser | string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: Date;
  message?: string;
  hoursCommitted?: number;
}

export interface IProject {
  _id: Types.ObjectId;
  creator: IUser | string;
  firstName: string;
  lastName: string;
  title: string;
  objective: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  duration: { startDate: Date; endDate: Date };
  location: { type: 'Point'; coordinates: [number, number]; address: string };
  images: string[];
  pictureOfSuccess?: string;
  supportItems: ISupportItem[];
  donors: (IUser | string)[];
  totalDonations: number;
  goalAmount?: number;
  volunteersNeeded?: number;
  volunteers: IVolunteer[];
  milestones: IMilestone[];
  updates: IProjectUpdate[];
  tags: string[];
  isVerified: boolean;
  viewCount: number;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DonationType = 'money' | 'items' | 'both';

export interface IDonation {
  _id: Types.ObjectId;
  userId: IUser | string;
  projectId: IProject | string;
  type: DonationType;
  amount?: number;
  items?: { name: string; quantity: number }[];
  message?: string;
  isAnonymous: boolean;
  isRecurring: boolean;
  recurringInterval?: 'monthly' | 'weekly';
  status: 'pending' | 'completed' | 'failed';
  receiptId?: string;
  donatedAt: Date;
}

export type NotificationType =
  | 'new_follower'
  | 'new_donation'
  | 'project_completed'
  | 'volunteer_accepted'
  | 'volunteer_rejected'
  | 'milestone_completed'
  | 'project_update'
  | 'new_volunteer';

export interface INotification {
  _id: Types.ObjectId;
  recipient: IUser | string;
  sender?: IUser | string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}


export interface AuthResponse { message: string; user: IUser; token: string }
export interface ProjectsResponse { projects: IProject[]; total: number; page: number; limit: number; pages: number }
export interface ErrorResponse { error: string; statusCode?: number }

export interface TokenPayload { userId: string; email: string; role: UserRole }