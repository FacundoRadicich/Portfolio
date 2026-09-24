# Expense Tracker ("Dr. Contable")

**Python · Streamlit · pdfplumber · pandas · Plotly · Supabase** · [Live demo](https://dr-contable-demo.streamlit.app/)

A personal-finance app built for a family member: upload the monthly credit-card and wallet statements as PDFs and get every transaction extracted, categorized and charted, instead of typing them into a spreadsheet.

## Features
- **Statement parsers for 6 issuers:** BBVA, Galicia (Visa and Amex), Macro, Santander and Mercado Pago. Each bank prints its statement differently, so each parser handles its own layout: date formats with Spanish month names, installments (`03/06`), peso and dollar columns, and card suffixes in descriptions.
- **Automatic bank detection** (`parsers/detector.py`) from the PDF text, so the user just drops the file.
- **Rule-based categorization** with user-editable rules stored in the database (`category_rules`).
- **Financial charges tracking:** interest, taxes and fees separated from real consumption.
- **Dashboard:** monthly spend by category, evolution over time, USD transactions converted with the exchange rate.
- **Auth:** Supabase email login with password recovery.

## Demo mode
When no Supabase credentials are configured, the app starts in **demo mode**: no login, six months of fictional transactions across three cards, and an in-memory database (`db/demo_client.py`) that mimics the Supabase query builder, so every screen runs unchanged. Nothing is saved; each visitor gets a fresh copy.

To try the PDF reader, download the fictional statement from the sidebar (`samples/resumen_macro_demo.pdf`) and upload it in **Cargar PDF**: the Macro parser extracts its 10 transactions, installments included, and categorizes them.

## Run locally
```bash
pip install -r requirements.txt
streamlit run app.py        # demo mode, no setup needed
# for the real app: cp .streamlit/secrets.toml.example .streamlit/secrets.toml and fill in Supabase URL/key
```
SQL for the extra tables is in `scripts/`.

## Notes on this public version
No statements or personal data are included. The UI is in Spanish.
