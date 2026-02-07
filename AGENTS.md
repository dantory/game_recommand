# AGENTS.md

Guidelines for AI coding agents operating in this repository.

## Project Overview

IGDB-powered game discovery service with Netflix-style UI and Korean localization. Next.js 16 + React 19 + TypeScript (strict) + Tailwind CSS v4. Users browse curated game sections, filter by genre/platform, search games, and view detailed game pages with screenshots, videos, and similar games.

## Commands

```bash
pnpm dev          # Dev server on localhost:3000
pnpm build        # Production build (use as typecheck + build verification)
pnpm lint         # ESLint (Next.js core-web-vitals + typescript rules)
pnpm test         # Run all tests (vitest)
pnpm test:watch   # Run tests in watch mode
pnpm start        # Start production server (requires build first)
```

Verify changes with `pnpm test`, `pnpm build`, and `pnpm lint`.

## Architecture

```
src/
  app/
    page.tsx              # Root page (client component, Netflix-style discovery)
    layout.tsx            # Root layout (fonts: Geist + Noto Sans KR, lang="ko")
    globals.css           # Tailwind v4 import, CSS custom properties, dark mode, scrollbar-hide
    api/games/route.ts    # GET route — sections: popular, top-rated, genre, filter
    api/games/[id]/route.ts   # GET route — game detail by ID
    api/games/search/route.ts # GET route — search games by query
    games/[id]/page.tsx   # Game detail page (server component)
  components/
    sections/             # Page-level sections
      GameSection.tsx     # Horizontal scroll game list (fetch on mount)
      GameGrid.tsx        # Responsive grid for filtered/search results
    ui/                   # Reusable primitives
      Button.tsx          # Primary/secondary variants
      FilterChip.tsx      # Toggle chip with emoji + label (genre/platform)
      FilterBar.tsx       # Horizontal scroll genre + platform filter bar
      SearchBar.tsx       # Search input with form submission
      GameCard.tsx        # Game card with cover, rating, genres, platform badges
      PlatformBadge.tsx   # PC/PS/Xbox/Switch/Android/iOS platform badges
      Skeleton.tsx        # Loading skeleton for GameCard
  lib/
    igdb.ts               # IGDB API client (Twitch OAuth + Apicalypse queries)
    constants.ts          # Genre/platform definitions (Korean labels, IGDB IDs)
    utils.ts              # cn(), shuffleArray(), pickRandom(), igdbImageUrl()
  types/
    game.ts               # TypeScript interfaces: IGDBGame, IGDBGamesResponse
  __tests__/
    utils.test.ts         # Utility function tests (18 tests)
    igdb.test.ts          # IGDB client tests with mocked fetch (23 tests)
    route.test.ts         # API route handler tests (19 tests)
    components.test.tsx   # UI component tests (38 tests)
```

### Data Flow

1. `page.tsx` (client) owns search query, selected genres/platforms via `useState`
2. In default mode: `GameSection` components fetch curated sections (popular, top-rated, genre-specific)
3. With active filters or search: fetches filtered/search results, displays in `GameGrid`
4. Route handlers call IGDB functions from `igdb.ts`
5. `igdb.ts` authenticates via Twitch OAuth, queries IGDB v4 with Apicalypse body
6. Game detail page (`games/[id]/page.tsx`) is a server component that calls `getGameDetail()` directly

### IGDB API

- **Auth**: Twitch OAuth client_credentials → access token (cached in memory with expiry)
- **Endpoint**: `POST https://api.igdb.com/v4/games`
- **Headers**: `Client-ID` + `Authorization: Bearer {token}` + `Content-Type: text/plain`
- **Body**: Apicalypse query text (e.g., `fields name, cover.url; where rating > 80; sort rating desc; limit 20;`)
- **Rate limit**: 4 requests/second
- **Images**: `//images.igdb.com/igdb/image/upload/t_thumb/xxx.jpg` — use `igdbImageUrl()` to set protocol + size (`t_cover_big`, `t_screenshot_big`, `t_720p`, `t_1080p`)

### Testing

- **Framework**: Vitest 4.x with `@vitejs/plugin-react`
- **Config**: `vitest.config.ts` at project root (path alias configured, jsdom environment)
- **Setup**: `src/__tests__/setup.ts` imports `@testing-library/jest-dom/vitest`
- **Test location**: `src/__tests__/*.test.ts` and `src/__tests__/*.test.tsx`
- **Mocking**: Use `vi.mock()` for module mocks, `vi.fn()` for function mocks
- **Pattern**: Import from `@/` alias in tests, same as production code
- **Component tests**: Mock `next/image` and `next/link` with plain HTML elements

