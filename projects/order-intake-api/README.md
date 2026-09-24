# Order Intake API

**FastAPI + Supabase + Claude API (vision)** · Deployed on Render · In daily use at OH My Chalk!

Wholesale orders arrive in every format: Excel lists, a customer's own purchase-order PDF, or a photo of a handwritten note. This app turns any of them into a clean, priced order in two steps (preview, then confirm), exports the ERP import file, and tracks each order through delivery, invoicing, payment and the broker's commission.

## What it does
- **Reads handwritten orders with an LLM.** Photos are sent to the Claude API (vision) with a constrained output format (`QTY|PRODUCT`), then matched against the product catalog with fuzzy name normalization.
- **Parses several Excel layouts** (simple lists, a third-party product-code list, the company's own order-form grid) into the same line-item structure.
- **Two-step flow:** `/api/procesar` builds a draft with prices, discounts and VAT for the user to review; `/api/confirmar` stores it and returns a ZIP with the Odoo import file.
- **Order lifecycle for a network of 10 sales brokers:** upload invoice / credit note / payment proof, register cash payments, compute the 7% commission on the net amount, and track commission payouts.
- **Role-based access:** Supabase Auth (JWT). Admin sees everything; each broker only sees their own orders and commissions (`/dashboard`).
- **Hardening:** rate limiting on the LLM endpoint (slowapi, 10/min), upload type validation, private storage bucket with signed URLs, `Cache-Control: no-store` on private pages.

## Stack
Python 3.11 · FastAPI · pandas / openpyxl / xlsxwriter · Anthropic SDK · Supabase (Postgres, Auth, Storage) · vanilla JS front end · Render

## Run locally
```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...          # photo orders
export SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=...
# or, without Supabase, a simple fallback login:
export BASIC_AUTH_USER=admin BASIC_AUTH_PASS=change-me
uvicorn main:app --reload
```
Database schema: `supabase_schema.sql` (+ `migration_corredor_nullable.sql`).

## Notes on this public version
- `catalogo.xlsx` keeps the real product names but **prices are randomized**.
- The company's order-form template is not included; the app skips that file when it is missing.
- Credentials come only from environment variables.
- UI and API messages are in Spanish (the users are in Argentina).
