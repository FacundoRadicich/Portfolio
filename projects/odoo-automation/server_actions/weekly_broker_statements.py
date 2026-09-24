# Odoo server action (Settings > Technical > Server Actions), run weekly by a
# scheduled action (ir.cron) every Monday at 08:00.
#
# For each sales broker, emails the unpaid invoices of the broker's customers,
# grouped by customer, with one PDF for the whole portfolio plus one PDF per
# customer that the broker can forward as-is.
#
# Brokers are modeled as partner tags (res.partner.category). The broker's own
# contact is the partner whose name matches the tag exactly, so adding a broker
# needs no code change: create the tag, the contact, and tag the customers.
#
# Runs inside Odoo's safe_eval sandbox: no imports, and no type()/isinstance().
# Available: env, datetime, and basic builtins (len, sum, sorted, str...).

CONTROL_CC = ""  # optional address copied on every email


def money(value):
    return "$ {:,.2f}".format(value)


def statement_html(title, groups):
    rows = ""
    grand_total = 0.0
    for partner_name, invoices in groups:
        subtotal = sum(invoices.mapped("amount_residual"))
        grand_total += subtotal
        rows += "<tr><td colspan='4' style='padding-top:12px'><b>" + partner_name + "</b></td></tr>"
        for inv in invoices.sorted(lambda i: i.invoice_date or datetime.date.today()):
            rows += "<tr><td>" + (inv.name or "") + "</td><td>" + str(inv.invoice_date or "") + "</td><td>" + str(inv.invoice_date_due or "") + "</td><td style='text-align:right'>" + money(inv.amount_residual) + "</td></tr>"
        rows += "<tr><td colspan='3' style='text-align:right'>Subtotal</td><td style='text-align:right'><b>" + money(subtotal) + "</b></td></tr>"
    return ("<h2>" + title + "</h2><table style='width:100%;border-collapse:collapse'>"
            "<tr><th>Invoice</th><th>Date</th><th>Due</th><th style='text-align:right'>Balance</th></tr>"
            + rows + "</table><p style='text-align:right'><b>Total: " + money(grand_total) + "</b></p>"), grand_total


def render_pdf(html, filename):
    result = env["ir.actions.report"]._run_wkhtmltopdf(["<html><body>" + html + "</body></html>"])
    pdf_bytes = result if result[:4] == b"%PDF" else result[0]
    return env["ir.attachment"].create({"name": filename, "raw": pdf_bytes, "mimetype": "application/pdf"})


for broker_tag in env["res.partner.category"].search([]):
    broker = env["res.partner"].search([("name", "=", broker_tag.name), ("email", "!=", False)], limit=1)
    if not broker:
        continue
    invoices = env["account.move"].search([
        ("move_type", "=", "out_invoice"),
        ("state", "=", "posted"),
        ("payment_state", "in", ["not_paid", "partial"]),
        ("commercial_partner_id.category_id", "in", [broker_tag.id]),
        ("partner_id", "!=", broker.id),
    ])
    if not invoices:
        continue

    partners = invoices.mapped("commercial_partner_id").sorted(lambda p: p.name)
    groups = [(p.name, invoices.filtered(lambda i: i.commercial_partner_id == p)) for p in partners]

    body, total = statement_html("Account statement: " + broker_tag.name, groups)
    attachments = render_pdf(body, "Statement - " + broker_tag.name + ".pdf")
    for name, customer_invoices in groups:
        customer_html, _ = statement_html("Account statement: " + name, [(name, customer_invoices)])
        attachments |= render_pdf(customer_html, "Statement - " + name + ".pdf")

    env["mail.mail"].create({
        "subject": "Weekly account statement - " + broker_tag.name,
        "email_to": broker.email,
        "email_cc": CONTROL_CC,
        "body_html": "<p>Hi " + broker.name + ", here are the open balances of your customers.</p>" + body,
        "attachment_ids": [(6, 0, attachments.ids)],
    }).send()
