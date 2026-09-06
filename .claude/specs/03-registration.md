# Spec: Registration

## Overview

Give Expenso real user accounts. This step installs an authentication library, wires it to the existing MongoDB database through the existing Prisma client, and ships a public `/register` page whose only action is **"Continue with Google"**. Completing that flow creates a `User` row, establishes a signed session cookie, and lands the user on an authenticated page. Steps 01 and 02 produced a marketing homepage and a schema whose `Expense` and `Category` models both require a `userId` — but nothing can produce a `userId` yet, so every feature after this one is blocked on it.

**Scope constraint (explicit):** registration is **Google OAuth only**. There is no email/password sign-up, no name/email registration form, no magic link, no email verification flow, and no password storage anywhere in this step. The registration surface is one button. Better Auth's `emailAndPassword` block must be left out entirely — it is disabled by default, and enabling it is out of scope.

Also deliberately out of scope, and named here so they are not smuggled in: a `/login` page (deferred to step 04 — note that because Google OAuth sign-up and sign-in are the same call, a returning user who lands on `/register` is signed in correctly, so nothing is broken by deferring it), account linking, multiple providers, profile editing, account deletion, default-category seeding (flagged in step 02 as belonging to the step that first creates expenses), a real dashboard, and `proxy.ts` route protection.

## Depends on

- **Step 01 — Homepage Design** (merged): the app scaffold, the `@/*` alias, `src/components/ui/button.tsx`, the design tokens in `globals.css`, `robots.ts` / `sitemap.ts`, and the `SiteHeader` / `MobileNav` components — both of which **already link to `/register`**, currently a dead link that this step makes real.
- **Step 02 — Database Connection and Schema** (merged): `prisma/schema.prisma` with the `User` model, the shared server-only client at `src/lib/prisma.ts`, the `@db.ObjectId` / `@map("_id")` primary-key convention, and the `DB_URI` environment variable. This step extends `User` and adds the auth-provider models that step 02 deliberately left out.

Nothing else. No expense or category feature depends on this spec's completion beyond needing the session it produces.

## User flow

**Entry point.** Any "Get started" / "Register" affordance on the marketing site — `SiteHeader` (desktop), `MobileNav` (small screens), and the hero/CTA sections — all already point at `/register`. The page is also reachable directly and is publicly indexable.

**Page state.** `/register` renders a centred card: the Expenso wordmark, a heading ("Create your account"), one sentence of supporting copy that sets the expectation that Google is the only option, and a single full-width **Continue with Google** button carrying the Google mark. Below it, a short line of legal/reassurance copy. There is **no form**, so there are no fields, no client-side field validation, and no submit-disabled-until-valid behaviour.

**Already-signed-in.** `/register` is a Server Component that reads the session before rendering. If a valid session exists, it `redirect()`s to `/dashboard` immediately — an authenticated user never sees the register card.

**User action.** Clicking the button calls `authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })` and the browser is handed off to Google's consent screen.

**Loading behaviour.** The button enters a pending state on click — spinner replacing the Google mark, label unchanged, `disabled` set so a double-click cannot start two OAuth flows. Because the redirect to Google follows, this state is brief but must exist; the page must not appear frozen.

**Success behaviour.** Google redirects back to `/api/auth/callback/google`. Better Auth exchanges the code, creates the `User` and `Account` rows on first sign-in (or matches the existing `User` on a return visit), writes the session row and the `HttpOnly` session cookie, and redirects to `/dashboard`. The user sees an authenticated placeholder page confirming who they are signed in as.

**Error behaviour.** Three distinct cases, all of which must land the user back on `/register` with a readable message and the button ready to retry:

1. **User cancels at Google's consent screen** — Google returns `access_denied`. Message: neutral, not alarming (e.g. "Sign-up was cancelled. Try again when you're ready.").
2. **OAuth exchange fails** (bad/expired code, provider outage, misconfigured credentials) — Message: generic and safe (e.g. "We couldn't complete sign-up with Google. Please try again."). The underlying error goes to the server log only. Never surface a provider error body, a Prisma error, a stack trace, the client secret, or the redirect URI.
3. **JavaScript unavailable** — the button is a real `<button>` inside the page; with no JS it does nothing. Acceptable for this step; do not build a no-JS fallback.

