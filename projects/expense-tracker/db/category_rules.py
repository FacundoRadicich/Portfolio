from __future__ import annotations
from db.supabase_client import get_client, get_current_user_id
from categories import UNCATEGORIZED


def fetch_category_rules() -> dict[str, str]:
    uid = get_current_user_id()
    result = (get_client().table("category_rules")
              .select("merchant_key, categoria")
              .eq("user_id", uid)
              .execute())
    return {r["merchant_key"]: r["categoria"] for r in result.data}


def learn_categories(descripcion_categoria_pairs: dict[str, str]) -> None:
    """Guarda/actualiza qué categoría corresponde a cada comercio, a partir
    de merchant_key -> categoria ya elegida por el usuario. Ignora 'Otros'
    porque es el valor por defecto cuando no se sabe la categoría, no una
    clasificación real que valga la pena recordar."""
    uid = get_current_user_id()
    rows = [
        {"user_id": uid, "merchant_key": key, "categoria": categoria}
        for key, categoria in descripcion_categoria_pairs.items()
        if key and categoria and categoria != UNCATEGORIZED
    ]
    if not rows:
        return
    get_client().table("category_rules").upsert(rows, on_conflict="user_id,merchant_key").execute()
