'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, AlertTriangle } from 'lucide-react';
import { Location } from '@/types';
import { useApi } from '@/hooks/useApi';

interface MapPopupProps {
  location: Location;
  onClose: () => void;
  onReportCreate: () => void;
}

export const MapPopup: React.FC<MapPopupProps> = ({
  location,
  onClose,
  onReportCreate,
}) => {
  const { getLocationDetails, isLoading } = useApi();
  const [locationData, setLocationData] = useState<any>(null);

  useEffect(() => {
    const fetchLocationData = async () => {
      const result = await getLocationDetails(location);
      if (result?.data) {
        setLocationData(result.data);
      }
    };

    fetchLocationData();
  }, [location, getLocationDetails]);

  const formatCoordinate = (coord: number, isLat: boolean) => {
    const direction = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(4)}°${direction}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Location Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner w-6 h-6"></div>
              <span className="ml-2 text-gray-600">Loading location details...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Coordinates */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Coordinates</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Latitude:</span>
                    <span className="font-mono">{formatCoordinate(location.lat, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Longitude:</span>
                    <span className="font-mono">{formatCoordinate(location.lng, false)}</span>
                  </div>
                </div>
              </div>

              {/* Location information */}
              {locationData && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Location Information</h3>
                  <div className="space-y-1 text-sm">
                    {locationData.address && (
                      <div>
                        <span className="font-medium">Address:</span>
                        <p className="text-gray-600 mt-1">{locationData.address}</p>
                      </div>
                    )}
                    {locationData.suburb && (
                      <div className="flex justify-between">
                        <span>Suburb:</span>
                        <span>{locationData.suburb}</span>
                      </div>
                    )}
                    {locationData.state && (
                      <div className="flex justify-between">
                        <span>State:</span>
                        <span>{locationData.state}</span>
                      </div>
                    )}
                    {locationData.country && (
                      <div className="flex justify-between">
                        <span>Country:</span>
                        <span>{locationData.country}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Weather summary at location */}
              {locationData?.weather && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-700 mb-2">Current Weather</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Temperature:</span>
                      <span>{locationData.weather.temperature}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conditions:</span>
                      <span>{locationData.weather.conditions}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Nearby incidents */}
              {locationData?.nearbyIncidents?.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <h3 className="text-sm font-medium text-yellow-700">Nearby Incidents</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    {locationData.nearbyIncidents.slice(0, 3).map((incident: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="capitalize">{incident.type}:</span>
                        <span className="text-yellow-700">{incident.distance}km away</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (navigator.geolocation) {
                // Get directions to this location
                const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
                window.open(url, '_blank');
              }
            }}
            className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Get Directions
          </button>
          <button
            onClick={onReportCreate}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Report Issue
          </button>
        </div>
      </div>
    </div>
  );
};