### Environment

- **Required**: `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in `.env.local`
- Path alias: `@/*` maps to `./src/*`
- Deployed on Vercel

## Code Style

### TypeScript

- **Strict mode enabled** (`"strict": true` in tsconfig)
- **No type suppression**: never use `as any`, `@ts-ignore`, `@ts-expect-error`
- Define component props as `interface` (not `type`) directly above the component
- Use `type` imports for type-only imports: `import type { IGDBGame } from "@/types/game"`
- Prefer union literal types for bounded values: `variant?: "primary" | "secondary"`
- API response types live in `src/types/game.ts`
- Extend native HTML element types for UI components: `interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`

### Imports

Order (no blank lines between groups — this codebase does not separate them):
1. React/Next.js framework imports (`react`, `next/*`)
2. Internal absolute imports using `@/` alias (`@/lib/*`, `@/components/*`, `@/types/*`)
3. Relative imports (sibling components like `./PlatformBadge`)

```typescript
// Correct
import { useState, useCallback } from "react";
import { GameCard } from "@/components/ui/GameCard";
import { igdbImageUrl, cn } from "@/lib/utils";
import type { IGDBGame } from "@/types/game";
```

- Always use the `@/` path alias for cross-directory imports
- Use relative imports only for siblings in the same directory

### Components

- **Named exports only** — no default exports for components (`export function Button`)
- **One component per file** — file name matches component name (PascalCase)
- `"use client"` directive at top of file for any component using hooks, event handlers, or browser APIs
- Server components (no directive) when possible — `GameCard`, `PlatformBadge`, `Skeleton` are server-compatible
- Destructure props in function signature
- Use `cn()` from `@/lib/utils` for conditional class merging (lightweight, no clsx dependency)

### Naming

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `GameCard`, `GameSection` |
| Component files | PascalCase.tsx | `GameCard.tsx` |
| Hooks/callbacks | camelCase, `on` prefix for props | `onToggleGenre`, `onSearch` |
| Internal handlers | camelCase, `handle` prefix | `handleSearch` |
| Constants | UPPER_SNAKE_CASE for module-level | `GENRES`, `PLATFORMS`, `RESULTS_PER_SECTION` |
| Interfaces | PascalCase + Props/Response suffix | `GameCardProps`, `IGDBGamesResponse` |
| Directories | kebab-case or lowercase | `sections/`, `ui/` |

### Styling

- **Tailwind CSS v4** with `@tailwindcss/postcss` plugin
- Custom color tokens via CSS custom properties in `globals.css` (not `tailwind.config`)
- Use semantic tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-muted`, `bg-card`, `border-border`, `bg-accent`, `text-accent`, `bg-accent-light`
- Dark mode: automatic via `prefers-color-scheme` media query — CSS variables swap in `globals.css`
- Custom utilities: `.animate-fade-in` for transitions, `.scrollbar-hide` for scroll containers
- Rounded corners: `rounded-xl` for interactive elements, `rounded-2xl` for cards
- Spacing: use `space-y-*` for vertical rhythm, `gap-*` for flex/grid
- Horizontal scroll: `overflow-x-auto snap-x snap-mandatory scrollbar-hide` with `min-w-[Npx] snap-start` children

### Error Handling

- API route: try/catch with `console.error` + JSON error response with status 500
- Client fetch: try/catch, set error state string, show Korean error message
- `catch` blocks without binding (`catch {` not `catch (e) {` when error is unused)

### UI Text

- All user-facing text is **Korean** (titles, labels, error messages, button text)
- Code comments and error logs are in **English**

### Patterns to Follow

- Wrap state updaters in `useCallback` when passed as props
- Use `URLSearchParams` for building query strings
- Next.js `<Image>` for external images with explicit `sizes` prop
- Use `igdbImageUrl()` to convert IGDB image URLs (protocol + size)
- Fisher-Yates shuffle for randomization (see `utils.ts`)
- Return `null` from components when nothing to render (e.g., `PlatformBadge`)
- Use `Array.from({ length: N })` for generating skeleton placeholders

### Patterns to Avoid

- No CSS-in-JS, no `style` props — Tailwind only
- No state management libraries (Redux, Zustand) — props + useState only
- No `useEffect` for data that can be computed — derive from state
- No `index` as key for dynamic lists — use stable IDs
- No barrel exports (`index.ts`) — import directly from component files
