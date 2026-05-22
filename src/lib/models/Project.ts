import mongoose, { Schema, Document } from 'mongoose';
export interface ISupportItem {
  item: string;
  quantity: number;
  byWhen: Date;
  dropLocation: string;
}

export interface IProject extends Document {
  creator: mongoose.Types.ObjectId;
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
  supportItems: ISupportItem[];
  donors: mongoose.Types.ObjectId[];
  totalDonations: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Title must be less than 100 characters'],
    },
    objective: {
      type: String,
      required: [true, 'Objective is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      enum: ['Human', 'Plant', 'Animal'],
      required: [true, 'Category is required'],
    },
    duration: {
      startDate: {
        type: Date,
        required: [true, 'Start date is required'],
      },
      endDate: {
        type: Date,
        required: [true, 'End date is required'],
      },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: [true, 'Coordinates are required'],
      },
      address: {
        type: String,
        required: [true, 'Address is required'],
      },
    },
    pictureOfSuccess: {
      type: String,
    },
    supportItems: [
      {
        item: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        byWhen: {
          type: Date,
          required: true,
        },
        dropLocation: {
          type: String,
          required: true,
        },
      },
    ],
    donors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    totalDonations: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ProjectSchema.index({ 'location': '2dsphere' });
ProjectSchema.index({ creator: 1 });
ProjectSchema.index({ category: 1 });

export default mongoose.models.Project ||
  mongoose.model<IProject>('Project', ProjectSchema);
