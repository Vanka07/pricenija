# CLAUDE.md — PriceNija

This document provides context for AI assistants working on the PriceNija codebase.

## Project Overview

PriceNija is a Nigerian agricultural commodity price tracking web application. Users can browse real-time market prices, compare prices across markets, track price trends via charts, and manage personal watchlists. An admin panel allows managing commodities, markets, prices, and users.

**Production URL:** https://www.pricenija.com

## Tech Stack

- **Framework:** Next.js 14.0.4 (App Router, JavaScript — no TypeScript)
- **UI:** React 18, Tailwind CSS 3.4, Lucide React icons
- **Charts:** Recharts (Area charts for price trends)
- **Backend/Auth/DB:** Supabase (PostgreSQL via `@supabase/ssr` and `@supabase/supabase-js`)
- **Sitemap:** next-sitemap (auto-generates in postbuild)
- **Deployment:** Vercel

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production build (also runs next-sitemap via postbuild)
npm run start      # Start production server
npm run lint       # Run ESLint
```

There are no tests configured in this project.

## Project Structure

```
pricenija/
├── app/                        # Next.js App Router
│   ├── layout.js               # Root layout (fonts, metadata, JSON-LD SEO)
│   ├── page.js                 # Main dashboard (~1400 lines, core app)
│   ├── loading.js              # Global loading fallback
│   ├── globals.css             # Tailwind directives + dark theme base styles
│   ├── components/
│   │   └── LoadingSkeleton.js  # Skeleton loading components
│   ├── about/
│   │   └── page.js             # About page (features, FAQ, contact)
│   ├── admin/
│   │   └── page.js             # Admin dashboard (protected, ~900 lines)
│   └── markets/
│       └── [id]/
│           └── page.js         # Dynamic market detail page
├── lib/
│   └── supabase.js             # Supabase client + auth/database helpers
├── middleware.js                # Auth middleware (protects /admin route)
├── public/
│   ├── favicon.svg
│   └── og-image.svg
├── next.config.js              # Next.js config (reactStrictMode, swcMinify: false)
├── tailwind.config.js          # Tailwind config (no custom theme extensions)
├── jsconfig.json               # Path alias: @/* → root
├── next-sitemap.config.js      # Sitemap config (excludes /admin/*, /api/*)
└── postcss.config.js           # PostCSS (Tailwind + Autoprefixer)
```

## Routes

| Path | File | Description |
|------|------|-------------|
| `/` | `app/page.js` | Main dashboard with 4 tabs: Dashboard, Prices, Markets, Watchlist |
| `/about` | `app/about/page.js` | About page with features, how-it-works, FAQ, contact |
| `/admin` | `app/admin/page.js` | Protected admin panel (redirects to `/` if unauthenticated) |
| `/markets/[id]` | `app/markets/[id]/page.js` | Dynamic market detail page |

## Database (Supabase)

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `markets` | Nigerian markets (cities) | `id`, `name`, `is_active` |
| `commodities` | Agricultural products | `id`, `name`, `category`, `is_active` |
| `prices` | Price records | `market_id`, `commodity_id`, `date`, `price` (unique on all three) |
| `watchlist` | User watchlists | `user_id`, `commodity_id` (unique on both) |
| `price_alerts` | Price alert settings | `user_id`, `commodity_id`, `market_id`, `alert_type`, `threshold_value`, `is_active` |
| `users` | User accounts + roles | `id`, `role` (checked for `'admin'`) |

### Supabase Client

- **Browser client** (`lib/supabase.js`): Uses `createBrowserClient` from `@supabase/ssr`
- **Server client** (`middleware.js`): Uses `createServerClient` from `@supabase/ssr` for session refresh
- All database helper functions are exported from `lib/supabase.js`
- Upserts use `onConflict` for idempotent writes (prices, watchlist)

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

Both are required. The app falls back to placeholder values with a console warning if missing.

## Architecture & Patterns

### Rendering

All page components use `'use client'` — this is a client-rendered SPA with Next.js App Router for routing and layout.

### State Management

- React hooks only (`useState`, `useEffect`, `useMemo`, `useCallback`)
- No external state library (no Redux, Zustand, etc.)
- Local component state with prop drilling within page files

### Authentication

- Supabase Auth with email/password (sign up and sign in)
- Middleware (`middleware.js`) protects `/admin` — redirects unauthenticated users to `/`
- Admin access verified by checking `users.role === 'admin'` via `checkAdminRole()`
- Auth modal is built into the main page component

### Data Fetching

- All data fetched client-side via Supabase helper functions in `lib/supabase.js`
- Uses Supabase foreign key joins: `commodity:commodities(*)`, `market:markets(*)`
- Loading states tracked with boolean flags (`loading`, `authLoading`, `saving`, `refreshing`)
- Error handling via try/catch with `console.error()` and user-facing messages

### Navigation

- Tab-based UI within pages using `useState` for active tab
- Hash-based URL sync via `window.history.pushState` (Dashboard, Prices, Markets, Watchlist tabs)
- Browser back/forward navigation supported via `popstate` listener

## Styling Conventions

- **Dark theme only** — base background `#0c0a09` (gray-950), text `#fafaf9` (gray-50)
- **Primary color:** Green (`green-400` through `green-600`, theme color `#22c55e`)
- **Tailwind utility classes** inline in JSX — no separate CSS modules or styled-components
- **Responsive breakpoints:** `sm:`, `md:`, `lg:` prefixes throughout
- **Component styling patterns:**
  - Cards: `bg-gray-900 border border-gray-800 rounded-xl p-4`
  - Buttons: gradient backgrounds (`bg-gradient-to-r from-green-500 to-green-600`), `rounded-lg`
  - Animations: `animate-pulse` for skeletons, `animate-spin` for loaders
  - Custom keyframes defined via `<style jsx global>` blocks: `fade-in-up`, `pulse-subtle`
