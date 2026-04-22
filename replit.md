# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### EduSphere (`artifacts/edusphere`)

A full-stack aesthetic educational platform built with React + Vite + TypeScript + localStorage.

**Features:**
- Landing page with animated gradient, glassmorphism cards, and particle background
- Teacher Portal: Create exams with questions (A/B/C/D options), set timer, publish to specific class
- Teacher Dashboard: View all published exams, notifications panel with unread badge count
- Student Portal: Login with name/phone/class, view available exams by class
- Student Dashboard: Available exams, past results, leaderboard CTA
- Exam Page: Timer countdown (glowing red under 1 min), question-by-question navigation with dot indicators, answer selection cards
- Results Page: Score, grade, trophy animation, color-coded result, full question review with correct/wrong answers
- Leaderboard: Top students per class (min 5 exams), gold/silver/bronze medals, animated row entrance

**Design:**
- Dark navy/deep purple aesthetic (#1a1a2e, #16213e, #0f3460)
- Accent: soft purple (#c9b8ff), cyan (#7ec8e3), gold (#f0c040)
- Glassmorphism cards, smooth transitions, animated gradient header
- Google Fonts: Poppins (headings) + Inter (body)
- Fully responsive

**Data:** 100% localStorage (no backend). Keys: `exams`, `results`, `notifications`, `currentStudent`, `teacherLoggedIn`, `studentLoggedIn`, `lastResult`

**Auth:** Teacher password: `tks1`
