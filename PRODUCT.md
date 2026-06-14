# FUTBOL VERSUS — Product Context

## What it is
A football club president management game. Players act as club presidents, managing budgets, market values, and competing in leagues, friendly matches, and challenges. The design language is dark, cinematic, and sports-inspired.

## Register: Brand
This is a game product where design IS part of the experience. The UI is a dark cinematic sports surface, not a utility product. Motion, atmosphere, and visual drama are expected and appropriate. Earned familiarity from football game aesthetics (dark panels, gold accents, red CTAs) is a feature.

## Design System
- **Palette**: `--bg-0: #070a11`, `--bg-1: #0b0f18`, `--bg-2: #10151f`, `--red: #c8102e`, `--gold: #e8cf8e`, `--txt: #eef1f6`, `--txt-2: #aeb6c4`, `--txt-3: #6c7585`
- **Fonts**: Barlow Condensed (`--font-d`, display/headings), Barlow Semi Condensed (`--font-u`, body)
- **Background pattern**: `.bg` with `.streaks` (subtle vertical light streaks) + `.vignette` (radial darkening). Reused on every full-screen surface.
- **Cards**: `border: 1px solid var(--line)`, `border-radius: 13-16px`, `background: var(--panel-solid)`. Selected state uses `--gold` border.
- **Primary CTA**: `.btn-play` — red gradient, `font-weight: 800`, uppercase, `letter-spacing: .14em`

## Key Screens
- **Login/Register** (`/login`): Full-screen dark cinematic, brand mark above form card, tabs for login/register
- **Menu shell** (`/(menu)`): `#stage > #canvas > .screen.active` with `.bg` + `.topbar` + `.home` split (nav sidebar + view frame)
- **Amistoso** (`/amistoso`): Minigame grid, card-based selection, modal detail
- **Liga** (`/`): Hero card with match CTA

## Auth Architecture
- Supabase Auth with email/password
- `@supabase/ssr` for cookie-based SSR auth
- `src/proxy.ts` for route protection (Next.js 16 convention)
- `profiles` table in Supabase with RLS
- Profile auto-created on signup via DB trigger
- `ProfileSetupModal` shown on first login (when profile is incomplete)

## Player Profile
- `president_name`, `country`, `avatar_id` (veteran/modern/visionary), `stadium_id` (coliseo/arena/fortaleza), `shield_id` (clasico/circulo/angular)
- `market_value` (default 0), `budget` (default 0) — system-set, not user-chosen
- Profile is "complete" when all 5 user fields are set
