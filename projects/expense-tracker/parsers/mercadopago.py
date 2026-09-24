import csv
import io
from categories import get_categoria

# Solo incluimos SETTLEMENT negativo; PAYOUTS son retiros al banco (no gastos)
SKIP_TYPES = {'PAYOUTS'}


def _parse_amount(s: str) -> float:
    try:
        return float((s or '0').replace(',', '.'))
    except ValueError:
        return 0.0


def _parse_date(s: str) -> str:
    """'2026-05-31T13:38:55.000-03:00' → '2026-05-31'"""
    return (s or '')[:10]


def _build_description(row: dict) -> str:
    """Prioridad: POS_NAME > STORE_NAME > wallet > nombre del pagador."""
    candidates = [
        row.get('POS_NAME', '').strip().strip('"'),
        row.get('STORE_NAME', '').strip().strip('"'),
    ]

    wallet    = row.get('POI_WALLET_NAME', '').strip().strip('"')
    bank_name = row.get('POI_BANK_NAME', '').strip().strip('"')
    if wallet:
        candidates.append(f"{wallet} - {bank_name}".strip(' -') if bank_name else wallet)

    desc_field = row.get('DESCRIPTION', '').strip().strip('"')
    if desc_field:
        candidates.append(desc_field)

    payer = row.get('PAYER_NAME', '').strip().strip('"')
    if payer:
        candidates.append(payer)

    for c in candidates:
        if c:
            return c

    return 'Mercado Pago'


def parse_mercadopago(csv_file) -> list[dict]:
    content = csv_file.read()
    if isinstance(content, bytes):
        content = content.decode('utf-8', errors='replace')

    reader = csv.DictReader(io.StringIO(content), delimiter=';')
    consumos = []

    for row in reader:
        tx_type = (row.get('TRANSACTION_TYPE') or '').strip()
        if tx_type in SKIP_TYPES:
            continue

        amount = _parse_amount(row.get('SETTLEMENT_NET_AMOUNT') or '0')

        # Solo egresos (negativos) y mayores a $1
        if amount >= 0 or abs(amount) < 1:
            continue

        date_str = row.get('TRANSACTION_DATE') or ''
        if not date_str:
            continue

        desc = _build_description(row)

        consumos.append({
            'fecha':       _parse_date(date_str),
            'descripcion': desc,
            'pesos':       abs(amount),
            'dolares':     None,
            'cuota':       None,
            'banco':       'Mercado Pago',
            'categoria':   get_categoria(desc),
        })

    return consumos
