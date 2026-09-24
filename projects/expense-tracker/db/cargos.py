from __future__ import annotations
import uuid
import pandas as pd
from db.supabase_client import get_client, get_current_user_id


def insert_cargos(cargos: list[dict], import_id: str | None = None,
                   filename: str | None = None) -> int:
    uid = get_current_user_id()
    if import_id is None:
        import_id = str(uuid.uuid4())
    rows = []
    for c in cargos:
        rows.append({**c, "user_id": uid, "import_id": import_id, "filename": filename})
    result = get_client().table("cargos_financieros").insert(rows).execute()
    return len(result.data)


def fetch_all_cargos() -> pd.DataFrame:
    result = (get_client().table("cargos_financieros")
              .select("*")
              .eq("user_id", get_current_user_id())
              .order("fecha", desc=True)
              .execute())
    empty_cols = ["id", "fecha", "concepto", "categoria", "monto", "banco",
                  "import_id", "filename", "created_at"]
    if not result.data:
        return pd.DataFrame(columns=empty_cols)
    df = pd.DataFrame(result.data)
    df["fecha"] = pd.to_datetime(df["fecha"])
    df["monto"] = pd.to_numeric(df["monto"], errors="coerce").fillna(0)
    return df


def delete_cargos(ids: list[str]) -> int:
    result = (get_client().table("cargos_financieros")
              .delete()
              .in_("id", ids)
              .eq("user_id", get_current_user_id())
              .execute())
    return len(result.data)
