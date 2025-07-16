'use client';

import React, { useState } from 'react';
import { 
  Cloud, 
  Flame, 
  Waves, 
  Car, 
  MapPin, 
  Settings, 
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useMapStore } from '@/hooks/useStore';
import { LayerType } from '@/types';

const layerIcons: Record<LayerType, React.ComponentType<any>> = {
  weather: Cloud,
  fire: Flame,
  flood: Waves,
  traffic: Car,
  userReports: MapPin,
};

export const LayerControls: React.FC = () => {
  const { 
    layers, 
    toggleLayer, 
    setLayerOpacity,
    filters,
    updateFilters 
  } = useMapStore();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const handleOpacityChange = (layerId: LayerType, opacity: number) => {
    setLayerOpacity(layerId, opacity / 100);
  };

  const handleSeverityFilter = (severity: string) => {
    const currentSeverities = filters.severity;
    const newSeverities = currentSeverities.includes(severity as any)
      ? currentSeverities.filter(s => s !== severity)
      : [...currentSeverities, severity as any];
    
    updateFilters({ severity: newSeverities });
  };

  return (
    <div className="control-panel min-w-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Map Layers</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 rounded hover:bg-gray-100"
            title="Filters"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-gray-100"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Layer toggles */}
          <div className="space-y-2 mb-4">
            {layers.map((layer) => {
              const IconComponent = layerIcons[layer.id];
              return (
                <div key={layer.id} className="layer-toggle">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleLayer(layer.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {layer.enabled ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                      <IconComponent 
                        className="w-4 h-4" 
                        style={{ color: layer.enabled ? layer.color : '#9ca3af' }}
                      />
                      <span className={layer.enabled ? 'text-gray-900' : 'text-gray-500'}>
                        {layer.name}
                      </span>
                    </button>
                  </div>
                  
                  {layer.enabled && (
                    <div className="mt-2 ml-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Opacity:</span>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={Math.round(layer.opacity * 100)}
                          onChange={(e) => handleOpacityChange(layer.id, parseInt(e.target.value))}
                          className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, ${layer.color} 0%, ${layer.color} ${layer.opacity * 100}%, #e5e7eb ${layer.opacity * 100}%, #e5e7eb 100%)`
                          }}
                        />
                        <span className="text-xs text-gray-500 w-8">
                          {Math.round(layer.opacity * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t border-gray-200 pt-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Filters</h4>
              
              {/* Severity filter */}
              <div className="mb-3">
                <label className="text-xs text-gray-600 mb-1 block">Severity</label>
                <div className="flex flex-wrap gap-1">
                  {(['low', 'moderate', 'high', 'extreme'] as const).map((severity) => (
                    <button
                      key={severity}
                      onClick={() => handleSeverityFilter(severity)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        filters.severity.includes(severity)
                          ? 'bg-primary-100 text-primary-700 border border-primary-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {severity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range filter */}
              <div className="mb-3">
                <label className="text-xs text-gray-600 mb-1 block">Time Range</label>
                <div className="space-y-1">
                  <input
                    type="datetime-local"
                    value={filters.dateRange.start.toISOString().slice(0, 16)}
                    onChange={(e) => updateFilters({
                      dateRange: {
                        ...filters.dateRange,
                        start: new Date(e.target.value)
                      }
                    })}
                    className="w-full text-xs p-1 border border-gray-300 rounded"
                  />
                  <input
                    type="datetime-local"
                    value={filters.dateRange.end.toISOString().slice(0, 16)}
                    onChange={(e) => updateFilters({
                      dateRange: {
                        ...filters.dateRange,
                        end: new Date(e.target.value)
                      }
                    })}
                    className="w-full text-xs p-1 border border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Verified reports only */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verified-only"
                  checked={filters.verified === true}
                  onChange={(e) => updateFilters({
                    verified: e.target.checked ? true : null
                  })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="verified-only" className="text-xs text-gray-600">
                  Verified reports only
                </label>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};