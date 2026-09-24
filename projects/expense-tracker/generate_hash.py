"""
Ejecutar para generar o cambiar la contraseña de acceso.
El hash resultante va en .streamlit/secrets.toml → [auth] password_hash

Uso:
    python generate_hash.py
"""
import bcrypt

password = input("Nueva contraseña: ")
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
print(f"\nCopiá este hash en secrets.toml → password_hash:\n\n{hashed}\n")
