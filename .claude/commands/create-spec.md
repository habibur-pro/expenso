---
description: Create a spec file and feature branch for the next expenso step
argument-hint: "Step number, feature name, and optional short description e.g. 3 registration need only by google"
allowed-tools: Read, Write, Glob, Grep, Bash(git:*), mcp__plugin_context7_context7__resolve-library-id, mcp__plugin_context7_context7__query-docs
---

You are a senior developer spinning up a new feature for the
expenso tracker. Always follow the rules in CLAUDE.md.

User input: $ARGUMENTS

## Step 1 — Check working directory is clean

Run `git status` and check for uncommitted, unstaged, or
untracked files. If any exist, stop immediately and tell
the user to commit or stash changes before proceeding.
DO NOT CONTINUE until the working directory is clean.

## Step 2 — Parse the arguments

From $ARGUMENTS extract:

1. `step_number` — zero-padded to 2 digits: 2 → 02, 11 → 11

2. `feature_title` — human readable title in Title Case
   - Example: "Registration" or "Login and Logout"

3. `feature_slug` — git and file safe slug
   - Lowercase, kebab-case
   - Only a-z, 0-9 and -
   - Maximum 40 characters
   - Example: registration, login-logout

4. `branch_name` — format: `feature/<feature_slug>`
   - Example: `feature/registration`

5. `feature_description` — optional short free-text note after
   the feature name, describing scope, constraints, or intent
   - Example: from "3 registration need only by google" the
     description is "need only by google" (registration should
     support Google sign-in only, not email/password)
   - This narrows or clarifies the feature's scope — it is not
     a full spec, just guidance for writing one
   - If absent, proceed without it

If you cannot infer `step_number` or `feature_title` from
$ARGUMENTS, ask the user to clarify before proceeding.

## Step 3 — Check branch name is not taken

Run `git branch` to list existing branches.
If `branch_name` is already taken, append a number:
`feature/registration-01`, `feature/registration-02` etc.

## Step 4 — Switch to main and pull latest

Run:

```
git checkout main
git pull origin main
```

## Step 5 — Create and switch to the feature branch

Run:

```
git checkout -b <branch_name>
```

## Step 6 — Research the codebase

Read these files before writing the spec:

- `CLAUDE.md` — project rules, architecture, conventions
- Relevant files in `src/app/`
- `prisma/schema.prisma` — current database schema
- Relevant files in `src/components/`
- Relevant files in `src/services/`
- Relevant files in `src/hooks/`
- Relevant files in `src/lib/`
- Relevant files in `src/lib/validations/`
- Existing authentication and authorization implementation
- Existing API Route Handlers related to the feature
- All files in `.claude/specs/` — avoid duplicating existing specs

Explore the existing implementation and conventions before
deciding what needs to change.

If `feature_description` was provided, treat it as a scope
constraint and confirm it's feasible given the existing codebase
before writing the spec (e.g. check whether an auth library
already installed supports the requested provider).

Check the Prisma schema before proposing any database changes.

Check `CLAUDE.md` to confirm the requested step is not already
marked complete. If it is, warn the user and stop.

Check `package.json` before proposing any new dependency.

Use current official documentation through Context7 when appropriate.
Do not assume APIs from older versions.

Do not modify project files during this research step.

## Step 7 — Write the spec

Generate a spec document with this exact structure:

---

# Spec: <feature_title>

## Overview

One paragraph describing what this feature does and why
it exists at this stage of the expenso roadmap.

