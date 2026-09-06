# CLAUDE.md

@AGENTS.md

# Expenso

## Overview

Expenso is a personal expense tracker: add/edit/delete expenses, organize by category, view history, search/filter/sort, and view spending analytics and trends. Built as a single full-stack Next.js app (no separate backend) on MongoDB via Prisma. Priorities: simple, fast, secure, responsive, maintainable. Make the smallest clean change that fully solves the requested task — do not build beyond scope, and understand existing code/conventions before changing them.

## Stack

Next.js, React, TypeScript, Tailwind CSS, shadcn/ui (when appropriate), React Hook Form (when appropriate), Zod, MongoDB, Prisma ORM, a charting library for analytics. Backend logic lives in Next.js Route Handlers — do not introduce a separate backend framework.

## Context7

Use the Context7 MCP (`use context7` in the prompt) for current, version-specific docs on Next.js, React, Prisma, MongoDB, Tailwind, shadcn/ui, Zod, React Hook Form, auth libraries, charting libraries, and any unfamiliar/version-sensitive API. Prefer current official docs over prior knowledge; don't assume APIs match older versions; check installed versions; don't add dependencies just because Context7 mentions them; don't refactor working code just because a newer approach exists.

## Architecture & Code Organization

Preferred structure (evolve as needed, but follow existing conventions and don't add unnecessary folders/files/abstractions):

```
src/
  app/            # (auth)/, (dashboard)/, api/, layout.tsx, page.tsx
  components/     # ui/, expenses/, analytics/, dashboard/
  lib/            # prisma.ts, validations/, utils/, constants/
  services/
  hooks/
  types/
prisma/schema.prisma
public/
tests/
```

- Pages/layouts → `src/app/`; API routes → `src/app/api/`; components → `src/components/*`; Prisma client → `src/lib/prisma.ts`; Zod schemas → `src/lib/validations/`; business logic → `src/services/`; shared hooks → `src/hooks/`; shared types → `src/types/`; DB schema → `prisma/schema.prisma`.
- Keep business logic out of UI components (put in services). Never access Prisma from Client Components.

## TypeScript / React / Next.js

- `camelCase` for variables/functions, `PascalCase` for components, prefer `const`, avoid `any`, descriptive names, focused functions, no duplicated logic, no unnecessary abstractions, prefer type inference.
- Prefer Server Components; use `"use client"` only when actually needed (browser APIs, event handlers, interactive forms/charts, client-side state). Avoid unnecessary `useEffect` and client-side state. Follow current Next.js APIs (use Context7 for version-sensitive ones).

## Styling

Tailwind CSS + shadcn/ui only — no other CSS framework. Avoid inline styles unless necessary. Keep spacing/typography consistent, all UI responsive (mobile/tablet/desktop), and reuse existing design patterns.

## Database & Prisma

- MongoDB only; Prisma is the access layer; schema lives in `prisma/schema.prisma`; use a shared Prisma client instance; avoid raw MongoDB queries unless required; keep DB logic reusable, not duplicated across routes; never expose credentials.
- Before touching the schema: inspect it, understand models/relationships, check the installed Prisma version, use Context7 if version-sensitive, identify destructive changes, make the smallest required change, then validate (`pnpm prisma validate`), push the changes to MongoDB (`pnpm prisma db push` — MongoDB has no SQL-style migrations, so this is how schema changes get applied), and regenerate the client (`pnpm prisma generate`) as needed, and verify affected functionality. Never make destructive DB changes without explicit permission.

## Auth & Authorization

Every user-owned resource must be scoped to the authenticated user, determined server-side — never trust a client-provided `userId` (body, query, or otherwise). Every protected read/update/delete must verify ownership. Users must never access, modify, delete, or view another user's expenses, analytics, or private data. Client-side authorization is never sufficient.

## Validation & Money

- Validate on the server with Zod: amount, category, description, date, IDs, query/filter params, and other user input. Never rely only on client-side validation.
- Avoid floating-point arithmetic for exact monetary values; use a precise representation supported by Prisma/MongoDB. Don't silently mix currencies.

## Expenses & Analytics

- Support only the expense features requested (create/edit/delete/view/search/filter/sort, by category and date range). Paginate — never fetch unbounded expense lists.
- Analytics (totals, daily/weekly/monthly, by category, trends, recent, top categories, averages, period comparisons) must use only the authenticated user's data, prefer server/DB-side aggregation, and avoid shipping raw data to the client for client-side math. Don't add analytics beyond what's requested.

## API Architecture & Security

Route Handlers should: authenticate → identify the user server-side → validate input → call the service → return a consistent response → handle errors safely. Keep business logic in services, not duplicated across routes. Never trust client-supplied `userId` or authorization state from body, query, or client state — every protected endpoint enforces authorization server-side.

## Error Handling

Client-facing errors must be safe, clear, useful, and free of secrets/internal details (e.g. say "Unable to update the expense," not the raw Prisma error). Technical detail belongs in server logs.

## Environment Variables

Keep secrets in env files; document required vars in `.env.example` without real values; never commit real secrets; never prefix private vars with `NEXT_PUBLIC_`; never hardcode credentials, keys, secrets, or tokens.

## Responsive UI / UX

Must work on mobile, tablet, and desktop — not desktop-only. Expense creation/history stay convenient on small screens; analytics/charts stay usable on mobile. Aim for a clean, modern, consistent, accessible UI; prioritize usability over decoration.

## SEO

Follow SEO best practices for all public-facing pages (landing, auth, marketing) using Next.js's built-in Metadata API — do not add a third-party SEO package unless asked.

- **Metadata:** Set `title` and `description` via the Metadata API (`generateMetadata` or the static `metadata` export) on every public route; avoid duplicate/generic titles across pages.
- **robots.txt:** Generate via `app/robots.ts`. Allow crawling of public pages; disallow authenticated routes (`/dashboard`, `/expenses`, `/analytics`, etc.) and API routes (`/api/*`).
- **Sitemap:** Generate via `app/sitemap.ts`, including only public, indexable pages.
- **Social sharing (Open Graph / Twitter Cards):** Set `openGraph` and `twitter` fields in metadata for public pages — title, description, and an image — so links render correctly when shared.
- **Canonical URLs:** Set `alternates.canonical` where a page could otherwise be reached by more than one URL.
- **Indexing control:** Set `robots: { index: false }` in metadata for authenticated/private pages so they're excluded even if linked externally.
- **Semantic HTML & accessibility:** One `<h1>` per page, logical heading hierarchy, descriptive `alt` text on images, semantic landmarks (`<nav>`, `<main>`, etc.).
- **Structured data:** Only add JSON-LD if a specific page type calls for it — don't add speculatively.
- Don't over-invest in SEO for pages that are inherently private/behind login — prioritize the public-facing surface (landing, sign-up/login).

## Performance

Avoid unnecessary DB queries, API requests, client JS, re-renders, and large data transfers. Prefer server-side fetching, efficient/DB-side aggregation, pagination, and minimal client JS. Don't optimize prematurely — prefer readable, maintainable solutions.

## Dependencies

Don't auto-install packages. Before adding one: check if an existing dependency solves it, confirm it's necessary, check official docs (Context7 if version-sensitive), prefer established/lightweight options, and keep `package.json`/lockfile consistent. Don't replace existing dependencies without clear reason.

## Workflow

**Before implementing:** understand the requirement, explore the codebase and existing implementations/components, check the Prisma schema and auth/authorization, check dependency versions, use Context7 when relevant, identify the minimal file set, then implement only what was requested.

**Plan mode:** explore and inspect existing code/deps first, use Context7 when relevant, then explain the approach (DB/API/UI changes and testing called out separately) without modifying files. Plan only the requested task.

**Implementing:** understand → inspect existing code → check docs → plan → implement only the requested change → run checks → fix resulting issues → verify authorization/data ownership → verify responsive behavior → summarize. Ask for clarification if an ambiguity would significantly change the implementation.

**File modification:** touch only files necessary for the task — no unrelated rewrites, unnecessary refactors, unneeded renames, architecture changes without reason, config changes without reason, or removing existing functionality without permission.

## Testing & Verification

Check `package.json` for which scripts actually exist before assuming (`pnpm lint`, `pnpm typecheck`, `pnpm test`; `pnpm prisma validate` / `pnpm prisma generate` for schema work). Run relevant checks after implementing. Test important functionality: expense CRUD, search, filtering, analytics, auth, authorization, and user data isolation. When checks fail, fix the actual cause — don't hide or suppress errors.

## Git

Use clear, conventional commit messages (`feat:`, `fix:`, `refactor:` ...). Never commit `.env`/`.env.local`, `node_modules/`, `.next/`, or real credentials/keys/secrets. Don't rewrite or delete git history unless explicitly asked.

## Avoid

Separate backend framework; replacing MongoDB or Prisma without instruction; Prisma in Client Components; trusting client-provided `userId`; cross-user data access; client-only authorization; exposing secrets to the browser; hardcoded credentials; unnecessary dependencies; unrelated file changes; over-engineering; unrequested features; destructive DB changes without permission; editing files during plan-only tasks; outdated APIs when current docs are available (use Context7).

## Commands

Use what's defined in `package.json` — typically `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm start`, plus `pnpm prisma generate` / `pnpm prisma validate`. Don't invent commands that aren't defined there.
