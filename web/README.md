# Web app

Next.js App Router frontend for the swarm builder: landing, dashboard, create swarm, per-swarm chat, mint flow, and activity/deliberation views.

## Setup

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Configure `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` (Dynamic Labs), optional RPC URLs, and contract addresses. Contract reads and writes are enabled only when the wallet is on `NEXT_PUBLIC_EXPECTED_CHAIN_ID` (default Base Sepolia `84532`).

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — ESLint
