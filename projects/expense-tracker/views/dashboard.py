import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
from datetime import date
from db.queries import fetch_all
from utils.exchange import USD_TO_ARS

TARJETAS = ["Todas", "Galicia Visa", "Galicia Amex", "Macro Visa", "Efectivo", "Débito", "Otro"]
PLOTLY_BASE = dict(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
                   font_color="#e0e0f0", margin=dict(t=36, b=0, l=0, r=0))


def _apply_filters(df, banco, fecha_desde, fecha_hasta):
    out = df.copy()
    if fecha_desde is not None: out = out[out["fecha"] >= fecha_desde]
    if fecha_hasta is not None: out = out[out["fecha"] <= fecha_hasta]
    if banco:                   out = out[out["banco"] == banco]
    return out


def _prev_period(tipo, fecha_desde, fecha_hasta):
    if tipo == "Mes":
        prev_desde = (fecha_desde - pd.DateOffset(months=1)).replace(day=1)
        prev_hasta = fecha_desde - pd.Timedelta(days=1)
    elif tipo == "Trimestre":
        prev_desde = fecha_desde - pd.DateOffset(months=3)
        prev_hasta = fecha_desde - pd.Timedelta(days=1)
    elif tipo == "Año":
        prev_desde = fecha_desde - pd.DateOffset(years=1)
        prev_hasta = fecha_hasta - pd.DateOffset(years=1)
    else:
        dur = fecha_hasta - fecha_desde
        prev_hasta = fecha_desde - pd.Timedelta(days=1)
        prev_desde = prev_hasta - dur
    return pd.Timestamp(prev_desde), pd.Timestamp(prev_hasta)


