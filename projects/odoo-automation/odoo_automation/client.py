"""Thin XML-RPC client for Odoo's external API.

Authenticates with a user API key (never the account password) read from
environment variables, so the same code runs locally and in schedulers.
"""
from __future__ import annotations

import os
import xmlrpc.client
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class OdooConfig:
    url: str
    db: str
    username: str
    api_key: str

    @classmethod
    def from_env(cls) -> "OdooConfig":
        missing = [k for k in ("ODOO_URL", "ODOO_DB", "ODOO_USERNAME", "ODOO_API_KEY") if not os.environ.get(k)]
        if missing:
            raise RuntimeError(f"Missing environment variables: {', '.join(missing)}")
        return cls(
            url=os.environ["ODOO_URL"].rstrip("/"),
            db=os.environ["ODOO_DB"],
            username=os.environ["ODOO_USERNAME"],
            api_key=os.environ["ODOO_API_KEY"],
        )


class OdooClient:
    def __init__(self, config: OdooConfig):
        self._cfg = config
        common = xmlrpc.client.ServerProxy(f"{config.url}/xmlrpc/2/common")
        self._uid = common.authenticate(config.db, config.username, config.api_key, {})
        if not self._uid:
            raise PermissionError("Odoo authentication failed: check username and API key")
        self._models = xmlrpc.client.ServerProxy(f"{config.url}/xmlrpc/2/object", allow_none=True)

    def call(self, model: str, method: str, *args: Any, **kwargs: Any) -> Any:
        return self._models.execute_kw(
            self._cfg.db, self._uid, self._cfg.api_key, model, method, list(args), kwargs
        )

    def search_read(self, model: str, domain: list, fields: list[str], **kwargs: Any) -> list[dict]:
        return self.call(model, "search_read", domain, fields=fields, **kwargs)
