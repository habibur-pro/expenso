# Spec: Database Connection and Schema

## Overview

Give Expenso its persistence layer: install Prisma ORM, connect the app to the existing MongoDB Atlas cluster through the already-configured `DB_URI` environment variable, define the initial data model (`User`, `Category`, and `Expense`), push it to MongoDB, and expose a single shared, server-only Prisma client at `src/lib/prisma.ts`. Step 01 shipped a static marketing homepage with no data layer at all — this step adds the foundation that authentication (step 03) and every expense/analytics feature after it will build on. It ships **no UI, no API routes, and no user-facing behaviour**: its entire deliverable is a validated schema, a live database connection, generated Prisma Client types, and the conventions (money as integer minor units, categories as a user-owned model, indexes designed for user-scoped queries, ownership via a required `userId`) that every later model and step must follow.

## Depends on

- **Step 01 — Homepage Design** (merged): established the project scaffold, `src/lib/`, the `@/*` path alias, and the `.env` / `.env.example` pair that already contains `DB_URI` and `NEXT_PUBLIC_SITE_URL`.

Nothing else. This step has no dependency on authentication — it defines the `User` model the auth step will consume, but does not implement sign-up, sign-in, sessions, or password storage.

## User flow

This feature has no user-facing surface. There is no page, no form, no route, and no visible state change for an end user; the "user" of this step is the developer. The verification flow is:

**Entry point:** A developer clones the repo and runs `pnpm install`.

**Actions and expected behaviour:**

1. `pnpm install` runs the new `postinstall` script, which runs `prisma generate` and writes Prisma Client into `src/generated/prisma`. A custom generator `output` is in use, so the client is not available until this runs.
2. `pnpm prisma validate` reports the schema as valid.
3. `pnpm prisma db push` connects to the Atlas cluster named in `DB_URI` and creates the `User`, `Category`, and `Expense` collections plus their indexes.
4. `pnpm build` compiles with the generated Prisma types available.

**Loading behaviour:** Not applicable — nothing renders.

**Validation behaviour:** If `DB_URI` is missing or empty, importing `src/lib/prisma.ts` throws a clear, non-secret server-side error (`"DB_URI is not set"`) at startup rather than failing later with an opaque driver error. The connection string itself is never logged, echoed, or included in any thrown message.

**Success behaviour:** `pnpm prisma db push` reports the database is in sync; a read-only query (for example `prisma.user.count()`) run from a throwaway script returns `0` against a fresh database.

**Error behaviour:** A wrong or unreachable `DB_URI` surfaces as a Prisma CLI/connection error in the terminal only. No client-facing error paths exist yet — safe error mapping arrives with the first Route Handler.

**Empty states / confirmation / navigation:** Not applicable.

## API Routes

No API route changes.

This step deliberately adds no Route Handlers. Do **not** add a `/api/health`, `/api/db-check`, or any other connectivity-probe endpoint: it would be a public endpoint reporting internal infrastructure state, and connectivity is already verifiable with `pnpm prisma db push` and a local throwaway script. The first Route Handlers arrive with the authentication and expense steps, and they will import the shared client from `src/lib/prisma.ts`.

## Database changes

The repository currently has **no** `prisma/` directory and no `prisma/schema.prisma`, so every model below is new and nothing is destructive. MongoDB has no SQL-style migrations — schema changes are applied with `pnpm prisma db push`.

**Datasource and generator**

- Provider: `mongodb`, with `url = env("DB_URI")` in the `datasource` block. Prisma requires a replica set; the existing Atlas `mongodb+srv://` cluster satisfies this.
- Generator: `prisma-client-js` with `output = "../src/generated/prisma"`.
- **Prisma version: 6.19.3, pinned — not 7.x.** Prisma 7 shipped _without MongoDB support_: its client requires a driver adapter, no `@prisma/adapter-mongodb` exists, and Prisma's own docs say MongoDB users must stay on 6.19. (Prisma 7's CLI still validates and pushes a `mongodb` schema, which makes the gap easy to miss — it is the app runtime that cannot connect.) MongoDB support returns in Prisma 8 through `@prisma/orm-mongo`, which is prerelease at time of writing; upgrading is a separate, deliberate step.
- No `prisma.config.ts`. That file is the Prisma 7 arrangement; Prisma 6 reads `url` from the schema and loads `.env` automatically, and adding the config file would _disable_ that auto-loading.

