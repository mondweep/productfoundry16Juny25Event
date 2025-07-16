import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Location, 
  LayerConfig, 
  LayerType, 
  MapFilters, 
  User, 
  WeatherData, 
  FireData, 
  FloodData, 
  TrafficData, 
  UserReport,
  LiveUpdate
} from '@/types';

// Map Store
interface MapState {
  center: Location;
  zoom: number;
  layers: LayerConfig[];
  filters: MapFilters;
  isLocationModalOpen: boolean;
  selectedLocation: Location | null;
  isReportModalOpen: boolean;
  
  // Actions
  setCenter: (center: Location) => void;
  setZoom: (zoom: number) => void;
  toggleLayer: (layerId: LayerType) => void;
  setLayerOpacity: (layerId: LayerType, opacity: number) => void;
  updateFilters: (filters: Partial<MapFilters>) => void;
  openLocationModal: (location: Location) => void;
  closeLocationModal: () => void;
  openReportModal: (location?: Location) => void;
  closeReportModal: () => void;
}

// Default layer configuration
const defaultLayers: LayerConfig[] = [
  { id: 'weather', name: 'Weather', color: '#3b82f6', icon: 'Cloud', enabled: true, opacity: 0.8 },
  { id: 'fire', name: 'Fire Incidents', color: '#ef4444', icon: 'Flame', enabled: true, opacity: 0.9 },
  { id: 'flood', name: 'Flood Warnings', color: '#06b6d4', icon: 'Waves', enabled: true, opacity: 0.8 },
  { id: 'traffic', name: 'Traffic', color: '#f59e0b', icon: 'Car', enabled: false, opacity: 0.7 },
  { id: 'userReports', name: 'User Reports', color: '#8b5cf6', icon: 'MapPin', enabled: true, opacity: 0.9 },
];

const defaultCenter: Location = {
  lat: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT || '-25.2744'),
  lng: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG || '133.7751'),
};

const defaultZoom = parseInt(process.env.NEXT_PUBLIC_DEFAULT_ZOOM || '5');

export const useMapStore = create<MapState>()(
  devtools(
    persist(
      (set, get) => ({
        center: defaultCenter,
        zoom: defaultZoom,
        layers: defaultLayers,
        filters: {
          dateRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            end: new Date(),
          },
          severity: ['low', 'moderate', 'high', 'extreme'],
          sources: [],
          verified: null,
        },
        isLocationModalOpen: false,
        selectedLocation: null,
        isReportModalOpen: false,

        setCenter: (center) => set({ center }),
        setZoom: (zoom) => set({ zoom }),
        
        toggleLayer: (layerId) => set((state) => ({
          layers: state.layers.map(layer =>
            layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
          ),
        })),

        setLayerOpacity: (layerId, opacity) => set((state) => ({
          layers: state.layers.map(layer =>
            layer.id === layerId ? { ...layer, opacity } : layer
          ),
        })),

        updateFilters: (newFilters) => set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

        openLocationModal: (location) => set({
          selectedLocation: location,
          isLocationModalOpen: true,
        }),

        closeLocationModal: () => set({
          selectedLocation: null,
          isLocationModalOpen: false,
        }),

        openReportModal: (location) => set({
          selectedLocation: location || null,
          isReportModalOpen: true,
        }),

        closeReportModal: () => set({
          selectedLocation: null,
          isReportModalOpen: false,
        }),
      }),
      {
        name: 'map-store',
        partialize: (state) => ({
          center: state.center,
          zoom: state.zoom,
          layers: state.layers,
          filters: state.filters,
        }),
      }
    ),
    { name: 'map-store' }
  )
);

