import io
import uuid
import streamlit as st
import pandas as pd
from datetime import date
from parsers.detector import detect_and_parse
from parsers.mercadopago import parse_mercadopago
from parsers.bbva import parse_bbva_master_cargos, parse_bbva_visa_cargos
from categories import all_categories, get_categoria, merchant_key
from db.queries import insert_transactions, fetch_imports, delete_by_import
from db.category_rules import fetch_category_rules, learn_categories
from db.cargos import insert_cargos

CARGO_CATEGORIAS = ["Comisión", "Intereses", "IVA", "Percepción IIBB",
                     "Percepción IVA", "Percepción Ganancias", "Otros cargos"]
_CARGOS_PARSER_POR_BANCO = {
    "BBVA Mastercard": parse_bbva_master_cargos,
    "BBVA Visa": parse_bbva_visa_cargos,
}

TARJETAS = ["Efectivo", "Débito", "BBVA Visa", "BBVA Mastercard", "Galicia Visa", "Galicia Amex",
            "Macro Visa", "Santander", "Mercado Pago", "Otro"]


def render_upload():
    st.title("📤 Cargar consumos")

    tab_pdf, tab_mp, tab_manual, tab_historial = st.tabs(
        ["📄 Subir PDF", "🟡 Mercado Pago", "✏️ Carga manual", "📦 Historial"]
    )

    with tab_pdf:
        _render_pdf_upload()

    with tab_mp:
        _render_mercadopago_upload()

    with tab_manual:
        _render_manual_entry()

    with tab_historial:
        _render_import_history()


def _render_pdf_upload():
    st.caption("Subí el PDF de BBVA, Galicia Visa, Macro o Santander — se detecta automáticamente.")

    uploaded = st.file_uploader("Seleccioná el archivo", type=["pdf"], label_visibility="collapsed")

    if not uploaded:
        return

    pdf_bytes = uploaded.read()

    with st.spinner("Leyendo PDF..."):
        transactions, bank = detect_and_parse(io.BytesIO(pdf_bytes))
        cargos_parser = _CARGOS_PARSER_POR_BANCO.get(bank)
        cargos = cargos_parser(io.BytesIO(pdf_bytes)) if cargos_parser else []

    if not transactions:
        st.error(
            "No se encontraron consumos. Verificá que sea un resumen de Galicia Visa o Macro, "
            "o que el PDF no esté protegido con contraseña."
        )
        return

    learned = fetch_category_rules()
    for t in transactions:
        t["categoria"] = get_categoria(t["descripcion"], learned)

    st.success(f"**{bank}** · {len(transactions)} consumos encontrados")

    df = pd.DataFrame(transactions)
    df["pesos"]   = pd.to_numeric(df["pesos"],   errors="coerce")
    df["dolares"] = pd.to_numeric(df["dolares"], errors="coerce")

    st.markdown("#### Revisá y corregí categorías antes de guardar")

    edited = st.data_editor(
        df[["fecha", "descripcion", "pesos", "dolares", "categoria", "cuota", "banco"]],
        column_config={
            "fecha":       st.column_config.TextColumn("Fecha",       disabled=True),
            "descripcion": st.column_config.TextColumn("Descripción", disabled=True),
            "pesos":       st.column_config.NumberColumn("Pesos",     format="$ %.2f"),
            "dolares":     st.column_config.NumberColumn("USD",       format="$ %.2f"),
            "categoria":   st.column_config.SelectboxColumn("Categoría", options=all_categories()),
            "cuota":       st.column_config.TextColumn("Cuota"),
            "banco":       st.column_config.TextColumn("Tarjeta",     disabled=True),
        },
        hide_index=True,
        use_container_width=True,
        num_rows="fixed",
    )

    col1, _ = st.columns([1, 4])
    with col1:
        if st.button("✅ Guardar", type="primary", use_container_width=True, key="save_pdf"):
            records = edited.to_dict("records")
            for r in records:
                r["pesos"]   = None if pd.isna(r.get("pesos"))   else float(r["pesos"])
                r["dolares"] = None if pd.isna(r.get("dolares")) else float(r["dolares"])
                r["cuota"]   = None if pd.isna(r.get("cuota"))   else str(r["cuota"])

            batch_id = str(uuid.uuid4())
            count = insert_transactions(records, import_id=batch_id, filename=uploaded.name)
            learn_categories({merchant_key(r["descripcion"]): r["categoria"] for r in records})
            st.success(f"✅ Se guardaron {count} consumos.")
            st.balloons()

    if cargos:
        _render_cargos_del_resumen(cargos, uploaded.name)


