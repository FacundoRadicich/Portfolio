import streamlit as st
import pandas as pd
from db.cargos import fetch_all_cargos, delete_cargos

TARJETAS = ["Todas", "BBVA Visa", "BBVA Mastercard"]


def render_cargos():
    st.title("💳 Cargos, intereses y comisiones")
    st.caption("Comisión de mantenimiento, intereses por financiación y percepciones — separado de los consumos.")

    df = fetch_all_cargos()
    if df.empty:
        st.info("Todavía no hay cargos cargados. Se agregan solos al subir un resumen de BBVA en 📤 Cargar PDF.")
        return

    col_mes, col_tarjeta = st.columns(2)
    with col_tarjeta:
        tarjeta = st.selectbox("Tarjeta", TARJETAS)
    with col_mes:
        meses = sorted(df["fecha"].dt.to_period("M").astype(str).unique(), reverse=True)
        mes = st.selectbox("Mes", ["Todos"] + meses)

    filtered = df.copy()
    if tarjeta != "Todas":
        filtered = filtered[filtered["banco"] == tarjeta]
    if mes != "Todos":
        filtered = filtered[filtered["fecha"].dt.to_period("M").astype(str) == mes]

    if filtered.empty:
        st.info("No hay cargos para ese filtro.")
        return

    # ── Resumen por categoría ────────────────────────────────────────────────
    resumen = (filtered.groupby("categoria")["monto"].sum()
               .reset_index().sort_values("monto", ascending=False))

    st.markdown("#### Resumen del período")
    cols = st.columns(len(resumen)) if len(resumen) <= 6 else st.columns(6)
    for i, (_, row) in enumerate(resumen.iterrows()):
        cols[i % len(cols)].metric(row["categoria"], f"${row['monto']:,.0f}".replace(",", "."))

    st.metric("Total del período", f"${filtered['monto'].sum():,.0f}".replace(",", "."))

    st.markdown("---")

    # ── Detalle ───────────────────────────────────────────────────────────────
    st.markdown("#### Detalle")
    display = filtered[["id", "fecha", "concepto", "categoria", "monto", "banco"]].copy()
    display["fecha"] = display["fecha"].dt.strftime("%d/%m/%Y")

    st.dataframe(
        display.rename(columns={
            "fecha": "Fecha", "concepto": "Concepto", "categoria": "Categoría",
            "monto": "Monto", "banco": "Tarjeta",
        })[["Fecha", "Concepto", "Categoría", "Monto", "Tarjeta"]],
        hide_index=True,
        use_container_width=True,
        column_config={"Monto": st.column_config.NumberColumn(format="$ %.2f")},
    )

    with st.expander("🗑️ Eliminar un cargo cargado por error"):
        opciones = {
            f"{row['fecha'].strftime('%d/%m/%Y')} · {row['concepto']} · ${row['monto']:,.0f}".replace(",", "."): row["id"]
            for _, row in filtered.iterrows()
        }
        elegido = st.selectbox("Cargo", ["—"] + list(opciones.keys()), label_visibility="collapsed")
        if elegido != "—" and st.button("Eliminar", type="primary"):
            delete_cargos([opciones[elegido]])
            st.success("✅ Eliminado.")
            st.rerun()
