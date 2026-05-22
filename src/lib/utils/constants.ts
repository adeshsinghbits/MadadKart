
export const CATEGORIES = {
  HUMAN: 'Human',
  PLANT: 'Plant',
  ANIMAL: 'Animal',
} as const;

export const PROJECT_FILTERS = {
  CATEGORY: 'category',
  SEARCH: 'search',
  LOCATION: 'location',
  RECENT: 'recent',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
} as const;

export const API_MESSAGES = {
  SUCCESS: 'Operation successful',
  INVALID_INPUT: 'Invalid input provided',
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource already exists',
  SERVER_ERROR: 'Internal server error',
} as const;