**Models**

```prisma
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  expenses   Expense[]
  categories Category[]
}

model Category {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  slug      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  expenses Expense[]

  @@unique([userId, slug])
  @@index([userId, name])
}

model Expense {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  userId      String   @db.ObjectId
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId  String   @db.ObjectId
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  amountMinor Int
  currency    String   @default("USD")
  description String?
  date        DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, date])
  @@index([userId, categoryId, date])
  @@index([userId, createdAt])
  @@index([categoryId])
}
```

**Decisions behind the model — follow these, do not silently revise them:**

- **Money is stored as `amountMinor: Int`** — the amount in the currency's smallest unit (cents), never a float. The MongoDB connector does not support Prisma's `Decimal` type, so integer minor units are the precise representation available. Conversion between minor units and a displayable amount belongs in a shared helper introduced by the step that first needs it, not here. `Int` caps a single expense near 21.4M major units, acceptable for a personal tracker.
- **`currency` is stored per expense** with a `"USD"` default so amounts are never silently currency-less. Multi-currency entry, conversion, and per-currency aggregation are **out of scope**; no settings UI or currency picker is added here.
- **`Category` is a first-class, user-owned model — not an enum.** Each category belongs to exactly one user via a required `userId`, so one user can never see, filter by, or attach another user's category. This is the deliberate choice: it lets categories be created, renamed, and removed per user later without a schema migration, and it lets analytics group by a real relation. Do **not** collapse it back into an enum, and do **not** make it a global/shared collection.
- **`Category.slug`** is the normalized form of `name` (lowercase, trimmed, kebab-case) and exists so uniqueness is enforced by the database rather than by a race-prone application check: `@@unique([userId, slug])` means one user cannot end up with both "Food" and "food". The service that creates categories derives the slug from the name; the slug also gives filter/query parameters a stable, readable value. `name` stays exactly as the user typed it and is what the UI displays.
- **`Expense.categoryId` is required, with `onDelete: Restrict`.** Deleting a category that still has expenses must fail rather than cascade-deleting the user's spending history or silently orphaning it. The step that adds category deletion decides what to offer the user (reassign, or block with a clear message); the schema simply refuses to lose data. Verify `Restrict` is accepted by the installed connector when running `pnpm prisma validate` — Prisma emulates referential actions for MongoDB.
- **Ownership is structural:** every `Expense` and every `Category` requires a `userId`, with `onDelete: Cascade` from `User`, so deleting a user removes both. There is no way to persist an unowned record.
- **Indexes lead with `userId`**, matching the only query shape this app will ever issue: list/filter/sort/aggregate _within one user_. `[userId, date]` serves history and date-range filters, `[userId, categoryId, date]` serves category filters and by-category analytics, `[userId, createdAt]` serves recent-activity and stable pagination, and `[categoryId]` makes the "does this category still have expenses?" check cheap when category deletion is implemented.
- **Description search** will use a Prisma `contains` filter on `description`; do not add a `@@fulltext` index or enable preview features for it in this step.
- **No category management, seeding, or UI in this step.** This step defines the `Category` collection and nothing more — no CRUD routes, no seed script, no default category list. Because `Expense.categoryId` is required, the step that first creates expenses must also ensure the user has categories (seeding a default set at registration is the natural place); flag that as a dependency there rather than pre-building it here.
- **No colour, icon, budget, archived, or ordering fields on `Category`,** and no `isDefault` flag. None has been requested; add them in the step that actually renders or uses them.
- **No auth-provider models** (`Account`, `Session`, `VerificationToken`) and **no credential fields** (`passwordHash`, `emailVerified`) are added here. The authentication step chooses the auth strategy and adds exactly the fields that strategy needs. `User.email` is unique so either strategy can key on it.

**Conventions every future model must follow.** More models are planned, so these are the house rules this schema establishes — apply them rather than re-deciding per model:

