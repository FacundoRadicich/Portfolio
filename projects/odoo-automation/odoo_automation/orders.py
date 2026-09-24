"""Turn a parsed B2B order into a draft `sale.order` in Odoo.

Business rules learned in production:
- Customers are often written with their trade name while Odoo stores the
  legal name, so matching falls back from name to tax ID (CUIT / VAT).
- A customer with its own discount pricelist must NOT also get a line
  discount, or the discount is applied twice.
- Customers that are not VAT-registered ("Responsable Inscripto") get their
  taxes cleared explicitly, because without a fiscal position Odoo applies the
  product's default 21% VAT.
- Catalog prices can drift from Odoo's list price; drift is reported, never
  silently fixed.
- Orders are created as drafts (quotations). A person confirms them in Odoo.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

VAT_REGISTERED = "IVA Responsable Inscripto"


@dataclass(frozen=True)
class OrderLine:
    product_name: str
    quantity: float
    catalog_price: float | None = None


@dataclass(frozen=True)
class Customer:
    id: int
    name: str
    pricelist_name: str | None
    vat_status: str | None


@dataclass
class OrderPlan:
    customer: Customer
    lines: list[dict]
    missing_products: list[str] = field(default_factory=list)
    price_drift: list[tuple[str, float, float]] = field(default_factory=list)


def normalize_vat(raw: str) -> str:
    """'20-12345678-9' -> '20123456789'."""
    return re.sub(r"\D", "", raw or "")


def has_own_discount_pricelist(customer: Customer) -> bool:
    return bool(customer.pricelist_name and customer.pricelist_name.lower().startswith("descuento"))


def build_order_lines(
    customer: Customer,
    lines: list[OrderLine],
    products: dict[str, dict],
    line_discount: float = 0.0,
    drift_tolerance: float = 0.01,
) -> OrderPlan:
    """Pure function: decides every field of every order line.

    `products` maps exact product name -> {"id": int, "list_price": float}.
    """
    plan = OrderPlan(customer=customer, lines=[])
    own_pricelist = has_own_discount_pricelist(customer)
    clear_taxes = customer.vat_status != VAT_REGISTERED

    for line in lines:
        product = products.get(line.product_name)
        if product is None:
            plan.missing_products.append(line.product_name)
            continue

        if line.catalog_price is not None:
            diff = abs(product["list_price"] - line.catalog_price)
            if diff > drift_tolerance:
                plan.price_drift.append((line.product_name, line.catalog_price, product["list_price"]))

        values: dict = {"product_id": product["id"], "product_uom_qty": line.quantity}
        if not own_pricelist:
            # Odoo computes the price from the customer's pricelist when price_unit is omitted
            values["price_unit"] = product["list_price"]
            if line_discount:
                values["discount"] = float(line_discount)
        if clear_taxes:
            values["tax_ids"] = [(6, 0, [])]
        plan.lines.append(values)

    return plan


def find_customer(client, name: str, vat: str | None = None) -> Customer | None:
    """Match by name first (case-insensitive), then by tax ID."""
    fields = ["id", "name", "property_product_pricelist", "l10n_ar_afip_responsibility_type_id"]
    rows = client.search_read("res.partner", [["name", "ilike", name], ["customer_rank", ">", 0]], fields, limit=2)
    if len(rows) != 1 and vat:
        digits = normalize_vat(vat)
        rows = client.search_read("res.partner", [["vat", "ilike", digits[2:10] if len(digits) == 11 else digits]], fields, limit=2)
    if len(rows) != 1:
        return None
    r = rows[0]
    return Customer(
        id=r["id"],
        name=r["name"],
        pricelist_name=r["property_product_pricelist"][1] if r["property_product_pricelist"] else None,
        vat_status=r["l10n_ar_afip_responsibility_type_id"][1] if r["l10n_ar_afip_responsibility_type_id"] else None,
    )


def create_draft_order(client, plan: OrderPlan, reference: str) -> int:
    if not plan.lines:
        raise ValueError("Order has no valid lines")
    return client.call("sale.order", "create", {
        "partner_id": plan.customer.id,
        "client_order_ref": reference,
        "order_line": [(0, 0, values) for values in plan.lines],
    })
