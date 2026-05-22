import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDoc extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'ngo' | 'admin';
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
  badges: Array<{ id: string; name: string; icon: string; description: string; earnedAt: Date }>;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  totalDonated: number;
  volunteeringHours: number;
  streakDays: number;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const BadgeSchema = new Schema({
  id: String,
  name: String,
  icon: String,
  description: String,
  earnedAt: { type: Date, default: Date.now },
}, { _id: false });

const UserSchema = new Schema<IUserDoc>(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['user', 'ngo', 'admin'], default: 'user' },
    avatar: String,
    coverImage: String,
    bio: { type: String, maxlength: 500 },
    location: String,
    website: String,
    socialLinks: {
      twitter: String,
      linkedin: String,
      instagram: String,
    },
    isVerified: { type: Boolean, default: true },
    isNGO: { type: Boolean, default: false },
    ngoVerified: { type: Boolean, default: false },
    impactScore: { type: Number, default: 0 },
    badges: [BadgeSchema],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    totalDonated: { type: Number, default: 0 },
    volunteeringHours: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ impactScore: -1 });

export default mongoose.models.User || mongoose.model<IUserDoc>('User', UserSchema);