- Primary key is always `id String @id @default(auto()) @map("_id") @db.ObjectId`.
- Every foreign key field is `String @db.ObjectId` and is paired with an explicit `@relation`.
- Every user-owned model carries a required `userId` with `onDelete: Cascade` from `User`, and adds the matching back-relation field on `User`.
- Every model carries `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
- Compound indexes on user-owned models lead with `userId`, followed by the field the query filters or sorts on.
- Monetary values are integer minor units paired with a currency, never `Float`.
- Deletes that would destroy user history use `Restrict`, not `Cascade`; only ownership edges from `User` cascade.
- New models are added to `prisma/schema.prisma`, applied with `pnpm prisma db push`, and the client regenerated with `pnpm prisma generate` — never with Prisma Migrate, which MongoDB does not support.

## components & ui

- **Create:** None. This step adds no components.
- **Modify:** None. Do not touch `src/components/**`, `src/app/layout.tsx`, `src/app/globals.css`, or any marketing component.
- **Pages:** No page or route under `src/app` is added or changed.

Responsive, loading, empty, error, and accessibility considerations do not apply — there is no rendered output. The existing design system and shadcn/ui setup are untouched.

## Services & Business Logic

No service changes.

`src/services/` is not created in this step: there is no business logic to hold yet, and CLAUDE.md forbids unnecessary scaffolding. The only non-UI module added is the shared Prisma client at `src/lib/prisma.ts`, which is infrastructure, not business logic:

- **`src/lib/prisma.ts`** — exports one shared `PrismaClient` instance. Responsibilities: read and assert `DB_URI` server-side, instantiate the client, and cache the instance on `globalThis` in development so Next.js hot reloading does not open a new connection pool on every reload. Marked with `import "server-only"` so any accidental import from a Client Component becomes a build error. Every future service and Route Handler imports the client from here — never `new PrismaClient()` anywhere else.

## Validation

There are **no user-controlled inputs in this step** — no forms, no query parameters, no request bodies — so no Zod schemas are added and `src/lib/validations/` is not created. Zod arrives with the first feature that accepts user input, and every user-supplied field (amount, category, description, date, ids, pagination, filter, and sort parameters) will be validated server-side there.

The one input this step does validate is operational configuration:

- **`DB_URI`** — required, non-empty string, read from `process.env` on the server only. Asserted at module load in `src/lib/prisma.ts`; a missing value throws immediately with a message that names the variable and never includes its value. It is not `NEXT_PUBLIC_`-prefixed and must never reach the browser.

Schema-level constraints the database itself enforces, and that later validation layers must mirror:

- `User.email` — required, unique.
- `User.name` — required.
- `Category.userId` — required, valid ObjectId, always the authenticated user's id.
- `Category.name` — required, non-empty; a maximum length must be enforced at the API layer when category creation is introduced.
- `Category.slug` — required, derived server-side from `name` (trimmed, lowercased, kebab-case); never accepted from the client. Unique per user (`@@unique([userId, slug])`), and a duplicate must be returned as a clear "you already have a category with that name" message, not a raw Prisma unique-constraint error.
- `Expense.userId` — required, valid ObjectId, always the authenticated user's id.
- `Expense.categoryId` — required, valid ObjectId; must reference a category **owned by the same authenticated user** (see _Authorization & Data Ownership_). Zod can only check that it is a well-formed ObjectId — existence and ownership are a database check, not a validation-layer one.
- `Expense.amountMinor` — required integer (minor units); must be validated as a positive integer at the API layer.
- `Expense.currency` — required, defaults to `"USD"`.
- `Expense.description` — optional string; a maximum length must be enforced at the API layer when it is introduced.
- `Expense.date` — required `DateTime`.

## Authorization & Data Ownership

No authentication or authorization code is written in this step — there is no session, no user context, and no endpoint to protect. What this step does is make correct authorization _possible and cheap_ for every step after it:

- `Expense.userId` and `Category.userId` are **required and non-nullable**, so neither an expense nor a category can exist without an owner.
- The `User` ← `Expense` and `User` ← `Category` relations use `onDelete: Cascade`, so a user's data does not outlive them.
- Every index leads with `userId`, so the natural, performant query is already the user-scoped one.

Binding rules for all future work built on this schema:

- The authenticated user id is always determined **server-side** from the session — never read from a request body, query string, route parameter, header, or any other client-supplied value.
- Every read, list, update, delete, and analytics aggregation must include `userId: <authenticated user id>` in its `where` clause. Filtering by record `id` alone is never sufficient — for expenses **and** for categories; ownership is verified in the same query (`where: { id, userId }`), not by fetching first and comparing in application code.
- **A client-supplied `categoryId` is an untrusted reference to another user's data until proven otherwise.** Because `Category` is now a user-owned model, every create or update of an expense must confirm the referenced category belongs to the authenticated user (for example `prisma.category.findFirst({ where: { id: categoryId, userId } })`, or a create nested under a user-scoped query) before writing. A `categoryId` that exists but belongs to someone else must be rejected with the same generic "category not found" response as one that does not exist — never a message that confirms another user's record exists. The same rule applies to `categoryId` used as a filter on lists and analytics.
- Client-side checks are never authorization. No component may query Prisma directly.

## Files to change

- `package.json` — add the `prisma` (dev) and `@prisma/client` dependencies, and a `"postinstall": "prisma generate"` script (a custom generator `output` is in use, so builds and CI need the client generated after install).
- `pnpm-workspace.yaml` — set `prisma`, `@prisma/client`, and `@prisma/engines` to `true` under `allowBuilds`, or pnpm blocks Prisma's install scripts and the engines never download.
- `pnpm-lock.yaml` — updated by `pnpm install`; keep it consistent and commit it.
- `.gitignore` — ignore the generated Prisma Client (`/src/generated`) so build output is never committed. Also add a `!.env.example` negation: the existing `.env*` rule currently excludes `.env.example` from version control, which defeats its purpose of documenting required variables such as `DB_URI`.
- `eslint.config.mjs` — add `src/generated/**` to the existing `globalIgnores([...])` list so generated client code cannot break `pnpm lint`.

Do not modify `next.config.ts`: `@prisma/client` is already on Next.js's built-in `serverExternalPackages` list, so no bundling opt-out is needed. Do not modify `tsconfig.json`, `.env`, or `.env.example` — `DB_URI` and `NEXT_PUBLIC_SITE_URL` are already present and correct in both.

## Files to create

- `prisma/schema.prisma` — datasource, `prisma-client-js` generator, and the `User`, `Category`, and `Expense` models exactly as specified above.
- `src/lib/prisma.ts` — the shared, server-only `PrismaClient` singleton described under _Services & Business Logic_. Import `PrismaClient` from the generated output (`@/generated/prisma`), **not** from `@prisma/client`, because a custom generator output path is in use.

The generated directory `src/generated/prisma/` is produced by `prisma generate` and is gitignored — it is not a file to author or commit.

## New dependencies

Two, both required and neither replaceable by something already installed (the project currently has no ORM or database driver):

- `@prisma/client` — **pin to `6.19.3`** (runtime client).
- `prisma` — **pin to `6.19.3`**, dev dependency (CLI: `validate`, `generate`, `db push`).

**Critical:** do **not** install with `@latest` or on 7.x. Prisma 7 has no MongoDB support (see _Database changes_), and the `prisma` CLI's `latest` dist-tag currently resolves to an `8.0.0-rc` prerelease. Install the exact versions:

```
pnpm add @prisma/client@6.19.3
pnpm add -D prisma@6.19.3
```

No `dotenv` — Prisma 6 loads `.env` automatically for the CLI, and Next.js loads it at app runtime.

Do not add `server-only` as a package — Next.js handles that import internally. Do not add Zod, a driver adapter (`@prisma/adapter-*`), or Prisma Accelerate/Optimize in this step.

**pnpm build scripts:** this repo uses pnpm's `allowBuilds` allowlist in `pnpm-workspace.yaml`. Prisma's install scripts are blocked by default, so `prisma`, `@prisma/client`, and `@prisma/engines` must each be set to `true` there or the engines never download.

## Rules for implementation

- Follow `CLAUDE.md` and `AGENTS.md`.
- Make the smallest clean change that fully solves the requested task.
- Do not implement features outside the requested scope.
- Do not refactor unrelated code.
- Do not remove existing functionality without explicit permission.
- Follow existing project conventions.
- Prefer Server Components.
- Use `"use client"` only when actually required.
- Never access Prisma directly from Client Components.
- Keep business logic out of UI components.
- Put reusable business logic in services.
- Use Next.js Route Handlers for backend logic.
- Validate all server-side user input with Zod.
- Never trust client-provided `userId`.
- Enforce authentication server-side.
- Enforce authorization server-side.
- Verify ownership of user-owned resources.
- Use MongoDB through Prisma.
- Avoid raw MongoDB queries unless genuinely required.
- Use a shared Prisma client instance.
- Avoid floating-point arithmetic for exact monetary values.
- Do not silently mix currencies.
- Never fetch unbounded expense lists.
- Use pagination for potentially large lists.
- Prefer server-side or database-side aggregation for analytics.
- Do not ship unnecessary raw data to the client.
- Return safe client-facing errors.
- Never expose Prisma/database/internal errors to users.
- Keep secrets server-side.
- Never hardcode credentials, keys, tokens, or secrets — the connection string is only ever read from `process.env.DB_URI`, and must never appear in source, logs, error messages, or committed files.
- Use Tailwind CSS for styling.
- Reuse existing shadcn/ui components and design patterns when appropriate.
- Keep all UI responsive across mobile, tablet, and desktop.
- Maintain accessibility.
- Avoid unnecessary client-side state and `useEffect`.
- Avoid unnecessary database queries and API requests.
- Do not add dependencies unless necessary.
- Check installed package versions before using APIs.
- Use Context7 for version-sensitive or unfamiliar APIs, but **trust the installed CLI over any doc page** — several published Prisma pages still describe MongoDB working on 7.x, which it does not. `pnpm prisma validate` is the arbiter. Read the relevant guide in `node_modules/next/dist/docs/` before touching anything Next.js-specific.
- Do not make destructive database changes without explicit permission — `pnpm prisma db push` against the empty database is additive and allowed; `--force-reset`, `migrate reset`, and any drop are not.
- Do not modify configuration unless required — the only sanctioned config changes are the files listed under _Files to change_.
- Do not modify unrelated files.

Step-specific constraints:

- Do not run `prisma init` — it would rewrite `.env` and scaffold files this spec does not want. Author `prisma/schema.prisma` by hand.
- Do not rename `DB_URI` to `DATABASE_URL`; the variable already exists in `.env` and `.env.example` and is used as-is.
- Do not commit `src/generated/**`.
- Any connectivity check must be a throwaway, read-only script kept outside the repository (use the session scratchpad) and deleted after use.
- If the generated ESM client fails to resolve under Turbopack, consult the installed generator's options via Context7 before changing `tsconfig.json` or `next.config.ts`.

## Definition of done

1. `pnpm install` completes and its `postinstall` step generates Prisma Client into `src/generated/prisma/`.
2. `package.json` lists `@prisma/client` and `prisma` on `6.19.3` (not 7.x, which cannot connect to MongoDB, and not an `8.0.0-rc` prerelease), and `pnpm-lock.yaml` is consistent.
3. `pnpm prisma validate` exits successfully and reports the schema as valid.
4. `pnpm prisma generate` succeeds and `src/generated/prisma/` contains the client with `User`, `Category`, and `Expense` types, including the `Expense.category` and `User.categories` relations.
5. `pnpm prisma db push` connects to the Atlas cluster from `DB_URI` and reports the database in sync, creating the `User`, `Category`, and `Expense` collections.
6. All declared indexes exist in MongoDB (verifiable in Atlas, Prisma Studio, or a `getIndexes()` check): `User.email` unique, `Category` `[userId, slug]` unique and `[userId, name]`, and the four `Expense` indexes.
7. A throwaway read-only script that imports `src/lib/prisma.ts` and runs `prisma.user.count()` returns a number without error — proving the runtime connection works, not just the CLI.
8. Removing or blanking `DB_URI` makes that same import fail immediately with a clear message naming the variable, and the message contains no connection string.
9. `pnpm lint` passes with no errors and no warnings from generated code.
10. `pnpm build` succeeds, confirming the generated Prisma types typecheck.
11. `pnpm dev` starts, `/` still renders exactly as it did in step 01, and no new client-side JavaScript is shipped to the browser.
12. `git status` is clean apart from the intended source changes — no `src/generated/`, no `.env`, no credentials in the diff.
13. Grepping the tracked tree finds no hardcoded connection string, username, or password.
