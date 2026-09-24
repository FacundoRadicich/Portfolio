# B2B Sales Intelligence (demo)

**JavaScript · hand-drawn SVG charts · no dependencies** · [Live demo](https://facundoradicich.github.io/Portfolio/sales-intelligence.html)

A replica of the analytics I built on top of the company's Odoo ERP, with **synthetic data** generated in the browser from a fixed seed. The production version pulls confirmed sale orders over XML-RPC and aggregates them in Python (the scoring and repurchase logic is in [`../odoo-automation/odoo_automation/analytics.py`](../odoo-automation/odoo_automation/analytics.py)).

- **Sales:** 6-month KPIs vs. the prior period, monthly revenue stacked by broker, revenue by region and product, and revenue concentration.
- **Customer follow-up:** each customer's own median days between orders against the days since the last one, classified as on track, in window or overdue.
- **Lead scoring:** accounts that never ordered, scored by customer tier, category fit and regional strength among active buyers. The weights are adjustable and the ranking updates live.

Open `index.html` in a browser to run it locally.
