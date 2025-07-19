/**
 * Type definitions for Live Conditions MCP Server
 */

export interface WeatherData {
  location: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    uvIndex: number;
    condition: string;
    description: string;
    icon: string;
  };
  timestamp: string;
}

export interface MarineData {
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  conditions: {
    waveHeight: number;
    wavePeriod: number;
    waveDirection: number;
    swellHeight: number;
    swellPeriod: number;
    swellDirection: number;
    windWaveHeight: number;
    seaSurfaceTemperature: number;
    tideLevel: number;
    tidalRange: number;
  };
  forecast: {
    nextTide: {
      type: 'high' | 'low';
      time: string;
      height: number;
    };
    surfConditions: string;
    marineWarnings: string[];
  };
  timestamp: string;
}

export interface TrafficData {
  location: {
    name: string;
    region: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  incidents: Array<{
    id: string;
    type: 'accident' | 'roadwork' | 'closure' | 'congestion' | 'weather';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location: string;
    startTime: string;
    estimatedEndTime?: string;
    detour?: string;
    impactedRoutes: string[];
  }>;
  roadConditions: {
    overallStatus: 'clear' | 'light' | 'moderate' | 'heavy' | 'blocked';
    averageSpeed: number;
    travelTimeIndex: number;
  };
  timestamp: string;
}

export interface AlertData {
  id: string;
  type: 'weather' | 'fire' | 'earthquake' | 'tsunami' | 'flood' | 'emergency';
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  title: string;
  description: string;
  areas: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  issued: string;
  expires?: string;
  instructions?: string;
  source: string;
  isActive: boolean;
}

export interface LocationQuery {
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  country?: string;
  radius?: number;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface DataSourceConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  rateLimit: {
    requests: number;
    period: number; // in milliseconds
  };
  timeout: number;
  retries: number;
}

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache size
  enabled: boolean;
}

export interface ServerConfig {
  port: number;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimiting: {
    windowMs: number;
    max: number;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'simple';
  };
}

export interface IntegrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: string;
  dataSourcesStatus: Record<string, {
    available: boolean;
    lastCheck: string;
    responseTime: number;
  }>;
}

export interface DataQuality {
  freshness: {
    lastUpdate: string;
    maxAge: number; // in minutes
    isStale: boolean;
  };
  completeness: {
    fieldsPresent: number;
    fieldsTotal: number;
    percentage: number;
  };
  accuracy: {
    confidence: number; // 0-1 scale
    source: string;
    verificationMethod: string;
  };
}