def render_dashboard():
    st.title("📊 Dashboard")

    all_df = fetch_all()
    if all_df.empty:
        st.info("No hay consumos cargados aún.")
        return

    # ── Filtros ───────────────────────────────────────────────────────────────
    col_p, col_t = st.columns([3, 1])
    with col_t:
        banco_opt = st.selectbox("Tarjeta", TARJETAS)
    with col_p:
        tipo = st.selectbox("Período", ["Mes", "Trimestre", "Año", "Rango libre"])

    fecha_desde = fecha_hasta = None

    if tipo == "Mes":
        meses = sorted(all_df["fecha"].dt.to_period("M").astype(str).unique(), reverse=True)
        mes = st.selectbox("", meses, index=0, label_visibility="collapsed")
        fecha_desde = pd.Timestamp(f"{mes}-01")
        fecha_hasta = fecha_desde + pd.offsets.MonthEnd(1)

    elif tipo == "Trimestre":
        años = sorted(all_df["fecha"].dt.year.unique(), reverse=True)
        c1, c2 = st.columns(2)
        with c1: año_q = st.selectbox("", años, label_visibility="collapsed")
        with c2: trim  = st.selectbox("", ["Q1 (Ene-Mar)","Q2 (Abr-Jun)","Q3 (Jul-Sep)","Q4 (Oct-Dic)"],
                                      label_visibility="collapsed")
        m_ini = {"Q1 (Ene-Mar)":1,"Q2 (Abr-Jun)":4,"Q3 (Jul-Sep)":7,"Q4 (Oct-Dic)":10}[trim]
        fecha_desde = pd.Timestamp(f"{año_q}-{m_ini:02d}-01")
        fecha_hasta = pd.Timestamp(f"{año_q}-{m_ini+2:02d}-01") + pd.offsets.MonthEnd(1)

    elif tipo == "Año":
        años = sorted(all_df["fecha"].dt.year.unique(), reverse=True)
        año = st.selectbox("", años, label_visibility="collapsed")
        fecha_desde = pd.Timestamp(f"{año}-01-01")
        fecha_hasta = pd.Timestamp(f"{año}-12-31")

    else:
        c1, c2 = st.columns(2)
        with c1: d_ini = st.date_input("Desde", value=date.today().replace(day=1), label_visibility="collapsed")
        with c2: d_fin = st.date_input("Hasta", value=date.today(), label_visibility="collapsed")
        fecha_desde, fecha_hasta = pd.Timestamp(d_ini), pd.Timestamp(d_fin)

    banco   = None if banco_opt == "Todas" else banco_opt
    df      = _apply_filters(all_df, banco, fecha_desde, fecha_hasta)
    prev_d, prev_h = _prev_period(tipo, fecha_desde, fecha_hasta)
    df_prev = _apply_filters(all_df, banco, prev_d, prev_h)

    # Cotización USD
    tc = st.sidebar.number_input("💱 USD → ARS", min_value=1.0, value=float(USD_TO_ARS),
                                  step=50.0, format="%.0f",
                                  help="Cotización usada para convertir dólares a pesos en los gráficos")

    def total_ars(d): return d["pesos"].fillna(0) + d["dolares"].fillna(0) * tc

    if df.empty:
        st.info("Sin consumos para el período seleccionado.")
        return

    # ── Fila 1: KPIs ─────────────────────────────────────────────────────────
    total_p = total_ars(df).sum()
    total_u = df["dolares"].sum()
    prev_p  = total_ars(df_prev).sum()
    prev_u  = df_prev["dolares"].sum()

    delta_p = f"{(total_p - prev_p) / prev_p * 100:+.1f}%" if prev_p > 0 else None
    delta_u = f"{(total_u - prev_u) / prev_u * 100:+.1f}%" if prev_u > 0 else None

    k1, k2 = st.columns(2)
    k1.metric("Total (ARS)", f"${total_p:,.0f}".replace(",","."),
              delta=delta_p, delta_color="inverse")
    k2.metric("Total USD", f"USD {total_u:.2f}",
              delta=delta_u, delta_color="inverse")

    st.markdown("---")

    # ── Fila 2: Categorías ────────────────────────────────────────────────────
    df["_total"] = total_ars(df)
    cat_totals = (df.groupby("categoria")["_total"].sum()
                    .reset_index().rename(columns={"_total":"pesos"})
                    .sort_values("pesos", ascending=False))

    col_pie, col_bar = st.columns(2)

    # Torta con selección
    with col_pie:
        fig_pie = px.pie(cat_totals, values="pesos", names="categoria",
                         title="Distribución por categoría", hole=0.42)
        fig_pie.update_layout(**PLOTLY_BASE, title_font_size=13, legend_font_size=10)
        fig_pie.update_traces(textposition="inside", textinfo="percent+label")
        pie_event = st.plotly_chart(fig_pie, use_container_width=True,
                                    on_select="rerun", key="pie_chart")

    # Barras horizontales con números grandes
    with col_bar:
        cat_fmt = cat_totals.copy()
        cat_fmt["label"] = cat_fmt["pesos"].apply(lambda x: f"${x/1000:.0f}K")
        fig_hbar = px.bar(
            cat_fmt.sort_values("pesos"), x="pesos", y="categoria",
            orientation="h", title="Gasto por categoría",
            text="label",
            labels={"pesos":"","categoria":""},
            color="pesos", color_continuous_scale="Purples",
        )
        fig_hbar.update_traces(textfont_size=14, textposition="outside")
        fig_hbar.update_layout(**PLOTLY_BASE, title_font_size=13,
                               coloraxis_showscale=False,
                               xaxis=dict(showticklabels=False))
        st.plotly_chart(fig_hbar, use_container_width=True)

    # Tabla al hacer click en la torta
    cat_sel = None
    if pie_event and pie_event.selection and pie_event.selection.points:
        cat_sel = pie_event.selection.points[0].get("label")

    # También opción manual por si el click no funciona
    cats_lista = cat_totals["categoria"].tolist()
    idx_default = cats_lista.index(cat_sel) + 1 if cat_sel and cat_sel in cats_lista else 0
    cat_manual = st.selectbox("🔍 Ver detalle de categoría (o hacé click en la torta)",
                              ["— seleccioná —"] + cats_lista,
                              index=idx_default, label_visibility="collapsed")
    cat_final = cat_sel if cat_sel and cat_manual == "— seleccioná —" else (
                None if cat_manual == "— seleccioná —" else cat_manual)

    if cat_final:
        det = df[df["categoria"] == cat_final][
            ["fecha","descripcion","pesos","dolares","banco"]
        ].copy().sort_values("pesos", ascending=False)
        det["fecha"] = det["fecha"].dt.strftime("%d/%m/%Y")
        total_cat = df[df["categoria"] == cat_final]["pesos"].sum()
        st.caption(f"**{cat_final}** — {len(det)} consumos · "
                   f"${total_cat:,.0f}".replace(",","."))
        st.dataframe(det.rename(columns={"fecha":"Fecha","descripcion":"Descripción",
                                          "pesos":"Pesos","dolares":"USD","banco":"Tarjeta"}),
                     use_container_width=True, hide_index=True,
                     column_config={"Pesos": st.column_config.NumberColumn(format="$ %.2f"),
                                    "USD":   st.column_config.NumberColumn(format="$ %.2f")})

    st.markdown("---")

    # ── Fila 3: Evolución ─────────────────────────────────────────────────────
    c1, c2 = st.columns(2)

    with c1:
        ev = all_df.copy()
        ev["mes"] = ev["fecha"].dt.to_period("M").astype(str)
        ev6 = ev[ev["mes"].isin(sorted(ev["mes"].unique())[-6:])]
        ev6 = ev6.copy()
        ev6["_total"] = ev6["pesos"].fillna(0) + ev6["dolares"].fillna(0) * tc
        stacked = (ev6.groupby(["mes","banco"])["_total"].sum()
                      .reset_index().rename(columns={"_total":"pesos"}).sort_values("mes"))
        fig_stack = px.bar(stacked, x="mes", y="pesos", color="banco",
                           title="Evolución mensual por tarjeta",
                           labels={"mes":"","pesos":"","banco":""},
                           barmode="stack",
                           color_discrete_map={
                               "Galicia Visa":"#6c63ff","Galicia Amex":"#4ade80",
                               "Macro Visa":"#fb923c","Efectivo":"#94a3b8","Débito":"#60a5fa",
                           })
        fig_stack.update_layout(**PLOTLY_BASE, title_font_size=13,
                                legend=dict(orientation="h", y=-0.2, font_size=10))
        st.plotly_chart(fig_stack, use_container_width=True)

    with c2:
        df_prev["_total"] = total_ars(df_prev)
        curr_cats = df.groupby("categoria")["_total"].sum()
        prev_cats = df_prev.groupby("categoria")["_total"].sum()
        all_cats  = sorted(set(curr_cats.index) | set(prev_cats.index))
        comp = pd.DataFrame({
            "Actual":   [curr_cats.get(c, 0) for c in all_cats],
            "Anterior": [prev_cats.get(c, 0) for c in all_cats],
        }, index=all_cats).sort_values("Actual", ascending=False).head(8)
        fig_comp = go.Figure()
        fig_comp.add_bar(name="Actual",   x=comp.index, y=comp["Actual"],   marker_color="#6c63ff")
        fig_comp.add_bar(name="Anterior", x=comp.index, y=comp["Anterior"], marker_color="#374151")
        fig_comp.update_layout(**PLOTLY_BASE, title="Actual vs período anterior",
                               title_font_size=13, barmode="group",
                               legend=dict(orientation="h", y=-0.2, font_size=10),
                               xaxis=dict(tickfont=dict(size=9)))
        st.plotly_chart(fig_comp, use_container_width=True)

    st.markdown("---")

    # ── Fila 4: Top consumos ──────────────────────────────────────────────────
    st.markdown("#### Top consumos del período")
    top10 = df.nlargest(10,"pesos")[["fecha","descripcion","pesos","dolares","categoria","banco"]].copy()
    top10["fecha"] = top10["fecha"].dt.strftime("%d/%m/%Y")
    st.dataframe(top10.rename(columns={"fecha":"Fecha","descripcion":"Descripción",
                                        "pesos":"Pesos","dolares":"USD",
                                        "categoria":"Categoría","banco":"Tarjeta"}),
                 use_container_width=True, hide_index=True,
                 column_config={"Pesos": st.column_config.NumberColumn(format="$ %.2f"),
                                "USD":   st.column_config.NumberColumn(format="$ %.2f")})

    st.markdown("---")

    # ── Fila 5: Resumen ───────────────────────────────────────────────────────
    st.markdown("#### 📝 Resumen del período")
    _render_insights(df, df_prev, total_p, prev_p)


