# eCFR Analyzer

A lightweight frontend web application to visualize analytics on the Electronic Code of Federal Regulations (eCFR).

Built with **React + TypeScript + Chakra UI + Vite**.

## Features (MVP)

1. **Word Count Per Agency** – approximate count of regulatory text associated with a selected agency.
2. **Historical Changes Over Time** – daily counts of occurrences for a search term, visualized as a line chart.

## Setup

```bash
# install deps
pnpm install # or npm i / yarn

# develop
pnpm dev

# build
pnpm build
``` 

## Architecture Notes

- Uses eCFR REST API endpoints under `https://www.ecfr.gov`.
- Axios for HTTP.
- Recharts for basic charts.
- Chakra UI for clean, responsive design.

Feel free to fork and extend metrics – e.g. word frequency, section diffing, etc.
