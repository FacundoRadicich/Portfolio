import re
import io
import pdfplumber
from categories import get_categoria

DATE_RE = re.compile(r'^\d{2}\.\d{2}\.\d{2}')
AMOUNT_RE = re.compile(r'-?\d{1,3}(?:\.\d{3})*,\d{2}')
CUOTA_RE = re.compile(r'\bCuota\s+(\d{2}/\d{2})\b', re.IGNORECASE)
COMPROBANTE_RE = re.compile(r'\b\d{6}[K\*]')

SKIP_KEYWORDS = {
    'SU PAGO EN PESOS', 'SU PAGO EN USD', 'SALDO ANTERIOR',
    'INTERESES FINANCIACION', 'DB IVA', 'SALDO ACTUAL',
    'PAGO MINIMO', 'DEBITAREMOS',
}


def _parse_amount(s: str) -> float:
    return float(s.replace('.', '').replace(',', '.'))


def _parse_date(s: str) -> str:
    d, m, y = s.split('.')
    return f"20{y}-{m}-{d}"


def _should_skip(line: str) -> bool:
    upper = line.upper()
    return any(kw in upper for kw in SKIP_KEYWORDS)


def _parse_line(line: str) -> dict | None:
    # Strip pdfplumber table artifacts
    line = line.rstrip('_ \t')

    if not DATE_RE.match(line):
        return None
    if _should_skip(line):
        return None

    amounts = AMOUNT_RE.findall(line)
    if not amounts:
        return None

    last_amount = amounts[-1]

    # Skip lines with trailing negative (payments/adjustments with "- _" pattern)
    if last_amount.startswith('-'):
        return None

    # Extract cuota ("Cuota 03/03")
    cuota_match = CUOTA_RE.search(line)
    cuota = cuota_match.group(1) if cuota_match else None

    # Work right-to-left: strip amount, then comprobante
    idx = line.rfind(last_amount)
    before_amount = line[:idx].rstrip()

    comp_match = COMPROBANTE_RE.search(before_amount)
    if comp_match:
        before_comp = (before_amount[:comp_match.start()] + before_amount[comp_match.end():]).strip()
    else:
        before_comp = before_amount

    # Remove cuota text
    if cuota:
        before_comp = re.sub(r'\bCuota\s+\d{2}/\d{2}\b', '', before_comp, flags=re.IGNORECASE).strip()

    # Remove date
    desc = re.sub(r'^\d{2}\.\d{2}\.\d{2}\s*', '', before_comp).strip()

    if not desc:
        return None

    return {
        'fecha': _parse_date(line[:8]),
        'descripcion': desc,
        'pesos': _parse_amount(last_amount),
        'dolares': None,
        'cuota': cuota,
        'banco': 'Macro Visa',
        'categoria': get_categoria(desc),
    }


def parse_macro(pdf_file: io.BytesIO) -> list[dict]:
    consumos = []

    with pdfplumber.open(pdf_file) as pdf:
        full_text = '\n'.join(page.extract_text() or '' for page in pdf.pages)

    in_section = False
    for line in full_text.split('\n'):
        line = line.strip()

        if re.search(r'SALDO ANTERIOR', line, re.IGNORECASE):
            in_section = True
            continue

        if in_section and re.search(r'Tarjeta \d+ Total Consumos', line, re.IGNORECASE):
            break

        if not in_section:
            continue

        result = _parse_line(line)
        if result:
            consumos.append(result)

    return consumos
