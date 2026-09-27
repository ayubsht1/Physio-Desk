// components/BackendWakeUp.tsx
'use client';

import { useEffect } from 'react';

export default function BackendWakeUp() {
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    fetch(`${apiUrl}/api/v1/health`)
      .then((res) => {
        if (res.ok) {
          console.log('Backend is awake and ready!');
        }
      })
      .catch(() => {
        console.log('Wake-up ping sent (backend might be starting up)...');
      });
  }, []);

  return null; // This component doesn't render any UI
}