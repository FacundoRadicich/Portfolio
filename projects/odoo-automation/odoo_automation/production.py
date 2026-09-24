"""Production urgency: simulate stock month by month against forecast demand.

Odoo's Master Production Schedule shows a suggested replenishment in the UI,
but that value is computed at render time and cannot be read through the API.
This module replicates the logic so the ranking can be produced as a report.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ProductionNeed:
    product: str
    on_hand: float
    first_shortage_month: int | None  # 0 = current month
    total_to_produce: float
    already_negative: bool

    @property
    def urgency(self) -> str:
        if self.already_negative or self.first_shortage_month == 0:
            return "critical"
        if self.first_shortage_month is not None and self.first_shortage_month <= 2:
            return "soon"
        if self.first_shortage_month is not None:
            return "planned"
        return "ok"


def monthly_forecast(sales_ytd: float, months_elapsed: float, horizon: int = 6) -> list[float]:
    """Flat forecast from year-to-date average; a planner can edit it later in Odoo."""
    if months_elapsed <= 0:
        raise ValueError("months_elapsed must be positive")
    return [sales_ytd / months_elapsed] * horizon


def simulate(product: str, on_hand: float, demand: list[float], safety_stock: float = 0.0) -> ProductionNeed:
    """Consume demand month by month, replenishing exactly what is missing."""
    stock = on_hand
    first_shortage = None
    to_produce = 0.0
    for month, qty in enumerate(demand):
        stock -= qty
        if stock < safety_stock:
            if first_shortage is None:
                first_shortage = month
            refill = safety_stock - stock
            to_produce += refill
            stock += refill
    return ProductionNeed(product, on_hand, first_shortage, round(to_produce, 2), on_hand < 0)


def rank(needs: list[ProductionNeed]) -> list[ProductionNeed]:
    order = {"critical": 0, "soon": 1, "planned": 2, "ok": 3}
    return sorted(needs, key=lambda n: (order[n.urgency], n.first_shortage_month if n.first_shortage_month is not None else 99, -n.total_to_produce))