def _render_cargos_del_resumen(cargos: list[dict], filename: str) -> None:
    st.markdown("---")
    st.markdown(f"#### 💳 Cargos, intereses y comisiones de este resumen ({len(cargos)})")
    st.caption("No son consumos — van aparte, a la solapa 💳 Cargos.")

    cargos_df = pd.DataFrame(cargos)
    cargos_df["monto"] = pd.to_numeric(cargos_df["monto"], errors="coerce")

    edited_cargos = st.data_editor(
        cargos_df[["fecha", "concepto", "categoria", "monto", "banco"]],
        column_config={
            "fecha":    st.column_config.TextColumn("Fecha", disabled=True),
            "concepto": st.column_config.TextColumn("Concepto", disabled=True),
            "categoria": st.column_config.SelectboxColumn("Categoría", options=CARGO_CATEGORIAS),
            "monto":    st.column_config.NumberColumn("Monto", format="$ %.2f"),
            "banco":    st.column_config.TextColumn("Tarjeta", disabled=True),
        },
        hide_index=True,
        use_container_width=True,
        num_rows="fixed",
        key="cargos_editor",
    )

    col1, _ = st.columns([1, 4])
    with col1:
        if st.button("✅ Guardar cargos", type="primary", use_container_width=True, key="save_cargos"):
            records = edited_cargos.to_dict("records")
            for r in records:
                r["monto"] = float(r["monto"])
            batch_id = str(uuid.uuid4())
            count = insert_cargos(records, import_id=batch_id, filename=filename)
            st.success(f"✅ Se guardaron {count} cargos.")


def _render_mercadopago_upload():
    st.caption("Subí el archivo CSV de liquidaciones de Mercado Pago (Actividad → Descargar → Formato CSV).")

    uploaded = st.file_uploader(
        "Seleccioná el archivo", type=["csv"], label_visibility="collapsed", key="mp_csv"
    )

    if not uploaded:
        return

    with st.spinner("Leyendo CSV..."):
        try:
            transactions = parse_mercadopago(uploaded)
        except Exception as e:
            st.error(f"No se pudo leer el archivo: {e}")
            return

    if not transactions:
        st.error("No se encontraron egresos. Verificá que sea un reporte de liquidaciones de Mercado Pago.")
        return

    learned = fetch_category_rules()
    for t in transactions:
        t["categoria"] = get_categoria(t["descripcion"], learned)

    st.success(f"**Mercado Pago** · {len(transactions)} movimientos encontrados")

    df = pd.DataFrame(transactions)
    df["pesos"]   = pd.to_numeric(df["pesos"],   errors="coerce")
    df["dolares"] = pd.to_numeric(df["dolares"], errors="coerce")

    st.markdown("#### Revisá y corregí categorías antes de guardar")

    edited = st.data_editor(
        df[["fecha", "descripcion", "pesos", "dolares", "categoria", "banco"]],
        column_config={
            "fecha":       st.column_config.TextColumn("Fecha",       disabled=True),
            "descripcion": st.column_config.TextColumn("Descripción", disabled=True),
            "pesos":       st.column_config.NumberColumn("Pesos",     format="$ %.2f"),
            "dolares":     st.column_config.NumberColumn("USD",       format="$ %.2f"),
            "categoria":   st.column_config.SelectboxColumn("Categoría", options=all_categories()),
            "banco":       st.column_config.TextColumn("Medio",       disabled=True),
        },
        hide_index=True,
        use_container_width=True,
        num_rows="fixed",
    )

    col1, _ = st.columns([1, 4])
    with col1:
        if st.button("✅ Guardar", type="primary", use_container_width=True, key="save_mp"):
            records = edited.to_dict("records")
            for r in records:
                r["pesos"]   = None if pd.isna(r.get("pesos"))   else float(r["pesos"])
                r["dolares"] = None if pd.isna(r.get("dolares")) else float(r["dolares"])
                r["cuota"]   = None

            batch_id = str(uuid.uuid4())
            count = insert_transactions(records, import_id=batch_id, filename=uploaded.name)
            learn_categories({merchant_key(r["descripcion"]): r["categoria"] for r in records})
            st.success(f"✅ Se guardaron {count} movimientos.")
            st.balloons()


