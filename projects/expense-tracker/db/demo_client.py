"""In-memory stand-in for the Supabase client, used by the public demo.

It implements the small subset of the query builder the app uses
(select / eq / in_ / not_.is_ / order / insert / update / delete / upsert),
so views and queries run unchanged. Data lives in st.session_state: each
visitor gets their own copy, seeded with fictional transactions, and nothing
is persisted.
"""
from __future__ import annotations

import random
import uuid
from datetime import date, datetime, timedelta

import streamlit as st

DEMO_USER_ID = "demo-user"
DEMO_EMAIL = "demo@example.com"


class _Result:
    def __init__(self, data: list[dict]):
        self.data = data


class _Not:
    def __init__(self, query: "_Query"):
        self._query = query

    def is_(self, column: str, value: str) -> "_Query":
        if value == "null":
            self._query._filters.append(lambda r: r.get(column) is not None)
        return self._query


class _Query:
    def __init__(self, rows: list[dict]):
        self._rows = rows
        self._filters: list = []
        self._order: tuple[str, bool] | None = None
        self._columns: list[str] | None = None
        self._action = "select"
        self._payload = None
        self._conflict: list[str] = []
        self.not_ = _Not(self)

    # --- builders
    def select(self, columns: str = "*") -> "_Query":
        self._columns = None if columns.strip() == "*" else [c.strip() for c in columns.split(",")]
        return self

    def eq(self, column: str, value) -> "_Query":
        self._filters.append(lambda r: r.get(column) == value)
        return self

    def in_(self, column: str, values: list) -> "_Query":
        allowed = set(values)
        self._filters.append(lambda r: r.get(column) in allowed)
        return self

    def order(self, column: str, desc: bool = False) -> "_Query":
        self._order = (column, desc)
        return self

    def insert(self, rows) -> "_Query":
        self._action, self._payload = "insert", rows if isinstance(rows, list) else [rows]
        return self

    def upsert(self, rows, on_conflict: str = "") -> "_Query":
        self._action, self._payload = "upsert", rows if isinstance(rows, list) else [rows]
        self._conflict = [c.strip() for c in on_conflict.split(",") if c.strip()]
        return self

    def update(self, fields: dict) -> "_Query":
        self._action, self._payload = "update", fields
        return self

    def delete(self) -> "_Query":
        self._action = "delete"
        return self

    # --- execution
    def _matches(self, row: dict) -> bool:
        return all(f(row) for f in self._filters)

    def execute(self) -> _Result:
        now = datetime.now().replace(microsecond=0).isoformat()
        if self._action == "insert":
            new = [{"id": str(uuid.uuid4()), "created_at": now, **r} for r in self._payload]
            self._rows.extend(new)
            return _Result(new)
        if self._action == "upsert":
            for r in self._payload:
                existing = next((x for x in self._rows if all(x.get(k) == r.get(k) for k in self._conflict)), None)
                if existing:
                    existing.update(r)
                else:
                    self._rows.append({"id": str(uuid.uuid4()), "created_at": now, **r})
            return _Result(list(self._payload))
        if self._action == "update":
            hit = [r for r in self._rows if self._matches(r)]
            for r in hit:
                r.update(self._payload)
            return _Result(hit)
        if self._action == "delete":
            hit = [r for r in self._rows if self._matches(r)]
            self._rows[:] = [r for r in self._rows if not self._matches(r)]
            return _Result(hit)

        rows = [r for r in self._rows if self._matches(r)]
        if self._order:
            col, desc = self._order
            rows = sorted(rows, key=lambda r: str(r.get(col) or ""), reverse=desc)
        if self._columns:
            rows = [{c: r.get(c) for c in self._columns} for r in rows]
        return _Result([dict(r) for r in rows])


class _Auth:
    def sign_out(self) -> None:
        return None

    def set_session(self, *_args) -> None:
        return None


class DemoClient:
    def __init__(self):
        if "_demo_db" not in st.session_state:
            st.session_state["_demo_db"] = _seed()
        self.auth = _Auth()

    def table(self, name: str) -> _Query:
        return _Query(st.session_state["_demo_db"].setdefault(name, []))


