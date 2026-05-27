import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportItem {
  item: string; quantity: number; byWhen: Date;
  dropLocation: string; fulfilledQuantity: number;
}
export interface IMilestone {
  title: string; description: string; targetDate: Date;
  isCompleted: boolean; completedAt?: Date; order: number;
}
export interface IProjectUpdate {
  title: string; content: string; images: string[];
  postedAt: Date; postedBy: mongoose.Types.ObjectId;
}
export interface IVolunteer {
  user: mongoose.Types.ObjectId; role: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: Date; message?: string; hoursCommitted?: number;
}
export interface IGalleryItem {
  url: string;
  caption?: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  width?: number;
  height?: number;
}
export interface IProject extends Document {
  creator: mongoose.Types.ObjectId;
  firstName: string; lastName: string;
  title: string; objective: string; description: string;
  category: 'Human' | 'Plant' | 'Animal' | 'Environment' | 'Education' | 'Health';
  status: 'active' | 'completed' | 'paused' | 'pending';
  duration: { startDate: Date; endDate: Date };
  location: { type: 'Point'; coordinates: [number, number]; address: string };
  images: string[];
  gallery: IGalleryItem[];
  pictureOfSuccess?: string;
  supportItems: ISupportItem[];
  donors: mongoose.Types.ObjectId[];
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
  createdAt: Date; updatedAt: Date;
}

const SupportItemSchema = new Schema<ISupportItem>({
  item: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  byWhen: { type: Date, required: true },
  dropLocation: { type: String, required: true },
  fulfilledQuantity: { type: Number, default: 0 },
}, { _id: false });

const MilestoneSchema = new Schema<IMilestone>({
  title: { type: String, required: true },
  description: String, targetDate: Date,
  isCompleted: { type: Boolean, default: false },
  completedAt: Date, order: { type: Number, default: 0 },
});

const ProjectUpdateSchema = new Schema<IProjectUpdate>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  images: [String],
  postedAt: { type: Date, default: Date.now },
  postedBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

const VolunteerSchema = new Schema<IVolunteer>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now },
  message: String, hoursCommitted: Number,
});

const GalleryItemSchema = new Schema<IGalleryItem>({
  url:         { type: String, required: true },
  caption:     { type: String, maxlength: 300 },
  uploadedBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt:  { type: Date, default: Date.now },
  width:       Number,
  height:      Number,
});

const ProjectSchema = new Schema<IProject>(
  {
    creator:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    title:       { type: String, required: true, trim: true, maxlength: 100 },
    objective:   { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category:    { type: String, enum: ['Human','Plant','Animal','Environment','Education','Health'], required: true },
    status:      { type: String, enum: ['active','completed','paused','pending'], default: 'active' },
    duration: {
      startDate: { type: Date, required: true },
      endDate:   { type: Date, required: true },
    },
    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
      address:     { type: String, required: true },
    },
    images:            [String],
    gallery:           [GalleryItemSchema],
    pictureOfSuccess:  String,
    supportItems:      [SupportItemSchema],
    donors:            [{ type: Schema.Types.ObjectId, ref: 'User' }],
    totalDonations:    { type: Number, default: 0 },
    goalAmount:        Number,
    volunteersNeeded:  Number,
    volunteers:        [VolunteerSchema],
    milestones:        [MilestoneSchema],
    updates:           [ProjectUpdateSchema],
    tags:              [String],
    isVerified:        { type: Boolean, default: false },
    viewCount:         { type: Number, default: 0 },
    reportCount:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProjectSchema.index({ location: '2dsphere' });
ProjectSchema.index({ creator: 1 });
ProjectSchema.index({ category: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ title: 'text', description: 'text', objective: 'text' });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);