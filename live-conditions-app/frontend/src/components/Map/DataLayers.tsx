'use client';

import React from 'react';
import { CircleMarker, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import {
  LayerConfig,
  WeatherData,
  FireData,
  FloodData,
  TrafficData,
  UserReport,
} from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface DataLayersProps {
  layers: LayerConfig[];
  weather: WeatherData[];
  fires: FireData[];
  floods: FloodData[];
  traffic: TrafficData[];
  userReports: UserReport[];
}

// Create custom icons for different data types
const createIcon = (color: string, icon: string) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        font-size: 12px;
        color: white;
      ">
        ${icon}
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Get severity color
const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'low':
      return '#22c55e';
    case 'moderate':
      return '#f59e0b';
    case 'high':
      return '#ef4444';
    case 'extreme':
      return '#7c2d12';
    default:
      return '#6b7280';
  }
};

// Get radius based on severity
const getSeverityRadius = (severity: string): number => {
  switch (severity) {
    case 'low':
      return 8;
    case 'moderate':
      return 12;
    case 'high':
      return 16;
    case 'extreme':
      return 20;
    default:
      return 10;
  }
};

export const DataLayers: React.FC<DataLayersProps> = ({
  layers,
  weather,
  fires,
  floods,
  traffic,
  userReports,
}) => {
  const enabledLayers = layers.filter(layer => layer.enabled);

  return (
    <>
      {/* Weather Layer */}
      {enabledLayers.find(l => l.id === 'weather') && (
        <>
          {weather.map((item) => (
            <CircleMarker
              key={`weather-${item.id}`}
              center={[item.location.lat, item.location.lng]}
              radius={10}
              pathOptions={{
                fillColor: '#3b82f6',
                color: '#1e40af',
                weight: 2,
                opacity: enabledLayers.find(l => l.id === 'weather')?.opacity || 0.8,
                fillOpacity: 0.6,
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-primary-700 mb-2">Weather Data</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Temperature:</span>
                      <span className="font-medium">{item.temperature}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Humidity:</span>
                      <span className="font-medium">{item.humidity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wind Speed:</span>
                      <span className="font-medium">{item.windSpeed} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pressure:</span>
                      <span className="font-medium">{item.pressure} hPa</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conditions:</span>
                      <span className="font-medium">{item.conditions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Source:</span>
                      <span className="font-medium uppercase">{item.source}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Updated {formatDistanceToNow(new Date(item.timestamp))} ago
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </>
      )}

      {/* Fire Layer */}
      {enabledLayers.find(l => l.id === 'fire') && (
        <>
          {fires.map((item) => (
            <CircleMarker
              key={`fire-${item.id}`}
              center={[item.location.lat, item.location.lng]}
              radius={getSeverityRadius(item.severity)}
              pathOptions={{
                fillColor: getSeverityColor(item.severity),
                color: '#7c2d12',
                weight: 2,
                opacity: enabledLayers.find(l => l.id === 'fire')?.opacity || 0.9,
                fillOpacity: 0.7,
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-red-700 mb-2">Fire Incident</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Severity:</span>
                      <span className={`font-medium px-2 py-1 rounded text-xs ${
                        item.severity === 'extreme' ? 'bg-red-100 text-red-800' :
                        item.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        item.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium">{item.size} hectares</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium capitalize">{item.status}</span>
                    </div>
                    <div className="mt-2">
                      <span className="font-medium">Description:</span>
                      <p className="text-sm mt-1">{item.description}</p>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Updated {formatDistanceToNow(new Date(item.timestamp))} ago
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </>
      )}

      {/* Flood Layer */}
      {enabledLayers.find(l => l.id === 'flood') && (
        <>
          {floods.map((item) => (
            <CircleMarker
              key={`flood-${item.id}`}
              center={[item.location.lat, item.location.lng]}
              radius={getSeverityRadius(item.severity)}
              pathOptions={{
                fillColor: getSeverityColor(item.severity),
                color: '#0891b2',
                weight: 2,
                opacity: enabledLayers.find(l => l.id === 'flood')?.opacity || 0.8,
                fillOpacity: 0.6,
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-cyan-700 mb-2">Flood Warning</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Severity:</span>
                      <span className={`font-medium px-2 py-1 rounded text-xs ${
                        item.severity === 'extreme' ? 'bg-red-100 text-red-800' :
                        item.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                        item.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Water Level:</span>
                      <span className="font-medium">{item.waterLevel}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trend:</span>
                      <span className={`font-medium ${
                        item.trend === 'rising' ? 'text-red-600' :
                        item.trend === 'falling' ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {item.trend}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="font-medium">Description:</span>
                      <p className="text-sm mt-1">{item.description}</p>
                    </div>
                    {item.affectedAreas.length > 0 && (
                      <div className="mt-2">
                        <span className="font-medium">Affected Areas:</span>
                        <p className="text-sm mt-1">{item.affectedAreas.join(', ')}</p>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Updated {formatDistanceToNow(new Date(item.timestamp))} ago
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </>
      )}

      {/* Traffic Layer */}
      {enabledLayers.find(l => l.id === 'traffic') && (
        <>
          {traffic.map((item) => (
            <Marker
              key={`traffic-${item.id}`}
              position={[item.location.lat, item.location.lng]}
              icon={createIcon(getSeverityColor(item.severity), '🚗')}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-yellow-700 mb-2">Traffic Incident</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Road:</span>
                      <span className="font-medium">{item.roadName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium capitalize">{item.incidentType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Severity:</span>
                      <span className={`font-medium px-2 py-1 rounded text-xs ${
                        item.severity === 'high' ? 'bg-red-100 text-red-800' :
                        item.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="font-medium">Description:</span>
                      <p className="text-sm mt-1">{item.description}</p>
                    </div>
                    {item.estimatedClearTime && (
                      <div className="flex justify-between">
                        <span>Est. Clear:</span>
                        <span className="font-medium">
                          {formatDistanceToNow(new Date(item.estimatedClearTime))}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Reported {formatDistanceToNow(new Date(item.timestamp))} ago
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </>
      )}

      {/* User Reports Layer */}
      {enabledLayers.find(l => l.id === 'userReports') && (
        <>
          {userReports.map((item) => (
            <Marker
              key={`report-${item.id}`}
              position={[item.location.lat, item.location.lng]}
              icon={createIcon(
                item.verified ? '#8b5cf6' : '#6b7280',
                item.verified ? '✓' : '📍'
              )}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-purple-700 mb-2">
                    {item.title}
                    {item.verified && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Verified
                      </span>
                    )}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium capitalize">{item.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Severity:</span>
                      <span className={`font-medium px-2 py-1 rounded text-xs ${
                        item.severity === 'extreme' ? 'bg-red-100 text-red-800' :
                        item.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        item.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(item.timestamp))} ago
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        👍 {item.votes}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </>
      )}
    </>
  );
};