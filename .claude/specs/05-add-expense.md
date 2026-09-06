# Spec: Add Expense

> **Amendment (post-implementation):** two decisions below were superseded after this spec was first implemented and are now fixed project rules (see `CLAUDE.md`):
>
> 1. **Currency is BDT only**, not USD — every mention of `USD`/`"$"` below means `BDT`/`"৳"`. There is still no currency selector and `currency` is still never accepted from the client.
> 2. **The add-expense UI is a modal dialog opened from `/dashboard`**, not a standalone `/expenses/new` page. `POST /api/expenses` and the validation/service layer are unchanged; only the page-vs-dialog wrapping and the trigger location differ from the "components & ui" and "User flow" sections below.

## Overview

Give Expenso its first piece of real product value: a signed-in user can record an expense. This step ships a dedicated `/expenses/new` page with a form (amount, category, date, optional description), a `POST /api/expenses` Route Handler that authenticates the request, validates the body with Zod, verifies the referenced category belongs to the caller, and writes a row through Prisma. Steps 01–04 produced a marketing homepage, the `User`/`Category`/`Expense` schema, and Google sign-in — but nothing has ever written an `Expense`, and `src/services/`, `src/lib/validations/`, and `src/hooks/` do not exist yet. This step creates the first service, the first Zod schema, and the first non-auth API route, so the conventions it sets (money as integer minor units parsed without floating point, ownership enforced in the `where` clause, safe client-facing errors, business logic in services) are the ones every later expense/analytics step inherits.

It also discharges a dependency that steps 02, 03, and 04 all deferred to this one: **`Expense.categoryId` is required, and no category management UI exists**, so this step seeds a small fixed set of default categories for a user the first time they open the add-expense page. That seeding is deliberately the minimum needed to make the form usable — it is not category management.

Scope is exactly "add an expense". Editing, deleting, listing, searching, filtering, sorting, analytics, category CRUD, receipts, recurring expenses, and multi-currency support are all out of scope and must not be smuggled in.

## Depends on

- **Step 02 — Database Connection and Schema** (merged): supplies the `Expense` and `Category` models, the `amountMinor` money convention, the user-scoped indexes, and the shared server-only client at `src/lib/prisma.ts`. No schema change is needed here.
- **Step 03 — Registration** (merged) and **Step 04 — Login** (merged): supply the session this step depends on — `src/lib/auth.ts`, `src/lib/auth-session.ts` (`getSession`, `requireSession`), and an authenticated `/dashboard` to link from.

Nothing else. Note that the unmerged local `feature/dashboard` branch also touches `src/app/(dashboard)/dashboard/page.tsx`; this spec branches from `main` and makes only a one-element addition to that page, so keep the change there minimal to avoid a painful merge.

## User flow

**Entry point.** A signed-in user on `/dashboard` clicks **Add expense** and lands on `/expenses/new`. Visiting `/expenses/new` directly while signed out redirects to `/login` (server-side, via `requireSession`).

**Page load.** The page is a Server Component. It resolves the session, ensures the user has categories (seeding the default set on first visit only), loads that user's categories, and renders the form with the category `<select>` already populated and the date field pre-filled with today's date. There is no client-side fetch on mount and no loading spinner for the initial render — the categories arrive with the HTML.

**Form interactions.** Four controls, in this order:

1. **Amount** — required. Text input with `inputMode="decimal"`, prefixed with the currency symbol. Accepts up to two decimal places.
2. **Category** — required. Select listing the user's categories by `name`, alphabetically. No "create new category" option in this step.
3. **Date** — required. Native `<input type="date">`, defaulting to today.
4. **Description** — optional. Single-line text input, max 200 characters, with helper text marking it optional.

**Validation behaviour.** Validation runs on submit against the shared Zod schema, client-side first for instant feedback and again server-side as the real gate. Field errors render beneath their field, the field gets `aria-invalid="true"` and is wired to its message with `aria-describedby`, and focus moves to the first invalid field. Errors clear as the user edits the offending field. If the server rejects a body the client thought was valid (a stale category, say), the server's field errors are rendered the same way.

**Loading behaviour.** While the request is in flight the submit button is disabled, shows a `Loader2` spinner and `aria-busy="true"`, and the label reads "Adding…" — matching `GoogleSignInButton`. Double submission is prevented by the disabled state.

