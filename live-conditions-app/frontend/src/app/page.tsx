'use client';

import React from 'react';
import { MapContainer } from '@/components/Map/MapContainer';
import { ReportModal } from '@/components/Reports/ReportModal';
import { Header } from '@/components/Layout/Header';
import { useMapStore } from '@/hooks/useStore';

export default function HomePage() {
  const { 
    center,
    zoom,
    layers,
    isReportModalOpen,
    closeReportModal,
    selectedLocation,
  } = useMapStore();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header />

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