Wire this by passing `errorCallbackURL: "/register?error=..."` (or Better Auth's equivalent for the installed version) and reading the error code from `searchParams` in the page. Map known codes to the copy above and everything else to the generic message — **never** interpolate a raw error string into the UI.

**Empty / confirmation / navigation.** No empty states (nothing is listed). No confirmation dialog — OAuth consent is the confirmation. The card links back to `/` so a user can leave without signing up.

**Sign out.** The `/dashboard` placeholder carries a **Sign out** control so the flow can be re-tested end to end. It calls `authClient.signOut()` and returns the user to `/`.

## API Routes

One new Route Handler, entirely provided by the library:

- `GET, POST /api/auth/[...all]` — Better Auth's catch-all handler, mounted with `toNextJsHandler(auth)` from `better-auth/next-js`. Serves the OAuth initiation, the Google callback (`/api/auth/callback/google`), session reads, and sign-out. **Access level: public** — it must be, since it is what unauthenticated users hit to authenticate. Do not hand-write, wrap, or add logic to these handlers.

No other Route Handlers are added in this step. Do not create a `/api/register`, `/api/user`, or `/api/session` endpoint: session reads happen server-side through `auth.api.getSession()`, not over HTTP from the client.

Authorization requirements applied to the one endpoint above:

- The handler establishes identity; it does not consume it. There is no user-owned resource behind it and therefore no ownership check to perform.
- The authenticated user id it produces is **only ever** read server-side from the session cookie via `auth.api.getSession({ headers: await headers() })`. No route, page, or component in this step accepts, reads, or forwards a client-supplied `userId`.
- `trustedOrigins` must be configured on the `auth` instance so `callbackURL` cannot be pointed at an attacker-controlled origin. This is the open-redirect guard — do not hand-roll a second one.

`robots.ts` already disallows `/api/`, so the handler is excluded from crawling with no change.

## Database changes

All changes are **additive**. No field is removed, renamed, retyped, or made stricter, and no existing relation changes — so nothing here is destructive.

**Do not hand-write these models from memory.** Better Auth's required field names change between minor versions (for example, recent versions add an `issuer` field to `Account` and key its compound unique on `[issuer, accountId]` rather than `[providerId, accountId]`). The correct procedure is:

1. Write `src/lib/auth.ts` first.
2. Run the Better Auth CLI to generate the schema for the **installed** version, writing to a throwaway path in the session scratchpad rather than over `prisma/schema.prisma`:
   `npx @better-auth/cli@latest generate --config src/lib/auth.ts --output <scratchpad>/better-auth.prisma`
3. Hand-merge its output into `prisma/schema.prisma`, applying the MongoDB adaptations below.
4. `pnpm prisma validate` → `pnpm prisma db push` → `pnpm prisma generate`.

**MongoDB adaptations the generated output will not have** — the CLI emits a relational-shaped schema, and applying it verbatim will not work on MongoDB:

- Every new model's primary key becomes `id String @id @default(auto()) @map("_id") @db.ObjectId`, per the step-02 convention. The CLI emits a bare `String @id`.
- Every foreign-key scalar (`userId`) becomes `String @db.ObjectId`, paired with an explicit `@relation(fields: [userId], references: [id], onDelete: Cascade)`.
- **Drop every `@@map("user")` / `@@map("session")` / … directive the CLI emits.** The existing `User` model has no `@@map`, so its collection is `User`; adding lowercase maps would point Better Auth at a different, empty collection and orphan the existing one. Keep the Prisma model names `User`, `Session`, `Account`, `Verification` so the adapter reaches them as `prisma.user`, `prisma.session`, `prisma.account`, `prisma.verification`.
- Keep the existing `createdAt DateTime @default(now())` / `updatedAt DateTime @updatedAt` convention on every model.

**`User` — modify in place, additively:**

```prisma
model User {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  email         String   @unique
  name          String
  emailVerified Boolean  @default(false)   // new — required by Better Auth
  image         String?                    // new — Google profile picture URL
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  expenses   Expense[]
  categories Category[]
  sessions   Session[]                     // new
  accounts   Account[]                     // new
}
```

`email` is already `@unique`, which is what Better Auth needs; `name` is already required, and Google always returns one. Do not relax either.

> **Verify before pushing:** `emailVerified` is a required field with a default. Prisma errors when reading an existing MongoDB document that lacks a required field, and `db push` does **not** backfill. Step 02 verified `prisma.user.count()` returned `0`; re-confirm the `User` collection is still empty before pushing. If it is not, that must be resolved deliberately — do not proceed and do not drop the collection.

**`Session`, `Account`, `Verification` — new models.** Take the exact field list from the CLI output for the installed version, then apply the adaptations above. The shape to expect (confirm, don't assume):

- **`Session`** — `expiresAt`, `token` (unique), `ipAddress?`, `userAgent?`, `userId` → `User` with `onDelete: Cascade`, plus timestamps.
- **`Account`** — `accountId`, `providerId` (and `issuer` on 1.7.x), `userId` → `User` with `onDelete: Cascade`, `accessToken?`, `refreshToken?`, `idToken?`, `accessTokenExpiresAt?`, `refreshTokenExpiresAt?`, `scope?`, `password?`, plus timestamps and the compound unique the CLI emits. **`password` stays nullable and is never written** — Google-only means no credential is ever stored; do not delete the field (the adapter expects it) and do not populate it.
- **`Verification`** — `identifier`, `value`, `expiresAt`, plus timestamps. Unused by the Google-only flow but required by the adapter; create it.

**Indexes.** Add `@@index([userId])` on both `Session` and `Account` — every lookup in the auth flow is by user or by token, and `token` is already unique. This follows the step-02 rule that user-owned models index on `userId`. Do not add indexes beyond these.

**Do not** add `passwordHash`, `role`, `banned`, `twoFactorEnabled`, or any other field no configured feature writes.

## components & ui

- **Create:**
  - `src/components/auth/google-sign-in-button.tsx` — `"use client"`. The only client component in this step. Renders the existing `Button` (variant `outline`, full width, `size="lg"`), the Google `g` mark as inline SVG, the label "Continue with Google", and owns the pending state (`disabled` + spinner) around the `authClient.signIn.social()` call. Props: an optional `callbackURL`. No business logic beyond the call.
  - `src/components/auth/sign-out-button.tsx` — `"use client"`. Calls `authClient.signOut()` then routes to `/`. Kept trivial; it exists so the flow is re-testable.

- **Modify:**
  - `src/app/sitemap.ts` — add the `/register` entry (public, indexable, lower priority than `/`). Required by the SEO rules in `CLAUDE.md`, which say the sitemap lists public indexable pages.
  - `prisma/schema.prisma` — as described above.

  Do **not** modify `SiteHeader`, `MobileNav`, `Hero`, `CtaSection`, `SiteFooter`, `layout.tsx`, `globals.css`, or `robots.ts`. The header/nav links already point at `/register` and become live for free; `robots.ts` already disallows `/api/` and `/dashboard`. Do not add a "signed in / signed out" state to the marketing header — that is a later step and would force the header to become dynamic.

- **Pages:**
  - `src/app/(auth)/register/page.tsx` — new. Server Component. Reads the session and redirects authenticated users to `/dashboard`; otherwise renders the card and embeds `GoogleSignInButton`. Reads `searchParams` for the OAuth error code and renders the mapped message. Exports `metadata`.
  - `src/app/(dashboard)/dashboard/page.tsx` — new, **placeholder**. Server Component. Reads the session server-side and `redirect()`s to `/register` when absent. Renders "Signed in as {name}" with the Google avatar and the sign-out control. This is not the dashboard feature — it is the landing target that makes registration verifiable, and the step that builds the real dashboard replaces its body. Exports `metadata` with `robots: { index: false }`.

Both route groups match the structure documented in `CLAUDE.md`. Neither needs its own `layout.tsx` in this step — do not add one.

**Responsive / a11y requirements for the register card:**

- Mobile-first: card is full-width with page padding under `sm`, capped around `max-w-sm` and vertically centred from `sm` up. The button is full-width at every breakpoint — a comfortable tap target on phones.
- One `<h1>` per page. Content sits in `<main>`. The Google mark is `aria-hidden` (the label carries the meaning), the spinner is `aria-hidden` with the pending state announced via `aria-busy` / `aria-disabled` on the button.
- The error message renders in a container with `role="status"` (or `aria-live="polite"`) so it is announced, and is visually distinguishable without relying on colour alone.
- Reuse the existing tokens (`bg-background`, `text-muted-foreground`, `border-border`, `rounded-lg`) and the existing `Button`. Do not introduce a new card component, a new colour, a new font, or a `motion` animation — `MotionProvider` is marketing-only and must not wrap these pages.

## Services & Business Logic

No `src/services/` in this step — there is still no business logic to hold. Registration is entirely the library's; the app contributes configuration and session reads, which are infrastructure, exactly as `src/lib/prisma.ts` is. Three new `src/lib/` modules:

- **`src/lib/auth.ts`** — the server-side Better Auth instance. Responsibilities: assert its required env vars are present (same fail-fast style as `prisma.ts`, naming the variable and never its value), wire `prismaAdapter(prisma, { provider: "mongodb" })` against the shared client from `src/lib/prisma.ts`, configure the Google social provider from env, set `advanced.database.generateId: false`, and set `trustedOrigins`. Marked `import "server-only"`. **Never imported by a Client Component.**
- **`src/lib/auth-client.ts`** — the browser client from `createAuthClient` (`better-auth/react`). Exports `signIn` / `signOut` for the two client components. Contains no secrets and no Prisma import.
- **`src/lib/auth-session.ts`** — `import "server-only"`. Exports `getSession()` (wrapped in React's `cache()` so multiple reads in one render pass hit the library once) and `requireSession()` (redirects to `/register` when absent). This is the Data Access Layer the Next.js authentication guide describes: **every** server-side consumer of identity in this step and every step after it goes through it, so the authenticated user id has exactly one origin. Later expense and analytics services take the user id from here — never from a request body, query string, route param, or header.

**`advanced.database.generateId: false` is load-bearing, not a preference.** Better Auth generates its own string ids by default. Those are not valid ObjectIds, so Prisma would reject every insert into a `@db.ObjectId` primary key — and more seriously, a non-ObjectId `User.id` would break the `Expense.userId` / `Category.userId` relations that step 02 already defined as `@db.ObjectId`. Setting it to `false` delegates id generation to MongoDB via `@default(auto())`, keeping every id in the database a real ObjectId and the step-02 conventions intact. Do not "fix" an id error by dropping `@db.ObjectId` from the auth models.

## Validation

**No Zod schemas are added in this step, and `src/lib/validations/` is not created.** This is a deliberate consequence of the Google-only constraint: there is no form, no request body, and no user-supplied field anywhere in the flow. `CLAUDE.md` requires Zod for user input; there is none to validate. Zod arrives with the first step that accepts a form submission (expense creation), which will validate amount, category, description, date, ids, and every query/filter/sort parameter server-side. Do not install it here on speculation.

The inputs that do exist, and how each is handled:

- **`callbackURL` / `errorCallbackURL`** — attacker-influenceable and the real risk on this page (open redirect). Handled by configuring `trustedOrigins` on the `auth` instance, which is the library's own guard. Only same-origin relative paths are passed from our code. Do not hand-roll a second redirect validator, and do not read a redirect target out of `searchParams` and pass it through unchecked.
- **`?error=` on `/register`** — a client-controlled string. Treated as an opaque key into a fixed map of known codes; anything unrecognised falls through to the generic message. It is **never** rendered into the page, used in a URL, or logged as trusted content.
- **Google's OAuth callback parameters** (`code`, `state`, PKCE verifier) — validated by Better Auth, including CSRF `state` checking. Do not intercept or re-implement.
- **Google profile fields** (`email`, `name`, `picture`) — trusted only insofar as Google asserts them, written by the adapter. `email` uniqueness is enforced by the database (`@unique`), not by an application read-then-write.

Environment configuration validated at startup, not at request time: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — each required and non-empty, asserted when `src/lib/auth.ts` loads, with a message naming the missing variable and never containing its value.

## Authorization & Data Ownership

This step creates the identity that every later authorization check depends on, and establishes the single path by which that identity is obtained.

**How authentication is enforced:**

- The session lives in an `HttpOnly`, `SameSite=Lax`, `Secure`-in-production cookie written by Better Auth, backed by a `Session` row. It is not readable by client JavaScript.
- Server-side identity is read **only** through `getSession()` / `requireSession()` in `src/lib/auth-session.ts`, which call `auth.api.getSession({ headers: await headers() })`.
- `/dashboard` performs its check in the Server Component itself, before rendering. There is no `proxy.ts` in this step and none is needed: the protected surface is one server-rendered page, and a server check at the data boundary is strictly stronger than an edge redirect. **If a later step adds one, the Next.js 16 file is `proxy.ts`, not `middleware.ts`** — `middleware.ts` is deprecated in this version, and it must only ever perform an optimistic cookie-presence check, never replace a server-side check.

**Never trusted, in this step or any step built on it:**

- `userId` from a request body, query parameter, route parameter, header, or form field.
- Client-side authentication or authorization state — a rendered "signed in" UI is a display detail, never a permission.
- Anything in `searchParams`, including `callbackURL` and `error`.

**Rules this step binds for everything after it:**

- The authenticated user id comes from `getSession()`/`requireSession()` and nowhere else.
- Every read, update, delete, and aggregation over `Expense` or `Category` must carry `userId: <session user id>` in its `where` clause, and must verify ownership in the same query (`where: { id, userId }`) rather than fetching then comparing.
- A record belonging to another user must be indistinguishable from one that does not exist — same generic "not found" response, never a message confirming another user's data.
- No Client Component may import `src/lib/auth.ts` or `src/lib/prisma.ts`.

Cross-user access is structurally impossible at this stage because no user-owned resource is readable yet — but `Session.userId` and `Account.userId` both cascade from `User`, so deleting a user removes their sessions and provider links along with their expenses and categories.

## Files to change

- `prisma/schema.prisma` — extend `User`; add `Session`, `Account`, `Verification`.
- `src/app/sitemap.ts` — add the `/register` entry.
- `package.json` — add `better-auth`.
- `pnpm-lock.yaml` — updated by `pnpm install`; keep consistent and commit.
- `.env.example` — document `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` with placeholder values only.
- `.env` — add the same four with real values. **Gitignored; never committed, never printed, never pasted into a commit message or a log.**

No change is needed to `next.config.ts`, `robots.ts`, `eslint.config.mjs`, `tsconfig.json`, `layout.tsx`, or `globals.css`. `pnpm-workspace.yaml` needs a new `allowBuilds` entry only if `pnpm install` reports a blocked build script for `better-auth` — check the install output rather than adding one pre-emptively.

## Files to create

- `src/lib/auth.ts`
- `src/lib/auth-client.ts`
- `src/lib/auth-session.ts`
- `src/app/api/auth/[...all]/route.ts`
- `src/app/(auth)/register/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/components/auth/google-sign-in-button.tsx`
- `src/components/auth/sign-out-button.tsx`

## New dependencies

One:

- **`better-auth`** — pin to **`1.7.3`** (current `latest`). Install with `pnpm add better-auth@1.7.3`.

Why this library, and why not something already installed: the project has no auth capability whatsoever — no session handling, no OAuth client, no cookie signing — so a dependency is unavoidable. `better-auth@1.7.3` declares peer support for `next@^16.0.0`, `react@^19.0.0`, and `prisma`/`@prisma/client@^6.0.0`, all of which match the installed versions exactly (`next@16.3.4`, `react@19.2.8`, Prisma `6.19.3`), and it is one of the libraries the installed Next.js 16 authentication guide lists. Its `prismaAdapter` accepts `provider: "mongodb"`, so Prisma stays the sole data-access layer per `CLAUDE.md`.

Explicitly rejected alternatives:

- **NextAuth / Auth.js v5** — still a beta release line; taking a beta as the foundation of every later feature is the larger risk.
- **Better Auth's `mongodbAdapter`** — it takes a raw `MongoClient` and would introduce a second data-access path alongside Prisma, contradicting `CLAUDE.md`. Use `prismaAdapter` with `provider: "mongodb"`. Do **not** add the `mongodb` driver package.

Not needed, and not to be installed: `zod` (nothing to validate — see _Validation_), `react-hook-form` (no form), `@better-auth/cli` as a dependency (invoke via `npx` once, for schema generation), `server-only` (Next.js provides it), and the `nextCookies()` plugin (it exists for setting cookies from Server Actions; this flow sets them in the Route Handler).

**External setup — required, and not code.** A Google Cloud OAuth 2.0 Client ID must exist with the authorized redirect URI `http://localhost:3000/api/auth/callback/google` for local development (and the production origin's equivalent before deploy). Without it, Google returns `redirect_uri_mismatch` and no amount of application-side debugging will help. `BETTER_AUTH_SECRET` should be a freshly generated random 32-byte value, not a memorable string.

## Rules for implementation

- Follow `CLAUDE.md` and `AGENTS.md`.
- Make the smallest clean change that fully solves the requested task.
- Do not implement features outside the requested scope.
- Do not refactor unrelated code.
- Do not remove existing functionality without explicit permission.
- Follow existing project conventions.
- Prefer Server Components.
- Use `"use client"` only when actually required — in this step, only the two auth buttons.
- Never access Prisma directly from Client Components.
- Keep business logic out of UI components.
- Put reusable business logic in services.
- Use Next.js Route Handlers for backend logic.
- Validate all server-side user input with Zod — there is none in this step; do not install Zod on speculation.
- Never trust client-provided `userId`.
- Enforce authentication server-side.
- Enforce authorization server-side.
- Verify ownership of user-owned resources.
- Use MongoDB through Prisma.
- Avoid raw MongoDB queries unless genuinely required — the raw `mongodbAdapter` is not required here.
- Use a shared Prisma client instance — `auth.ts` imports the existing one from `src/lib/prisma.ts`; never call `new PrismaClient()`.
- Avoid floating-point arithmetic for exact monetary values.
- Do not silently mix currencies.
- Never fetch unbounded expense lists.
- Use pagination for potentially large lists.
- Prefer server-side or database-side aggregation for analytics.
- Do not ship unnecessary raw data to the client — pass only `name` and `image` into the placeholder page's markup, never the whole session object.
- Return safe client-facing errors.
- Never expose Prisma/database/internal errors to users — OAuth failures render fixed copy; detail goes to the server log.
- Keep secrets server-side — `GOOGLE_CLIENT_SECRET` and `BETTER_AUTH_SECRET` are read only in `src/lib/auth.ts`, never `NEXT_PUBLIC_`-prefixed, never imported by a Client Component.
- Never hardcode credentials, keys, tokens, or secrets.
- Use Tailwind CSS for styling.
- Reuse existing shadcn/ui components and design patterns when appropriate — the existing `Button` and `globals.css` tokens.
- Keep all UI responsive across mobile, tablet, and desktop.
- Maintain accessibility.
- Avoid unnecessary client-side state and `useEffect` — the pending flag is the only client state; there is no `useEffect` in this step.
- Avoid unnecessary database queries and API requests — `getSession()` is memoized with React `cache()`.
- Do not add dependencies unless necessary.
- Check installed package versions before using APIs.
- Use Context7 for version-sensitive or unfamiliar APIs.
- Do not make destructive database changes without explicit permission — this step's `db push` is purely additive; `--force-reset` and any drop are forbidden.
- Do not modify configuration unless required.
- Do not modify unrelated files.

Step-specific constraints:

- **Read `node_modules/next/dist/docs/01-app/02-guides/authentication.md` before writing the session helpers.** This is not the Next.js in your training data: `middleware.ts` is deprecated and renamed to `proxy.ts` in Next.js 16, and `cookies()` / `headers()` are async. Any tutorial that says otherwise is describing an older version.
- **Do not hand-write the auth Prisma models from memory.** Generate them with the Better Auth CLI against the installed version, then hand-merge with the MongoDB adaptations. Field names differ between versions.
- Do not enable `emailAndPassword`, add a second social provider, or add a plugin. Google only.
- Do not add `@@map` directives to any auth model.
- Do not add `proxy.ts` or `middleware.ts`.
- Do not build `/login` in this step.
- Do not seed default categories at registration in this step — step 02 assigns that to the step that first creates expenses.
- Do not add sign-in/sign-out state to the marketing header.
- Verify the `User` collection is empty before `pnpm prisma db push`, because `emailVerified` is a new required field (see _Database changes_). If it is not empty, stop and ask.
- `src/lib/auth.ts` imports `PrismaClient` types from the generated output (`@/generated/prisma`), not `@prisma/client`. If the adapter's types object to the custom-output client, resolve it at the type level — do **not** switch to importing `@prisma/client` and do **not** silence it with `any`. Confirm with `pnpm build`.
- If a real credential ever reaches a file, a log line, or the terminal transcript, treat it as compromised and rotate it.

## Definition of done

1. `pnpm install` completes; `package.json` lists `better-auth@1.7.3` and `pnpm-lock.yaml` is consistent.
2. `pnpm prisma validate` passes with the extended `User` plus the `Session`, `Account`, and `Verification` models.
3. `pnpm prisma db push` reports the database in sync and creates the three new collections; `pnpm prisma generate` regenerates the client with the new types.
4. `pnpm lint` passes with no errors or warnings.
5. `pnpm build` succeeds, and the build output shows `/register` as a static/public route and `/dashboard` as dynamic.
6. `pnpm dev`, visiting `/` — "Get started" in the desktop header and in the mobile nav both navigate to `/register` (previously dead links).
7. `/register` renders the card with a single "Continue with Google" button, no email or password field anywhere on the page, and no form element.
8. `/register` is usable at 375px, 768px, and 1280px widths: no horizontal scroll, the button is full-width and comfortably tappable, and text does not overflow the card.
9. Keyboard only: `Tab` reaches the button, `Enter` activates it; the pending state is announced and the button cannot be activated twice.
10. Clicking the button redirects to Google's consent screen at `accounts.google.com`.
11. Approving consent returns to the app and lands on `/dashboard`, which shows the Google account's name.
12. In the database, exactly one new `User` document exists with the Google email, a real 24-character hex `_id`, `emailVerified` present, and `image` populated; one `Account` document links it to `providerId: "google"` with a **null/absent `password`**; one `Session` document exists with a matching `userId`.
13. The session cookie is present in DevTools with `HttpOnly` set, and `document.cookie` in the browser console does not reveal it.
14. Signing out from `/dashboard` returns to `/`; visiting `/dashboard` directly afterwards redirects to `/register`.
15. Visiting `/dashboard` in a private window with no session redirects to `/register` — verified with JavaScript disabled, proving the check is server-side.
16. Signing in again with the **same** Google account lands on `/dashboard` and creates **no** second `User` document — the original `_id` is unchanged.
17. Visiting `/register` while signed in redirects to `/dashboard` without showing the card.
18. Cancelling at Google's consent screen returns to `/register` with the neutral "cancelled" message and a working retry.
19. Temporarily setting an invalid `GOOGLE_CLIENT_SECRET` produces the generic failure message on `/register` — and the rendered page contains no secret, no redirect URI, no provider error body, and no stack trace. Restore the value afterwards.
20. Removing `BETTER_AUTH_SECRET` makes the server fail at startup with a message naming the variable and not containing any value.
21. `/register` page source has exactly one `<h1>`, a `<main>` landmark, and a `<title>` and meta description distinct from the homepage's; `/dashboard` emits `noindex`.
22. `curl -s localhost:3000/sitemap.xml` includes `/register` and does not include `/dashboard`; `/robots.txt` still disallows `/api/` and `/dashboard`.
23. Grepping the tracked tree finds no client id, client secret, auth secret, or connection string; `git status` shows no `.env` and no `src/generated/`.
24. `src/components/**` contains no import of `@/lib/auth` or `@/lib/prisma` from any file marked `"use client"`.