**Success behaviour.** On `201`, the form clears the amount and description, **keeps** the selected category and date so consecutive entries are fast on a phone, and shows a dismissible confirmation in a `role="status"` region: "Added $12.50 to Groceries." Focus returns to the amount field. A "Back to dashboard" link sits below the form for when the user is done.

**Error behaviour.** A failed request (network failure, `500`, or an unexpected status) shows a single safe message in a `role="alert"` region above the submit button — "We couldn't save that expense. Please try again." — with the form values preserved so nothing is retyped. A `401` means the session expired: show "Your session has expired. Please sign in again." and route to `/login`. No Prisma, MongoDB, or stack detail ever reaches the browser.

**Empty state.** If the user somehow has no categories after seeding (a seed failure), the form renders with the category select disabled and an explanatory message instead of a broken control; the submit button is disabled. This is a guard, not an expected path.

**Confirmation / navigation.** No confirmation dialog — adding an expense is non-destructive. The user stays on `/expenses/new` after a successful add; there is no expense list to redirect to yet.

## API Routes

- `POST /api/expenses` — create one expense for the authenticated user — **logged-in only**.

Requirements for this endpoint:

- **Server-side authentication:** resolve the session with `getSession()` from `src/lib/auth-session.ts` (which reads `headers()` server-side). No session → `401` with a generic body; do not redirect an API request.
- **Server-side user identification:** `userId` comes from `session.user.id` and nothing else.
- **No trust in client-provided `userId`:** the request body schema does not include `userId`, `currency`, `createdAt`, or `id`; any such key sent by the client is ignored, never merged into the Prisma `data`.
- **Server-side ownership verification:** the client-supplied `categoryId` is untrusted. Before writing, confirm the category belongs to the caller (`where: { id: categoryId, userId }`). A category that does not exist and a category owned by someone else must produce the **same** `404`-shaped response ("That category is no longer available."), never a message that reveals another user's record exists.

Response shape (set here as the convention for every later route):

- `201` → `{ "data": { "id": string, "amountMinor": number, "currency": string, "date": string, "categoryId": string, "categoryName": string, "description": string | null } }`
- `400` → `{ "error": { "message": string, "fields": { "<field>": string } } }` — field messages come from the Zod result, never from a raw `ZodError` dump.
- `401` → `{ "error": { "message": "You need to sign in to add an expense." } }`
- `404` → `{ "error": { "message": "That category is no longer available." } }`
- `500` → `{ "error": { "message": "Unable to add the expense. Please try again." } }` — the real cause goes to `console.error` on the server only.

A malformed JSON body is caught and answered as `400`, not allowed to throw. Keep the response helper inline in the route for now; extract a shared helper when a second route needs it, not before.

No other route is added or modified. There is no `GET /api/expenses` in this step (nothing lists expenses yet) and no `GET /api/categories` (the page reads categories server-side through the service).

## Database changes

**No database changes.** `prisma/schema.prisma` already defines everything this feature needs:

- `Expense` with `userId`, `categoryId`, `amountMinor Int`, `currency String @default("USD")`, `description String?`, `date DateTime`, and the `[userId, date]` / `[userId, categoryId, date]` / `[userId, createdAt]` indexes.
- `Category` with `@@unique([userId, slug])`, which is what makes the default-category seed safe to run concurrently.

Do not add fields (no `note`, `tags`, `paymentMethod`, `receiptUrl`, `isRecurring`), do not relax `onDelete: Restrict`, do not add a `Currency` model, and do not run `prisma db push` — nothing to push. `pnpm prisma generate` has already produced the client in `src/generated/prisma`; re-run it only if the generated client is missing.

## components & ui

**Create:**

- `src/components/expenses/expense-form.tsx` — `"use client"`. The add-expense form: four fields, client-side Zod validation, `fetch("/api/expenses", { method: "POST" })`, pending/success/error states. Receives `categories: { id: string; name: string }[]` and `currency: string` as props from the server page; it never touches Prisma and holds no business logic beyond form state and the request call.
- `src/components/ui/input.tsx`, `src/components/ui/label.tsx`, `src/components/ui/select.tsx` — added with the shadcn CLI (`pnpm dlx shadcn@latest add input label select`) so they match the configured `base-nova` style and the existing `@base-ui/react` + `cva` + `cn` conventions in `button.tsx`. If a component is unavailable in that style, hand-write a minimal equivalent following `button.tsx` — do not import a different UI library and do not restyle `button.tsx`.

**Modify:**

