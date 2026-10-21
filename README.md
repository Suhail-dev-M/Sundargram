# Sundargram — Full-Stack Instagram Web Clone

[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_&_Auth-3ecf8e.svg?logo=supabase)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff.svg?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A pixel-faithful, production-grade social photo & video sharing web application inspired by Instagram, engineered with **React 19**, **TypeScript**, **Tailwind CSS 4**, and **Supabase** (PostgreSQL, Row Level Security, Auth, Storage, and Realtime).

---

## ✨ Features

- **📱 Mobile-First Ergonomics & Responsive Desktop**:
  - Compact mobile top bar with custom cursive script wordmark, notifications badge, and DM icon.
  - Mobile bottom tab navigation (Home, Search/Explore, Create +, Reels, Profile).
  - Desktop responsive layout with collapsible 244px sidebar, centered 470px feed, and right-hand suggestion rails.
- **📸 Ephemeral Stories (24h)**:
  - Gradient story ring indicators (`#F58529` → `#DD2A7B` → `#8134AF` → `#515BD4`) and seen tracking.
  - Full-screen story viewer with segmented progress timers, pause-on-hold, tap left/right navigation, and direct story replies sent to DMs.
- **🎬 Full-Screen Reels**:
  - Vertical snap-scroll feed (`scroll-snap-type: y mandatory`) with video playback, tap-to-mute, side action rail, and audio title display.
- **🎨 Creation Studio**:
  - Upload up to 10 images or videos (multi-media carousel).
  - Aspect ratio cropping (1:1 square, 4:5 portrait, 16:9 landscape).
  - Caption editor with hashtag support, location tagger, and optimistic publishing.
- **💬 Direct Messages (DMs)**:
  - Split desktop conversation list and active chat view; full mobile thread.
  - Real-time message streaming, photo attachments, typing status, and message unsend.
- **❤️ Social Interactions**:
  - Double-tap-to-like with centered heart burst animation and celebratory particle feedback.
  - Nested comments with parent/reply hierarchy and comment liking.
  - Saved collections private to user.
- **👥 Profile & Follow System**:
  - Real-time follower, following, and post counts.
  - Public and private account privacy with follow request approval/rejection.
  - 3-column media grid tabs: Posts, Reels, Saved, and Tagged.
- **🌙 Dark Mode & Theming**:
  - System preference detection (`prefers-color-scheme`) with manual Dark/Light toggle in Settings.
- **⚡ Smart Supabase Engine & Offline Mode**:
  - Automatic exponential backoff retries on network timeouts.
  - Request deduplication and in-memory query caching.
  - Normalized error handling for RLS and Postgres constraints.
  - Seamless offline fallback when Supabase keys are not configured.
- **📲 Progressive Web App (PWA)**:
  - Web App Manifest (`manifest.json`), high-contrast SVG icon, and in-app install prompt with iOS Safari guide.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Frontend Framework** | React 19 (Hooks, Context, Functional Components) |
| **Language** | TypeScript |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS 4 (@tailwindcss/vite) |
| **Icons** | Lucide React |
| **Backend & Database** | Supabase (PostgreSQL 15, Auth, Storage, Realtime) |
| **Security** | Row Level Security (RLS) on all 18 tables |
| **Animations** | Motion / Canvas Confetti |

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn or pnpm
- (Optional) A Supabase account at [supabase.com](https://supabase.com)

### 2. Clone the Repository
```bash
git clone https://github.com/Suhail-dev-M/Sundargram.git
cd Sundargram
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Add your Supabase credentials (optional; app works out-of-the-box in local mode if left empty):
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
sundargram/
├── public/                 # Static assets, PWA manifest, and app icons
├── src/
│   ├── components/
│   │   ├── auth/           # Login & Sign-up cards
│   │   ├── common/         # Wordmark Logo, PWA install prompt, Toasts
│   │   ├── direct/         # Direct messaging split inbox and chat
│   │   ├── explore/        # Asymmetric explore grid & search autocomplete
│   │   ├── feed/           # Stories tray, post cards, suggestions column
│   │   ├── layout/         # Desktop sidebar, mobile top bar & bottom nav
│   │   ├── modals/         # Create post, story viewer, comments, settings
│   │   ├── profile/        # Profile header stats, bio, 3-column media tabs
│   │   └── reels/          # Vertical snap-scroll reels player
│   ├── hooks/              # Custom hooks (PWA install, online status)
│   ├── lib/                # Supabase client, smart request handler, local store
│   ├── store/              # State stores (auth, theme, modals)
│   ├── types/              # TypeScript domain types & interfaces
│   ├── App.tsx             # Root application orchestrator
│   ├── main.tsx            # DOM root mounting
│   └── index.css           # Global Tailwind 4 styling & design tokens
├── supabase/
│   └── migrations/         # Full PostgreSQL migration with RLS & triggers
├── netlify.toml            # Netlify deployment configuration
├── vercel.json             # Vercel SPA routing configuration
├── vite.config.ts          # Vite bundler configuration
└── package.json            # Dependencies & scripts
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