- **Scrollbar:** Custom dark webkit scrollbar styles in `globals.css`

## Code Conventions

- **Language:** JavaScript (no TypeScript)
- **Components:** PascalCase function components, all in page files (minimal extraction to components/)
- **Variables/functions:** camelCase
- **Indentation:** Inconsistent (mix of 2-space and tab) — follow surrounding code when editing
- **Semicolons:** Used
- **Imports:** Path alias `@/` available (maps to project root via jsconfig.json)
- **Icons:** Import from `lucide-react` (e.g., `TrendingUp`, `ShoppingCart`, `MapPin`)
- **Price formatting:** Custom `formatPrice()` and `formatCompactPrice()` utilities defined inline in page.js

## Key Files to Know

| File | What It Does | Size |
|------|-------------|------|
| `app/page.js` | Core application — dashboard, prices, markets, watchlist, auth modal | ~1400 lines |
| `app/admin/page.js` | Full admin panel — CRUD for all entities, bulk import, reports | ~900 lines |
| `lib/supabase.js` | Single Supabase client + all auth and database helper functions | ~175 lines |
| `middleware.js` | Route protection and session refresh | ~55 lines |
| `app/components/LoadingSkeleton.js` | Reusable skeleton loading components | ~170 lines |

## Working With This Codebase

### Adding a New Page

1. Create `app/<route>/page.js`
2. Add `'use client'` directive at the top
3. Import Supabase helpers from `@/lib/supabase`
4. Import icons from `lucide-react`
5. Follow the dark theme styling conventions (gray-900 cards, green accents)
6. Update `next-sitemap.config.js` exclusions if the page should not be indexed

### Adding a New Database Query

1. Add the async function to `lib/supabase.js`
2. Use the existing `supabase` client instance
3. Follow the established pattern: `const { data, error } = await supabase.from(...)`
4. Return `{ data, error }` (or `{ error }` for mutations)

### Adding a New Admin Feature

1. Add a new tab constant in `app/admin/page.js`
2. Add the tab button to the sidebar navigation
3. Add the corresponding content section in the render

## Gotchas

- **Large page files:** `app/page.js` and `app/admin/page.js` are monolithic — most logic is in these two files rather than split into components
- **No TypeScript:** No type checking — be careful with data shapes from Supabase
- **No tests:** No test suite exists — validate changes manually or by running `npm run build`
- **Client-side only:** All pages use `'use client'` — no server components or server-side rendering for data
- **SWC minify disabled:** `next.config.js` has `swcMinify: false`
- **Inconsistent indentation:** Some files use tabs, others use spaces — match surrounding code
- **Placeholder fallback:** If Supabase env vars are missing, the client initializes with placeholder URLs and will not function
