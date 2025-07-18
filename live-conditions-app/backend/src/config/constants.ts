// HTTP Status Codes
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INTERNAL_ERROR: 'Internal server error. Please try again later.',
  UNAUTHORIZED: 'Access denied. Please authenticate.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Invalid input data provided.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_TOKEN: 'Invalid authentication token.',
  USER_EXISTS: 'User already exists with this email.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_DISABLED: 'Your account has been disabled.',
} as const;

// API Configuration
export const API_CONFIG = {
  VERSION: 'v1',
  BASE_PATH: '/api',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_TIMEOUT: 30000,
  MAX_FILE_SIZE: '10mb',
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  TTL: {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },
  KEYS: {
    WEATHER: 'weather',
    TRAFFIC: 'traffic',
    ALERTS: 'alerts',
    USER_PREFERENCES: 'user_prefs',
  },
} as const;

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100, // requests per window
  SKIP_SUCCESSFUL_REQUESTS: false,
  SKIP_FAILED_REQUESTS: false,
  HEADERS: true,
} as const;

// Database Configuration
export const DB_CONFIG = {
  CONNECTION_TIMEOUT: 30000,
  MAX_POOL_SIZE: 10,
  RECONNECT_INTERVAL: 5000,
  BUFFER_MAX_ENTRIES: 0,
} as const;

// WebSocket Configuration
export const WS_CONFIG = {
  HEARTBEAT_INTERVAL: 30000,
  CONNECTION_TIMEOUT: 60000,
  MAX_CONNECTIONS: 1000,
  RECONNECT_ATTEMPTS: 3,
} as const;

// External API Configuration
export const EXTERNAL_API_CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  BOM: {
    BASE_URL: 'http://www.bom.gov.au/fwo',
    RATE_LIMIT: 60, // requests per minute
  },
  GEONET: {
    BASE_URL: 'https://api.geonet.org.nz',
    RATE_LIMIT: 100,
  },
  NSW_RFS: {
    BASE_URL: 'https://www.rfs.nsw.gov.au/feeds',
    RATE_LIMIT: 30,
  },
} as const;

// Validation Constants
export const VALIDATION_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  EMAIL_MAX_LENGTH: 254,
  REPORT_DESCRIPTION_MAX_LENGTH: 500,
  COORDINATES: {
    LAT_MIN: -90,
    LAT_MAX: 90,
    LNG_MIN: -180,
    LNG_MAX: 180,
  },
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  MAX_FILES_PER_REPORT: 3,
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  JWT_EXPIRES_IN: '7d',
  JWT_REFRESH_EXPIRES_IN: '30d',
  BCRYPT_ROUNDS: 12,
  CORS_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://live-conditions.app',
  ],
} as const;

// Geographic Boundaries
export const GEO_BOUNDARIES = {
  AUSTRALIA: {
    LAT_MIN: -43.6345972634,
    LAT_MAX: -10.6681857235,
    LNG_MIN: 113.338953078,
    LNG_MAX: 153.569469029,
  },
  NEW_ZEALAND: {
    LAT_MIN: -47.2839494,
    LAT_MAX: -34.4506617,
    LNG_MIN: 166.5089341,
    LNG_MAX: 178.517094,
  },
} as const;

// Alert Types
export const ALERT_TYPES = {
  WEATHER: 'weather',
  FIRE: 'fire',
  FLOOD: 'flood',
  EARTHQUAKE: 'earthquake',
  TRAFFIC: 'traffic',
  SAFETY: 'safety',
  COMMUNITY: 'community',
} as const;

// Report Categories
export const REPORT_CATEGORIES = {
  SAFETY: 'safety',
  TRAFFIC: 'traffic',
  VIBE: 'vibe',
  WILDLIFE: 'wildlife',
  WEATHER: 'weather',
  GENERAL: 'general',
} as const;

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export default {
  HTTP_STATUS_CODES,
  ERROR_MESSAGES,
  API_CONFIG,
  CACHE_CONFIG,
  RATE_LIMIT_CONFIG,
  DB_CONFIG,
  WS_CONFIG,
  EXTERNAL_API_CONFIG,
  VALIDATION_CONFIG,
  UPLOAD_CONFIG,
  SECURITY_CONFIG,
  GEO_BOUNDARIES,
  ALERT_TYPES,
  REPORT_CATEGORIES,
  PRIORITY_LEVELS,
};