# Odoo ERP Automation

**Python · Odoo 19 external API (XML-RPC) · Odoo server actions · unittest**

In 2024 the company moved from Pipedrive (CRM only) to Odoo, to run sales, customers, accounting and production in one system. These are the automations I built on top of it. The business rules live in pure functions with tests, and the Odoo calls stay in a thin client.

| Module | What it does |
|---|---|
| `odoo_automation/orders.py` | Turns a parsed order into a draft `sale.order`: matches the customer by name, then by tax ID; avoids double discounts for customers with their own pricelist; clears VAT for non-registered customers; reports missing products and catalog price drift. Orders stay as quotations for a human to confirm. |
| `odoo_automation/production.py` | Month-by-month stock simulation against a demand forecast to rank production urgency (critical / soon / planned). This replicates Odoo's Master Production Schedule suggestion, which the API does not expose. |
| `odoo_automation/analytics.py` | Repurchase rhythm per customer (on track / in window / overdue, based on each customer's own median days between orders) and a weighted lead-scoring model for accounts that never ordered. |
| `server_actions/weekly_broker_statements.py` | Scheduled server action: every Monday each sales broker gets an email with their customers' unpaid invoices grouped by customer, plus one PDF for the whole portfolio and one per customer. Written for Odoo's restricted `safe_eval` sandbox. |
| `odoo_automation/client.py` | XML-RPC client authenticated with an API key from environment variables. |

In production this setup also covered 132 bills of materials, reorder rules for packaging and a 6-month demand forecast loaded into the MPS.

## Run the tests
```bash
python -m unittest discover -s tests -t .
```
No Odoo instance is needed: the tests cover the business rules. To talk to a real instance, set `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME` and `ODOO_API_KEY` (see `.env.example`).