- `src/app/(dashboard)/dashboard/page.tsx` — add one **Add expense** link styled as a button (`Link` + `buttonVariants`, or `Button render={<Link/>}` per the base-ui `Button` API) pointing at `/expenses/new`, placed beside the existing sign-out control. Nothing else on this page changes.

**Pages:**

- `src/app/(dashboard)/expenses/new/page.tsx` — new Server Component page. Calls `requireSession()`, `ensureDefaultCategories(userId)`, `listCategories(userId)`, and renders `<ExpenseForm />`. Exports `metadata` with a distinct `title` ("Add expense") and `robots: { index: false }`, matching the dashboard page — this is a private route and must stay out of the index. One `<h1>` ("Add expense"), content inside `<main>`.

Per-breakpoint and state requirements:

- **Mobile (default):** single-column stack, full-width fields with comfortable touch targets, full-width submit button, form inside a bordered card with `px-4 py-8`. `inputMode="decimal"` so the numeric keypad opens.
- **Tablet (`sm:`):** centred card capped around `max-w-md`, roomier padding, submit button may sit inline-end.
- **Desktop (`md:`/`lg:`):** same centred card — do not stretch the form to full viewport width. Amount and date may sit side by side on a two-column row.
- **Loading state:** disabled + spinner submit button, described above. No skeleton is needed for the initial render since categories are server-rendered.
- **Empty state:** the no-categories guard described in _User flow_.
- **Error state:** `role="alert"` form-level message; per-field messages tied to inputs with `aria-describedby`.
- **Accessibility:** every control has a real `<label htmlFor>`; required fields marked with `required` and visible "Required"/"Optional" cues rather than colour alone; `aria-invalid` on failed fields; status and alert live regions; visible focus rings inherited from the existing token-based styles; keyboard-only completion must work end to end.
- **Design reuse:** reuse the card/border/`bg-background`/`border-border` pattern from `src/app/(auth)/layout.tsx` and the dashboard card, the design tokens in `globals.css`, and `lucide-react` icons. No new design system, no new colour values, no unrelated UI changes.

## Services & Business Logic

**Create:**

- `src/services/categories.ts` — server-only (`import "server-only"`).
  - `ensureDefaultCategories(userId: string)` — idempotent. Counts the user's categories; if zero, inserts the default set from `src/lib/constants/categories.ts` with server-derived slugs. Because `@@unique([userId, slug])` exists, a duplicate insert from a concurrent request must be caught (Prisma `P2002`) and treated as success, not surfaced as an error. Returns nothing meaningful; callers re-read.
  - `listCategories(userId: string)` — returns `{ id, name }[]` for that user, ordered by `name`, selected (not `include`d) so no extra fields ship to the client, and bounded with a `take` limit.
- `src/services/expenses.ts` — server-only.
  - `createExpense(input: { userId: string; categoryId: string; amountMinor: number; currency: string; date: Date; description?: string | null })` — verifies the category belongs to `userId` and returns a discriminated result (e.g. `{ ok: false, reason: "category_not_found" }` vs `{ ok: true, expense }`) so the route maps outcomes to status codes without parsing Prisma errors. Performs the create with `userId` from the argument only. Selects just the fields the response needs, including `category: { select: { name: true } }`.

**Create (helpers, not services):**

- `src/lib/utils/money.ts` — `toMinorUnits(amount: string): number` (string-based, no floating-point arithmetic: split on `.`, right-pad the fraction to two digits, combine as integers) and `formatMoney(amountMinor: number, currency: string): string` for the success message via `Intl.NumberFormat`. Shared by validation and UI; contains no `server-only` import.
- `src/lib/constants/categories.ts` — `DEFAULT_CATEGORY_NAMES` (a short fixed list, e.g. Groceries, Dining, Transport, Housing, Utilities, Health, Entertainment, Shopping, Other) and a `toCategorySlug(name)` helper (trim → lowercase → kebab-case) matching the slug rule set in step 02.

The route handler contains no business logic beyond authenticate → validate → call service → map result to response. The client component contains no business logic beyond form state and the `fetch`.

## Validation

All of the following is validated **server-side** with Zod in `src/lib/validations/expense.ts`, and the same schema is imported by the client form for pre-submit feedback. The module must stay free of `server-only` imports so both sides can use it.

`createExpenseSchema` — strict object (unknown keys stripped or rejected; never passed through to Prisma):