# ------------------------------------------------------------------ seed data

_MERCHANTS = [
    ("COTO SUPERMERCADO", "Supermercado", 18_000, 85_000),
    ("JUMBO RETAIL", "Supermercado", 25_000, 120_000),
    ("DIA TIENDA 214", "Supermercado", 6_000, 30_000),
    ("PEDIDOSYA*PROPINA", "Delivery", 9_000, 28_000),
    ("RAPPI ARGENTINA", "Delivery", 11_000, 32_000),
    ("CAFE MARTINEZ", "Cafecito", 3_500, 9_000),
    ("SUSHI CLUB", "Restaurantes", 28_000, 75_000),
    ("PANADERIA LA ESPIGA", "Restaurantes", 4_000, 12_000),
    ("YPF SERVICENTRO", "Transporte", 35_000, 70_000),
    ("UBER *TRIP", "Transporte", 5_000, 19_000),
    ("AUTOPISTAS DEL SOL", "Peajes", 2_500, 6_000),
    ("FARMACIA DEL PUEBLO", "Salud", 8_000, 45_000),
    ("SPOTIFY", "Suscripciones", 4_500, 4_500),
    ("NETFLIX.COM", "Suscripciones", 9_900, 9_900),
    ("EDENOR DEBITO", "Servicios", 30_000, 65_000),
    ("METROGAS", "Servicios", 15_000, 40_000),
    ("ROPA URBANA SRL", "Indumentaria", 30_000, 140_000),
    ("FRAVEGA ONLINE", "Hogar", 60_000, 380_000),
    ("MERPAGO*FERIA", "Varios", 5_000, 25_000),
    ("KIOSCO LA ESQUINA", "Otros", 2_000, 8_000),
]
_CARDS = ["BBVA Visa", "Galicia Visa", "Macro Visa"]


def _seed() -> dict[str, list[dict]]:
    rng = random.Random(2026)
    today = date.today()
    transactions: list[dict] = []
    cargos: list[dict] = []
    for months_back in range(6, 0, -1):
        first = (today.replace(day=1) - timedelta(days=30 * months_back)).replace(day=1)
        for card in _CARDS:
            import_id = str(uuid.uuid4())
            filename = f"resumen_{card.split()[0].lower()}_{first:%Y_%m}.pdf"
            created = datetime.combine(first + timedelta(days=35), datetime.min.time()).isoformat()
            for _ in range(rng.randint(12, 20)):
                name, cat, lo, hi = rng.choice(_MERCHANTS)
                usd = name in ("SPOTIFY", "NETFLIX.COM") and rng.random() < 0.3
                transactions.append({
                    "id": str(uuid.uuid4()), "user_id": DEMO_USER_ID, "import_id": import_id,
                    "filename": filename, "created_at": created, "banco": card,
                    "fecha": (first + timedelta(days=rng.randint(0, 27))).isoformat(),
                    "descripcion": name, "categoria": cat,
                    "pesos": 0 if usd else round(rng.uniform(lo, hi), 2),
                    "dolares": round(rng.uniform(5, 15), 2) if usd else 0,
                    "cuota": f"0{rng.randint(1, 3)}/03" if cat == "Hogar" else None,
                })
            for concepto, cat in (("INTERESES FINANCIACION", "Intereses"), ("IVA RG 4240", "IVA"),
                                  ("PERCEPCION IIBB", "Percepción IIBB")):
                if rng.random() < 0.6:
                    cargos.append({
                        "id": str(uuid.uuid4()), "user_id": DEMO_USER_ID, "import_id": import_id,
                        "filename": filename, "created_at": created, "banco": card,
                        "fecha": (first + timedelta(days=27)).isoformat(),
                        "concepto": concepto, "categoria": cat,
                        "monto": round(rng.uniform(800, 14_000), 2),
                    })
    return {"transactions": transactions, "cargos_financieros": cargos, "category_rules": []}
