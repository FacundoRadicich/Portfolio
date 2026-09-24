from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components
from db.supabase_client import get_client, restore_session, get_current_user_id, is_demo

st.set_page_config(
    page_title="Dr. Contable",
    page_icon="🧾",
    layout="wide",
    initial_sidebar_state="expanded",
)


def _inject_hash_redirect() -> None:
    """JS que corre en el browser: convierte tokens del hash (#) a query params (?)
    para que Streamlit pueda leerlos server-side."""
    components.html(
        """
        <script>
        (function() {
            var hash = window.parent.location.hash;
            if (!hash || hash.length < 2) return;
            var params = new URLSearchParams(hash.substring(1));
            var type = params.get('type');
            if (type !== 'recovery' && type !== 'signup') return;
            var qs = '?type=' + type;
            if (params.get('token_hash'))   qs += '&token_hash='   + encodeURIComponent(params.get('token_hash'));
            if (params.get('access_token')) qs += '&access_token=' + encodeURIComponent(params.get('access_token'));
            if (params.get('refresh_token')) qs += '&refresh_token=' + encodeURIComponent(params.get('refresh_token'));
            window.parent.location.replace(
                window.parent.location.origin + window.parent.location.pathname + qs
            );
        })();
        </script>
        """,
        height=0,
    )


def render_password_recovery() -> None:
    params      = st.query_params
    token_hash  = params.get("token_hash", "")
    access_token  = params.get("access_token", "")
    refresh_token = params.get("refresh_token", "")

    st.markdown("<br>" * 2, unsafe_allow_html=True)
    col = st.columns([1, 1, 1])[1]
    with col:
        st.title("🧾 Dr. Contable")
        st.markdown("---")
        st.subheader("Crear nueva contraseña")

        with st.form("recovery_form"):
            new_pass = st.text_input("Nueva contraseña", type="password", help="Mínimo 6 caracteres")
            confirm  = st.text_input("Confirmar contraseña", type="password")
            submitted = st.form_submit_button("Guardar contraseña", type="primary", use_container_width=True)

        if submitted:
            if new_pass != confirm:
                st.error("Las contraseñas no coinciden.")
            elif len(new_pass) < 6:
                st.error("La contraseña debe tener al menos 6 caracteres.")
            else:
                try:
                    client = get_client()
                    if token_hash:
                        client.auth.verify_otp({"token_hash": token_hash, "type": "recovery"})
                    elif access_token:
                        client.auth.set_session(access_token, refresh_token)
                    client.auth.update_user({"password": new_pass})
                    st.query_params.clear()
                    st.success("✅ Contraseña actualizada. Ya podés iniciar sesión.")
                except Exception as e:
                    st.error(f"El link expiró o es inválido. Pedí un nuevo reset. ({e})")


