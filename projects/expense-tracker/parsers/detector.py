import io
import re
import pdfplumber
from parsers.bbva import parse_bbva_master, parse_bbva_visa
from parsers.galicia import parse_galicia
from parsers.galicia_amex import parse_galicia_amex
from parsers.macro import parse_macro
from parsers.santander import parse_santander


def detect_bank(pdf_bytes: io.BytesIO) -> str:
    with pdfplumber.open(pdf_bytes) as pdf:
        first_page = pdf.pages[0].extract_text() or ''

    upper = first_page.upper()

    # El texto del resumen BBVA viene con una franja lateral extraída al
    # revés por pdfplumber ("BBVA" -> "AVBB"); es la marca más confiable
    # porque "BBVA" en texto normal recién aparece en el legal (página 3/4).
    if 'AVBB' in upper:
        return 'BBVA Mastercard' if 'MASTERCARD' in upper else 'BBVA Visa'
    # Amex antes que Galicia genérico (ambos dicen "Galicia")
    if 'AMERICAN EXPRESS' in upper:
        return 'Galicia Amex'
    if 'GALICIA' in upper:
        return 'Galicia Visa'
    if 'MACRO' in upper:
        return 'Macro Visa'
    if 'SANTANDER' in upper:
        return 'Santander'

    # Fallback por formato de fecha
    if re.search(r'\d{2}-\d{2}-\d{2}', first_page):
        return 'Galicia Visa'
    if re.search(r'\d{2}\.\d{2}\.\d{2}', first_page):
        return 'Macro Visa'

    return 'Unknown'


def detect_and_parse(uploaded_file) -> tuple[list[dict], str]:
    """Detecta el banco y parsea el PDF. Retorna (transacciones, nombre_banco)."""
    pdf_bytes = io.BytesIO(uploaded_file.read())
    bank = detect_bank(pdf_bytes)
    pdf_bytes.seek(0)

    if bank == 'BBVA Mastercard':
        return parse_bbva_master(pdf_bytes), bank
    elif bank == 'BBVA Visa':
        return parse_bbva_visa(pdf_bytes), bank
    elif bank == 'Galicia Visa':
        return parse_galicia(pdf_bytes), bank
    elif bank == 'Galicia Amex':
        return parse_galicia_amex(pdf_bytes), bank
    elif bank == 'Macro Visa':
        return parse_macro(pdf_bytes), bank
    elif bank == 'Santander':
        return parse_santander(pdf_bytes), bank

    return [], bank
