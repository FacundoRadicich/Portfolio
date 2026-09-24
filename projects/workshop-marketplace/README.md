# Workshop Marketplace

**Next.js 16 · React 19 · TypeScript · Prisma 7 · Supabase (Postgres + Auth) · Tailwind 4 · Leaflet**

A marketplace that connects the brand's community with the teachers who run chalk-paint workshops across Argentina, plus a public map of the stores that sell the products.

## Features
- **Public site:** upcoming workshops with filters by province and category, teacher profiles, workshop pages with a WhatsApp booking link. Past workshops drop out automatically (the home page revalidates every 10 minutes).
- **Teacher portal:** sign-up with onboarding, profile, and self-service workshop publishing.
- **Student accounts:** registration, favorites and history.
- **"Where to buy" map:** Leaflet + marker clustering over ~550 points of sale, with retail/wholesale channels.
- **Store self-validation:** each store gets a private token link to review and correct its own public listing (address, hours, contact), with a free-text comments field.
- **Admin panel:** teachers, workshops, categories, subscribers and points of sale.
- **Data pipeline:** `scripts/etl_pdv.py` turns the store sign-up form export into a seed file: groups branches by tax ID (detects multi-branch chains), fixes coordinates, normalizes provinces, classifies the channel and generates validation tokens.
- **Ops:** GitHub Actions keep-alive for the Supabase free tier (`.github/workflows/keepalive.yml`).

## Run locally
```bash
npm install
cp .env.local.example .env.local   # fill in Supabase URL/keys and DATABASE_URL/DIRECT_URL
npx prisma db push && npm run db:seed
npm run dev
```

## Notes on this public version
- `prisma/pdv-seed.json` contains **12 fictional stores**; the real store list (with tax IDs and contacts) is not published.
- Seed workshops are generated relative to the current date, so the demo always shows upcoming events.
- UI copy is in Spanish (Argentine audience).
