export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  error?: string;
} => {
  if (password.length < 6) {
    return {
      isValid: false,
      error: 'Password must be at least 6 characters',
    };
  }
  return { isValid: true };
};

export const validateProjectData = (data: any): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  if (!data.title?.trim()) errors.title = 'Title is required';
  if (data.title?.length > 100) errors.title = 'Title must be less than 100 characters';

  if (!data.objective?.trim()) errors.objective = 'Objective is required';

  if (!data.description?.trim()) errors.description = 'Description is required';

  if (!['Human', 'Plant', 'Animal'].includes(data.category)) {
    errors.category = 'Invalid category';
  }

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (startDate >= endDate) {
    errors.duration = 'End date must be after start date';
  }

  if (!data.location?.coordinates || data.location.coordinates.length !== 2) {
    errors.location = 'Valid location coordinates are required';
  }

  if (!data.location?.address?.trim()) {
    errors.location = 'Address is required';
  }

  if (!Array.isArray(data.supportItems) || data.supportItems.length === 0) {
    errors.supportItems = 'At least one support item is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
