from __future__ import annotations
import uuid
import streamlit as st
import pandas as pd
from db.supabase_client import get_client


def _uid() -> str:
    return st.session_state.get("user_id", "")


def insert_transactions(transactions: list[dict], import_id: str | None = None,
                        filename: str | None = None) -> int:
    uid = _uid()
    if import_id is None:
        import_id = str(uuid.uuid4())
    for t in transactions:
        t["import_id"] = import_id
        t["user_id"]   = uid
        if filename:
            t["filename"] = filename
    result = get_client().table("transactions").insert(transactions).execute()
    return len(result.data)


def fetch_all() -> pd.DataFrame:
    result = (get_client().table("transactions")
              .select("*")
              .eq("user_id", _uid())
              .order("fecha", desc=True)
              .execute())
    return _to_df(result.data)


def fetch_imports() -> pd.DataFrame:
    result = (get_client().table("transactions")
              .select("import_id, banco, fecha, created_at, pesos, filename")
              .eq("user_id", _uid())
              .not_.is_("import_id", "null")
              .order("created_at", desc=True)
              .execute())
    if not result.data:
        return pd.DataFrame(columns=["import_id", "fecha_import", "tarjeta",
                                     "archivo", "consumos", "total_pesos"])
    df = pd.DataFrame(result.data)
    df["pesos"]    = pd.to_numeric(df["pesos"], errors="coerce").fillna(0)
    df["filename"] = df["filename"].fillna("—")
    grouped = (df.groupby("import_id")
               .agg(
                   fecha_import=("created_at", "first"),
                   tarjeta=("banco", "first"),
                   archivo=("filename", "first"),
                   consumos=("import_id", "count"),
                   total_pesos=("pesos", "sum"),
               )
               .reset_index()
               .sort_values("fecha_import", ascending=False))
    grouped["fecha_import"] = (pd.to_datetime(grouped["fecha_import"])
                               .dt.strftime("%d/%m/%Y %H:%M"))
    return grouped


def delete_by_import(import_id: str) -> int:
    result = (get_client().table("transactions")
              .delete()
              .eq("import_id", import_id)
              .eq("user_id", _uid())
              .execute())
    return len(result.data)


def delete_transactions(ids: list[str]) -> int:
    result = (get_client().table("transactions")
              .delete()
              .in_("id", ids)
              .eq("user_id", _uid())
              .execute())
    return len(result.data)


def update_transaction(id: str, fields: dict) -> None:
    get_client().table("transactions").update(fields).eq("id", id).execute()


def available_months() -> list[str]:
    result = (get_client().table("transactions")
              .select("fecha")
              .eq("user_id", _uid())
              .order("fecha", desc=True)
              .execute())
    if not result.data:
        return []
    return sorted({r["fecha"][:7] for r in result.data}, reverse=True)


def _to_df(data: list) -> pd.DataFrame:
    empty_cols = ["id", "fecha", "descripcion", "pesos", "dolares",
                  "categoria", "banco", "cuota", "import_id", "created_at"]
    if not data:
        return pd.DataFrame(columns=empty_cols)
    df = pd.DataFrame(data)
    df["fecha"]   = pd.to_datetime(df["fecha"])
    df["pesos"]   = pd.to_numeric(df["pesos"],   errors="coerce").fillna(0)
    df["dolares"] = pd.to_numeric(df["dolares"], errors="coerce").fillna(0)
    return df


def _next_month(year_month: str) -> str:
    from dateutil.relativedelta import relativedelta
    from datetime import date
    y, m = map(int, year_month.split("-"))
    d = date(y, m, 1) + relativedelta(months=1)
    return d.strftime("%Y-%m-%d")