If `feature_description` was provided, state the constraint
explicitly here (e.g. "Registration supports Google sign-in
only; email/password is out of scope for this step").

Keep the scope focused on the requested feature.

## Depends on

Which previous steps this feature requires to be complete.

## User flow

Describe the expected user flow from start to finish.

Include when relevant:

- Entry point
- User actions
- Form interactions
- Validation behavior
- Loading behavior
- Success behavior
- Error behavior
- Empty states
- Confirmation behavior
- Navigation behavior

Keep the flow specific to the requested feature.

## API Routes

List every new or modified Next.js Route Handler required.

Every new api route needed:

- `METHOD /path` — description — access level (public/logged-in)

For every protected endpoint, explicitly require:

- Server-side authentication
- Server-side identification of the authenticated user
- Server-side ownership verification for user-owned resources
- No trust in client-provided userId

If no API changes are required: state "No API route changes"

## Database changes

Describe any required changes to:

- Prisma models
- Fields
- Relationships
- Indexes
- Constraints
- MongoDB-specific configuration

Always verify the proposal against the existing `prisma/schema.prisma`.

Prefer reusing existing schema structures when possible.

Do not propose destructive database changes.

If none: state "No database changes"

## components & ui

- **Create:** List every new component that needs to be created and its path.
  example: `src/components/expenses/expense-form.tsx` — expense creation/edit form
- **Modify:** List every existing component that needs to be modified and describe the required changes.
- **Pages:** List every affected page or route under `src/app`.

For each UI change, consider:

- Mobile
- Tablet
- Desktop
- Loading states
- Empty states
- Error states
- Accessibility
- Existing design patterns
- Existing shadcn/ui components
  Do not introduce a new design system or unrelated UI changes.

## Services & Business Logic

List every new or modified service.

For each service, describe its responsibility.

Business logic must remain outside UI components.

Services should handle reusable application logic and database
operations where appropriate.

If none: state "No service changes"

## Validation

List all user-controlled inputs that require validation.

Include:

- Required fields
- Optional fields
- Data types
- Allowed ranges
- Maximum lengths
- IDs
- Dates
- Amounts
- Query parameters
- Filters
- Sort parameters
- Other relevant constraints

Use Zod for frontend and server-side validation.

## Authorization & Data Ownership

Explain how authentication and authorization must be enforced.

Every user-owned resource must be scoped to the authenticated
user determined server-side.

Never trust:

- `userId` from request bodies
- `userId` from query parameters
- `userId` from route parameters when used as authorization
- Client-side authentication state
- Client-side authorization state

Every protected read, update, delete, and analytics operation
must verify ownership server-side.

Users must never be able to access another user data.

## Files to change

Every file that will be modified.
Only include files that are actually necessary for feature.

Do not include speculative or unrelated files.

## Files to create

Every new file that will be created.
Include the complete path for each file.

## New dependencies

List any new pnpm packages required.
Before proposing a dependency, verify that an existing dependency
cannot already solve the requirement.

If no new dependency is required: state "No new dependencies"

## Rules for implementation

Specific constraints Claude must follow. Always include:

- Follow `CLAUDE.md` and `AGENTS.md`
- Make the smallest clean change that fully solves the requested task
- Do not implement features outside the requested scope
- Do not refactor unrelated code
- Do not remove existing functionality without explicit permission
- Follow existing project conventions
- Prefer Server Components
- Use "use client" only when actually required
- Never access Prisma directly from Client Components
- Keep business logic out of UI components
- Put reusable business logic in services
- Use Next.js Route Handlers for backend logic
- Validate all server-side user input with Zod
- Never trust client-provided userId
- Enforce authentication server-side
- Enforce authorization server-side
- Verify ownership of user-owned resources
- Use MongoDB through Prisma
- Avoid raw MongoDB queries unless genuinely required
- Use a shared Prisma client instance
- Avoid floating-point arithmetic for exact monetary values
- Do not silently mix currencies
- Never fetch unbounded expense lists
- Use pagination for potentially large lists
- Prefer server-side or database-side aggregation for analytics
- Do not ship unnecessary raw data to the client
- Return safe client-facing errors
- Never expose Prisma/database/internal errors to users
- Keep secrets server-side
- Never hardcode credentials, keys, tokens, or secrets
- Use Tailwind CSS for styling
- Reuse existing shadcn/ui components and design patterns when appropriate
- Keep all UI responsive across mobile, tablet, and desktop
  Maintain accessibility
- Avoid unnecessary client-side state and useEffect
- Avoid unnecessary database queries and API requests
- Do not add dependencies unless necessary
- Check installed package versions before using APIs
- Use Context7 for version-sensitive or unfamiliar APIs
- Do not make destructive database changes without explicit permission
- Do not modify configuration unless required
- Do not modify unrelated files

## Definition of done

A specific testable checklist. Each item must be
something that can be verified by running the app.
---

## Step 8 — Save the spec

Save to: `.claude/specs/<step_number>-<feature_slug>.md`

## Step 9 — Report to the user

Print a short summary in this exact format:

```
Branch:    <branch_name>
Spec file: .claude/specs/<step_number>-<feature_slug>.md
Title:     <feature_title>
```

Then tell the user:
"Review the spec at `.claude/specs/<step_number>-<feature_slug>.md`
then enter Plan Mode with Shift+Tab twice to begin implementation."

Do not print the full spec in chat unless explicitly asked.
