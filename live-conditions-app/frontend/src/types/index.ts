// Location and Geographic Types
export interface Location {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Weather and Environmental Data
export interface WeatherData {
  id: string;
  location: Location;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  conditions: string;
  timestamp: string;
  source: 'bom' | 'metservice' | 'user' | 'sensor';
}

export interface FireData {
  id: string;
  location: Location;
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  size: number; // in hectares
  status: 'active' | 'contained' | 'controlled' | 'out';
  description: string;
  timestamp: string;
  source: string;
}

export interface FloodData {
  id: string;
  location: Location;
  severity: 'minor' | 'moderate' | 'major' | 'extreme';
  waterLevel: number;
  trend: 'rising' | 'falling' | 'stable';
  description: string;
  timestamp: string;
  affectedAreas: string[];
}

export interface TrafficData {
  id: string;
  location: Location;
  roadName: string;
  incidentType: 'accident' | 'roadwork' | 'congestion' | 'closure';
  severity: 'low' | 'moderate' | 'high';
  description: string;
  estimatedClearTime?: string;
  timestamp: string;
}

// User Reports
export interface UserReport {
  id: string;
  userId: string;
  location: Location;
  type: 'weather' | 'fire' | 'flood' | 'traffic' | 'other';
  title: string;
  description: string;
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  images?: string[];
  verified: boolean;
  timestamp: string;
  votes: number;
}

export interface CreateUserReportPayload {
  location: Location;
  type: UserReport['type'];
  title: string;
  description: string;
  severity: UserReport['severity'];
  images?: File[];
}

// Map Layer Types
export type LayerType = 'weather' | 'fire' | 'flood' | 'traffic' | 'userReports';

export interface LayerConfig {
  id: LayerType;
  name: string;
  color: string;
  icon: string;
  enabled: boolean;
  opacity: number;
}

export interface MapFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  severity: ('low' | 'moderate' | 'high' | 'extreme')[];
  sources: string[];
  verified: boolean | null;
}

// Real-time Updates
export interface LiveUpdate {
  type: 'weather' | 'fire' | 'flood' | 'traffic' | 'userReport';
  action: 'create' | 'update' | 'delete';
  data: WeatherData | FireData | FloodData | TrafficData | UserReport;
  timestamp: string;
}

// Authentication
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
}

export interface UserPreferences {
  notifications: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    types: LayerType[];
    regions: BoundingBox[];
  };
  map: {
    defaultCenter: Location;
    defaultZoom: number;
    preferredLayers: LayerType[];
  };
}

// Notifications
export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    type: LayerType;
    location: Location;
    url?: string;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Component Props
export interface MapComponentProps {
  center: Location;
  zoom: number;
  layers: LayerConfig[];
  onLocationSelect?: (location: Location) => void;
  onReportCreate?: (report: CreateUserReportPayload) => void;
  className?: string;
}

export interface LayerControlProps {
  layers: LayerConfig[];
  onLayerToggle: (layerId: LayerType) => void;
  onOpacityChange: (layerId: LayerType, opacity: number) => void;
}

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: CreateUserReportPayload) => void;
  initialLocation?: Location;
}

// WebSocket Types
export interface WSMessage {
  type: 'liveUpdate' | 'heartbeat' | 'error';
  payload: LiveUpdate | { timestamp: string } | { message: string };
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}