- **`amount`** — required, `string` (the raw form value, kept as a string so no float ever touches the money path). Trimmed, non-empty, must match `^\d{1,9}(\.\d{1,2})?$`, must be greater than zero, and must not exceed a sane ceiling (e.g. `999,999,999.99`). Transformed to an integer `amountMinor` via `toMinorUnits`. Messages: "Enter an amount.", "Enter a valid amount, like 12.50.", "Amount must be greater than 0."
- **`categoryId`** — required, `string`, must match a 24-character hex ObjectId (`/^[0-9a-fA-F]{24}$/`). Zod can only prove it is well-formed; existence and ownership are the database check described under _Authorization_.
- **`date`** — required, `string` in `YYYY-MM-DD` (`z.iso.date()`). Converted server-side to UTC midnight of that calendar date. Rejected if before `2000-01-01` or more than one day after the current UTC date (the one-day slack tolerates users ahead of UTC; a genuinely future-dated expense is not allowed).
- **`description`** — optional, `string`, trimmed, max 200 characters; an empty string normalises to `null` rather than being stored as `""`.
- **`currency`** — **not accepted from the client.** The server uses the schema default (`"USD"`) for every expense. Currencies are never mixed and no currency selector exists in this step.
- **`userId` / `id` / `createdAt` / `updatedAt`** — never accepted from the client under any circumstance.

No query parameters, filters, sort parameters, or pagination inputs exist in this step (there is no list endpoint yet); when they arrive they get the same treatment.

Client-side validation is a convenience only — the route must revalidate every field and must not assume the client checked anything.

## Authorization & Data Ownership

- `/expenses/new` calls `requireSession()`, which redirects unauthenticated visitors to `/login` before any data is read. The page also sets `robots: { index: false }`; `src/app/robots.ts` already disallows `/expenses` (alongside `/api/`, `/dashboard`, `/analytics`), so no robots change is needed.
- `POST /api/expenses` calls `getSession()` and returns `401` when there is none. It never redirects, never reads a `userId` from the body, query string, route params, headers, or a cookie it manages itself, and never accepts a client claim about who the user is.
- The authenticated `userId` is the only source of ownership: `prisma.expense.create({ data: { userId: session.user.id, ... } })`.
- **The client-supplied `categoryId` is untrusted.** Ownership is verified in the query itself — `prisma.category.findFirst({ where: { id: categoryId, userId } })` (or an equivalent user-scoped lookup) — never by fetching the category and comparing fields in application code afterwards.
- A category belonging to another user and a category that does not exist are indistinguishable in the response: same status, same message. No enumeration signal.
- `ensureDefaultCategories` and `listCategories` are both scoped by `userId`; neither ever reads or writes a row without it.
- Client-side authorization is never sufficient: hiding the form or disabling a control changes nothing about what the route accepts.

## Files to change

- `src/app/(dashboard)/dashboard/page.tsx` — add the "Add expense" link.
- `package.json` — add the `zod` dependency.
- `pnpm-lock.yaml` — lockfile update from that install.

## Files to create

- `src/app/(dashboard)/expenses/new/page.tsx`
- `src/app/api/expenses/route.ts`
- `src/components/expenses/expense-form.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/select.tsx`
- `src/lib/validations/expense.ts`
- `src/lib/constants/categories.ts`
- `src/lib/utils/money.ts`
- `src/services/categories.ts`
- `src/services/expenses.ts`

## New dependencies

- **`zod`** (latest v4) — required. `CLAUDE.md` mandates server-side Zod validation, this is the first step with user input, and nothing installed can replace it (`better-auth` bundles a validator but it is not a public API to build on). Steps 02–04 explicitly deferred installing it to this step. Install with `pnpm add zod`, then confirm the installed major before writing schemas — v4 exposes `z.iso.date()` and a different error surface (`error.issues`, `z.treeifyError`) from v3; use Context7 for anything version-sensitive.

No other package. **Do not** add React Hook Form (four fields do not justify it), a date-picker library (the native `<input type="date">` is sufficient and better on mobile), a money library, or a currency-formatting package (`Intl.NumberFormat` is built in). The shadcn CLI additions are source files, not runtime dependencies — check that `pnpm dlx shadcn add` did not pull in anything new beyond the already-installed `@base-ui/react`, and revert what it adds if it did.

## Rules for implementation