def render_auth() -> None:
    st.markdown("<br>" * 2, unsafe_allow_html=True)
    col = st.columns([1, 1, 1])[1]
    with col:
        st.title("🧾 Dr. Contable")
        st.markdown("---")
        tab_login, tab_register = st.tabs(["Iniciar sesión", "Registrarse"])

        with tab_login:
            with st.form("login_form"):
                email = st.text_input("Email")
                password = st.text_input("Contraseña", type="password")
                submitted = st.form_submit_button("Entrar", type="primary",
                                                   use_container_width=True)
            if submitted:
                try:
                    client = get_client()
                    res = client.auth.sign_in_with_password(
                        {"email": email, "password": password}
                    )
                    st.session_state["access_token"]  = res.session.access_token
                    st.session_state["refresh_token"] = res.session.refresh_token
                    st.session_state["user_id"]       = res.user.id
                    st.session_state["user_email"]    = res.user.email
                    st.rerun()
                except Exception:
                    st.error("Email o contraseña incorrectos.")

            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("¿Olvidaste tu contraseña?", use_container_width=True):
                st.session_state["show_reset"] = not st.session_state.get("show_reset", False)

            if st.session_state.get("show_reset"):
                with st.form("reset_form"):
                    reset_email = st.text_input("Ingresá tu email")
                    send = st.form_submit_button("Enviar link de recuperación", use_container_width=True)
                if send:
                    if not reset_email:
                        st.error("Ingresá un email.")
                    else:
                        try:
                            site_url = st.secrets.get("site_url", "")
                            get_client().auth.reset_password_for_email(
                                reset_email,
                                {"redirect_to": site_url} if site_url else {},
                            )
                            st.success("✅ Si el email existe, vas a recibir el link en unos minutos.")
                            st.session_state["show_reset"] = False
                        except Exception as e:
                            st.error(f"Error al enviar el email: {e}")

        with tab_register:
            with st.form("register_form"):
                email2    = st.text_input("Email")
                password2 = st.text_input("Contraseña", type="password",
                                          help="Mínimo 6 caracteres")
                password3 = st.text_input("Confirmar contraseña", type="password")
                submitted2 = st.form_submit_button("Crear cuenta", type="primary",
                                                    use_container_width=True)
            if submitted2:
                if password2 != password3:
                    st.error("Las contraseñas no coinciden.")
                elif len(password2) < 6:
                    st.error("La contraseña debe tener al menos 6 caracteres.")
                else:
                    try:
                        res = get_client().auth.sign_up(
                            {"email": email2, "password": password2}
                        )
                        if res.user:
                            site_url = st.secrets.get("site_url", "https://dr-contable.streamlit.app/")
                            try:
                                get_client().auth.reset_password_for_email(
                                    email2, {"redirect_to": site_url}
                                )
                            except Exception:
                                pass  # El registro fue exitoso; el email de bienvenida es opcional
                            st.success(
                                f"✅ Cuenta creada. Se envió un email a **{email2}** "
                                f"con el link para configurar tu contraseña e ingresar a la app."
                            )
                        else:
                            st.error("No se pudo crear la cuenta.")
                    except Exception as e:
                        st.error(f"Error: {e}")


def _start_demo_session() -> None:
    from db.demo_client import DEMO_EMAIL, DEMO_USER_ID
    st.session_state.setdefault("user_id", DEMO_USER_ID)
    st.session_state.setdefault("user_email", DEMO_EMAIL)


def _render_demo_sidebar() -> None:
    st.info("Demo con datos ficticios. Los cambios duran solo esta sesión.")
    sample = Path(__file__).parent / "samples" / "resumen_macro_demo.pdf"
    if sample.exists():
        st.download_button("Descargar resumen PDF de prueba", sample.read_bytes(),
                           file_name=sample.name, mime="application/pdf", use_container_width=True)
        st.caption("Subilo en **Cargar PDF** para ver cómo se lee y categoriza.")


def main() -> None:
    demo = is_demo()
    if demo:
        _start_demo_session()
    else:
        _inject_hash_redirect()
        restore_session()

    is_recovery = st.query_params.get("type") == "recovery" and (
        st.query_params.get("token_hash") or st.query_params.get("access_token")
    )
    if is_recovery and not demo:
        render_password_recovery()
        return

    if not get_current_user_id():
        render_auth()
        return

    from views.dashboard import render_dashboard
    from views.upload import render_upload
    from views.consumos import render_consumos
    from views.cargos import render_cargos

    with st.sidebar:
        st.title("🧾 Dr. Contable")
        st.markdown("---")
        page = st.radio(
            "Menú",
            ["📊 Dashboard", "📤 Cargar PDF", "📋 Consumos", "💳 Cargos"],
            label_visibility="collapsed",
        )
        st.markdown("---")
        if demo:
            _render_demo_sidebar()
        st.caption(f"👤 {st.session_state.get('user_email', '')}")
        if not demo and st.button("Cerrar sesión", use_container_width=True):
            get_client().auth.sign_out()
            for key in ["access_token", "refresh_token", "user_id", "user_email"]:
                st.session_state.pop(key, None)
            st.rerun()

    if page == "📊 Dashboard":
        render_dashboard()
    elif page == "📤 Cargar PDF":
        render_upload()
    elif page == "📋 Consumos":
        render_consumos()
    elif page == "💳 Cargos":
        render_cargos()


main()
