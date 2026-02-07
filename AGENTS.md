# AGENTS.md

Guidelines for AI coding agents operating in this repository.

## Project Overview

Mobile game recommendation wizard with Korean UI. Next.js 16 + React 19 + TypeScript (strict) + Tailwind CSS v4. Users pick genres/tags in a 3-step wizard, then get recommendations from the RAWG API filtered to iOS/Android.

## Commands

```bash
pnpm dev          # Dev server on localhost:3000
pnpm build        # Production build (use as typecheck + build verification)
pnpm lint         # ESLint (Next.js core-web-vitals + typescript rules)
pnpm start        # Start production server (requires build first)
```

**No test framework is configured.** There are no unit or integration tests. Verify changes with `pnpm build` and `pnpm lint`.

## Architecture

```
src/
  app/
    page.tsx              # Root page (server component, renders WizardShell)
    layout.tsx            # Root layout (fonts: Geist + Noto Sans KR, lang="ko")
    globals.css           # Tailwind v4 import, CSS custom properties, dark mode
    api/games/route.ts    # GET route handler — proxies to RAWG API
  components/
    wizard/               # Wizard orchestration (3-step flow)
      WizardShell.tsx     # State owner: step, selectedGenres, selectedTags
      GenreStep.tsx       # Step 1: genre multi-select
      TagStep.tsx         # Step 2: tag multi-select (optional)
      ResultStep.tsx      # Step 3: fetch + display game results
      StepIndicator.tsx   # Visual step progress bar
    ui/                   # Reusable primitives
      Button.tsx          # Primary/secondary variants
      SelectableChip.tsx  # Toggle chip with emoji + label
      GameCard.tsx        # Game display card with image, rating, platforms
      PlatformBadge.tsx   # iOS/Android platform badges
      Skeleton.tsx        # Loading skeleton for GameCard
  lib/
    rawg.ts               # RAWG API client (server-side only)
    constants.ts          # Genre/tag definitions (Korean labels), platform IDs
    utils.ts              # cn(), shuffleArray(), pickRandom()
  types/
    game.ts               # TypeScript interfaces for RAWG API responses
```

### Data Flow

1. `WizardShell` (client) owns all wizard state via `useState`
2. Steps receive state + callbacks as props (no context/store)
3. `ResultStep` fetches `/api/games?genres=...&tags=...` on mount
4. Route handler (`api/games/route.ts`) calls `fetchMobileGames()` from `rawg.ts`
5. Server shuffles results, returns top 6 games

### Environment

- `RAWG_API_KEY` in `.env.local` — required for API calls
- Path alias: `@/*` maps to `./src/*`
- Deployed on Vercel

## Code Style

### TypeScript

- **Strict mode enabled** (`"strict": true` in tsconfig)
- **No type suppression**: never use `as any`, `@ts-ignore`, `@ts-expect-error`
- Define component props as `interface` (not `type`) directly above the component
- Use `type` imports for type-only imports: `import type { RawgGame } from "@/types/game"`
- Prefer union literal types for bounded values: `variant?: "primary" | "secondary"`, `currentStep: 1 | 2 | 3`
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
import { Button } from "@/components/ui/Button";
import type { RawgGame } from "@/types/game";
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
| Components | PascalCase | `GameCard`, `WizardShell` |
| Component files | PascalCase.tsx | `GameCard.tsx` |
| Hooks/callbacks | camelCase, `on` prefix for props | `onToggleGenre`, `onStartOver` |
| Internal handlers | camelCase, `handle` prefix | `handleStartOver` |
| Constants | UPPER_SNAKE_CASE for module-level | `GENRES`, `MOBILE_PLATFORM_IDS` |
| Interfaces | PascalCase + Props/Response suffix | `GenreStepProps`, `RawgListResponse` |
| Directories | kebab-case or lowercase | `wizard/`, `ui/` |

### Styling

- **Tailwind CSS v4** with `@tailwindcss/postcss` plugin
- Custom color tokens via CSS custom properties in `globals.css` (not `tailwind.config`)
- Use semantic tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-muted`, `border-border`, `bg-accent`, `text-accent`, `bg-accent-light`
- Dark mode: automatic via `prefers-color-scheme` media query — CSS variables swap in `globals.css`
- Custom animation: `.animate-fade-in` class for step transitions
- Rounded corners: `rounded-xl` for interactive elements, `rounded-2xl` for cards
- Spacing: use `space-y-*` for vertical rhythm, `gap-*` for flex/grid

### Error Handling

- API route: try/catch with `console.error` + JSON error response with status 500
- Client fetch: try/catch, set error state string, show Korean error message + retry button
- `catch` blocks without binding (`catch {` not `catch (e) {` when error is unused)
- Validate env vars with early throw: `if (!apiKey) throw new Error("...")`

### UI Text

- All user-facing text is **Korean** (titles, labels, error messages, button text)
- Code comments and error logs are in **English**

### Patterns to Follow

- Wrap state updaters in `useCallback` when passed as props
- Use `URLSearchParams` for building query strings
- Next.js `<Image>` for external images with explicit `sizes` prop
- Fisher-Yates shuffle for randomization (see `utils.ts`)
- Return `null` from components when nothing to render (e.g., `PlatformBadge`)
- Use `Array.from({ length: N })` for generating skeleton placeholders

### Patterns to Avoid

- No CSS-in-JS, no `style` props — Tailwind only
- No state management libraries (Redux, Zustand) — props + useState only
- No `useEffect` for data that can be computed — derive from state
- No `index` as key for dynamic lists — use stable IDs
- No barrel exports (`index.ts`) — import directly from component files
