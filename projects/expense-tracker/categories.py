import re

CATEGORY_MAP = {
    "Supermercado":  ["JUMBO", "DIA ", "COTO", "DISCO", "CARREFOUR", "WALMART", "CHANGOMAS"],
    "Delivery":      ["PEDIDOSYA", "RAPPI", "MC DONALDS", "MCDONALDS", "BURGER"],
    "Restaurantes":  ["HAVANNA", "LUCCIANOS", "SUSHI", "HELADERO", "PASTELERIA", "CHOCOLATES",
                      "PANADERIA", "BEBOP"],
    "Cafecito":      ["CAFE", "MODOCAFE"],
    "Transporte":    ["CABIFY", "UBER", "YPF", "AXION", "SHELL", "APPYPF", "COMBUST"],
    "Peajes":        ["AUTOPISTAS", "CVSA ACCESOS", "CORREDORES", "AUBASA"],
    "Salud":         ["ALPI", "FARMPLUS", "FARMACIA", "DIAGNOSTICO", "MEDIC"],
    "Suscripciones": ["SPOTIFY", "GOOGLE", "NETFLIX", "HBO", "DISNEY", "CANVA", "CHATGPT",
                      "TANGO", "SUSCR."],
    "Servicios":     ["EDENOR", "METROGAS", "ARBA", "FEDERACION PAT", "VERISUR", "LA NACION",
                      "HOSTINGER", "BBVA SEGUROS"],
    "Indumentaria":  ["ANOUSH", "LINGERIE", "TEXTIL", "ROPA"],
    "Hogar":         ["MUEBLES", "FRAVEGA", "ELECTRO", "IMPROSTOCK", "LIBRERIA"],
    "Vacaciones":    [],
    "Financiero":    ["COMISION", "INTERES"],
    "Varios":        ["MERPAGO", "LA RURAL", "MULTIMARCA"],
}

UNCATEGORIZED = "Otros"

_FOREIGN_AMOUNT_RE = re.compile(r'\b(?:USD|BRL|EUR|CLP|UYU|PYG)\s+[\d.,]+')
_CUOTA_RE = re.compile(r'\bC\.\d{2}/\d{2}\b')
_DIGITS_RE = re.compile(r'\d+')
_PUNCT_RE = re.compile(r'[^\w\s*]')
_SPACES_RE = re.compile(r'\s+')


def merchant_key(descripcion: str) -> str:
    """Normaliza una descripción a una clave estable por comercio, sacando
    cupones, cuotas y montos variables (ej. 'MERPAGO*LEPISRL 299065' y
    'MERPAGO*LEPISRL 647653' -> 'MERPAGO*LEPISRL'). Se usa para "aprender"
    la categoría que el usuario le asignó a un comercio y reaplicarla."""
    s = descripcion.upper()
    s = _FOREIGN_AMOUNT_RE.sub(' ', s)
    s = _CUOTA_RE.sub(' ', s)
    s = _DIGITS_RE.sub(' ', s)
    s = _PUNCT_RE.sub(' ', s)
    return _SPACES_RE.sub(' ', s).strip()


def get_categoria(descripcion: str, learned: dict[str, str] | None = None) -> str:
    if learned:
        remembered = learned.get(merchant_key(descripcion))
        if remembered:
            return remembered

    desc_upper = descripcion.upper()
    for categoria, keywords in CATEGORY_MAP.items():
        if any(kw in desc_upper for kw in keywords):
            return categoria
    return UNCATEGORIZED


def all_categories() -> list[str]:
    return sorted(CATEGORY_MAP.keys()) + [UNCATEGORIZED]
