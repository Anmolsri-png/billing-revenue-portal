# Billing & Revenue Portal

Next.js and Prisma application with one codebase and two separated environments.

| | Development | Production |
|---|---|---|
| Where it runs | This machine, `npm run dev` | The production host |
| Config file | `.env.local` (gitignored) | Host environment variables |
| Database | Local PostgreSQL, database `billing_revenue_dev` | Existing Neon database |
| `APP_ENV` | `development` | `production` |

`.env` still holds the live Neon credentials. It is gitignored and is not the development database. Do not point `.env.local` at Neon.

## Development environment

Local PostgreSQL 16 on `localhost:5432`, database `billing_revenue_dev`.

1. Copy the template and fill in local values:

```bash
copy .env.example .env.local
```

2. Set `APP_ENV=development`.
3. Set `DATABASE_URL` to local PostgreSQL. The database name is `billing_revenue_dev`.
4. Set a development-only `AUTH_SECRET`.
5. Set `AUTH_URL` and `NEXT_PUBLIC_SERVER_URL` to `http://localhost:3000`.

Start the app:

```bash
npm run dev
```

The development database is empty until the existing migrations are applied. That command is not run automatically. Approve it before running:

```bash
npx prisma migrate deploy
```

That applies the migrations already in `prisma/migrations` to whichever database `DATABASE_URL` resolves to. With `.env.local` present, that is `billing_revenue_dev`.

## Production environment

Production does not read `.env.local`. Set these on the host:

- `APP_ENV=production`
- `DATABASE_URL` — the Neon connection string currently in `.env`
- `AUTH_SECRET` — a different secret from development
- `AUTH_URL` — the public production URL
- `NEXT_PUBLIC_SERVER_URL` — the same public URL
- `NEXT_APP_APP_NAME`
- `NEXT_APP_DESCRIPTION`
- `NEXT_APP_SERVER_URL`

`npm run dev` loads `.env.local` and uses local PostgreSQL. `npm run build` and `npm run start` load `.env.production.local` first, so they use the Neon database. Run the production instance on another port when both are open:

```bash
npm run dev
npx next start -p 3001
```

## Environment variables

| Variable | Development | Production |
|---|---|---|
| `APP_ENV` | `development` | `production` |
| `DATABASE_URL` | `localhost` / `billing_revenue_dev` | Neon |
| `AUTH_SECRET` | Unique to development | Unique to production |
| `AUTH_URL` | `http://localhost:3000` | Public production URL |
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost:3000` | Public production URL |
| `NEXT_APP_SERVER_URL` | `http://localhost:3000` | Public production URL |
| `NEXT_APP_APP_NAME` | Display name | Display name |
| `NEXT_APP_DESCRIPTION` | Description | Description |

`DATABASE_URL` and `AUTH_SECRET` are server-only. Do not prefix them with `NEXT_PUBLIC_`.

## `.env.example`

`.env.example` is the only environment file that belongs in Git. It lists variable names and placeholders. Real passwords, database URLs, and auth secrets belong in `.env.local` or on the production host.

## Local development setup

- PostgreSQL 16 listening on port 5432
- Database `billing_revenue_dev`
- `.env.local` filled from `.env.example`
- `npm install`
- `npm run dev`

## Production build

```bash
npm run build
```

On this machine the build loads `.env.production.local` and uses the Neon database. On the production host, set the host variables before building so `NEXT_PUBLIC_*` values are baked into the client bundle. Host variables override the local files.

## Production start

```bash
npm run start
```

The host must set `APP_ENV=production` and the Neon `DATABASE_URL`. The app refuses a production `APP_ENV` that points at `localhost`.

## Database separation

```
Development (npm run dev)
        DATABASE_URL in .env.local
        localhost:5432 / billing_revenue_dev

Production (host)
        DATABASE_URL on the host
        Neon / neondb
```

Development refuses a Neon URL. Production refuses a localhost URL when `APP_ENV=production`.

## Prisma commands

Prisma CLI uses the same file order as Next.js. With `NODE_ENV` unset, commands use `.env.local` and the local development database. `NODE_ENV=production` uses `.env.production.local` and Neon. A `DATABASE_URL` already set by the host is never overwritten.

Safe against the local development database, after you approve them:

```bash
npx prisma validate
npx prisma migrate deploy
npx prisma generate
```

Do not run `prisma migrate dev`, `prisma db push`, `prisma db seed`, or `prisma migrate reset` against the Neon database. `prisma db seed` creates an admin user with a fixed development password and is for an empty development database only.

## Git workflow

- `develop` deploys the development environment
- `main` deploys production

Those branches are not created by this setup. Commit `.env.example`. Do not commit `.env` or `.env.local`.

## Deployment configuration

No hosting platform is connected yet. When you deploy, create two separate targets:

Development deployment:

- Branch `develop`
- `APP_ENV=development` only if that target has its own Postgres instance
- Its own `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_URL`
- This local machine uses localhost Postgres instead of a hosted development app

Production deployment:

- Branch `main`
- `APP_ENV=production`
- Neon `DATABASE_URL`
- A different `AUTH_SECRET` and the public `AUTH_URL`

Do not reuse the development database URL on the production host.

## Security precautions

- `.env` and `.env.local` stay gitignored
- `.env.example` contains placeholders only
- Development and production use different `AUTH_SECRET` values
- Do not copy the Neon URL into `.env.local`
- Do not run seed against production
- Email sender passwords stored in the `Configuration` table stay in that database and are not environment variables
