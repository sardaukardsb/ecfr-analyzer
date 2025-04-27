# eCFR Analyzer

Interactive web dashboard that surfaces insights from the Electronic Code of Federal Regulations.

## Features

| Tab | What it does |
|-----|--------------|
| **Word Count per Agency** | Compare the total word-count of regulations issued by up to five agencies.
| **Historical Term Usage** | Visualise how often a search term appears in the CFR over time.
| **Historical Agency Changes** | Plot daily change counts for an agency over a chosen period.
| **Bureaucracy Ranking** | Rank agencies by *word-count + all-time change count*.

> Tabs are listed left-to-right from most general to most analytical.

### Data pipeline

All data is fetched live from the official eCFR API (https://www.ecfr.gov).  In development Vite proxies `/api/**` to that domain (see `vite.config.ts`).
In production (Vercel) the same paths are rewritten via `vercel.json`, keeping requests same-origin and avoiding CORS.

No data is stored server-side – everything happens in the browser.

### Navigation cheatsheet

1. **Pick a tab** across the top.
2. **Choose agencies / terms / date-range** via the controls that appear.
3. Hover or click the charts for exact values.
4. Hit **Refresh** buttons to re-query live data.

### Local development

```bash
npm install
npm run dev  # open http://localhost:5173
```

### Production build

```bash
npm run build
npm run preview  # test production bundle locally
```

### Deployment

Push to `main` – Vercel Git integration auto-builds and deploys to **ecfr.danielbassett.com**.

---
Made with React 18, Vite 5, TypeScript, Axios, Chakra UI & Recharts.
