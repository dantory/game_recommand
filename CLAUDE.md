# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered mobile game recommendation wizard (Korean UI) built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. Users select genres and tags through a 3-step wizard, and the app fetches recommendations from the RAWG API filtered to mobile platforms (iOS/Android).

## Commands

```bash
pnpm dev        # Start dev server (localhost:3000)
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # ESLint with Next.js + TypeScript rules
```

No test framework is configured.

## Architecture

**Wizard Flow:** `WizardShell` orchestrates a 3-step process — `GenreStep` (select genres) → `TagStep` (optional tags) → `ResultStep` (display recommendations). All wizard state lives in `WizardShell` via React `useState`.

**API Layer:** Client components fetch from `/api/games` (Next.js route handler in `src/app/api/games/route.ts`), which proxies requests to the RAWG API (`src/lib/rawg.ts`). The API key is stored in `.env.local` as `RAWG_API_KEY`.

**Component Organization:**
- `src/components/wizard/` — wizard step components and orchestrator
- `src/components/ui/` — reusable primitives (Button, SelectableChip, GameCard, PlatformBadge, Skeleton)
- `src/lib/constants.ts` — genre/tag definitions with Korean labels
- `src/types/game.ts` — TypeScript interfaces for RAWG API data

**Path alias:** `@/*` maps to `./src/*`.

**Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`. Dark mode uses `prefers-color-scheme` with CSS custom properties defined in `src/app/globals.css`. Custom fade-in animation for transitions.

**Image optimization:** Next.js `<Image>` with `media.rawg.io` configured as allowed remote pattern in `next.config.ts`.

## Deployment

Deployed on Vercel. Configuration in `.vercel/` directory.
