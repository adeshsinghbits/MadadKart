import { Types } from 'mongoose';

declare global {
  var mongoose: {
    conn: any;
    promise: Promise<any> | null;
  };
}

export interface IUser {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProject {
  _id: Types.ObjectId | string;
  creator: IUser;
  firstName: string;
  lastName: string;
  title: string;
  objective: string;
  description: string;
  category: 'Human' | 'Plant' | 'Animal';
  duration: {
    startDate: Date;
    endDate: Date;
  };
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  pictureOfSuccess?: string;
  supportItems: Array<{
    item: string;
    quantity: number;
    byWhen: Date;
    dropLocation: string;
  }>;
  donors: (IUser | string)[];
  totalDonations: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDonation {
  _id: Types.ObjectId | string;
  userId: IUser | string;
  projectId: IProject | string;
  amount?: number;
  message?: string;
  donatedAt: Date;
}

export interface AuthResponse {
  message: string;
  user: IUser;
  token: string;
}

export interface ProjectsResponse {
  projects: IProject[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ErrorResponse {
  error: string;
  statusCode?: number;
}