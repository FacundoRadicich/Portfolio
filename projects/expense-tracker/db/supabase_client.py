import os

import streamlit as st
from supabase import create_client, Client

_client: Client | None = None


def is_demo() -> bool:
    """Public demo: no Supabase credentials configured (or DEMO_MODE=1)."""
    if os.environ.get("DEMO_MODE") == "1":
        return True
    try:
        return "supabase" not in st.secrets
    except Exception:  # no secrets.toml at all
        return True


def get_client() -> Client:
    global _client
    if is_demo():
        from db.demo_client import DemoClient
        return DemoClient()
    if _client is None:
        url = st.secrets["supabase"]["url"]
        key = st.secrets["supabase"]["key"]
        _client = create_client(url, key)
    return _client


def restore_session() -> None:
    """Restaura la sesión de auth desde session_state en cada rerun."""
    if "access_token" in st.session_state and "refresh_token" in st.session_state:
        try:
            get_client().auth.set_session(
                st.session_state["access_token"],
                st.session_state["refresh_token"],
            )
        except Exception:
            for key in ["access_token", "refresh_token", "user_id", "user_email"]:
                st.session_state.pop(key, None)


def get_current_user_id() -> str | None:
    return st.session_state.get("user_id")
