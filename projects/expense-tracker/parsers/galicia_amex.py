import re
import io
from parsers.galicia import parse_galicia as _parse_galicia


def parse_galicia_amex(pdf_file: io.BytesIO) -> list[dict]:
    """Reutiliza el parser Galicia Visa — el formato es idéntico.
    Solo ajusta el banco y limpia artefactos de descripción propios de Amex."""
    transactions = _parse_galicia(pdf_file)
    for t in transactions:
        t['banco'] = 'Galicia Amex'
        # Limpiar prefijo '=' y códigos tipo '16315=' de descripciones Amex
        t['descripcion'] = re.sub(r'^[=\d]+=?', '', t['descripcion']).strip()
        t['descripcion'] = t['descripcion'].lstrip('=').strip()
    return transactions