def _render_manual_entry():
    st.caption("Para gastos en efectivo, débito u otros que no aparecen en el resumen.")

    with st.form("manual_entry", clear_on_submit=True):
        c1, c2 = st.columns(2)
        with c1:
            fecha = st.date_input("Fecha", value=date.today())
        with c2:
            banco = st.selectbox("Medio de pago", TARJETAS)

        descripcion = st.text_input("Descripción", placeholder="Ej: Farmacia, Verdulería, Taxi...")

        c3, c4 = st.columns(2)
        with c3:
            pesos = st.number_input("Monto en pesos", min_value=0.0, step=100.0, format="%.2f")
        with c4:
            dolares = st.number_input("Monto en USD", min_value=0.0, step=1.0, format="%.2f")

        categoria_sugerida = get_categoria(descripcion) if descripcion else "Otros"
        cats = all_categories()
        idx = cats.index(categoria_sugerida) if categoria_sugerida in cats else 0
        categoria = st.selectbox("Categoría", cats, index=idx)

        submitted = st.form_submit_button("✅ Agregar consumo", type="primary", use_container_width=True)

    if submitted:
        if not descripcion:
            st.error("Ingresá una descripción.")
            return
        if pesos == 0 and dolares == 0:
            st.error("Ingresá al menos un monto.")
            return

        record = {
            "fecha":       fecha.strftime("%Y-%m-%d"),
            "descripcion": descripcion.strip(),
            "pesos":       float(pesos) if pesos > 0 else None,
            "dolares":     float(dolares) if dolares > 0 else None,
            "categoria":   categoria,
            "banco":       banco,
            "cuota":       None,
        }
        insert_transactions([record])
        learn_categories({merchant_key(record["descripcion"]): record["categoria"]})
        st.success(f"✅ **{descripcion}** guardado — ${pesos:,.0f}")


def _render_import_history():
    st.markdown("#### Importaciones realizadas")
    st.caption("Podés revertir una importación completa si hubo un error al cargar.")

    try:
        imports_df = fetch_imports()
    except Exception as e:
        st.warning("⚠️ Para usar el historial, ejecutá este SQL en Supabase primero:")
        st.code("alter table transactions add column if not exists import_id uuid;", language="sql")
        return

    if imports_df.empty:
        st.info("Todavía no hay importaciones de PDF registradas.")
        return

    for _, row in imports_df.iterrows():
        col1, col2, col3, col4, col5, col6 = st.columns([2, 2, 2.5, 1, 2, 1])
        col1.write(f"🗓️ {row['fecha_import']}")
        col2.write(f"💳 {row['tarjeta']}")
        col3.write(f"📄 `{row['archivo']}`")
        col4.write(f"**{int(row['consumos'])}**")
        col5.write(f"${row['total_pesos']:,.0f}".replace(",", "."))
        with col6:
            if st.button("↩️ Revertir", key=f"rev_{row['import_id']}", use_container_width=True):
                st.session_state[f"confirm_{row['import_id']}"] = True

        # Confirmation step
        if st.session_state.get(f"confirm_{row['import_id']}"):
            st.warning(
                f"¿Segura que querés eliminar **{row['archivo']}**? "
                f"Se van a borrar **{int(row['consumos'])} consumos** de {row['tarjeta']}."
            )
            c1, c2, _ = st.columns([1, 1, 4])
            with c1:
                if st.button("Sí, eliminar", key=f"yes_{row['import_id']}", type="primary"):
                    deleted = delete_by_import(row["import_id"])
                    del st.session_state[f"confirm_{row['import_id']}"]
                    st.success(f"✅ {deleted} consumos eliminados.")
                    st.rerun()
            with c2:
                if st.button("Cancelar", key=f"no_{row['import_id']}"):
                    del st.session_state[f"confirm_{row['import_id']}"]
                    st.rerun()

        st.divider()
