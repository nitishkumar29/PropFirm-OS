# PropFirm OS

PropFirm OS is a premium fintech operating system for prop firm traders. It combines portfolio tracking, payout orchestration, financial flow visualization, accounting-style ledger views, analytics, and an AI assistant in a polished dark-mode SaaS experience.

## 1. Project Overview

- Project name: PropFirm OS
- Type: Single-page dashboard application for prop-firm trading operations
- Primary audience: Traders managing multiple prop-firm accounts, payouts, broker activity, and capital allocation
- Current architecture: Frontend-only React/Next.js application with client-side persistence

## 2. Requirements

- Node.js: 20.18+ recommended (the project was verified in a Node 24 environment)
- npm: 10+
- Operating system: Windows, macOS, or Linux

## 3. Installation

```bash
cd /path/to/portfolio
npm install
```

## 4. Development

Start the local development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## 5. Production Build

Create a production build:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

## 6. Linting

```bash
npm run lint
```

## 7. Deployment

### Recommended deployment: Vercel

This project is a standard Next.js app and deploys very easily to Vercel.

#### Vercel deployment steps

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Vercel will detect Next.js automatically.
4. Deploy.

Other options:
- Netlify: possible, but requires extra adapter configuration
- Railway: possible for containerized deployment
- Docker: possible with a standard Next.js container setup
- Localhost: supported for development and private use

## 8. Data Storage and Backup

### Where user data is stored

User data is stored in the browser using Zustand persistence.

- Storage mechanism: `localStorage`
- Persistence key: `propfirm-os-storage`
- Data saved: accounts, payouts, brokers, broker transactions, flow nodes, and settings

### How data is saved

The app uses Zustand with the `persist` middleware in [lib/store.ts](lib/store.ts). This writes the state to browser local storage under the key `propfirm-os-storage`.

### Backup instructions

Because the app is currently client-side only, backups are manual.

#### Manual backup

1. Open browser developer tools.
2. Go to Application or Storage.
3. Open Local Storage for the app origin.
4. Copy the value for the key `propfirm-os-storage`.
5. Save it as a JSON backup file.

#### Restore backup

1. Open the same Local Storage entry.
2. Replace the stored JSON with your backed-up value.
3. Reload the app.

> Important: Clearing browser storage or switching browsers will remove the data unless it is backed up.

## 9. Project Structure

```text
app/
  layout.tsx
  page.tsx
  globals.css
components/
  app-shell.tsx
  sections/
    accounts.tsx
    analytics.tsx
    broker-portfolio.tsx
    capital-allocation.tsx
    dashboard.tsx
    financial-flow.tsx
    heatmap.tsx
    ledger.tsx
    payouts.tsx
    prop-firms.tsx
    propfirm-ai.tsx
    settings.tsx
lib/
  ai.ts
  metrics.ts
  store.ts
  types.ts
  utils.ts
public/
```

## 10. Main Technologies

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- React Flow
- Zustand
- Lucide Icons
- date-fns
- xlsx
- Zod

## 11. PWA and Desktop Notes

### PWA status

This project is not currently a PWA.

### To make it a PWA

You would need to add a service worker and manifest, typically with Next.js PWA tooling.

### Desktop app conversion

This app can be wrapped in Electron or Tauri with relatively small changes because it is a frontend app with no backend dependency. The main challenge would be state persistence and packaging, not core application architecture.

## 12. Current State

The project is a polished frontend prototype and a strong foundation for a fintech operating system. It currently supports:

- Dashboard overview
- Account tracking
- Payout tracking
- Broker portfolio views
- Capital allocation areas
- Financial flow visualization
- AI assistant workflow

## 13. Important Notes

- There is no database backend yet.
- There is no authentication or multi-user support.
- There is no server-side API layer.
- Data is browser-scoped and not shared across devices automatically.
- The app is best suited for single-user local productivity workflows today.

