"""Ejecuta un archivo .sql con `prisma db execute`, usando el SESSION pooler
(5432) durante la ejecucion y restaurando el transaction pooler (6543) al final.

Uso: python scripts/run_sql.py prisma/pdv_tables.sql
"""
import os
import re
import subprocess
import sys
from pathlib import Path

ENV = Path(".env.local")
REF = os.environ.get("SUPABASE_PROJECT_REF", "")
HOST = "aws-1-sa-east-1.pooler.supabase.com"


def password(txt):
    m = re.search(r"postgres\." + REF + r":([^@]+)@", txt)
    if not m:
        sys.exit("No pude extraer el password de .env.local")
    return m.group(1)


def set_db(txt, port, extra=""):
    pw = password(txt)
    url = f'DATABASE_URL="postgresql://postgres.{REF}:{pw}@{HOST}:{port}/postgres{extra}"'
    return re.sub(r'(?m)^\s*DATABASE_URL\s*=.*$', url, txt)


def safe(s):
    return (s or "").encode("ascii", "replace").decode("ascii")


def main():
    sql_file = sys.argv[1]
    original = ENV.read_text(encoding="utf-8")
    ENV.write_text(set_db(original, 5432), encoding="utf-8")
    rc = 1
    try:
        p = subprocess.run(
            f"npx prisma db execute --file {sql_file}",
            shell=True, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=180,
        )
        rc = p.returncode
        print("rc", rc)
        print(safe(p.stdout)[-1500:])
        if rc != 0:
            print("ERR", safe(p.stderr)[-1500:])
    finally:
        ENV.write_text(set_db(ENV.read_text(encoding="utf-8"), 6543, "?pgbouncer=true"), encoding="utf-8")
        print("DATABASE_URL restaurado a transaction pooler (6543).")
    sys.exit(rc)


if __name__ == "__main__":
    main()
