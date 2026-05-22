import mongoose, { Schema, Document } from 'mongoose';
export interface IDonation extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  amount?: number;
  message?: string;
  donatedAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    amount: {
      type: Number,
      min: 0,
    },
    message: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: { createdAt: 'donatedAt', updatedAt: false } }
);

DonationSchema.index({ projectId: 1, userId: 1 });
DonationSchema.index({ userId: 1 });

export default mongoose.models.Donation ||
  mongoose.model<IDonation>('Donation', DonationSchema);