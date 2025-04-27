// axiosSetup.ts
// Centralized Axios configuration to ensure API requests work in both development and production
// Import this file once (e.g. in main.tsx) before any axios calls are made.
//
// In development (localhost / 127.0.0.1) we keep relative URLs ("/api/..."), which Vite's dev
// server proxies to https://www.ecfr.gov via vite.config.ts.
//
// In production (any non-local host – e.g. ecfr.danielbassett.com on Vercel) we prepend the
// eCFR domain so that the same relative paths resolve to the live API instead of the deployed
// site itself.

import axios from 'axios';

// Guard against SSR environments (though this app is client-only)
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  // Treat anything that is not obviously localhost as production.
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  // When running on production we need the full eCFR domain so that requests like
  //   axios.get('/api/admin/v1/agencies.json')
  // resolve to: https://www.ecfr.gov/api/admin/v1/agencies.json
  if (!isLocal) {
    axios.defaults.baseURL = 'https://www.ecfr.gov';
  }
}

export {};
