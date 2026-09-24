-- OMC Pedidos — Schema (safe to run on existing Supabase project)
-- No toca tablas existentes. Todo con IF NOT EXISTS / OR REPLACE.

-- ── Tabla corredores ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS corredores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre              TEXT NOT NULL,
  email               TEXT UNIQUE NOT NULL,
  porcentaje_comision DECIMAL(5,2) NOT NULL DEFAULT 7.00,
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tabla pedidos ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id                 UUID REFERENCES corredores(id),
  cliente                     TEXT NOT NULL,
  valor_estimado              DECIMAL(12,2) NOT NULL CHECK (valor_estimado > 0),
  factura_url                 TEXT,
  valor_factura               DECIMAL(12,2),
  nota_credito_url            TEXT,
  valor_nota_credito          DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_neto                  DECIMAL(12,2),
  fecha_pedido                DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega_estimada      DATE,
  fecha_entrega_real          DATE,
  estado                      TEXT NOT NULL DEFAULT 'en_preparacion'
                                CHECK (estado IN ('en_preparacion','entregado','cobrado')),
  comprobante_cobro_url       TEXT,
  cobro_pendiente_validacion  BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_cobro                 DATE,
  forma_pago                  TEXT
                                CHECK (forma_pago IN ('echeq','cheque','transferencia','efectivo') OR forma_pago IS NULL),
  dias_al_cobro               INT,
  comision_monto              DECIMAL(12,2),
  comision_estado             TEXT NOT NULL DEFAULT 'pendiente'
                                CHECK (comision_estado IN ('pendiente','aprobada','pagada')),
  comprobante_comision_url    TEXT,
  comision_fecha_pago         DATE,
  notion_page_id              TEXT,
  notas                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Trigger updated_at ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_pedidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pedidos_updated_at ON pedidos;
CREATE TRIGGER pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION update_pedidos_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE pedidos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE corredores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS corredor_select_own  ON pedidos;
DROP POLICY IF EXISTS corredor_select_self ON corredores;

CREATE POLICY corredor_select_own ON pedidos
  FOR SELECT
  USING (
    corredor_id = (
      SELECT id FROM corredores WHERE supabase_user_id = auth.uid()
    )
  );

CREATE POLICY corredor_select_self ON corredores
  FOR SELECT
  USING (supabase_user_id = auth.uid());

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pedidos_corredor    ON pedidos(corredor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado      ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_cobro_pend  ON pedidos(cobro_pendiente_validacion)
  WHERE cobro_pendiente_validacion = TRUE;
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha       ON pedidos(fecha_pedido DESC);
CREATE INDEX IF NOT EXISTS idx_corredores_user_id  ON corredores(supabase_user_id);

-- ── Storage bucket ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('omc-documentos', 'omc-documentos', false)
ON CONFLICT (id) DO NOTHING;
