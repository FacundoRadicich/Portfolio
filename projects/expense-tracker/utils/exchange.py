USD_TO_ARS = 1500  # Cotización de referencia


def pesos_total(pesos, dolares, rate: float = USD_TO_ARS) -> float:
    return (pesos or 0) + (dolares or 0) * rate
