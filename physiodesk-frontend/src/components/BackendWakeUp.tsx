"use client";

import { useEffect } from "react";

export default function BackendWakeUp() {
  useEffect(() => {
    fetch("/api/v1/health")
      .then((res) => {
        if (res.ok) {
          console.log("Backend is awake and ready!");
        }
      })
      .catch(() => {
        console.log("Wake-up ping sent (backend might be starting up)...");
      });
  }, []);

  return null;
}