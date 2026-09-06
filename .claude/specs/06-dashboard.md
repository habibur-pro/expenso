# Spec: Dashboard

## Overview

Turn `/dashboard` from a placeholder card into the real home of the signed-in app. Step 05 made it possible to record an expense, but nothing in the product ever reads those rows back — a user can add ten expenses and the page still shows nothing but their name, an **Add expense** button, and **Sign out**. This step ships two things: an **app shell** for the `(dashboard)` route group (a header with the Expenso wordmark, the signed-in user's identity, and sign-out, wrapping every future authenticated page), and a **dashboard overview** that answers "how am I doing this month?" from the user's own data — this month's total, how that compares to last month, how many expenses were logged, the daily average, the top spending categories, and the five most recent expenses. Every number is computed database-side through Prisma aggregation, scoped to the authenticated user, and rendered on the server.

Scope is exactly "the dashboard overview page and the shell it lives in". Explicitly **out of scope and not to be smuggled in**: charts and a charting dependency (that belongs to the later analytics step), a full expense history/list page with search, filter, sort, or pagination, editing or deleting expenses, category management, date-range or month pickers, budgets, exports, and multi-currency support. The only interactive control on the page is the existing add-expense dialog.

## Depends on

- **Step 02 — Database Connection and Schema** (merged): the `Expense` and `Category` models, `amountMinor` as integer minor units, the shared server-only client at `src/lib/prisma.ts`, and the `@@index([userId, date])` / `@@index([userId, categoryId, date])` indexes this step's aggregations rely on. No schema change is needed.
- **Step 03 — Registration** and **Step 04 — Login** (merged): `src/lib/auth.ts`, `src/lib/auth-session.ts` (`getSession`, `requireSession`), and the redirect-to-`/login` behaviour the shell and page inherit.
- **Step 05 — Add Expense** (merged): the only writer of `Expense` rows, and therefore the only source of the data this page displays. Supplies `AddExpenseDialog`, `ExpenseForm`, `ensureDefaultCategories` / `listCategories`, `CURRENCY` (`"BDT"`), and `formatMoney` in `src/lib/utils/money.ts`. Without it the dashboard has nothing to show but its empty state.

Nothing in this step blocks a later expense-history or analytics step; it deliberately leaves the list/filter/chart surface unbuilt.

## User flow

**Entry point.** A signed-in user lands on `/dashboard` after Google sign-in (`callbackURL: "/dashboard"`), or navigates to it directly. Visiting it signed out redirects to `/login`, server-side, via `requireSession()` — unchanged from today.

**Shell.** Every page in the `(dashboard)` group renders inside a new layout: a sticky top header with the Expenso wordmark on the left (linking to `/dashboard`) and, on the right, the user's Google avatar, their name, and the existing **Sign out** button. On mobile the name is hidden and only the avatar and sign-out control remain, so the header never wraps or scrolls horizontally. Below the header, a `<main>` element with a centred `max-w-6xl` container and responsive padding matching the marketing `SiteHeader`.

**Page load.** `/dashboard` is a Server Component. It resolves the session, ensures the user's default categories exist (existing behaviour from step 05 — do not remove it), loads the categories for the add-expense dialog, and loads the dashboard summary in a single service call. All numbers arrive with the HTML; there is no client-side fetch, no `useEffect`, and no loading spinner for the initial render.

**Loading behaviour.** A `loading.tsx` for the dashboard segment renders a skeleton of the same layout — a header row, four stat card placeholders, and two panel placeholders — so a slow database round-trip shows structure instead of a blank screen. The skeleton uses `animate-pulse` with `bg-muted` blocks; it must not shift layout when the real content replaces it.

**Page content, in order.**

1. **Page header** — a single `<h1>` reading "Dashboard", a line of muted supporting copy naming the current month ("Your spending in March 2026"), and the **Add expense** trigger. On mobile the trigger sits below the heading, full width; from `sm` up it sits on the same row, right-aligned.
2. **Stat cards** — four cards in a responsive grid (1 column on mobile, 2 from `sm`, 4 from `lg`):
   - **This month** — total spent in the current calendar month, formatted in BDT.
   - **Last month** — last month's total, with the change against it as a signed percentage and an up/down icon. Spending _more_ than last month is not an error state, so use muted/foreground colours with the arrow carrying the direction — do not colour it `destructive`.
   - **Expenses** — the count of expenses logged this month.
   - **Daily average** — this month's total divided by the number of days elapsed so far this month.
3. **Top categories** — a panel listing up to five categories by this month's spend, each row showing the category name, the amount, its share of the month as a percentage, and a proportional bar.
4. **Recent expenses** — a panel listing the five most recent expenses (any month), each row showing the category name, the description when present, the date, and the amount. A muted note under the list states that only the five most recent are shown; **do not** add a "View all" link — there is no history page yet and dead links are not acceptable.

**Empty states.** Three distinct cases, all of which must be handled:

- **No expenses at all.** Instead of the stat cards and panels, render one centred panel: a wallet icon, "No expenses yet", a sentence explaining that adding the first expense starts the summary, and the **Add expense** trigger. Nothing shows `৳0.00` in this case.
- **Expenses exist, but none this month.** The stat cards render with `৳0.00`, a count of `0`, and a `৳0.00` daily average; the "Last month" card still shows last month's real total. The top-categories panel shows "No spending recorded this month." The recent-expenses panel still lists the user's most recent expenses from earlier months.
- **Nothing spent last month.** The change percentage is undefined rather than infinite: show "No spending last month" instead of a percentage. Never render `Infinity%`, `NaN%`, or a division by zero.

**Success / refresh behaviour.** Adding an expense from the dialog must update the page. `ExpenseForm` currently does not refresh the router on success, so the new totals would not appear until a manual reload — this step adds a `router.refresh()` after a successful `201` so the server re-renders the dashboard with the new row included. The existing success behaviour (confirmation message, cleared amount and description, retained category and date, focus back to amount) must be preserved exactly.

**Error behaviour.** If the summary query fails, the error surfaces through Next.js's error boundary; the user never sees a Prisma or MongoDB message. Technical detail goes to the server log via `console.error`, matching the API routes from step 05.

**Navigation behaviour.** The wordmark links to `/dashboard`. Sign out returns to `/` as it does today. No other navigation is added — the header contains no nav link list, because `/dashboard` is the only authenticated route that exists.

## API Routes

**No API route changes.**

The dashboard is server-rendered: the page calls the service directly from a Server Component, so no HTTP endpoint is involved and none must be created. Specifically, **do not** add `GET /api/dashboard`, `GET /api/expenses`, or `GET /api/summary` in this step — that would ship data to the client only to render it there, and would add an endpoint with no consumer.

`POST /api/expenses` and `POST /api/categories` (step 05) are unchanged. Both already authenticate server-side via `getSession()`, derive `userId` from the session only, and verify category ownership in the `where` clause; nothing in this step alters, wraps, or extends them.

## Database changes

**No database changes.**

Verified against the current `prisma/schema.prisma`:

- The current-month and previous-month totals filter on `userId` + `date` range — served by `@@index([userId, date])`.
- The per-category grouping filters on `userId` + `date` and groups by `categoryId` — served by `@@index([userId, categoryId, date])`.
- Recent expenses order by `date` descending, scoped to `userId` — served by `@@index([userId, date])`.
- Category names are read by `id` (primary key) scoped to `userId`.

No new model, field, relation, index, or constraint is required. Therefore: do **not** edit `prisma/schema.prisma`, do **not** run `prisma db push`, and do **not** regenerate the client as part of this step.

## components & ui

- **Create:**
  - `src/app/(dashboard)/layout.tsx` — Server Component. The shell for the `(dashboard)` route group: sticky header + `<main>` container. Resolves the session with `requireSession()` and passes `name` / `image` to the header. Type the props as `LayoutProps<"/dashboard">` if Next.js typegen emits a usable key for the route-group layout; otherwise fall back to `{ children: React.ReactNode }`, matching `src/app/(auth)/layout.tsx`. Never use `any`.
  - `src/components/dashboard/dashboard-header.tsx` — Server Component. The header bar: `Wallet` icon + "Expenso" wordmark linking to `/dashboard` (reusing the exact wordmark markup from `SiteHeader`), the user's avatar (`<img>` with `alt=""` and the same eslint-disable comment used today for external Google avatars, plus a fallback initial when `image` is null), the user's name (`hidden sm:inline`), and `<SignOutButton />`. Sticky, `h-16`, `border-b`, `bg-background/80 backdrop-blur-xl` — same treatment as the marketing header.
  - `src/components/dashboard/stat-card.tsx` — Server Component, presentational. One labelled statistic: a muted uppercase label, a large value, and optional supporting text/icon slot. Used four times. Plain Tailwind on a bordered `bg-card` container — do **not** install a new shadcn `card` primitive for this.
  - `src/components/dashboard/top-categories.tsx` — Server Component. Renders the top-category rows with their share bars, or the "no spending this month" empty message. The bar width is the one place an inline `style` is justified (a dynamic percentage cannot be a static Tailwind class); mark the bar `aria-hidden` and keep the percentage in text so screen readers get the value.
  - `src/components/dashboard/recent-expenses.tsx` — Server Component. Renders the five most recent expenses as a semantic list, or an empty message. Category name and date on the left, amount right-aligned and `tabular-nums`; the description is truncated with `truncate` rather than wrapped, so a long description cannot break the row on mobile.
  - `src/app/(dashboard)/dashboard/loading.tsx` — the skeleton described in the User flow.
  - `src/services/dashboard.ts` — see **Services & Business Logic**.
  - `src/lib/utils/date-range.ts` — UTC month-boundary and date-formatting helpers (see below).

- **Modify:**
  - `src/app/(dashboard)/dashboard/page.tsx` — replaced with the overview described above. Keeps `metadata` (`title: "Dashboard"`, `robots: { index: false }`), keeps `requireSession()`, keeps the `ensureDefaultCategories` + `listCategories` calls that feed `AddExpenseDialog`, and drops the centred single-card layout, the inline avatar, and the inline `SignOutButton` (both now live in the shell header — this is a move, not a removal of functionality).
  - `src/components/expenses/expense-form.tsx` — add `router.refresh()` on a successful `201` so the dashboard re-renders with the new expense. `useRouter` is already imported. Change nothing else in this file.

- **Pages:** `/dashboard` (`src/app/(dashboard)/dashboard/page.tsx`) and the new `(dashboard)` layout wrapping it. No other route is touched. `src/app/robots.ts` already disallows `/dashboard`, and the page already sets `robots: { index: false }` — no SEO work is needed for this private surface.

**Responsive requirements.** 375px: single-column stat cards, full-width add-expense trigger, header showing avatar + sign-out only, no horizontal scroll anywhere. 768px: two-column stat grid, panels stacked full width. 1280px: four-column stat grid, the two panels side by side in a two-column grid. Amounts use `tabular-nums` so columns align.

**Accessibility.** Exactly one `<h1>` ("Dashboard"); each panel carries an `<h2>`. The stat cards are a `<ul>`/`<li>` or a plain grid of `<div>`s — not a table. Recent expenses and top categories are lists. The avatar is decorative (`alt=""`) because the name is adjacent; when the name is visually hidden on mobile it stays available to screen readers. Colour is never the sole carrier of meaning in the month-over-month indicator — the arrow icon plus the signed number carries it, and the icon is `aria-hidden` with the direction stated in the text.

## Services & Business Logic

**Create `src/services/dashboard.ts`** — `server-only`, the single owner of every dashboard read. Exports one function:

`getDashboardSummary(userId: string)` returning the shape the page renders:

- `month`: `{ totalMinor, expenseCount, dailyAverageMinor }` for the current calendar month.
- `previousMonth`: `{ totalMinor }`.
- `changePercent`: `number | null` — `null` when last month's total is `0`.
- `topCategories`: at most five `{ id, name, totalMinor, sharePercent }`, highest first.
- `recentExpenses`: at most five `{ id, amountMinor, date, description, categoryName }`, most recent first.
- `hasAnyExpenses`: `boolean`.

Implementation constraints:

- **Every query filters on `userId`.** The `userId` argument comes from the session at the call site and from nowhere else.
- **Every query also filters on `currency: CURRENCY`.** Expenso is BDT-only; filtering rather than summing blindly means a stray row in another currency can never be silently added into a Taka total.
- **Aggregate in the database, not in JavaScript.** Use `prisma.expense.aggregate` with `_sum: { amountMinor: true }` and `_count` for the two month totals, and `prisma.expense.groupBy({ by: ["categoryId"], _sum: { amountMinor: true } })` for the category breakdown. Never `findMany` a month of expenses and reduce them on the server, and never send raw rows to the client for client-side math.
- **Bound every read.** `recentExpenses` uses `take: 5`. For the category breakdown, prefer `orderBy: { _sum: { amountMinor: "desc" } }` with `take: 5` in the query; check the installed Prisma version's MongoDB support for ordering by an aggregate (Context7 / the Prisma docs) before relying on it, and if it is unsupported, sort the already-aggregated rows in the service and slice to five — the aggregation itself must still happen in the database either way.
- Category names for the grouped rows come from one bounded `prisma.category.findMany({ where: { id: { in: <=5 ids>, userId } } })` — scoped by `userId` as a second ownership check, not by id alone. Never issue one query per category.
- `hasAnyExpenses` is derived from `recentExpenses.length > 0` — it must not cost an extra query.
- Run the independent queries concurrently with `Promise.all`.
- **Integer money only.** `totalMinor`, `dailyAverageMinor`, and every category total are integer minor units. The daily average is `Math.round(totalMinor / daysElapsed)` where `daysElapsed` is the current UTC day-of-month. `changePercent` and `sharePercent` are display percentages, not money — computing them with division and `Math.round` is fine, but no monetary value may ever be produced by floating-point arithmetic.
- The service returns plain data. It performs no formatting: turning minor units into `৳12.50` is the UI's job via the existing `formatMoney`.

**Create `src/lib/utils/date-range.ts`** — pure helpers, no `server-only` needed:

- `getMonthRange(reference: Date, monthOffset = 0): { start: Date; end: Date }` — the half-open `[start, end)` UTC boundaries of a calendar month, built with `Date.UTC`. **UTC is mandatory**, because step 05 stores every expense at UTC midnight (`new Date(\`${date}T00:00:00.000Z\`)`); using local-time boundaries would push month-edge expenses into the wrong month.
- `formatMonthLabel(date: Date): string` and `formatDayMonth(date: Date): string` — `Intl.DateTimeFormat("en-US", { … , timeZone: "UTC" })`. The `timeZone: "UTC"` option is required for the same reason: without it a browser west of UTC renders every expense one day early.

**Unchanged:** `src/services/expenses.ts` and `src/services/categories.ts`. Do not refactor them.

## Validation

**This step introduces no new user-controlled input**, so it adds no new Zod schema — and that is a deliberate, verifiable claim, not an oversight:

- The dashboard page accepts **no** `searchParams` and **no** route params. There is no month picker, no range filter, no sort control, and no pagination cursor in this step.
- No form is added. The only writable input on the page belongs to `ExpenseForm`, already validated by `createExpenseSchema` (`src/lib/validations/expense.ts`) on both the client and the server, and by `createCategorySchema` for inline category creation. Neither schema changes.
- No API route is added, so there is no request body or query string to parse.
- The only input to `getDashboardSummary` is `userId`, which is read from the server-side session — never from a body, query string, route param, header, or client state — so it is trusted by construction and needs no schema.

**Binding rule for the implementer:** if you introduce _any_ client-controlled input while building this — a `?month=` parameter, a category filter, a "show more" count — it must be parsed with a Zod schema in `src/lib/validations/` before it reaches the service (allowed values enumerated, dates constrained the way `createExpenseSchema` constrains them, numeric limits capped), and it must be validated server-side even if it is also validated client-side. Do not hand-parse a query parameter with `Number()` or a regex.

## Authorization & Data Ownership

- `/dashboard` and the `(dashboard)` layout both resolve identity through `requireSession()` from `src/lib/auth-session.ts`, which redirects to `/login` when there is no session. `getSession` is memoized with React `cache()`, so the layout and the page reading it in the same request cost one auth lookup.
- The authenticated `userId` is `session.user.id` and is read **only** there. It is never accepted from a request body, query parameter, route parameter, header, cookie other than the session cookie, `localStorage`, or any client-supplied value — and it is never passed to the client as a prop.
- `getDashboardSummary(userId)` filters every single query by that `userId`: both month aggregates, the category grouping, the category-name lookup (`{ id: { in: … }, userId }`), and the recent-expenses read. A user with no expenses sees the empty state — never another user's totals.
- Because `Category` rows are also user-owned, the name lookup is scoped by `userId` as well as by id. An id that belongs to someone else resolves to nothing rather than leaking a foreign category name.
- No Prisma call is made from a Client Component. `src/services/dashboard.ts` and `src/lib/prisma.ts` are both marked `server-only`; the dashboard components receive already-computed, already-scoped values as props.
- Client-side authorization is never sufficient and is not used: nothing in this step gates content by a client-side session check.
- Errors surfaced to the user are generic; Prisma/MongoDB messages, stack traces, ids, and field names never reach the response or the browser console.

## Files to change

- `src/app/(dashboard)/dashboard/page.tsx` — replaced with the dashboard overview (keeps session handling, category seeding/loading, and metadata).
- `src/components/expenses/expense-form.tsx` — call `router.refresh()` after a successful create; no other change.

## Files to create

- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/dashboard/loading.tsx`
- `src/components/dashboard/dashboard-header.tsx`
- `src/components/dashboard/stat-card.tsx`
- `src/components/dashboard/top-categories.tsx`
- `src/components/dashboard/recent-expenses.tsx`
- `src/services/dashboard.ts`
- `src/lib/utils/date-range.ts`

## New dependencies

**No new dependencies.**

Checked against `package.json`: `lucide-react` supplies every icon needed (`Wallet`, `TrendingUp`/`TrendingDown`, `Receipt`), Tailwind supplies the bars and skeletons, `Intl` (built in) supplies currency and date formatting through the existing `formatMoney` and the new date helpers, and `@prisma/client` supplies `aggregate` / `groupBy` — both confirmed present in the generated client for `Expense`. In particular, **do not install a charting library** in this step: there are no charts here, and that dependency belongs to the analytics step where it can be chosen against real requirements.

## Rules for implementation

- Follow `CLAUDE.md` and `AGENTS.md`.
- Make the smallest clean change that fully solves the requested task.
- Do not implement features outside the requested scope (no charts, no expense list page, no edit/delete, no filters, no month picker, no budgets, no exports).
- Do not refactor unrelated code.
- Do not remove existing functionality without explicit permission — the add-expense dialog, default-category seeding, and sign-out all keep working; sign-out and the avatar move into the shell header rather than disappearing.
- Follow existing project conventions (file naming, comment style, the `server-only` marker on server modules, the `@/` alias).
- Prefer Server Components; use `"use client"` only when actually required — every component created in this step is a Server Component.
- Never access Prisma directly from Client Components.
- Keep business logic out of UI components; put reusable business logic in services.
- Use Next.js Route Handlers for backend logic — and add none here, because the page reads its data server-side.
- Validate all server-side user input with Zod (see **Validation** — this step has none, and any input added must be schema-validated).
- Never trust client-provided `userId`; enforce authentication and authorization server-side; verify ownership of user-owned resources on every read.
- Use MongoDB through Prisma; avoid raw MongoDB queries; use the shared client from `src/lib/prisma.ts`.
- Avoid floating-point arithmetic for exact monetary values — totals and averages stay integer minor units.
- Do not silently mix currencies: every aggregate filters on `CURRENCY` (`"BDT"`), and no currency value is ever accepted from the client.
- Never fetch unbounded expense lists; use `take` on every row-returning query and paginate any list that could grow.
- Prefer database-side aggregation for analytics; do not ship raw rows to the client for client-side math.
- Return safe client-facing errors; never expose Prisma/database/internal errors to users; log detail with `console.error`.
- Keep secrets server-side; never hardcode credentials, keys, tokens, or secrets.
- Use Tailwind CSS for styling; reuse the existing `Button`, `Dialog`, and design tokens; avoid inline styles except the dynamic bar width.
- Keep all UI responsive across mobile, tablet, and desktop; maintain accessibility (one `<h1>`, semantic lists, labelled landmarks, no colour-only meaning).
- Avoid unnecessary client-side state and `useEffect`.
- Avoid unnecessary database queries and API requests; run independent queries with `Promise.all`; do not query per category.
- Do not add dependencies unless necessary.
- Check installed package versions before using APIs; use Context7 for version-sensitive ones — in particular, confirm Prisma 6.19's MongoDB support for `groupBy` ordering by an aggregate before depending on it, and confirm Next.js 16's `LayoutProps` typegen behaviour for a route-group layout.
- Do not make destructive database changes without explicit permission — this step touches no schema and runs no `prisma db push`.
- Do not modify configuration unless required; do not modify unrelated files.

## Definition of done

Verified by running the app (`pnpm dev`) against the real database, signed in with a Google account:

1. Signed out, visiting `/dashboard` still redirects to `/login`; no dashboard markup, user name, or amount appears in the response body.
2. Signed in with **no expenses**, `/dashboard` shows the "No expenses yet" empty state with a working **Add expense** trigger — and shows no `৳0.00` stat cards and no empty panels.
3. Adding an expense from the dialog updates the dashboard **without a manual reload**: the "This month" total, the expense count, the top-categories panel, and the recent-expenses list all reflect the new row.
4. After adding, the form's existing behaviour is intact: the confirmation message appears, amount and description clear, category and date are retained, and focus returns to the amount field.
5. With several expenses this month, "This month" equals the exact sum of their `amountMinor` values formatted in BDT (`৳` symbol, two decimals) — verified against the values in the database, with no rounding drift.
6. "Daily average" equals this month's total divided by today's UTC day-of-month, rounded to whole minor units.
7. With expenses in the previous month, the "Last month" card shows that month's total and a signed percentage change with the correct direction and arrow; with **no** spending last month it reads "No spending last month" — never `Infinity%` or `NaN%`.
8. An expense dated on the first or last day of the current month is counted in this month, and an expense dated the last day of the previous month is not — confirming UTC month boundaries.
9. Top categories lists at most five rows, ordered highest-spend first, with amounts summing to this month's total when five or fewer categories were used, and shares totalling ~100%.
10. Recent expenses lists at most five rows, most recent first, showing category, date, amount, and description (a row with no description renders cleanly, not `null`), and a long description truncates instead of breaking the row.
11. With expenses in previous months but none this month, the stat cards show `৳0.00` / `0`, the top-categories panel shows its empty message, and recent expenses still lists the older rows.
12. A second user account signed in on the same machine sees only its own totals, categories, and recent expenses — no value from the first account appears anywhere on the page.
13. The shell header appears on `/dashboard` with the wordmark linking to `/dashboard`, the user's avatar (or an initial fallback when Google returns no image), and a **Sign out** button that ends the session and returns to `/`.
14. The page renders correctly at 375px, 768px, and 1280px: one/two/four stat columns respectively, no horizontal scroll, no cramped or sprawling controls, and the header never wraps.
15. Throttling the connection shows the `loading.tsx` skeleton, and the real content replaces it without a layout shift.
16. Only the dashboard queries run on a page load — no `GET /api/dashboard`-style request appears in the network tab, and no expense rows beyond the five recent ones appear in the RSC payload.
17. Nothing in the page's HTML or RSC payload contains the user's `id`, another user's data, or any Prisma/MongoDB error text.
18. `prisma/schema.prisma` is unchanged and no `prisma db push` was run.
19. `pnpm lint` passes and `pnpm exec tsc --noEmit` reports no errors.
