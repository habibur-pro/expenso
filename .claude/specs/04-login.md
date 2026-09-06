# Spec: Login

## Overview

Step 03 shipped `/register` and, with it, a working Google OAuth flow: session cookie, `User`/`Account`/`Session` rows, and a server-side session reader. What it deliberately did not ship is a **sign-in surface**. Three places in the marketing chrome — `SiteHeader` (desktop), `MobileNav` (small screens), and `SiteFooter` — already render a "Log in" link pointing at `/login`, and all three are dead links today. This step makes them real: a public `/login` page whose only action is **"Continue with Google"**, plus the two small consequences of a login page existing — protected pages now bounce unauthenticated visitors to `/login` rather than `/register`, and the two auth pages cross-link to each other.

**Scope constraint (explicit):** login is **Google OAuth only**. There is no email/password sign-in, no password field, no "forgot password", no magic link, no second provider, and no credential of any kind stored or read. The login surface is one button. Better Auth's `emailAndPassword` block stays absent — it is disabled by default and enabling it is out of scope.

**A deliberate non-feature, named so it is not smuggled in.** With Google OAuth, sign-in and sign-up are the _same_ call: a visitor who has never used Expenso and clicks "Continue with Google" on `/login` gets an account created and lands on `/dashboard`. Better Auth 1.7.3 does expose `disableSignUp` / `disableImplicitSignUp` on the provider config to reject unknown accounts, but wiring that in would add a whole rejection path (a new error code, new copy, a redirect to `/register`) for no user benefit — it is the standard behaviour of every Google-only app. **Do not set `disableSignUp` or `disableImplicitSignUp` in this step.** `/login` and `/register` differ in copy and in nothing else.

Also out of scope: `proxy.ts` route protection, account linking, "remember me", session-length configuration, a real dashboard, sign-in state in the marketing header, and default-category seeding.

## Depends on

- **Step 01 — Homepage Design** (merged): the app scaffold, the `@/*` alias, `src/components/ui/button.tsx`, the design tokens in `globals.css`, `robots.ts` / `sitemap.ts`, and the three components that already link to `/login` — `SiteHeader`, `MobileNav`, `SiteFooter`.
- **Step 03 — Registration** (merged): everything this step reuses rather than rebuilds — `src/lib/auth.ts` (the configured Better Auth instance with the Google provider and `trustedOrigins`), `src/lib/auth-client.ts`, `src/lib/auth-session.ts` (`getSession` / `requireSession`), the `/api/auth/[...all]` catch-all handler, the `Session` / `Account` / `Verification` models, `GoogleSignInButton`, `SignOutButton`, and the `/register` page whose card chrome this step factors into a shared layout.
- **Step 02 — Database Connection and Schema** (merged): transitively, via step 03.

No expense, category, or analytics work depends on this step — step 03 already produces a session. This step exists to complete the auth surface and to fix three dead links.

## User flow

**Entry point.** "Log in" in the desktop `SiteHeader`, in the `MobileNav` panel, and in the `SiteFooter` — all three already point at `/login`. The page is also reachable directly, is publicly indexable, and is now the destination for anyone who hits a protected page without a session.

**Page state.** `/login` renders inside the shared auth card: the Expenso wordmark (linking home), a heading (**"Welcome back"**), one sentence of supporting copy that sets the expectation that Google is the only option, and a single full-width **Continue with Google** button carrying the Google mark. Below it, a line reading "Don't have an account? **Create one**" linking to `/register`, and a "Back to home" link. There is **no form**, therefore no fields, no client-side field validation, and no submit-disabled-until-valid behaviour.

**Already-signed-in.** `/login` is a Server Component that reads the session before rendering. If a valid session exists it `redirect()`s to `/dashboard` immediately — an authenticated user never sees the login card. This mirrors `/register`.

**User action.** Clicking the button calls `authClient.signIn.social({ provider: "google", callbackURL: "/dashboard", errorCallbackURL: "/login" })` and the browser is handed off to Google's consent screen.

**Loading behaviour.** The button enters its existing pending state on click — spinner replacing the Google mark, label unchanged, `disabled` set so a double-click cannot start two OAuth flows. Brief, because the redirect to Google follows, but it must exist.

