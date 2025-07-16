'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer as LeafletMapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { MapComponentProps, Location, LayerType } from '@/types';
import { useMapStore, useDataStore } from '@/hooks/useStore';
import { useApi } from '@/hooks/useApi';
import { DataLayers } from './DataLayers';
import { LayerControls } from './LayerControls';
import { MapPopup } from './MapPopup';

// Fix default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

// Component to handle map events and bounds changes
const MapEventHandler: React.FC = () => {
  const map = useMap();
  const { fetchData } = useApi();
  const { setCenter, setZoom } = useMapStore();

  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      
      setCenter({ lat: center.lat, lng: center.lng });
      setZoom(zoom);
      
      // Fetch data for new bounds
      fetchData({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
    
    click: (e) => {
      const { openLocationModal } = useMapStore.getState();
      openLocationModal({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  // Initial data fetch
  useEffect(() => {
    const bounds = map.getBounds();
    fetchData({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
  }, [map, fetchData]);

  return null;
};

export const LeafletMap: React.FC<MapComponentProps> = ({
  center,
  zoom,
  layers,
  onLocationSelect,
  onReportCreate,
  className = '',
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const { 
    center: storeCenter, 
    zoom: storeZoom, 
    layers: storeLayers,
    openReportModal,
    selectedLocation,
    isLocationModalOpen,
    closeLocationModal,
  } = useMapStore();
  
  const { weather, fires, floods, traffic, userReports } = useDataStore();
  
  const [isMapReady, setIsMapReady] = useState(false);

  // Use store values as defaults, fallback to props
  const mapCenter = center || storeCenter;
  const mapZoom = zoom || storeZoom;
  const mapLayers = layers || storeLayers;

  const handleContextMenu = (e: L.LeafletMouseEvent) => {
    e.originalEvent.preventDefault();
    openReportModal({ lat: e.latlng.lat, lng: e.latlng.lng });
  };

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.on('contextmenu', handleContextMenu);
      return () => {
        mapRef.current?.off('contextmenu', handleContextMenu);
      };
    }
  }, [isMapReady]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <LeafletMapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        className="h-full w-full"
        zoomControl={false}
        ref={(map) => {
          if (map) {
            mapRef.current = map;
            setIsMapReady(true);
          }
        }}
      >
        {/* Base tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Alternative tile layers */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          opacity={0}
        />
        
        {/* Map event handler */}
        <MapEventHandler />
        
        {/* Data layers */}
        <DataLayers
          layers={mapLayers}
          weather={weather}
          fires={fires}
          floods={floods}
          traffic={traffic}
          userReports={userReports}
        />
      </LeafletMapContainer>

      {/* Layer controls overlay */}
      <div className="map-controls">
        <LayerControls />
        
        {/* Zoom controls */}
        <div className="control-panel">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="block w-full p-2 text-center hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="block w-full p-2 text-center hover:bg-gray-50"
            title="Zoom out"
          >
            −
          </button>
        </div>
      </div>

      {/* Location details popup */}
      {isLocationModalOpen && selectedLocation && (
        <MapPopup
          location={selectedLocation}
          onClose={closeLocationModal}
          onReportCreate={() => {
            closeLocationModal();
            openReportModal(selectedLocation);
          }}
        />
      )}
    </div>
  );
};