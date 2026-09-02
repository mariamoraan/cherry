# Next.js Boilerplate

**Next.js 16** boilerplate with authentication, PostgreSQL database, and a structure ready to scale. Includes login with Google, GitHub, and email/password, route protection, and access restricted by an email allowlist.

---

## Stack

| Technology | Details |
|---|---|
| [Next.js 16](https://nextjs.org/) | App Router, `proxy.ts` for route protection |
| [React 19](https://react.dev/) | Server Components + Server Actions |
| [TypeScript](https://www.typescriptlang.org/) | Strict mode |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling |
| [Prisma 7](https://www.prisma.io/) | ORM + PostgreSQL (Neon, local, Docker…) |
| [Auth.js / NextAuth v5](https://authjs.dev/) | OAuth + Credentials, JWT sessions |
| [TanStack Query v5](https://tanstack.com/query) | Server state on the client |
| [Zod](https://zod.dev/) + [@t3-oss/env-nextjs](https://env.t3.gg/) | Environment variable validation |

---

## Prerequisites

- **Node.js** 20 or higher
- **npm** (or pnpm/yarn)
- **PostgreSQL** database ([Neon](https://neon.tech), local, Docker…)
- OAuth apps on **GitHub** (required) and **Google** (optional)

---

## Quick start

### 1. Clone and install dependencies

```bash
git clone <repo-url> nextjs-boilerplate
cd nextjs-boilerplate
npm install
```

### 2. Configure environment variables

Create a `.env` file at the project root:

```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
AUTH_SECRET="..."          # openssl rand -base64 32

GITHUB_ID="..."
GITHUB_SECRET="..."

# Optional — without these variables, the Google button won't work
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Initialize the database

```bash
npx prisma db push      # Sync schema with PostgreSQL
npx prisma generate     # Generate Prisma client
npx prisma db seed      # Create initial development user
```

> **Important:** after `prisma generate` or changes to `schema.prisma`, restart the development server (`npm run dev`). Prisma caches the client in memory.

### 4. Configure OAuth

#### GitHub (required)

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
3. Copy the **Client ID** → `GITHUB_ID`
4. Generate the **Client Secret** → `GITHUB_SECRET`

#### Google (optional)

1. [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth 2.0
2. **Redirect URI:** `http://localhost:3000/api/auth/callback/google`
3. `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`

### 5. Authorize your email

Edit `src/app/core/config/allowed-emails.ts` and add allowed emails:

```ts
export const ALLOWED_EMAILS = ["you@email.com"] as const;
```

Only emails on this list can sign in, regardless of the method (OAuth or credentials).

### 6. Start the server

```bash
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login).

**Development credentials** (created by the seed):

- Email: `test@example.com`
- Password: `Password123!`

> Change the seed and allowlist before deploying to production.

---

## Useful commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint

npx prisma db push   # Apply schema changes
npx prisma generate  # Regenerate Prisma client
npx prisma db seed   # Run seed
npx prisma studio    # UI to explore the database
```

---

## What's included

### Authentication (Auth.js v5)

Three providers configured in `src/app/core/config/auth.ts`:

| Provider | Method | Notes |
|---|---|---|
| **GitHub** | OAuth | Required — needs `GITHUB_ID` and `GITHUB_SECRET` |
| **Google** | OAuth | Optional — needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` |
| **Credentials** | Email + password | Verified against `passwordHash` in PostgreSQL with bcrypt |

- **JWT sessions** — required because Auth.js does not support database sessions together with Credentials
- **PrismaAdapter** — persists OAuth users and accounts in PostgreSQL
- **Email allowlist** — `signIn` callback rejects unauthorized emails
- **Custom pages** — `/login` and `/auth/error`

### Database (Prisma 7)

- Schema in `prisma/schema.prisma` with Auth.js models (`User`, `Account`, `Session`, `VerificationToken`)
- `passwordHash` field on `User` for credentials login
- Client generated in `src/app/core/lib/generated/prisma/`
- Connection config in `prisma.config.ts` (Prisma 7 does not use `url` in the schema)
- `@prisma/adapter-pg` adapter for PostgreSQL
- Seed in `prisma/seed.ts` for development user

### Route protection

`src/proxy.ts` (Next.js 16 — replaces `middleware.ts`):

- Redirects to `/login` if there is no session
- Redirects to `/dashboard` if authenticated and visiting `/login`
- Blocks unauthorized emails → `/auth/error?error=AccessDenied`
- Public routes: `/login`, `/auth/error`, `/api/*`

### Environment validation

`src/app/core/config/env.ts` validates all variables with Zod on startup. If a required variable is missing, the app fails with a clear error.

### Global providers

`src/app/core/providers/index.tsx` wraps the app with:

- `SessionProvider` (next-auth/react)
- `QueryClientProvider` (TanStack Query + DevTools)

### Import aliases

```ts
@/*           → src/*
@/core/*      → src/app/core/*
@/features/*  → src/app/features/*
@/ui/*        → src/app/core/components/ui/*
@/auth        → src/app/core/config/auth.ts
@/env         → src/app/core/config/env.ts
```

---

## Architecture

```
nextjs-boilerplate/
├── prisma/
│   ├── schema.prisma          # Database models
│   └── seed.ts                # Initial dev user
├── prisma.config.ts           # Prisma 7 config (URL, seed, migrations)
├── src/
│   ├── proxy.ts               # Route protection (auth guard)
│   └── app/
│       ├── layout.tsx         # Root layout + Providers
│       ├── page.tsx           # Home page
│       ├── api/auth/
│       │   └── [...nextauth]/ # Auth.js handlers
│       ├── (app)/             # Application routes
│       │   ├── login/         # Login (OAuth + credentials)
│       │   ├── auth/error/    # Authentication errors
│       │   └── dashboard/     # Example protected page
│       └── core/
│           ├── config/        # auth, env, site, allowed-emails
│           ├── lib/           # db, verify-credentials, Prisma client
│           ├── providers/     # SessionProvider + React Query
│           ├── components/    # Shared components
│           └── types/         # Type extensions (next-auth.d.ts)
└── docs/
    └── SETUP.md               # Detailed guide to recreate the stack from scratch
```

### Authentication flow

```mermaid
sequenceDiagram
  participant User
  participant Proxy as proxy.ts
  participant Login as /login
  participant NextAuth as /api/auth
  participant DB as PostgreSQL

  User->>Proxy: GET /dashboard
  Proxy->>Login: no session → redirect
  User->>Login: email+password or OAuth
  Login->>NextAuth: signIn()
  NextAuth->>DB: verify / create user
  NextAuth->>User: JWT cookie + redirect /dashboard
  User->>Proxy: GET /dashboard (with session)
  Proxy->>User: access granted
```

### Layers

```
┌─────────────────────────────────────────────┐
│  UI (React Server/Client Components)        │
│  src/app/(app)/*                            │
├─────────────────────────────────────────────┤
│  Server Actions                             │
│  src/app/(app)/login/actions.ts             │
├─────────────────────────────────────────────┤
│  Auth.js (NextAuth v5)                      │
│  src/app/core/config/auth.ts                │
├─────────────────────────────────────────────┤
│  Prisma ORM                                 │
│  src/app/core/lib/db.ts                     │
├─────────────────────────────────────────────┤
│  PostgreSQL                                 │
└─────────────────────────────────────────────┘
```

The **proxy** acts as the first line of defense on every request. Protected pages can also call `auth()` directly to access the session in Server Components.

---

## Keeping dependencies up to date

### Check what's outdated

```bash
npm outdated
```

Shows installed versions vs. the latest available in the registry.

### Update patches and minors (conservative)

```bash
npm update
```

Updates within the semver range defined in `package.json` (what `^` allows). The safest option for day-to-day use.

### Update to latest versions (includes majors)

```bash
npx npm-check-updates        # See available major versions
npx npm-check-updates -u     # Write new versions to package.json
npm install                  # Install
```

After a major version bump, review changelogs and test the app:

```bash
npm run build
npm run dev
```

### Packages that need special attention

| Package | Notes when updating |
|---|---|
| `next` + `eslint-config-next` | Update together. Check [Next.js releases](https://github.com/vercel/next.js/releases) |
| `next-auth` | Currently in **beta** (`5.0.0-beta.x`). Review [Auth.js docs](https://authjs.dev) before bumping versions |
| `prisma` + `@prisma/client` + `@prisma/adapter-pg` | Keep all three on the **same version**. After updating: `npx prisma generate` |
| `react` + `react-dom` | Must match in version |
| `@tanstack/react-query` | Update together with `@tanstack/react-query-devtools` |

### Security audit

```bash
npm audit
npm audit fix          # Compatible automatic patches
```

For vulnerabilities that require a major bump, evaluate them manually before forcing an update.

### Recommended workflow

1. `npm outdated` — see the big picture
2. Update Prisma, Next.js, and Auth.js separately (not all at once)
3. `npx prisma generate` if you touched Prisma
4. `npm run build && npm run lint` — verify it compiles
5. Manually test login (OAuth + credentials) and protected routes

---

## Additional documentation

- [`docs/SETUP.md`](docs/SETUP.md) — step-by-step guide to recreate this stack from scratch
- [Next.js docs](https://nextjs.org/docs)
- [Auth.js docs](https://authjs.dev)
- [Prisma docs](https://www.prisma.io/docs)

---

## License

Private project — Maria Moran Luaces.
