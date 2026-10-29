'use client';
import { useEffect } from 'react';

// The interactive behaviour (menu, scroll reveals, tabs, filters, lightbox, forms, share
// buttons) lives in plain scripts that enhance the server-rendered HTML. They are loaded
// after React has hydrated the page so they never fight with it. Pages are linked with
// normal <a> tags, so every page load runs them once.
export function MainScript() {
  useEffect(() => {
    import('@/scripts/main.js');
  }, []);
  return null;
}

// Home page globe (canvas). Its map data, public/assets/js/globe-data.js, loads on demand.
export function GlobeScript() {
  useEffect(() => {
    import('@/scripts/globe.js');
  }, []);
  return null;
}
