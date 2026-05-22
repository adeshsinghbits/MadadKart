import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'ngo']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  avatar: z.string().optional(),
  coverImage: z.string().optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
