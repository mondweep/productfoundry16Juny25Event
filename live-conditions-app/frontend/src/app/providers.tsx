'use client';

import React, { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/hooks/useStore';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize WebSocket connection
  useWebSocket();

  // Initialize authentication from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('auth-store');
        if (storedUser) {
          const parsedData = JSON.parse(storedUser);
          if (parsedData.state?.user) {
            // Validate stored user data and set authentication
            useAuthStore.getState().setUser(parsedData.state.user);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth from storage:', error);
      }
    };

    initAuth();
  }, []);

  // Register service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return <>{children}</>;
};