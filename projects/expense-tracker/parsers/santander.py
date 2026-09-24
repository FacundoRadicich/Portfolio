import re
import io
import pdfplumber
from categories import get_categoria

DATE_RE = re.compile(r'^(\d{2}/\d{2}/\d{2})')
PESO_AMOUNT_RE = re.compile(r'-?\$\s*[\d.]+,\d{2}')
USD_AMOUNT_RE  = re.compile(r'-?U\$S\s*[\d.]+,\d{2}')

# Movimientos que NO son gastos de consumo
SKIP_PESOS = {
    'SALDO INICIAL', 'SALDO TOTAL',
    'TRANSFERENCIA RECIBIDA',
    'CREDITO TRANSF',
    'PAGO INTERES POR SALDO',
    'ACREDITACION',
    'DEBITO POR COMPRA DE DOLARES',
    'PAGO TARJETA DE CREDITO',
}

SKIP_USD = {
    'SALDO INICIAL', 'SALDO TOTAL',
    'ACREDITACION COMPRA DE DOLARES',
    'PAGO INTERES POR SALDO',
}

# Palabras que indican línea de encabezado de tabla
HEADER_WORDS = {'COMPROBANTE', 'MOVIMIENTO', 'CAJA DE AHORRO', 'CUENTA CORRIENTE',
                'PERÍODO', 'PERIODO', 'ASÍ USASTE', 'RESUMEN'}


def _should_skip(line: str, skip_set: set) -> bool:
    upper = line.upper()
    return any(kw in upper for kw in skip_set)


def _is_header(line: str) -> bool:
    upper = line.upper()
    return any(kw in upper for kw in HEADER_WORDS)


def _parse_date(s: str) -> str:
    d, m, y = s.split('/')
    return f"20{y}-{m}-{d}"


def _parse_peso_amount(s: str) -> float:
    s = re.sub(r'[\$\s]', '', s)
    return float(s.replace('.', '').replace(',', '.'))


def _parse_usd_amount(s: str) -> float:
    s = re.sub(r'U\$S\s*', '', s).strip()
    return float(s.replace('.', '').replace(',', '.'))


def _clean_line(line: str, amounts: list[str]) -> str:
    """Remueve fecha, comprobante y montos de una línea para obtener la descripción."""
    text = DATE_RE.sub('', line).strip()
    # Remueve comprobante (número largo al inicio)
    text = re.sub(r'^\d{5,}\s+', '', text)
    for amt in amounts:
        text = text.replace(amt, '')
    return text.strip()


def _clean_card_suffix(text: str) -> str:
    """Remueve '- tarj nro. XXXX' que agrega el banco en compras con tarjeta."""
    return re.sub(r'\s*-?\s*tarj\s+nro\.?\s*\d+', '', text, flags=re.IGNORECASE).strip()


def _parse_section(lines: list[str], usd: bool = False) -> list[dict]:
    amount_re = USD_AMOUNT_RE if usd else PESO_AMOUNT_RE
    skip_set  = SKIP_USD if usd else SKIP_PESOS

    consumos = []
    i = 0

    while i < len(lines):
        line = lines[i].strip()
        i += 1

        if not line or not DATE_RE.match(line) or _is_header(line):
            continue
        if _should_skip(line, skip_set):
            continue

        amounts = amount_re.findall(line)
        if not amounts:
            continue

        # Solo nos interesan egresos (montos negativos)
        negatives = [a for a in amounts if a.replace(' ', '').startswith('-')]
        if not negatives:
            continue

        movement = negatives[0]
        desc = _clean_line(line, amounts)

        # Línea de continuación (detalle del movimiento)
        if i < len(lines):
            next_line = lines[i].strip()
            if (next_line
                    and not DATE_RE.match(next_line)
                    and not _is_header(next_line)
                    and not amount_re.search(next_line)):
                continuation = _clean_card_suffix(next_line)
                if continuation:
                    desc = f"{desc} {continuation}".strip() if desc else continuation
                i += 1

        desc = _clean_card_suffix(desc)
        if not desc:
            continue

        date_str = DATE_RE.match(line.strip()).group(1)

        if usd:
            amount_val = abs(_parse_usd_amount(movement))
            row = {
                'fecha':       _parse_date(date_str),
                'descripcion': desc,
                'pesos':       None,
                'dolares':     amount_val,
                'cuota':       None,
                'banco':       'Santander',
                'categoria':   get_categoria(desc),
            }
        else:
            amount_val = abs(_parse_peso_amount(movement))
            row = {
                'fecha':       _parse_date(date_str),
                'descripcion': desc,
                'pesos':       amount_val,
                'dolares':     None,
                'cuota':       None,
                'banco':       'Santander',
                'categoria':   get_categoria(desc),
            }

        consumos.append(row)

    return consumos


def parse_santander(pdf_file: io.BytesIO) -> list[dict]:
    with pdfplumber.open(pdf_file) as pdf:
        full_text = '\n'.join(page.extract_text() or '' for page in pdf.pages)

    lines = full_text.split('\n')

    pesos_start   = None
    dolares_start = None

    for idx, line in enumerate(lines):
        upper = line.upper()
        if 'MOVIMIENTOS EN PESOS' in upper and pesos_start is None:
            pesos_start = idx + 1
        if ('MOVIMIENTOS EN D' in upper and 'LARES' in upper and dolares_start is None):
            dolares_start = idx + 1

    consumos = []

    if pesos_start is not None:
        end = dolares_start if dolares_start else len(lines)
        consumos.extend(_parse_section(lines[pesos_start:end], usd=False))

    if dolares_start is not None:
        consumos.extend(_parse_section(lines[dolares_start:], usd=True))

    return consumos
