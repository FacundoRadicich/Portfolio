"""Sales analytics on confirmed sale orders: repurchase rhythm and lead scoring."""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import date
from statistics import median

# ---------------------------------------------------------------- repurchase

OVERDUE_FACTOR = 1.5


def purchase_status(order_dates: list[date], today: date) -> tuple[str, int | None, int]:
    """Compare days since the last order with the customer's own median rhythm.

    Returns (status, median_days_between_orders, days_since_last_order).
    """
    if not order_dates:
        raise ValueError("customer has no orders")
    dates = sorted(set(order_dates))
    since = (today - dates[-1]).days
    if len(dates) < 2:
        return "single", None, since
    rhythm = int(median((b - a).days for a, b in zip(dates, dates[1:])))
    if since > rhythm * OVERDUE_FACTOR:
        return "overdue", rhythm, since
    if since > rhythm:
        return "window", rhythm, since
    return "on_track", rhythm, since


# ---------------------------------------------------------------- lead scoring

TIER_SCORES = {"Strategic": 100, "Key": 85, "Potential": 70, "Standard": 40}


@dataclass(frozen=True)
class Weights:
    tier: float = 0.40
    category: float = 0.30
    region: float = 0.30

    def normalized(self) -> "Weights":
        total = self.tier + self.category + self.region
        if total <= 0:
            raise ValueError("weights must add up to more than zero")
        return Weights(self.tier / total, self.category / total, self.region / total)


def strength_index(values: list[str]) -> dict[str, int]:
    """Share of active buyers per value, scaled so the strongest equals 100."""
    counts = Counter(v for v in values if v)
    if not counts:
        return {}
    top = max(counts.values())
    return {k: round(v / top * 100) for k, v in counts.items()}


def score_leads(leads: list[dict], active_buyers: list[dict], weights: Weights = Weights()) -> list[dict]:
    """Rank accounts with zero orders by resemblance to the customers who do buy.

    Each lead/buyer dict needs: "category", "region"; leads also need "tier".
    Returns new dicts (inputs are not mutated), highest score first.
    """
    w = weights.normalized()
    cat = strength_index([b["category"] for b in active_buyers])
    reg = strength_index([b["region"] for b in active_buyers])
    scored = [
        {**lead, "score": round(
            w.tier * TIER_SCORES.get(lead.get("tier"), 0)
            + w.category * cat.get(lead.get("category"), 0)
            + w.region * reg.get(lead.get("region"), 0)
        )}
        for lead in leads
    ]
    return sorted(scored, key=lambda l: l["score"], reverse=True)
