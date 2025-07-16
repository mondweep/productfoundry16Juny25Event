'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { MapComponentProps } from '@/types';

// Dynamically import the map component to avoid SSR issues with Leaflet
const DynamicMap = dynamic(
  () => import('./LeafletMap').then(mod => mod.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export const MapContainer: React.FC<MapComponentProps> = (props) => {
  const mapProps = useMemo(() => props, [props]);

  return (
    <div className="map-container">
      <DynamicMap {...mapProps} />
    </div>
  );
};