**Success behaviour — returning user.** Google redirects to `/api/auth/callback/google`. Better Auth matches the existing `Account` row, writes a fresh `Session` row and the `HttpOnly` session cookie, and redirects to `/dashboard`, which greets the user by name. **No second `User` document is created and the original `_id` is unchanged.**

**Success behaviour — first-time visitor.** Identical, except the `User` and `Account` rows are created on the way through. See the Overview: this is intended.

**Error behaviour.** Every failure lands the user back on `/login` with a readable message above the button and the button ready to retry:

1. **User cancels at Google's consent screen** — Google returns `?error=access_denied`, which Better Auth's callback forwards to the `errorCallbackURL`. Message: neutral, not alarming — "Sign-in was cancelled. Try again when you're ready."
2. **No authorization code came back** — Better Auth emits `?error=no_code`. Same neutral cancel copy.
3. **OAuth exchange fails** (expired/invalid code, provider outage, misconfigured credentials, session write failure) — Better Auth emits codes such as `invalid_code`, `unable_to_get_user_info`, `email_not_found`, `state_mismatch`. Message: generic and safe — "We couldn't sign you in with Google. Please try again." The underlying detail goes to the server log only.
4. **JavaScript unavailable** — the button is a real `<button>`; with no JS it does nothing. Acceptable for this step, exactly as in step 03; do not build a no-JS fallback.

**Critical error-rendering rule.** Better Auth's `redirectOnError` appends **both** `error` and, when the provider supplied one, `error_description` to the callback URL (`api/routes/callback.mjs` in the installed package). `error_description` is provider- and attacker-influenced free text. **Never read, render, or interpolate `error_description`.** Only the `error` code is read, and only through an allowlist map — an unrecognised code renders the generic message, never the raw value.

**Empty / confirmation states.** None. Nothing is listed, and Google's consent screen is the confirmation.

**Navigation behaviour.** `/login` and `/register` cross-link in both directions. Both link back to `/`. Signing out from `/dashboard` returns to `/`; visiting `/dashboard` with no session now redirects to `/login` (previously `/register`).

## API Routes

**No API route changes.**

`GET, POST /api/auth/[...all]` — Better Auth's catch-all handler from step 03 — already serves OAuth initiation (`POST /api/auth/sign-in/social`), the Google callback (`/api/auth/callback/google`), session reads, and sign-out. **Access level: public**, necessarily, since unauthenticated users hit it to authenticate. Do not hand-write, wrap, extend, or add logic to it.

Do **not** create `/api/login`, `/api/session`, or any endpoint that returns the current user to the client. Session reads happen server-side through `auth.api.getSession()` via `src/lib/auth-session.ts`, never over HTTP from a Client Component.

Authorization requirements, restated for the one endpoint that exists:

- It establishes identity; it does not consume it. There is no user-owned resource behind it, so there is no ownership check to perform here.
- The authenticated user id is **only ever** derived server-side from the session cookie. No page, component, or route added in this step accepts, reads, or forwards a client-supplied `userId`.
- `trustedOrigins` is already configured on the `auth` instance and is the open-redirect guard for `callbackURL` / `errorCallbackURL`. Do not hand-roll a second check, and do not widen `trustedOrigins`.
- `robots.ts` already disallows `/api/`, so the handler stays out of the index with no change.

## Database changes

**No database changes.**

`prisma/schema.prisma` was verified against this feature: `User`, `Session`, `Account`, and `Verification` already exist with the fields Better Auth 1.7.3 needs, `Session.token` is `@unique`, and both `Session` and `Account` carry `@@index([userId])`. Signing in writes a new `Session` row through the existing adapter — no new model, field, relation, index, or constraint is required.

Therefore: do **not** run `prisma db push`, do **not** edit `prisma/schema.prisma`, and do **not** regenerate the client as part of this step. `Account.password` stays nullable and stays unwritten — Google-only means no credential is ever stored.

## components & ui

