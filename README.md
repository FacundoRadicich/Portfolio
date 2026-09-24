# Facundo Radicich · Portfolio

**AI & Data Automation · Python · SQL · LLMs · ERP integrations**

I founded and ran OH My Chalk!, a paint brand sold through a B2B network across Argentina. I led its sales and marketing teams, set up its CRM (Pipedrive), led and implemented its move to an ERP (Odoo), and in 2026 built the data and automation systems it runs on. This repository collects those tools, published with anonymized or synthetic data.

**Website with live demo:** https://facundoradicich.github.io/portfolio/ · **Resume:** [EN](docs/Facundo_Radicich_CV_EN.pdf) · [ES](docs/Facundo_Radicich_CV_ES.pdf)

## Projects

| Project | What it is | Stack |
|---|---|---|
| [LLM Order Intake](projects/order-intake-api) | Turns wholesale orders (Excel, PDF or a handwritten photo read by an LLM) into priced orders and ERP files; tracks invoices, payments and commissions for 10 brokers. **In production.** | FastAPI, Claude API, Supabase, Render |
| [Odoo ERP Automation](projects/odoo-automation) | Order-loading rules (tax ID matching, pricelists, VAT, price drift), stock-out simulation for production planning, weekly broker statements. Tested business rules. | Python, XML-RPC, Odoo 19 |
| [B2B Sales Intelligence](projects/sales-intelligence-demo) | Sales dashboard with repurchase tracking and an interactive lead-scoring model. [Live demo](https://facundoradicich.github.io/portfolio/sales-intelligence.html). | JavaScript, SVG |
| [CRM Sales Effort Analysis](projects/crm-sales-effort) | 2,563 Pipedrive deals: strategic accounts bring 20% of revenue with 6% of the effort. | pandas, matplotlib, Power BI |
| [Customer Churn Model](projects/churn-model) | Five classifiers compared with cross-validation and ROC-AUC, explainability check, cost-based threshold. | scikit-learn |
| [Workshop Marketplace](projects/workshop-marketplace) | Teachers publish painting workshops; students book; public map of ~550 points of sale with store self-validation. | Next.js 16, TypeScript, Prisma, Postgres |
| [Expense Tracker](projects/expense-tracker) | Extracts and categorizes transactions from credit-card PDF statements of six banks. | Streamlit, pdfplumber, Supabase |

## About the data
No real customer, supplier or financial data is published here. Store and customer lists were replaced with fictional records, prices and deal values were randomized or rescaled, and credentials were moved to environment variables.

## Contact
facundoradicich@gmail.com · [LinkedIn](https://www.linkedin.com/in/facundoradicich-8b1931130) · Buenos Aires, Argentina (open to remote)
