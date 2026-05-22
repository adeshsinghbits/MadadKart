import { z } from 'zod';

export const createProjectSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  title: z.string().min(5).max(100),
  objective: z.string().min(10),
  description: z.string().min(20),
  category: z.enum(['Human', 'Plant', 'Animal', 'Environment', 'Education', 'Health']),
  startDate: z.string(),
  endDate: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().min(5),
  goalAmount: z.number().positive().optional(),
  volunteersNeeded: z.number().positive().int().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  supportItems: z.array(z.object({
    item: z.string(),
    quantity: z.number().positive(),
    byWhen: z.string(),
    dropLocation: z.string(),
  })).optional(),
});

export const donateSchema = z.object({
  type: z.enum(['money', 'items', 'both']),
  amount: z.number().positive().optional(),
  items: z.array(z.object({ name: z.string(), quantity: z.number() })).optional(),
  message: z.string().max(500).optional(),
  isAnonymous: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['monthly', 'weekly']).optional(),
});

export const volunteerSchema = z.object({
  role: z.string().min(2),
  message: z.string().max(500).optional(),
  hoursCommitted: z.number().positive().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type DonateInput = z.infer<typeof donateSchema>;
export type VolunteerInput = z.infer<typeof volunteerSchema>;