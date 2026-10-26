// src/api.js
// Shared constant for the backend API base URL.
// Includes a protocol safeguard for cloud deployments (e.g. Render)
// so that a raw hostname automatically resolves to valid HTTPS.

const rawApiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export const API_BASE =
  rawApiBase.startsWith('http://') || rawApiBase.startsWith('https://')
    ? rawApiBase
    : `https://${rawApiBase}`;
