import streamlit as st
import pandas as pd
from datetime import date, timedelta
from db.queries import fetch_all, delete_transactions, update_transaction
from categories import all_categories, merchant_key
from db.category_rules import learn_categories

TARJETAS = ["Todas", "BBVA Visa", "BBVA Mastercard", "Galicia Visa", "Galicia Amex",
            "Macro Visa", "Santander", "Mercado Pago", "Efectivo", "Débito", "Otro"]


def render_consumos():
    st.title("📋 Consumos")

    df = fetch_all()
    if df.empty:
        st.info("No hay consumos cargados aún.")
        return

    # ── Filtros ──────────────────────────────────────────────────────────────
    col_fecha, col_tarjeta, col_cat, col_busq = st.columns(4)

    with col_tarjeta:
        tarjeta = st.selectbox("Tarjeta", TARJETAS)

    with col_cat:
        categoria = st.selectbox("Categoría", ["Todas"] + all_categories())

    with col_busq:
        busqueda = st.text_input("Buscar", placeholder="Descripción...")

    with col_fecha:
        tipo_fecha = st.selectbox("Período", ["Mes", "Trimestre", "Año", "Rango libre"])

    # Sub-filtro según tipo de período
    fecha_desde, fecha_hasta = None, None

    if tipo_fecha == "Mes":
        months_raw = sorted(df["fecha"].dt.to_period("M").astype(str).unique(), reverse=True)
        mes = st.selectbox("Mes", ["Todos"] + months_raw, label_visibility="collapsed")
        if mes != "Todos":
            fecha_desde = pd.Timestamp(f"{mes}-01")
            fecha_hasta = fecha_desde + pd.offsets.MonthEnd(1)

    elif tipo_fecha == "Trimestre":
        años = sorted(df["fecha"].dt.year.unique(), reverse=True)
        c1, c2 = st.columns(2)
        with c1:
            año_q = st.selectbox("Año", años, label_visibility="collapsed")
        with c2:
            trimestre = st.selectbox("Trimestre", ["Q1 (Ene-Mar)", "Q2 (Abr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dic)"], label_visibility="collapsed")
        q_map = {
            "Q1 (Ene-Mar)": (1, 3), "Q2 (Abr-Jun)": (4, 6),
            "Q3 (Jul-Sep)": (7, 9), "Q4 (Oct-Dic)": (10, 12),
        }
        m_ini, m_fin = q_map[trimestre]
        fecha_desde = pd.Timestamp(f"{año_q}-{m_ini:02d}-01")
        fecha_hasta = pd.Timestamp(f"{año_q}-{m_fin:02d}-01") + pd.offsets.MonthEnd(1)

    elif tipo_fecha == "Año":
        años = sorted(df["fecha"].dt.year.unique(), reverse=True)
        año = st.selectbox("Año", años, label_visibility="collapsed")
        fecha_desde = pd.Timestamp(f"{año}-01-01")
        fecha_hasta = pd.Timestamp(f"{año}-12-31")

    elif tipo_fecha == "Rango libre":
        c1, c2 = st.columns(2)
        with c1:
            d_ini = st.date_input("Desde", value=date.today().replace(day=1), label_visibility="collapsed")
        with c2:
            d_fin = st.date_input("Hasta", value=date.today(), label_visibility="collapsed")
        fecha_desde = pd.Timestamp(d_ini)
        fecha_hasta = pd.Timestamp(d_fin)

    # ── Aplicar filtros ───────────────────────────────────────────────────────
    filtered = df.copy()
    if fecha_desde is not None:
        filtered = filtered[filtered["fecha"] >= fecha_desde]
    if fecha_hasta is not None:
        filtered = filtered[filtered["fecha"] <= fecha_hasta]
    if tarjeta != "Todas":
        filtered = filtered[filtered["banco"] == tarjeta]
    if categoria != "Todas":
        filtered = filtered[filtered["categoria"] == categoria]
    if busqueda:
        filtered = filtered[filtered["descripcion"].str.contains(busqueda, case=False, na=False)]

    # ── Resumen ───────────────────────────────────────────────────────────────
    total_p = filtered["pesos"].sum()
    total_u = filtered["dolares"].sum()
    st.caption(
        f"**{len(filtered)} consumos** · "
        f"Pesos: **${total_p:,.0f}** · "
        f"USD: **{total_u:.2f}**".replace(",", ".")
    )

    # ── Tabla editable ────────────────────────────────────────────────────────
    display = filtered[
        ["id", "fecha", "descripcion", "pesos", "dolares", "categoria", "banco", "cuota"]
    ].copy()
    display["fecha"] = display["fecha"].dt.strftime("%d/%m/%Y")

    edited = st.data_editor(
        display.rename(columns={
            "fecha": "Fecha", "descripcion": "Descripción", "pesos": "Pesos",
            "dolares": "USD", "categoria": "Categoría", "banco": "Tarjeta", "cuota": "Cuota",
        }),
        column_config={
            "id":           st.column_config.TextColumn("id",          disabled=True, width="small"),
            "Fecha":        st.column_config.TextColumn("Fecha",       disabled=True),
            "Descripción":  st.column_config.TextColumn("Descripción", disabled=True),
            "Pesos":        st.column_config.NumberColumn("Pesos",     format="$ %.2f"),
            "USD":          st.column_config.NumberColumn("USD",       format="$ %.2f"),
            "Categoría":    st.column_config.SelectboxColumn("Categoría", options=all_categories()),
            "Tarjeta":      st.column_config.TextColumn("Tarjeta",     disabled=True),
            "Cuota":        st.column_config.TextColumn("Cuota",       disabled=True),
        },
        hide_index=True,
        use_container_width=True,
        column_order=["Fecha", "Descripción", "Pesos", "USD", "Categoría", "Tarjeta", "Cuota"],
    )

    if st.button("💾 Guardar cambios de categoría", type="primary"):
        _save_category_edits(filtered, edited)


def _save_category_edits(original: pd.DataFrame, edited: pd.DataFrame) -> None:
    orig = original.set_index("id")[["categoria", "descripcion"]]
    changed = 0
    learned = {}
    for _, row in edited.iterrows():
        row_id = row["id"]
        new_cat = row["Categoría"]
        if row_id in orig.index and orig.loc[row_id, "categoria"] != new_cat:
            update_transaction(row_id, {"categoria": new_cat})
            learned[merchant_key(orig.loc[row_id, "descripcion"])] = new_cat
            changed += 1
    learn_categories(learned)
    if changed:
        st.success(f"✅ {changed} categoría{'s' if changed != 1 else ''} actualizada{'s' if changed != 1 else ''}.")
        st.rerun()
    else:
        st.info("No hay cambios para guardar.")
