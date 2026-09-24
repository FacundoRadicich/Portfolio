import re
import io
import pdfplumber
from categories import get_categoria

MESES = {
    'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
    'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
    'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12',
}

DATE_RE = re.compile(r'^(\d{2})-([A-Za-z]{3})-(\d{2})\b')
AMOUNT_RE = re.compile(r'-?\d{1,3}(?:\.\d{3})*,\d{2}')
CUOTA_RE = re.compile(r'\bC\.(\d{2})/(\d{2})\b')

SKIP_KEYWORDS = {'SU PAGO', 'TRANSFERENCIA DEUDA'}


def _parse_amount(s: str) -> float:
    return float(s.replace('.', '').replace(',', '.'))


def _parse_date(day: str, mes_abbr: str, year2: str) -> str:
    mes = MESES[mes_abbr.upper()]
    return f"20{year2}-{mes}-{day}"


def _should_skip(line: str) -> bool:
    upper = line.upper()
    return any(kw in upper for kw in SKIP_KEYWORDS)


def _parse_line(line: str, banco: str) -> dict | None:
    m = DATE_RE.match(line)
    if not m:
        return None
    if _should_skip(line):
        return None

    amounts = AMOUNT_RE.findall(line)
    if not amounts:
        return None

    # Un consumo en moneda extranjera (USD, BRL, EUR, ...) siempre trae DOS
    # importes en la linea: el monto original en esa moneda y, al final, el
    # equivalente ya facturado en la columna DOLARES. Un consumo en pesos
    # trae un unico importe. No alcanza con buscar la marca "USD": el BBVA
    # tambien liquida en dolares consumos en BRL/EUR sin esa palabra.
    is_foreign = len(amounts) >= 2
    last_amount = amounts[-1]
    amount_val = _parse_amount(last_amount)

    day, mes_abbr, year2 = m.groups()
    fecha = _parse_date(day, mes_abbr, year2)

    idx = line.rfind(last_amount)
    desc = line[m.end():idx].strip()
    if not desc:
        return None

    cuota_match = CUOTA_RE.search(desc)
    cuota = f"{cuota_match.group(1)}/{cuota_match.group(2)}" if cuota_match else None

    return {
        'fecha': fecha,
        'descripcion': desc,
        'pesos': None if is_foreign else amount_val,
        'dolares': amount_val if is_foreign else None,
        'cuota': cuota,
        'banco': banco,
        'categoria': get_categoria(desc),
    }


def _parse(pdf_file: io.BytesIO, banco: str) -> list[dict]:
    with pdfplumber.open(pdf_file) as pdf:
        full_text = '\n'.join(page.extract_text() or '' for page in pdf.pages)

    # Section header is "Consumos <CARDHOLDER NAME>"
    m = re.search(r'^Consumos .+$', full_text, re.M)
    start = m.start() if m else -1
    end = full_text.find('TOTAL CONSUMOS', start)
    if start == -1 or end == -1:
        return []
    header = m.group(0)
    section = full_text[start:end]

    consumos = []
    for line in section.split('\n'):
        line = line.strip()
        if not line or line.startswith('FECHA') or line == header:
            continue
        result = _parse_line(line, banco)
        if result:
            consumos.append(result)

    return consumos


def parse_bbva_master(pdf_file: io.BytesIO) -> list[dict]:
    return _parse(pdf_file, 'BBVA Mastercard')


def parse_bbva_visa(pdf_file: io.BytesIO) -> list[dict]:
    return _parse(pdf_file, 'BBVA Visa')


# ── Impuestos, cargos e intereses ────────────────────────────────────────
# Sección aparte del resumen (después de "TOTAL CONSUMOS"): comisión de
# mantenimiento, intereses por financiación y las percepciones sobre esos
# conceptos. A diferencia de los consumos, acá nunca hay montos en dólares,
# así que siempre se toma el último importe de la línea como el monto real
# (los importes intermedios son bases de cálculo del porcentaje, no cargos).

CARGO_CATEGORIAS = [
    ('COMISION', 'Comisión'),
    ('INTERESES FINANCIACION', 'Intereses'),
    ('DB IVA', 'IVA'),
    ('IIBB PERCEP', 'Percepción IIBB'),
    ('IVA RG', 'Percepción IVA'),
    ('DB.RG', 'Percepción Ganancias'),
]


def _clasificar_cargo(concepto: str) -> str:
    upper = concepto.upper()
    for kw, categoria in CARGO_CATEGORIAS:
        if kw in upper:
            return categoria
    return 'Otros cargos'


def _parse_cargo_line(line: str, banco: str) -> dict | None:
    m = DATE_RE.match(line)
    if not m:
        return None

    amounts = AMOUNT_RE.findall(line)
    if not amounts:
        return None

    last_amount = amounts[-1]
    monto = _parse_amount(last_amount)

    day, mes_abbr, year2 = m.groups()
    fecha = _parse_date(day, mes_abbr, year2)

    idx = line.rfind(last_amount)
    concepto = line[m.end():idx].strip().rstrip('$').strip()
    if not concepto:
        return None

    return {
        'fecha': fecha,
        'concepto': concepto,
        'categoria': _clasificar_cargo(concepto),
        'monto': monto,
        'banco': banco,
    }


def _parse_cargos(pdf_file: io.BytesIO, banco: str) -> list[dict]:
    with pdfplumber.open(pdf_file) as pdf:
        full_text = '\n'.join(page.extract_text() or '' for page in pdf.pages)

    start = full_text.find('Impuestos, cargos e intereses')
    end = full_text.find('SALDO ACTUAL', start)
    if start == -1 or end == -1:
        return []
    section = full_text[start:end]

    cargos = []
    for line in section.split('\n'):
        line = line.strip()
        if not line or line.startswith('FECHA') or 'Impuestos, cargos' in line:
            continue
        result = _parse_cargo_line(line, banco)
        if result:
            cargos.append(result)

    return cargos


def parse_bbva_master_cargos(pdf_file: io.BytesIO) -> list[dict]:
    return _parse_cargos(pdf_file, 'BBVA Mastercard')


def parse_bbva_visa_cargos(pdf_file: io.BytesIO) -> list[dict]:
    return _parse_cargos(pdf_file, 'BBVA Visa')
