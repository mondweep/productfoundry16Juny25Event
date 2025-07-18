'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer } from '@/components/Map/MapContainer';
import { ReportModal } from '@/components/Reports/ReportModal';
import { Header } from '@/components/Layout/Header';
import { useMapStore } from '@/hooks/useStore';
import { testApiConnection, testWeatherApi } from '@/utils/test-api';

export default function HomePage() {
  const { 
    center,
    zoom,
    layers,
    isReportModalOpen,
    closeReportModal,
    selectedLocation,
  } = useMapStore();

  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [weatherData, setWeatherData] = useState<any>(null);

  useEffect(() => {
    const testConnections = async () => {
      const healthCheck = await testApiConnection();
      if (healthCheck) {
        setConnectionStatus('✅ Backend Connected');
        const weather = await testWeatherApi();
        setWeatherData(weather);
      } else {
        setConnectionStatus('❌ Backend Disconnected');
      }
    };
    
    testConnections();
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header />

      {/* Debug Status */}
      <div className="bg-blue-100 p-2 text-sm">
        <strong>Status:</strong> {connectionStatus}
        {weatherData && (
          <span className="ml-4">
            <strong>Demo Weather:</strong> {weatherData.data?.current?.temperature}°C, {weatherData.data?.current?.description}
          </span>
        )}
      </div>

      {/* Main map area */}
      <main className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={zoom}
          layers={layers}
        />
      </main>

      {/* Report modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={closeReportModal}
        location={selectedLocation || undefined}
      />
    </div>
  );
}