# Guide: building a Next.js Boilerplate project from scratch

Current project stack:

| Technology | Version / details |
|---|---|
| Next.js | 16 (App Router, `proxy.ts` instead of `middleware.ts`) |
| React | 19 |
| TypeScript | strict |
| Tailwind CSS | v4 |
| Prisma | 7 + PostgreSQL (Neon or other) |
| Auth.js / NextAuth | v5 (beta) |
| TanStack Query | v5 |
| Env validation | `@t3-oss/env-nextjs` + Zod |

---

## 1. Prerequisites

- **Node.js** 20+
- **npm** (or pnpm/yarn)
- **PostgreSQL** account (local, Docker, or [Neon](https://neon.tech))
- (Optional) OAuth apps on **GitHub** and **Google**

---

## 2. Create the Next.js project

```bash
npx create-next-app@latest my-project \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-import-alias
```

Recommended options:

- TypeScript
- ESLint
- Tailwind CSS
- App Router
- `src/` directory

---

## 3. Install dependencies

### Production

```bash
npm install next-auth@beta @auth/prisma-adapter \
  prisma @prisma/client @prisma/adapter-pg \
  @t3-oss/env-nextjs zod \
  @tanstack/react-query @tanstack/react-query-devtools \
  bcryptjs dotenv
```

> `pg` is usually installed as a transitive dependency of `@prisma/adapter-pg`. If Prisma fails at runtime, install it explicitly: `npm install pg`.

### Development

```bash
npm install -D @types/bcryptjs \
  prettier prettier-plugin-tailwindcss @trivago/prettier-plugin-sort-imports \
  eslint-config-prettier \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-tailwindcss
```

---

## 4. Recommended folder structure

```
my-project/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── prisma.config.ts
├── src/
│   ├── proxy.ts                    # Route protection (Next.js 16)
│   └── app/
│       ├── layout.tsx
│       ├── globals.css
│       ├── page.tsx
│       ├── api/
│       │   └── auth/
│       │       └── [...nextauth]/
│       │           └── route.ts    # ⚠️ /api/auth/* (NOT [api])
│       ├── (app)/                  # Authenticated app routes
│       │   ├── login/
│       │   │   ├── page.tsx
│       │   │   └── actions.ts
│       │   ├── auth/
│       │   │   └── error/
│       │   │       └── page.tsx
│       │   └── dashboard/
│       │       └── page.tsx
│       └── core/
│           ├── config/
│           │   ├── auth.ts
│           │   ├── env.ts
│           │   ├── site.ts
│           │   └── allowed-emails.ts
│           ├── lib/
│           │   ├── db.ts
│           │   ├── verify-credentials.ts
│           │   └── generated/prisma/   # Generated client
│           ├── providers/
│           │   └── index.tsx
│           └── types/
│               └── next-auth.d.ts
├── .env
├── .env.example
├── next.config.ts
└── tsconfig.json
```

---

## 5. Configure TypeScript (`tsconfig.json`)

Add import aliases:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/core/*": ["./src/app/core/*"],
      "@/features/*": ["./src/app/features/*"],
      "@/ui/*": ["./src/app/core/components/ui/*"],
      "@/auth": ["./src/app/core/config/auth.ts"],
      "@/env": ["./src/app/core/config/env.ts"]
    }
  }
}
```

---

## 6. Tailwind CSS v4

**`postcss.config.mjs`**

```js
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};
export default config;
```

**`src/app/globals.css`**

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

Import `./globals.css` in `src/app/layout.tsx`.

---

## 7. Prisma 7 + PostgreSQL

### 7.1 Initialize Prisma

```bash
npx prisma init
```

### 7.2 `prisma.config.ts` (Prisma 7)

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

### 7.3 `prisma/schema.prisma`

Auth.js models + password field:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/app/core/lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String?   // Email/password users only
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts Account[]
  sessions Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### 7.4 Prisma client (`src/app/core/lib/db.ts`)

```ts
import { PrismaClient } from "@/core/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

### 7.5 `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "./src/app/core/lib/generated/prisma",
    "pg",
  ],
};

export default nextConfig;
```

### 7.6 Sync database

```bash
npx prisma db push
npx prisma generate
```

> **Important:** after `prisma generate` or schema changes, **restart** `npm run dev`. Prisma caches the client in memory during development.

---

## 8. Environment variables

**`.env`**

```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
AUTH_SECRET="..."          # openssl rand -base64 32

GITHUB_ID="..."
GITHUB_SECRET="..."
GOOGLE_CLIENT_ID=""        # optional
GOOGLE_CLIENT_SECRET=""    # optional
```

**`.env.example`** — copy without secrets for the repo.

**Validation with Zod** (`src/app/core/config/env.ts`):

```ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(1),
    GITHUB_ID: z.string().min(1),
    GITHUB_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
});
```

---

## 9. Auth.js / NextAuth v5

### 9.1 Email allowlist

**`src/app/core/config/allowed-emails.ts`**

```ts
export const ALLOWED_EMAILS = ["test@example.com"] as const;

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (ALLOWED_EMAILS as readonly string[]).includes(email.toLowerCase());
}
```

### 9.2 Credentials verification

**`src/app/core/lib/verify-credentials.ts`**

```ts
import bcrypt from "bcryptjs";

import { isAllowedEmail } from "@/core/config/allowed-emails";
import { db } from "@/core/lib/db";

export async function verifyCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password || !isAllowedEmail(normalizedEmail)) return null;

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  if (!user?.passwordHash) return null;
  if (!(await bcrypt.compare(password, user.passwordHash))) return null;

  return { id: user.id, email: user.email, name: user.name };
}
```

### 9.3 Main configuration

**`src/app/core/config/auth.ts`**

Key points:

- **3 providers:** Google, GitHub, Credentials
- **JWT sessions** (required with Credentials; Auth.js does not support `database` + Credentials)
- **PrismaAdapter** is still used for OAuth (create users/accounts in the database)
- `signIn` callback → allowlist
- `jwt` + `session` callbacks → persist `id`, `email`, `name` in the session

```ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

import { isAllowedEmail } from "@/core/config/allowed-emails";
import { db } from "@/core/lib/db";
import { verifyCredentials } from "@/core/lib/verify-credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString() ?? "";
        const password = credentials?.password?.toString() ?? "";
        return verifyCredentials(email, password);
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    signIn({ user }) {
      return isAllowedEmail(user.email);
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
});
```

### 9.4 API route (common mistake)

It must live at:

```
src/app/api/auth/[...nextauth]/route.ts
```

**NOT** at `src/app/[api]/...` (that is a dynamic segment, not `/api`).

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

### 9.5 Session types

**`src/app/core/types/next-auth.d.ts`**

```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}
```

---

## 10. Route protection (`src/proxy.ts`)

In **Next.js 16**, `middleware.ts` is deprecated → use **`proxy.ts`** in `src/`:

```ts
import { auth } from "@/auth";
import { isAllowedEmail } from "@/core/config/allowed-emails";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const isPublicPage =
    pathname.startsWith("/login") || pathname.startsWith("/auth/error");

  if (
    isAuthenticated &&
    !isAllowedEmail(req.auth?.user?.email) &&
    !pathname.startsWith("/auth/error")
  ) {
    return NextResponse.redirect(
      new URL("/auth/error?error=AccessDenied", req.url),
    );
  }

  if (!isAuthenticated && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthenticated && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
```

---

## 11. Global providers

**`src/app/core/providers/index.tsx`**

```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

Wrap `{children}` in `src/app/layout.tsx`.

---

## 12. Login page

### Server actions (`src/app/(app)/login/actions.ts`)

```ts
"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";

export async function loginWithCredentials(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email")?.toString().trim(),
      password: formData.get("password")?.toString(),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      redirect("/login?error=CredentialsSignin");
    }
    throw error;
  }
}

export async function loginWithGitHub() {
  await signIn("github", { redirectTo: "/dashboard" });
}

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}
```

### Page (`src/app/(app)/login/page.tsx`)

- Server Component that calls `auth()` and redirects if a session already exists
- Email/password form → `loginWithCredentials`
- OAuth buttons → `loginWithGitHub` / `loginWithGoogle`
- Displays errors from `searchParams.error`

### Protected dashboard

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <h1>Welcome to the dashboard</h1>;
}
```

---

## 13. Initial user seed

**`prisma/seed.ts`**

```ts
import "dotenv/config";

import bcrypt from "bcryptjs";

import { db } from "@/core/lib/db";

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);
  await db.user.upsert({
    where: { email: "test@example.com" },
    update: { passwordHash, name: "Admin" },
    create: { email: "test@example.comm", name: "Admin", passwordHash },
  });
}

main().finally(() => db.$disconnect());
```

```bash
npx prisma db seed
```

> Never store plaintext passwords in production code. Use seed only for dev or read the password from an environment variable.

---

## 14. Configure OAuth

### GitHub

1. [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. **Callback URL:** `http://localhost:3000/api/auth/callback/github`
3. Copy **Client ID** → `GITHUB_ID`
4. Generate **Client Secret** → `GITHUB_SECRET`

### Google

1. [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth 2.0
2. **Redirect URI:** `http://localhost:3000/api/auth/callback/google`
3. `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`

### AUTH_SECRET

```bash
openssl rand -base64 32
```

---

## 15. ESLint + Prettier (optional but recommended)

Copy the config from:

- `eslint.config.mjs` — flat config with Next.js, TypeScript, import order, Tailwind
- `.prettierrc` — sort imports + tailwind class order
- `.prettierignore` — ignores `.next`, `node_modules`, etc.

---

## 16. Day-to-day commands

```bash
# Development
npm run dev

# After changing schema.prisma
npx prisma db push
npx prisma generate
# ⚠️ Restart npm run dev

# Seed
npx prisma db seed

# Production build
npm run build
npm start

# Lint
npm run lint
```

---

## 17. Authentication flow (summary)

```mermaid
sequenceDiagram
  participant User
  participant Proxy as proxy.ts
  participant Login as /login
  participant NextAuth as /api/auth
  participant DB as PostgreSQL

  User->>Proxy: GET /dashboard
  Proxy->>Login: no session
  User->>Login: email+password or OAuth
  Login->>NextAuth: signIn
  NextAuth->>DB: verify / create user
  NextAuth->>User: JWT cookie + redirect /dashboard
  User->>Proxy: GET /dashboard
  Proxy->>User: grant access
```

---

## 18. Common errors and how to avoid them

| Problem | Cause | Solution |
|---|---|---|
| OAuth doesn't work | Route under `[api]` instead of `api` | Move to `src/app/api/auth/[...nextauth]/route.ts` |
| Email/password fails after schema change | Prisma client cached in dev | `npx prisma generate` + restart server |
| "Invalid email or password" with correct credentials | Query missing `passwordHash` (stale client) | Regenerate client and restart |
| OAuth user blocked after login | Email not in JWT session | Copy `email` in `jwt` and `session` callbacks |
| Credentials + database sessions | Incompatible in Auth.js | Use `session: { strategy: "jwt" }` |
| Denied without a clear message | `/auth/error` is not a public route | Add it to the proxy as a public page |

---

## 19. Final checklist before testing

- [ ] `.env` with `DATABASE_URL`, `AUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`
- [ ] `npx prisma db push && npx prisma generate`
- [ ] `npx prisma db seed`
- [ ] OAuth callback URLs point to `/api/auth/callback/{provider}`
- [ ] User email is in `allowed-emails.ts`
- [ ] Server restarted after Prisma changes
- [ ] Login at `http://localhost:3000/login`
- [ ] Dashboard at `http://localhost:3000/dashboard`
