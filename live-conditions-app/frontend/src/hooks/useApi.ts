import { useCallback, useState } from 'react';
import { apiClient } from '@/utils/api';
import { useDataStore, useAuthStore } from './useStore';
import { 
  WeatherData, 
  FireData, 
  FloodData, 
  TrafficData, 
  UserReport, 
  CreateUserReportPayload,
  Location,
  BoundingBox 
} from '@/types';

export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    setWeatherData, 
    setFireData, 
    setFloodData, 
    setTrafficData, 
    setUserReports,
    addUserReport 
  } = useDataStore();
  
  const { user } = useAuthStore();

  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    onSuccess?: (data: T) => void
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('API call failed:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all data for a bounding box
  const fetchData = useCallback(async (bounds: BoundingBox) => {
    await handleApiCall(async () => {
      const [weatherRes, fireRes, floodRes, trafficRes, reportsRes] = await Promise.all([
        apiClient.get<WeatherData[]>(`/v1/weather?bounds=${JSON.stringify(bounds)}`),
        apiClient.get<FireData[]>(`/v1/fires?bounds=${JSON.stringify(bounds)}`),
        apiClient.get<FloodData[]>(`/v1/floods?bounds=${JSON.stringify(bounds)}`),
        apiClient.get<TrafficData[]>(`/v1/traffic?bounds=${JSON.stringify(bounds)}`),
        apiClient.get<UserReport[]>(`/v1/reports?bounds=${JSON.stringify(bounds)}`),
      ]);

      setWeatherData(weatherRes.data);
      setFireData(fireRes.data);
      setFloodData(floodRes.data);
      setTrafficData(trafficRes.data);
      setUserReports(reportsRes.data);
      
      return {
        weather: weatherRes.data,
        fires: fireRes.data,
        floods: floodRes.data,
        traffic: trafficRes.data,
        reports: reportsRes.data,
      };
    });
  }, [handleApiCall, setWeatherData, setFireData, setFloodData, setTrafficData, setUserReports]);

  // Fetch weather data
  const fetchWeatherData = useCallback(async (bounds?: BoundingBox) => {
    const endpoint = bounds 
      ? `/v1/weather?bounds=${JSON.stringify(bounds)}`
      : '/v1/weather';
    
    return handleApiCall(
      () => apiClient.get<WeatherData[]>(endpoint),
      (response) => setWeatherData(response.data)
    );
  }, [handleApiCall, setWeatherData]);

  // Fetch fire incidents
  const fetchFireData = useCallback(async (bounds?: BoundingBox) => {
    const endpoint = bounds 
      ? `/v1/fires?bounds=${JSON.stringify(bounds)}`
      : '/v1/fires';
    
    return handleApiCall(
      () => apiClient.get<FireData[]>(endpoint),
      (response) => setFireData(response.data)
    );
  }, [handleApiCall, setFireData]);

  // Fetch flood warnings
  const fetchFloodData = useCallback(async (bounds?: BoundingBox) => {
    const endpoint = bounds 
      ? `/v1/floods?bounds=${JSON.stringify(bounds)}`
      : '/v1/floods';
    
    return handleApiCall(
      () => apiClient.get<FloodData[]>(endpoint),
      (response) => setFloodData(response.data)
    );
  }, [handleApiCall, setFloodData]);

  // Fetch traffic data
  const fetchTrafficData = useCallback(async (bounds?: BoundingBox) => {
    const endpoint = bounds 
      ? `/v1/traffic?bounds=${JSON.stringify(bounds)}`
      : '/v1/traffic';
    
    return handleApiCall(
      () => apiClient.get<TrafficData[]>(endpoint),
      (response) => setTrafficData(response.data)
    );
  }, [handleApiCall, setTrafficData]);

  // Fetch user reports
  const fetchUserReports = useCallback(async (bounds?: BoundingBox) => {
    const endpoint = bounds 
      ? `/v1/reports?bounds=${JSON.stringify(bounds)}`
      : '/v1/reports';
    
    return handleApiCall(
      () => apiClient.get<UserReport[]>(endpoint),
      (response) => setUserReports(response.data)
    );
  }, [handleApiCall, setUserReports]);

  // Create user report
  const createUserReport = useCallback(async (reportData: CreateUserReportPayload) => {
    if (!user) {
      setError('You must be logged in to create a report');
      return null;
    }

    const formData = new FormData();
    formData.append('location', JSON.stringify(reportData.location));
    formData.append('type', reportData.type);
    formData.append('title', reportData.title);
    formData.append('description', reportData.description);
    formData.append('severity', reportData.severity);
    
    if (reportData.images) {
      reportData.images.forEach((image, index) => {
        formData.append(`images`, image);
      });
    }

    return handleApiCall(
      () => apiClient.upload<UserReport>('/api/reports', formData),
      (response) => addUserReport(response.data)
    );
  }, [handleApiCall, addUserReport, user]);

  // Vote on user report
  const voteOnReport = useCallback(async (reportId: string, vote: 'up' | 'down') => {
    if (!user) {
      setError('You must be logged in to vote');
      return null;
    }

    return handleApiCall(
      () => apiClient.post<UserReport>(`/api/reports/${reportId}/vote`, { vote }),
      (response) => {
        // Update the report in the store would typically be handled by real-time updates
        console.log('Vote submitted:', response.data);
      }
    );
  }, [handleApiCall, user]);

  // Get location details
  const getLocationDetails = useCallback(async (location: Location) => {
    return handleApiCall(
      () => apiClient.get<any>(`/api/location?lat=${location.lat}&lng=${location.lng}`)
    );
  }, [handleApiCall]);

  return {
    isLoading,
    error,
    fetchData,
    fetchWeatherData,
    fetchFireData,
    fetchFloodData,
    fetchTrafficData,
    fetchUserReports,
    createUserReport,
    voteOnReport,
    getLocationDetails,
    clearError: () => setError(null),
  };
};