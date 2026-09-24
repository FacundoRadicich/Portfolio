-- Hace corredor_id opcional en pedidos.
-- Ejecutar en Supabase: SQL Editor → pegar esto → Run.
ALTER TABLE pedidos ALTER COLUMN corredor_id DROP NOT NULL;