- **Create:**
  - `src/app/(auth)/layout.tsx` — Server Component. The shared chrome for the `(auth)` route group: the `<main>` landmark, the full-height centring, the two decorative blurred glows (`aria-hidden`), the bordered card container with its glow-behind, and the Expenso wordmark linking to `/`. Lifted verbatim from the current `/register` page — same Tailwind classes, same responsive padding (`p-6 sm:p-8`), same `max-w-sm`. Renders `{children}` below the wordmark. Type the props as `LayoutProps<"/">` to match the root layout's convention; if Next.js typegen does not emit a usable key for a route-group layout, fall back to `{ children: React.ReactNode }` — confirm with `pnpm build`, do not use `any`.
  - `src/app/(auth)/login/page.tsx` — Server Component. Redirects to `/dashboard` when a session exists, reads `error` from `searchParams`, and renders heading, supporting copy, the allowlisted error message, `<GoogleSignInButton callbackURL="/dashboard" errorCallbackURL="/login" />`, the "Create one" link to `/register`, and "Back to home". Exports `metadata` (see below).
  - `src/lib/auth-errors.ts` — the single allowlist mapping OAuth error codes to safe user-facing copy, shared by `/login` and `/register` so the two pages cannot drift. No `"server-only"` marker needed (it is a pure string map), but it must not import `@/lib/auth` or `@/lib/prisma`.

- **Modify:**
  - `src/app/(auth)/register/page.tsx` — remove the chrome now owned by the layout (the `<main>`, the glows, the card `<div>`, the wordmark) and the local `ERROR_MESSAGES` / `DEFAULT_ERROR_MESSAGE` constants, which move to `src/lib/auth-errors.ts`. Add the reciprocal "Already have an account? **Log in**" link to `/login`. Keep its `metadata` export, its signed-in redirect, its copy, and its `<h1>` exactly as they are apart from the shared cancel-message wording. **No other behavioural change.**
  - `src/components/auth/google-sign-in-button.tsx` — add an optional `errorCallbackURL?: string` prop defaulting to `"/register"` so `/register`'s behaviour is byte-for-byte unchanged, and pass it through to `signIn.social` in place of the current hard-coded `"/register"`. Nothing else in this file changes — not the pending state, not the SVG, not the markup.
  - `src/lib/auth-session.ts` — `requireSession()` redirects unauthenticated requests to `/login` instead of `/register`. This is the correct destination now that a login page exists, and it supersedes items 14 and 15 of step 03's Definition of Done. `getSession()` is untouched.
  - `src/app/sitemap.ts` — add the `/login` entry (public, indexable, `priority: 0.8`, `changeFrequency: "monthly"`), matching the shape of the existing `/register` entry.

- **Pages:** `src/app/(auth)/login/page.tsx` (new), `src/app/(auth)/register/page.tsx` (modified), `src/app/(auth)/layout.tsx` (new, wraps both). `src/app/(dashboard)/dashboard/page.tsx` is **not** edited — its redirect target changes via `requireSession()`.

**Metadata for `/login`.** Mirror `/register`'s existing pattern exactly: a static `metadata` export with `title: "Log in"` (the root layout's `%s | Expenso` template supplies the suffix), a description distinct from both `/` and `/register`, and `alternates: { canonical: "/login" }`. Open Graph and Twitter fields are inherited from the root layout together with `opengraph-image.tsx` / `twitter-image.tsx`; do **not** add page-level `openGraph` blocks to `/login` alone, which would leave `/register` inconsistent. `/login` is public, so it gets **no** `robots: { index: false }` — that stays on `/dashboard`.

UI considerations for every change above:

- **Mobile (375px):** no horizontal scroll; the card's `p-6` padding and `max-w-sm` width hold; the button is full-width and comfortably tappable; the heading and copy do not overflow.
- **Tablet (768px) / Desktop (1280px):** the card stays centred at `max-w-sm` with `sm:p-8`; the decorative glows stay clipped by `overflow-hidden` and never introduce scrollbars.
- **Loading state:** the existing spinner + `disabled` + `aria-busy` pending state on the button; no page-level skeleton (there is nothing to fetch).
- **Empty state:** none — nothing is listed.
- **Error state:** one `role="status" aria-live="polite"` region above the button, styled with the existing `border-destructive/30 bg-destructive/10 text-destructive` treatment already used on `/register`.
- **Accessibility:** exactly one `<h1>` per page ("Welcome back" on `/login`, "Create your account" on `/register` — the layout must **not** render an `<h1>`); `<main>` landmark supplied once by the layout; the Google mark stays `aria-hidden` with the accessible name coming from the button text; visible focus rings inherited from the existing `Button`; keyboard-reachable and `Enter`-activatable.
- **Design patterns:** reuse `src/components/ui/button.tsx` and the `globals.css` tokens only. Do not add a shadcn component, a new colour, a new font, or a new spacing scale.

