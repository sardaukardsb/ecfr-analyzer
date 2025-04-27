// axiosSetup.ts
// Centralized Axios configuration to ensure API requests work in both development and production
// Import this file once (e.g. in main.tsx) before any axios calls are made.
//
// In development (localhost / 127.0.0.1) we keep relative URLs ("/api/..."), which Vite's dev
// server proxies to https://www.ecfr.gov via vite.config.ts.
//
// In production (deployed to Vercel at ecfr.danielbassett.com) we now rely on **Vercel rewrites**
// (see `vercel.json`) to transparently proxy any request starting with "/api" to
// https://www.ecfr.gov/api. Because the browser sees the request as same-origin, no CORS headers
// are required and the eCFR API's "missing CORS" issue is avoided.
//
// Therefore, we **do not** override axios.defaults.baseURL in production any more; we always keep
// relative URLs so that both development (Vite proxy) and production (Vercel rewrite) behave the
// same way.

import axios from 'axios';

// Guard against SSR environments (though this app is client-only)
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  // Historically we set axios.defaults.baseURL to "https://www.ecfr.gov" when not local, but that
  // caused browser CORS errors in production. The Vercel rewrite makes this unnecessary, so the
  // block has been removed.
  
  // if (!isLocal) {
  //   axios.defaults.baseURL = 'https://www.ecfr.gov';
  // }
}

export {};  
