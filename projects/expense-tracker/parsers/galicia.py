import re
import io
import pdfplumber
from categories import get_categoria

DATE_RE = re.compile(r'^\d{2}-\d{2}-\d{2}')
AMOUNT_RE = re.compile(r'-?\d{1,3}(?:\.\d{3})*,\d{2}')
CUOTA_RE = re.compile(r'\b(\d{2}/\d{2})\b')
COMPROBANTE_RE = re.compile(r'\b\d{6}\b')

SKIP_KEYWORDS = {
    'SU PAGO', 'DEV.IMP.', 'SALDO ANTERIOR', 'INTERESES',
    'DB IVA', 'PERCEPCION', 'IIBB', 'IVA RG', 'DB.RG',
    'TOTAL A PAGAR', 'PAGO MINIMO',
}


def _parse_amount(s: str) -> float:
    return float(s.replace('.', '').replace(',', '.'))


def _parse_date(s: str) -> str:
    d, m, y = s.split('-')
    return f"20{y}-{m}-{d}"


def _should_skip(line: str) -> bool:
    upper = line.upper()
    return any(kw in upper for kw in SKIP_KEYWORDS)


def _parse_line(line: str) -> dict | None:
    if not DATE_RE.match(line):
        return None
    if _should_skip(line):
        return None

    amounts = AMOUNT_RE.findall(line)
    if not amounts:
        return None

    last_amount = amounts[-1]
    is_usd = 'USD' in line.upper()

    # Work right-to-left: strip amount, then comprobante
    idx = line.rfind(last_amount)
    before_amount = line[:idx].rstrip()

    comp_matches = list(COMPROBANTE_RE.finditer(before_amount))
    if comp_matches:
        last_comp = comp_matches[-1]
        before_comp = (before_amount[:last_comp.start()] + before_amount[last_comp.end():]).strip()
    else:
        before_comp = before_amount

    # Extract cuota (e.g. 09/12)
    cuota_match = CUOTA_RE.search(before_comp)
    cuota = None
    if cuota_match:
        cuota = cuota_match.group(1)
        before_comp = (before_comp[:cuota_match.start()] + before_comp[cuota_match.end():]).strip()

    # Remove date + type indicator (K or *)
    desc = re.sub(r'^\d{2}-\d{2}-\d{2}\s+[K\*]\s+', '', before_comp).strip()
    # Strip leading date if pdfplumber duplicated it (extraction artifact)
    desc = re.sub(r'^\d{2}-\d{2}-\d{2}\s+', '', desc).strip()
    # Remove inline "USD X,XX" notation
    desc = re.sub(r'\s*USD\s+[\d,]+', '', desc).strip()

    if not desc:
        return None

    amount_val = _parse_amount(last_amount)

    return {
        'fecha': _parse_date(line[:8]),
        'descripcion': desc,
        'pesos': None if is_usd else amount_val,
        'dolares': amount_val if is_usd else None,
        'cuota': cuota,
        'banco': 'Galicia Visa',
        'categoria': get_categoria(desc),
    }


def parse_galicia(pdf_file: io.BytesIO) -> list[dict]:
    consumos = []

    with pdfplumber.open(pdf_file) as pdf:
        full_text = '\n'.join(page.extract_text() or '' for page in pdf.pages)

    in_section = False
    for line in full_text.split('\n'):
        line = line.strip()

        if 'DETALLE DEL CONSUMO' in line:
            in_section = True
            continue

        if in_section and re.search(r'TARJETA \d+ Total Consumos', line, re.IGNORECASE):
            break

        if not in_section:
            continue

        result = _parse_line(line)
        if result:
            consumos.append(result)

    return consumos