def _render_insights(df, df_prev, total_p, prev_p):
    msgs = []
    if "_total" not in df.columns:
        df = df.copy(); df["_total"] = df["pesos"].fillna(0)
    if "_total" not in df_prev.columns:
        df_prev = df_prev.copy(); df_prev["_total"] = df_prev["pesos"].fillna(0)

    # Variación total
    if prev_p > 0:
        pct = (total_p - prev_p) / prev_p * 100
        if pct > 5:
            msgs.append(f"📈 El gasto **subió {pct:.0f}%** respecto al período anterior "
                        f"(${total_p:,.0f} vs ${prev_p:,.0f}).".replace(",","."))
        elif pct < -5:
            msgs.append(f"📉 El gasto **bajó {abs(pct):.0f}%** respecto al período anterior "
                        f"(${total_p:,.0f} vs ${prev_p:,.0f}).".replace(",","."))
        else:
            msgs.append(f"➡️ El gasto se mantuvo estable respecto al período anterior ({pct:+.1f}%).")

    # Categoría más cara
    if not df.empty:
        top_cat = df.groupby("categoria")["_total"].sum().idxmax()
        top_pct = df.groupby("categoria")["_total"].sum()[top_cat] / total_p * 100
        msgs.append(f"💳 La categoría más cara fue **{top_cat}** ({top_pct:.0f}% del total).")

    # Mayor suba/baja por categoría
    if not df_prev.empty:
        curr_c = df.groupby("categoria")["_total"].sum()
        prev_c = df_prev.groupby("categoria")["_total"].sum()
        common = curr_c.index.intersection(prev_c.index)
        if len(common):
            deltas = (curr_c[common] - prev_c[common]) / prev_c[common] * 100
            if deltas.max() > 20:
                msgs.append(f"⬆️ **{deltas.idxmax()}** fue la categoría que más subió "
                            f"(+{deltas.max():.0f}% vs período anterior).")
            if deltas.min() < -20:
                msgs.append(f"⬇️ **{deltas.idxmin()}** fue la categoría que más bajó "
                            f"({deltas.min():.0f}% vs período anterior).")

    # Top 3 gastos más caros
    if not df.empty:
        top3 = df.nlargest(3, "_total")[["descripcion","_total","fecha"]].copy()
        top3["fecha"] = top3["fecha"].dt.strftime("%d/%m/%Y")
        lineas = "  \n".join(
            f"  {i+1}. **{row['descripcion']}** — ${row['_total']:,.0f} ({row['fecha']})".replace(",",".")
            for i, (_, row) in enumerate(top3.iterrows())
        )
        msgs.append(f"💸 Los 3 gastos más caros del período:\n{lineas}")

    # Sin clasificar
    otros = df[df["categoria"].isin(["Otros","Varios"])]["_total"].sum()
    if total_p > 0 and otros / total_p > 0.20:
        msgs.append(f"⚠️ El **{otros/total_p*100:.0f}%** del gasto está en 'Otros' o 'Varios' — "
                    f"hay consumos para reclasificar.")

    # Tarjeta dominante
    if df["banco"].nunique() > 1:
        top_banco = df.groupby("banco")["_total"].sum().idxmax()
        banco_pct = df.groupby("banco")["_total"].sum()[top_banco] / total_p * 100
        if banco_pct > 60:
            msgs.append(f"📊 **{top_banco}** concentró el {banco_pct:.0f}% del gasto del período.")

    for m in msgs:
        st.markdown(f"- {m}")