- Follow `CLAUDE.md` and `AGENTS.md`. `AGENTS.md` applies literally: this is Next.js 16.3.4, so read the relevant guide under `node_modules/next/dist/docs/` before writing route-handler or page code rather than relying on remembered APIs.
- Make the smallest clean change that fully solves the requested task.
- Do not implement features outside the requested scope — no list, edit, delete, search, filter, sort, analytics, or category management.
- Do not refactor unrelated code.
- Do not remove existing functionality without explicit permission.
- Follow existing project conventions (file headers, comment style, `cn` from `"cn"`, `lucide-react` icons, token-based Tailwind classes).
- Prefer Server Components; use `"use client"` only where actually required — here, only `expense-form.tsx`.
- Never access Prisma directly from Client Components.
- Keep business logic out of UI components; put reusable business logic in services.
- Use Next.js Route Handlers for backend logic — no separate backend, and no Server Actions in place of the specified route.
- Validate all server-side user input with Zod; never rely on the client's validation.
- Never trust client-provided `userId`; enforce authentication and authorization server-side; verify ownership of user-owned resources in the query's `where` clause.
- Use MongoDB through Prisma via the shared client at `src/lib/prisma.ts`; avoid raw MongoDB queries.
- Avoid floating-point arithmetic for exact monetary values — parse the amount string to integer minor units; `parseFloat`/`Number(amount) * 100` is not acceptable.
- Do not silently mix currencies; the server fixes `currency` to the schema default.
- Never fetch unbounded lists; bound the category read even though it is small.
- Prefer server-side/database-side work; do not ship raw data to the client that the page does not render.
- Return safe client-facing errors; never expose Prisma, MongoDB, or internal error text to users — log the detail with `console.error` server-side.
- Keep secrets server-side; never hardcode credentials, keys, tokens, or secrets; no new environment variables are needed.
- Use Tailwind CSS; reuse existing shadcn/ui components and design patterns; keep the UI responsive across mobile, tablet, and desktop; maintain accessibility.
- Avoid unnecessary client-side state and `useEffect` — no effect is needed to load categories, set the default date, or reset the form.
- Avoid unnecessary database queries and API requests.
- Do not add dependencies beyond `zod`; check installed package versions before using APIs; use Context7 for version-sensitive or unfamiliar APIs.
- Do not make destructive database changes; this step needs no `db push` at all.
- Do not modify configuration (`next.config.ts`, `tsconfig.json`, `components.json`, ESLint) unless genuinely required.
- Do not modify unrelated files — in particular, leave the marketing components and auth pages alone.

## Definition of done

Verified by running the app (`pnpm dev`) against the real database:

1. `pnpm add zod` completes; `package.json` and `pnpm-lock.yaml` are consistent and no other dependency was added.
2. Signed out, visiting `/expenses/new` redirects to `/login`.
3. Signed in, `/dashboard` shows an **Add expense** control that navigates to `/expenses/new`.
4. On first visit as a brand-new user, the category select is populated with the default categories, and the `Category` collection contains exactly those rows for that user — with correct kebab-case slugs and the right `userId`.
5. Reloading `/expenses/new` does **not** create duplicate categories (the count stays the same).
6. Submitting amount `12.50`, a category, today's date, and a description creates one `Expense` with `amountMinor: 1250` (not `1250.0000001`, not `12.5`), `currency: "USD"`, `date` at UTC midnight, the signed-in user's `userId`, and the chosen `categoryId`.
7. Submitting `0`, a negative amount, `1.234`, `abc`, or an empty amount is rejected with a field-level message and no row is written.
8. Submitting an empty description stores `null`, not `""`; a 201-character description is rejected.
9. A future date (beyond the one-day tolerance) and a date before 2000-01-01 are both rejected server-side.
10. Success shows the confirmation ("Added $12.50 to Groceries"), clears amount and description, keeps category and date, and returns focus to the amount field.
11. `curl -X POST /api/expenses` with no session cookie returns `401` and writes nothing.
12. Posting a valid body with `userId` set to another user's id creates the expense for the **authenticated** user, never the injected one.
13. Posting a `categoryId` that belongs to a different user returns the same `404` and message as a `categoryId` that does not exist, and writes nothing.
14. Posting malformed JSON returns `400`, not a `500` or an unhandled exception.
15. Forcing a server failure returns the generic message; no Prisma/MongoDB text, field names, or stack trace appears in the response body or browser console.
16. The form is fully usable at 375px, 768px, and 1280px widths — no horizontal scroll, no cramped controls, no full-width sprawl on desktop — and completable with the keyboard alone; labels, `aria-invalid`, and the status/alert regions behave as specified.
17. `pnpm lint` passes and `pnpm exec tsc --noEmit` reports no errors.
