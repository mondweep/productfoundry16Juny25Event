import { useEffect, useRef, useCallback } from 'react';
import { websocketService } from '@/services/websocket';
import { useDataStore } from './useStore';
import { LiveUpdate } from '@/types';

export const useWebSocket = () => {
  const { handleLiveUpdate } = useDataStore();
  const isConnectedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async () => {
    if (isConnectedRef.current || websocketService.isConnected()) {
      return;
    }

    try {
      await websocketService.connect();
      isConnectedRef.current = true;
      
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      isConnectedRef.current = false;
      
      // Schedule reconnection attempt
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
    isConnectedRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Set up event listeners
    const handleLiveUpdateEvent = (update: LiveUpdate) => {
      handleLiveUpdate(update);
    };

    const handleConnected = () => {
      console.log('WebSocket connected successfully');
      isConnectedRef.current = true;
    };

    const handleDisconnected = () => {
      console.log('WebSocket disconnected');
      isConnectedRef.current = false;
    };

    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
      isConnectedRef.current = false;
    };

    // Register event listeners
    websocketService.on('liveUpdate', handleLiveUpdateEvent);
    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);
    websocketService.on('error', handleError);

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      websocketService.off('liveUpdate', handleLiveUpdateEvent);
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
      websocketService.off('error', handleError);
      
      disconnect();
    };
  }, [connect, disconnect, handleLiveUpdate]);

  return {
    isConnected: false, // Temporarily disable WebSocket since localhost won't work from browser
    connect,
    disconnect,
  };
};