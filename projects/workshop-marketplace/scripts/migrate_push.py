"""Corre `prisma db push` contra el SESSION pooler (5432) via --url.

Motivo: el transaction pooler (pgbouncer, 6543) cuelga el DDL de las
migraciones; Prisma necesita una conexion 'session' para DDL. Pasamos
la URL del session pooler con --url (no toca .env.local).
"""
import re
import subprocess
import sys
from pathlib import Path

ENV = Path(".env.local")


def session_url():
    txt = ENV.read_text(encoding="utf-8")
    m = re.search(r'(?m)^\s*DIRECT_URL\s*=\s*"?([^"\n]+)"?', txt)
    if not m:
        sys.exit("No encontre DIRECT_URL en .env.local")
    return m.group(1)


def main():
    url = session_url()
    try:
        proc = subprocess.run(
            f'npx prisma db push --url "{url}"',
            shell=True, capture_output=True, text=True, timeout=180,
            encoding="utf-8", errors="replace",
        )
        def safe(s):
            return (s or "").encode("ascii", "replace").decode("ascii")
        print(safe(proc.stdout)[-2500:])
        if proc.returncode != 0:
            print("STDERR:", safe(proc.stderr)[-2000:])
        sys.exit(proc.returncode)
    except subprocess.TimeoutExpired:
        print("TIMEOUT: db push tardo demasiado (¿base aun arrancando?)")
        sys.exit(1)


if __name__ == "__main__":
    main()
