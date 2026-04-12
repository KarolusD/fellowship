---
name: codebase-map
description: Map an unfamiliar codebase — stack, architecture, conventions, structure, and concerns — into a single prescriptive reference file that all companions can use.
user-invocable: true
trigger: /fellowship:map
---

# Codebase Map

Use this skill when starting work on an unfamiliar project, or when `docs/fellowship/codebase-map.md` doesn't exist and Tier 3+ work is about to begin.

**Invocation:** `/fellowship:map`

**Output:** `docs/fellowship/codebase-map.md`

---

## What this produces

A single prescriptive reference file — not documentation, not a description of what exists, but a guide for what to do and where to do it. Every section answers a question a companion would ask before starting work.

**Prescriptive, not descriptive.** "Use camelCase for function names" not "Some functions use camelCase." "Add new API routes to `src/routes/`" not "API routes are in `src/routes/`." Companions follow instructions; they don't infer conventions from descriptions.

**File paths required.** Every claim anchors to a real path: `src/lib/auth.ts`, `prisma/schema.prisma`. No vague references.

---

## How to run it

Work through the codebase using Read, Glob, Grep, and Bash. No agent dispatch needed for most projects — this is direct exploration work. For large monorepos, Merry can be dispatched to handle architecture analysis in parallel.

Explore in this order:

1. **Entry points** — `package.json`, `Cargo.toml`, `pyproject.toml`, main config files. What runs? What are the start commands?
2. **Directory structure** — top-level layout with `ls -la`. What does each folder contain?
3. **Stack** — framework, runtime, key dependencies. Read lock files for the real dependency list.
4. **Architecture** — how does a request flow through the system? Where does data come in, where does it go?
5. **Conventions** — scan 5-10 existing files for naming patterns, error handling, import organization. Read the most recently modified files — they reflect current practice.
6. **Where new code goes** — for each file type (component, route, test, utility), where does it live? What naming pattern does it follow?
7. **Concerns** — TODOs, deprecated patterns, fragile areas, known issues. Grep for `TODO`, `FIXME`, `HACK`, `deprecated`.

---

## Output format

Write directly to `docs/fellowship/codebase-map.md`. Create `docs/fellowship/` if it doesn't exist.

```markdown
# Codebase Map

**Project:** [name]
**Generated:** [YYYY-MM-DD]
**Stack:** [one-line summary — e.g. "Next.js 15 / Prisma / PostgreSQL / Tailwind"]

---

## Stack

- **Runtime:** [Node 22 / Python 3.13 / etc.]
- **Framework:** [Next.js App Router / FastAPI / SvelteKit / etc.]
- **Database:** [PostgreSQL via Prisma ORM — schema at `prisma/schema.prisma`]
- **Auth:** [NextAuth v5 — config at `src/auth.ts`]
- **Testing:** [Vitest — run with `npm test`]
- **Package manager:** [pnpm — use `pnpm` not `npm`]

## Architecture

[How a request flows through the system. 3-5 sentences. Include the key files at each stage.]

Entry → `src/app/` (Next.js routes) → `src/lib/` (business logic) → `src/db/` (Prisma queries) → PostgreSQL

Key files:
- `src/lib/auth.ts` — session validation, used by all protected routes
- `src/db/index.ts` — Prisma client singleton
- `src/app/api/` — all API routes

## Structure

    src/
      app/          # Next.js App Router — pages and API routes
      components/   # Reusable UI components
      lib/          # Business logic, utilities, shared helpers
      db/           # Database queries and Prisma client
      types/        # TypeScript type definitions

**Where to add new code:**
- New page: `src/app/[route]/page.tsx`
- New API route: `src/app/api/[route]/route.ts`
- New component: `src/components/[Name].tsx` (PascalCase)
- New utility: `src/lib/[name].ts` (camelCase)
- New DB query: add to the relevant file in `src/db/`
- New type: `src/types/[domain].ts`

## Conventions

**Naming:**
- Files: kebab-case (`user-profile.ts`) except components (PascalCase: `UserProfile.tsx`)
- Functions: camelCase (`getUserById`)
- Types/interfaces: PascalCase (`UserProfile`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)

**Error handling:**
- API routes: return `{ error: string }` with appropriate HTTP status
- Server actions: throw `Error` — caught by error boundary
- Never swallow errors silently — log and rethrow or return error shape

**Imports:**
- Use `@/` alias for `src/` — `import { db } from '@/db'`
- External packages first, then internal, then relative

**Patterns in use:**
- [e.g. "Server Components for data fetching — Client Components only for interactivity"]
- [e.g. "Zod for all input validation — schemas in `src/lib/validation/`"]

## Concerns

- [Issue — `path/to/file.ts` — impact — suggested fix]
- [e.g. "No error boundaries on dashboard routes — `src/app/dashboard/` — unhandled errors crash the page — add `error.tsx` files"]
- [e.g. "Auth check duplicated in 3 API routes — `src/app/api/users/`, `src/app/api/orders/`, `src/app/api/admin/` — extract to middleware"]

If no concerns: `None identified.`
```

---

## After writing

Tell the user where the file is and give a one-line summary: *"Codebase map written to `docs/fellowship/codebase-map.md` — Next.js App Router, Prisma/PostgreSQL, Vitest. Two concerns flagged."*

The map is a starting point. It will drift as the codebase evolves. Gimli updates the "Where to add new code" section when he creates new directories. Flag it for regeneration with `/fellowship:map` if it becomes significantly out of date.
