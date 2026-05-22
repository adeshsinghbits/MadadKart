import mongoose, { Schema, Document } from 'mongoose';

export interface IDonation extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  type: 'money' | 'items' | 'both';
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

const DonationSchema = new Schema<IDonation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    type: { type: String, enum: ['money', 'items', 'both'], default: 'money' },
    amount: { type: Number, min: 0 },
    items: [{ name: String, quantity: Number }],
    message: { type: String, maxlength: 500 },
    isAnonymous: { type: Boolean, default: false },
    isRecurring: { type: Boolean, default: false },
    recurringInterval: { type: String, enum: ['monthly', 'weekly'] },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    receiptId: String,
  },
  { timestamps: { createdAt: 'donatedAt', updatedAt: false } }
);

DonationSchema.index({ projectId: 1, userId: 1 });
DonationSchema.index({ userId: 1 });
DonationSchema.index({ donatedAt: -1 });

export default mongoose.models.Donation || mongoose.model<IDonation>('Donation', DonationSchema);