## Services & Business Logic

**No service changes.**

There is no `src/services/` directory yet and this step does not create one. The only logic involved — "who is the current user?" — already lives in `src/lib/auth-session.ts`, which is the server-only identity module every future service will call. Signing in is entirely the auth library's business logic, reached through its own Route Handler.

`src/lib/auth-errors.ts` is a presentation-layer allowlist, not business logic, and correctly belongs in `lib/` rather than `services/`. It contains no branching beyond a map lookup with a fallback.

## Validation

There is exactly **one** user-controlled input in this step: the `error` query parameter on `/login` (and, unchanged, on `/register`).

| Input               | Source                                     | Type                              | Required | Constraint                                                                                                                                                                                |
| ------------------- | ------------------------------------------ | --------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`             | `searchParams` on `/login` and `/register` | `string \| string[] \| undefined` | optional | Must match a key in the `AUTH_ERROR_MESSAGES` allowlist; anything else — including an array, an empty string, or a 10KB attacker-supplied string — resolves to the single generic message |
| `error_description` | `searchParams`                             | —                                 | —        | **Never read.** Not destructured, not typed, not rendered                                                                                                                                 |

The allowlist map **is** the validation: an unrecognised value can only ever produce the fixed generic string, so no user-controlled text can reach the DOM. There are no ids, dates, amounts, filters, sort parameters, pagination parameters, or request bodies in this step to validate.

**Do not install Zod for this.** `CLAUDE.md` requires server-side Zod validation for user input, and Zod is the right tool the moment a request body or a filter/sort/pagination query arrives — which is the expense CRUD step, not this one. Adding a dependency to guard a single enum lookup that already fails closed contradicts the "don't add dependencies unless necessary" rule and step 03's precedent. If Zod is already a dependency by the time this is implemented, using `z.enum([...]).catch()` here is acceptable; installing it _for_ this is not.

Note also that `searchParams` in Next.js 16 is a `Promise` and must be awaited, and that a repeated query parameter yields an array — hence the `string | string[]` typing above. Handle the non-string case by falling through to the generic message.

## Authorization & Data Ownership

`/login` is a **public** page by definition — it must be reachable with no session. Its only authorization concern is the inverse: an _authenticated_ visitor is redirected away to `/dashboard`, decided server-side from the session cookie before any markup renders.

Enforcement rules for this step:

- Authentication state is read **only** through `src/lib/auth-session.ts`, which calls `auth.api.getSession({ headers: await headers() })`. No page or component reads a cookie, header, or token directly.
- `requireSession()` remains the single gate for protected pages, and it runs **server-side, before render**. Its redirect target changes to `/login`; its enforcement does not weaken. A visitor with JavaScript disabled and no session still cannot see `/dashboard`.
- **Never trust** a `userId` from a request body, a query parameter, a route parameter, or client-side state. Nothing in this step accepts one from anywhere.
- **Never trust** client-side authentication or authorization state. The redirect on `/login` is a server `redirect()`, not a `useEffect` check — a client-side guard would render the card to an authenticated user before bouncing them, and would be bypassable.
- No user-owned resource is read, written, or deleted in this step, so there is no ownership check to perform. When expenses and analytics arrive, every one of their reads, updates, deletes, and aggregations must scope to `session.user.id` from `getSession()` — and no user may ever reach another user's data.
- Secrets (`GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `DB_URI`) stay server-side in `src/lib/auth.ts` / `src/lib/prisma.ts`, are never `NEXT_PUBLIC_`-prefixed, and are never imported by a `"use client"` file.
- `src/components/**` must contain no import of `@/lib/auth`, `@/lib/auth-session`, or `@/lib/prisma` from any file marked `"use client"`.

## Files to change

- `src/app/(auth)/register/page.tsx` — strip the chrome moved into the layout, drop the local error map in favour of `@/lib/auth-errors`, add the "Log in" cross-link.
- `src/components/auth/google-sign-in-button.tsx` — add the optional `errorCallbackURL` prop (defaulting to `/register`) and pass it through.
- `src/lib/auth-session.ts` — `requireSession()` redirects to `/login`.
- `src/app/sitemap.ts` — add the `/login` entry.