// Data Store
interface DataState {
  weather: WeatherData[];
  fires: FireData[];
  floods: FloodData[];
  traffic: TrafficData[];
  userReports: UserReport[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: string | null;

  // Actions
  setWeatherData: (data: WeatherData[]) => void;
  setFireData: (data: FireData[]) => void;
  setFloodData: (data: FloodData[]) => void;
  setTrafficData: (data: TrafficData[]) => void;
  setUserReports: (data: UserReport[]) => void;
  addUserReport: (report: UserReport) => void;
  updateUserReport: (reportId: string, updates: Partial<UserReport>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  handleLiveUpdate: (update: LiveUpdate) => void;
  clearData: () => void;
}

export const useDataStore = create<DataState>()(
  devtools(
    (set, get) => ({
      weather: [],
      fires: [],
      floods: [],
      traffic: [],
      userReports: [],
      isLoading: false,
      error: null,
      lastUpdate: null,

      setWeatherData: (data) => set({ 
        weather: data, 
        lastUpdate: new Date().toISOString() 
      }),

      setFireData: (data) => set({ 
        fires: data, 
        lastUpdate: new Date().toISOString() 
      }),

      setFloodData: (data) => set({ 
        floods: data, 
        lastUpdate: new Date().toISOString() 
      }),

      setTrafficData: (data) => set({ 
        traffic: data, 
        lastUpdate: new Date().toISOString() 
      }),

      setUserReports: (data) => set({ 
        userReports: data, 
        lastUpdate: new Date().toISOString() 
      }),

      addUserReport: (report) => set((state) => ({
        userReports: [report, ...state.userReports],
        lastUpdate: new Date().toISOString(),
      })),

      updateUserReport: (reportId, updates) => set((state) => ({
        userReports: state.userReports.map(report =>
          report.id === reportId ? { ...report, ...updates } : report
        ),
        lastUpdate: new Date().toISOString(),
      })),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      handleLiveUpdate: (update) => {
        const state = get();
        
        switch (update.type) {
          case 'weather':
            if (update.action === 'create' || update.action === 'update') {
              const weatherData = update.data as WeatherData;
              set({
                weather: update.action === 'create' 
                  ? [weatherData, ...state.weather]
                  : state.weather.map(item => item.id === weatherData.id ? weatherData : item),
                lastUpdate: new Date().toISOString(),
              });
            } else if (update.action === 'delete') {
              set({
                weather: state.weather.filter(item => item.id !== (update.data as WeatherData).id),
                lastUpdate: new Date().toISOString(),
              });
            }
            break;

          case 'fire':
            if (update.action === 'create' || update.action === 'update') {
              const fireData = update.data as FireData;
              set({
                fires: update.action === 'create'
                  ? [fireData, ...state.fires]
                  : state.fires.map(item => item.id === fireData.id ? fireData : item),
                lastUpdate: new Date().toISOString(),
              });
            } else if (update.action === 'delete') {
              set({
                fires: state.fires.filter(item => item.id !== (update.data as FireData).id),
                lastUpdate: new Date().toISOString(),
              });
            }
            break;

          case 'userReport':
            if (update.action === 'create' || update.action === 'update') {
              const reportData = update.data as UserReport;
              set({
                userReports: update.action === 'create'
                  ? [reportData, ...state.userReports]
                  : state.userReports.map(item => item.id === reportData.id ? reportData : item),
                lastUpdate: new Date().toISOString(),
              });
            } else if (update.action === 'delete') {
              set({
                userReports: state.userReports.filter(item => item.id !== (update.data as UserReport).id),
                lastUpdate: new Date().toISOString(),
              });
            }
            break;

          // Handle other types similarly...
        }
      },

      clearData: () => set({
        weather: [],
        fires: [],
        floods: [],
        traffic: [],
        userReports: [],
        error: null,
        lastUpdate: null,
      }),
    }),
    { name: 'data-store' }
  )
);

// Auth Store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        setUser: (user) => set({ 
          user, 
          isAuthenticated: !!user,
          error: null 
        }),

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),

        logout: () => set({ 
          user: null, 
          isAuthenticated: false,
          error: null 
        }),
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);