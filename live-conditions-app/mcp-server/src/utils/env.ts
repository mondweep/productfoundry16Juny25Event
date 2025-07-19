import dotenv from 'dotenv';

dotenv.config();

export interface Environment {
  PORT: number;
  NODE_ENV: string;
  LOG_LEVEL: string;
  
  // API Keys
  OPENWEATHER_API_KEY?: string;
  BOM_API_KEY?: string;
  METSERVICE_API_KEY?: string;
  GEONET_API_KEY?: string;
  NSW_RFS_API_KEY?: string;
  NZTA_API_KEY?: string;
  
  // Cache settings
  CACHE_TTL: number;
  CACHE_MAX_SIZE: number;
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  
  // Backend API
  BACKEND_API_URL: string;
  API_TIMEOUT: number;
}

export function validateEnvironment(): Environment {
  const env: Environment = {
    PORT: parseInt(process.env.PORT || '3001'),
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    // API Keys (optional for MCP server - uses backend)
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
    BOM_API_KEY: process.env.BOM_API_KEY,
    METSERVICE_API_KEY: process.env.METSERVICE_API_KEY,
    GEONET_API_KEY: process.env.GEONET_API_KEY,
    NSW_RFS_API_KEY: process.env.NSW_RFS_API_KEY,
    NZTA_API_KEY: process.env.NZTA_API_KEY,
    
    // Cache settings
    CACHE_TTL: parseInt(process.env.CACHE_TTL || '300'), // 5 minutes
    CACHE_MAX_SIZE: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
    
    // Rate limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    
    // Backend API
    BACKEND_API_URL: process.env.BACKEND_API_URL || 'http://localhost:5000',
    API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '10000'), // 10 seconds
  };

  // Validate required settings
  if (!env.BACKEND_API_URL) {
    throw new Error('BACKEND_API_URL environment variable is required');
  }

  return env;
}

export const env = validateEnvironment();