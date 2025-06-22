// components/AppInitializer.tsx
'use client';
import { useEffect } from 'react';
import { startPushSubscriptionMonitoring } from '@/libs/client/pushUtils';

export default function AppInitializer() {
  useEffect(() => {
    startPushSubscriptionMonitoring();
  }, []);
  return null;
}
