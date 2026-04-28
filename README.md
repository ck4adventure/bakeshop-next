# Bakeshop Next

A production-operations tool for small bakeries. Tracks freezer inventory, daily bake-off targets, weekly production schedules, and transaction history — all scoped per bakery with role-based access.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL (via `pg`) |
| ORM | Prisma 7 |
| Auth | NextAuth v4 — credentials + JWT sessions |
| Data fetching | SWR 2 |
| Styling | Tailwind CSS 4 |
| UI primitives | Radix UI, shadcn/ui components |
| Theming | next-themes (light / dark / system) |

---

## Features

- **Today** — shows each item's bake-off target for the current day (from the weekly schedule, with daily overrides), logs bake transactions, and tracks running freezer stock
- **Inventory** — current freezer stock across all items with manual adjustment support
- **Schedule** — weekly production schedule; set default quantities per item per weekday
- **Manage Items** — create and edit items (name, slug, category, par level, default batch quantity)
- **Operating Days** — configure which days of the week the bakery is open
- **Settings** — bakery name and slug
- **History** — full inventory transaction log with reasons and timestamps

**Auth & roles:** credential-based login with bcrypt-hashed passwords. Three roles — `ADMIN`, `MANAGER`, `BAKER` — stored in the JWT session and available server-side on every request.

**Database triggers:** `InventoryTransaction` inserts automatically project onto `ItemInventory` via a PostgreSQL trigger, keeping current stock consistent without application-layer bookkeeping.

---

## Folder Structure

```
app/
  (bakery)/          # authenticated bakery routes (layout with nav)
    history/
    inventory/
    manage-items/
    operating-days/
    schedule/
    settings/
    today/
  api/               # Route Handlers
    auth/
    bakery/
    categories/
    inventory/
    items/
    production-schedule/
  login/
  providers.tsx      # SWRConfig + SessionProvider + ThemeProvider
components/
  ui/                # shadcn/ui primitives (button, card, input, label)
  bottom-nav.tsx
  header.tsx
  item-sheet.tsx     # slide-out panel for editing an item
  numeric-field.tsx
  toast.tsx
lib/
  auth.ts            # NextAuth config
  fetcher.ts         # SWR fetcher
  swr-hooks.ts       # typed SWR hooks for each API endpoint
  prisma.ts          # PrismaClient singleton
  utils.ts
  weekdays.ts
prisma/
  schema.prisma
  migrations/
  seed.ts            # demo bakery, users, items, and starting inventory
types/
  items.d.ts
  next-auth.d.ts     # session type augmentation
```

---

## Local Setup

### Prerequisites

- Node.js 20+
- A local PostgreSQL instance

### 1. Clone and install

```bash
git clone https://github.com/ck4adventure/bakeshop-next.git
cd bakeshop-next
npm install
```

### 2. Configure environment

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<dbname>
NEXTAUTH_SECRET=<any long random string>
NEXTAUTH_URL=http://localhost:3000
```

Replace `<user>`, `<password>`, and `<dbname>` with your local Postgres credentials. `NEXTAUTH_SECRET` can be any random string — `openssl rand -base64 32` works well.

### 3. Run migrations

```bash
npx prisma migrate deploy
```

This applies all migrations in `prisma/migrations/`, including the inventory trigger.

### 4. Seed demo data

```bash
npm run db:seed
```

This creates:
- A **Demo Bakeshop** bakery
- Three users: `admin / admin123`, `manager / manager123`, `baker / baker123`
- A set of demo categories and items with starting inventory and a partial weekly production schedule

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with one of the seeded credentials above.