No other file is touched. In particular: `prisma/schema.prisma`, `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/lib/prisma.ts`, `src/app/api/auth/[...all]/route.ts`, `src/app/robots.ts`, `src/app/layout.tsx`, `src/app/(dashboard)/dashboard/page.tsx`, `src/components/auth/sign-out-button.tsx`, `src/components/ui/button.tsx`, every file under `src/components/marketing/`, `package.json`, and every config file stay **unchanged**. The three "Log in" links in `SiteHeader`, `MobileNav`, and `SiteFooter` already point at `/login` and need no edit — they simply stop 404-ing.

## Files to create

- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/lib/auth-errors.ts`

## New dependencies

**No new dependencies.**

Everything required is installed: `better-auth@1.7.3` (whose `signIn.social` already accepts `callbackURL` and `errorCallbackURL` — verified against `socialSignInBodySchema` in the installed package), `next@16.3.4`, `react@19.2.8`, `lucide-react` for the spinner, and the existing `Button`. Explicitly **not** to be installed: `zod` (see _Validation_), `react-hook-form` (there is no form), any shadcn card/alert component (the existing markup and tokens cover it), and any second auth provider package.

Also **not** required: any change to `.env.example` or to the Google Cloud OAuth client. `/login` reuses the same `/api/auth/callback/google` redirect URI that step 03 already registered — a new page does not mean a new redirect URI.

## Rules for implementation

- Follow `CLAUDE.md` and `AGENTS.md`.
- Make the smallest clean change that fully solves the requested task.
- Do not implement features outside the requested scope.
- Do not refactor unrelated code — the layout extraction is in scope only because `/login` would otherwise duplicate ~50 lines of `/register`'s chrome; nothing beyond that chrome moves.
- Do not remove existing functionality without explicit permission — `/register` must behave identically after the extraction.
- Follow existing project conventions.
- Prefer Server Components — every file created in this step is one.
- Use `"use client"` only when actually required — no new Client Component is added; `GoogleSignInButton` is the only client code in the flow and it already exists.
- Never access Prisma directly from Client Components.
- Keep business logic out of UI components.
- Put reusable business logic in services — none applies here; see _Services_.
- Use Next.js Route Handlers for backend logic — the existing catch-all is the only one, and it is not modified.
- Validate all server-side user input with Zod — the sole input is the `error` query parameter, guarded by an allowlist; do not install Zod on speculation.
- Never trust client-provided `userId`.
- Enforce authentication server-side.
- Enforce authorization server-side.
- Verify ownership of user-owned resources.
- Use MongoDB through Prisma.
- Avoid raw MongoDB queries unless genuinely required.
- Use a shared Prisma client instance — never call `new PrismaClient()`.
- Avoid floating-point arithmetic for exact monetary values.
- Do not silently mix currencies.
- Never fetch unbounded expense lists.
- Use pagination for potentially large lists.
- Prefer server-side or database-side aggregation for analytics.
- Do not ship unnecessary raw data to the client — do not pass the session object into any component prop.
- Return safe client-facing errors.
- Never expose Prisma/database/internal errors to users.
- Keep secrets server-side.
- Never hardcode credentials, keys, tokens, or secrets.
- Use Tailwind CSS for styling.
- Reuse existing shadcn/ui components and design patterns — the existing `Button` and the `globals.css` tokens.
- Keep all UI responsive across mobile, tablet, and desktop.
- Maintain accessibility.
- Avoid unnecessary client-side state and `useEffect` — no new client state, and no `useEffect` anywhere in this step.
- Avoid unnecessary database queries and API requests — `getSession()` is already memoized with React `cache()`; call it once per page.
- Do not add dependencies unless necessary.
- Check installed package versions before using APIs.
- Use Context7 for version-sensitive or unfamiliar APIs.
- Do not make destructive database changes without explicit permission — this step makes **no** database changes at all; do not run `prisma db push`.
- Do not modify configuration unless required.
- Do not modify unrelated files.

Step-specific constraints:

- **This is not the Next.js in your training data.** `searchParams` is a `Promise` and must be awaited; `middleware.ts` is deprecated in favour of `proxy.ts` in Next.js 16 — and neither is added here. Read the relevant guide under `node_modules/next/dist/docs/` before reaching for a remembered API.
- **Do not set `disableSignUp` or `disableImplicitSignUp`** on the Google provider. See the Overview: `/login` creating an account for a first-time visitor is intended behaviour in this step.
- **Do not enable `emailAndPassword`**, add a password field, add a second social provider, add a Better Auth plugin, or touch `src/lib/auth.ts` at all.
- **Never render `error_description`** — or any other query parameter — from the URL. Only the `error` code is read, and only through the allowlist.
- Do not add `proxy.ts` or `middleware.ts`.
- Do not add sign-in/sign-out state to the marketing header, footer, or mobile nav.
- Do not edit `prisma/schema.prisma` or run any Prisma CLI command.
- The `(auth)` layout must not render an `<h1>` — each page owns its single `<h1>`.
- Keep `/register`'s `metadata`, canonical URL, and `<h1>` intact through the refactor; only the cancel-message wording may change, and only because the copy is now shared.
- If a real credential ever reaches a file, a log line, or the terminal transcript, treat it as compromised and rotate it.

## Definition of done

1. `pnpm lint` passes with no errors and no warnings.
2. `pnpm build` succeeds; the build output lists `/login` alongside `/register` as a public route and `/dashboard` as dynamic. (`package.json` defines no `typecheck` or `test` script — `lint` and `build` are the checks that exist.)
3. `git status` shows no change to `prisma/schema.prisma`, `package.json`, or `pnpm-lock.yaml`, and no `.env` or `src/generated/` in the diff.
4. `pnpm dev`, from `/`: "Log in" in the desktop header navigates to `/login` and renders the page — previously a 404.
5. At a viewport under 768px, opening the mobile nav and tapping "Log in" navigates to `/login`; the footer "Log in" link does the same.
6. `/login` renders one "Continue with Google" button, with **no** email field, **no** password field, **no** "forgot password" link, and no `<form>` element anywhere in the page source.
7. `/login` is usable at 375px, 768px, and 1280px: no horizontal scroll at any width, the button is full-width and comfortably tappable, and no text overflows the card.
8. `/login` and `/register` render visually identically apart from their heading, supporting copy, and cross-link — confirming the shared layout is in use and the chrome was not duplicated.
9. Keyboard only: `Tab` reaches the Google button, `Enter` activates it, the focus ring is visible, and the pending state prevents a second activation.
10. Clicking the button redirects to Google's consent screen at `accounts.google.com`.
11. Approving consent with an account that **already** signed up in step 03 lands on `/dashboard` showing that account's name; in the database the `User` count is unchanged and the original `_id` is unchanged, while a **new** `Session` document exists with a matching `userId`.
12. Visiting `/login` while signed in redirects to `/dashboard` without the card appearing.
13. Signing out from `/dashboard` returns to `/`; visiting `/dashboard` directly afterwards now redirects to **`/login`** (not `/register`).
14. Visiting `/dashboard` in a private window with JavaScript disabled and no session still redirects to `/login`, proving the check is server-side.
15. Cancelling at Google's consent screen from `/login` returns to **`/login`** — not `/register` — with the neutral cancel message and a working retry button.
16. Cancelling from `/register` still returns to `/register` with the neutral cancel message, confirming the new `errorCallbackURL` prop's default preserved step 03's behaviour.
17. Loading `/login?error=<a long unrecognised string>` renders the fixed generic message and does not echo any part of that string into the DOM; `/login?error=access_denied&error_description=<script>alert(1)</script>` renders the neutral cancel message and no trace of `error_description` appears in the page source.
18. Temporarily invalidating `GOOGLE_CLIENT_SECRET` produces the generic failure message on `/login`, and the rendered page contains no secret, no redirect URI, no provider error body, and no stack trace. Restore the value afterwards.
19. `/login` page source has exactly one `<h1>` ("Welcome back"), exactly one `<main>` landmark, and a `<title>` and meta description distinct from both `/` and `/register`. `/register` still has exactly one `<h1>` and one `<main>`.
20. `/login` links to `/register` and `/register` links to `/login`; both link back to `/`.
21. `curl -s localhost:3000/sitemap.xml` includes `/login` and `/register` and excludes `/dashboard`; `curl -s localhost:3000/robots.txt` still disallows `/api/` and `/dashboard`.
22. Grepping `src/app/(auth)/` for `"use client"` returns nothing — both auth pages and the layout are Server Components.
23. No file under `src/components/` that is marked `"use client"` imports `@/lib/auth`, `@/lib/auth-session`, or `@/lib/prisma`.
24. Grepping the tracked tree finds no client id, client secret, auth secret, or connection string.
